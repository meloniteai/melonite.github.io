import { mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import type { Post } from '../src/post.ts';
import { site } from '../src/site.ts';
import { escapeHtml, renderHeader, renderFooter } from '../src/site-layout.ts';
import { renderBenchmarkFigure, renderMetricsDashboard } from './benchmark-figures.ts';
import { renderSolverDesktop } from '../src/solver-desktop-view.ts';
import { renderPageMetadata } from './page-metadata.ts';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedMarker = '<!-- Generated from content/posts/; edit the Markdown source. -->';
const markdown = new MarkdownIt({ html: false, linkify: true });
type MarkdownToken = ReturnType<typeof markdown.parse>[number];

function headingText(tokens: MarkdownToken[]): string {
  return tokens.map((token) => {
    if (token.children) return headingText(token.children);
    if (token.type === 'softbreak' || token.type === 'hardbreak') return ' ';
    return ['text', 'code_inline', 'image'].includes(token.type) ? token.content : '';
  }).join('');
}

markdown.renderer.rules.heading_close = (tokens, index, options, _env, self) => {
  const heading = tokens[index - 2];
  const id = heading?.attrGet('id');
  const title = headingText(tokens[index - 1]?.children ?? []);
  const permalink = id ? ` <a class="section-permalink" href="#${escapeHtml(String(id))}" aria-label="Link to ${escapeHtml(title)}"><span aria-hidden="true">#</span></a>` : '';
  return permalink + self.renderToken(tokens, index, options);
};

function renderArticleBody(tokens: MarkdownToken[], showContents: boolean, base: string): { html: string; contents?: string } {
  const usedIds = new Set(['article-title', 'main-content', 'article-contents']);
  const sections: { id: string; title: string }[] = [];
  tokens.forEach((token, index) => {
    if (token.type !== 'heading_open') return;
    const title = headingText(tokens[index + 1]?.children ?? []);
    const slug = title.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
    let id = slug;
    for (let suffix = 2; usedIds.has(id); suffix++) id = `${slug}-${suffix}`;
    usedIds.add(id);
    token.attrSet('id', id);
    token.attrJoin('class', 'article-section-heading');
    if (token.tag === 'h2' && token.level === 0) sections.push({ id, title });
  });
  const html = markdown.renderer.render(tokens, markdown.options, { base });
  if (!showContents || !sections.length) return { html };
  const contents = `<nav class="article-toc" aria-label="On this page"><span class="article-toc-label">On this page</span><button class="article-toc-toggle" type="button" aria-expanded="false" aria-controls="article-contents" hidden>On this page</button><ul id="article-contents" role="list">${sections.map(({ id, title }) => `<li><a href="#${escapeHtml(id)}">${escapeHtml(title)}</a></li>`).join('')}</ul></nav>\n`;
  return { html, contents };
}

const defaultFence = markdown.renderer.rules.fence!;
markdown.renderer.rules.fence = (tokens, index, options, env, self) => {
  const token = tokens[index];
  if (token.info.trim() === 'article-cta') {
    const content = markdown.parse(token.content, env ?? {});
    prefixMarkdownUrls(content, typeof env?.base === 'string' ? env.base : '/');
    return `<footer class="article-cta" aria-label="Work with us">${markdown.renderer.render(content, options, env)}</footer>`;
  }
  if (token.info.trim() === 'cre-desktop') {
    if (token.content.trim() !== 'Alderwick-St-55') throw new Error('Unknown Blue Cell Bench desktop.');
    return renderSolverDesktop();
  }
  if (token.info.trim() === 'cre-dashboard') return renderMetricsDashboard(token.content, source=>markdown.render(source));
  return token.info.trim() === 'cre-chart'
    ? renderBenchmarkFigure(token.content.trim())
    : defaultFence(tokens, index, options, env, self);
};

export interface Article extends Post {
  path: string;
  html: string;
  contents?: string;
  order: number;
  draft: boolean;
}

export function normalizeBase(base = '/'): string {
  if (!base || base === '/') return '/';
  const path = base.replace(/^\/+|\/+$/g, '');
  if (!/^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(path) || path.split('/').some((part) => part === '.' || part === '..')) {
    throw new Error('BASE_PATH must be a site path such as / or /repository-name/.');
  }
  return `/${path}/`;
}

function prefixMarkdownUrls(tokens: ReturnType<typeof markdown.parse>, base: string): void {
  for (const token of tokens) {
    for (const attribute of ['href', 'src']) {
      const url = token.attrGet(attribute);
      if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) token.attrSet(attribute, base + url.slice(1));
    }
    if (token.children) prefixMarkdownUrls(token.children, base);
  }
}

export function parseArticle(source: string, filename: string, base = '/'): Article {
  const id = basename(filename, '.md');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`${filename}: use a lowercase, hyphenated filename.`);
  const { data, content } = matter(source);
  if (typeof data.title !== 'string' || !data.title.trim()) throw new Error(`${filename}: title is required.`);
  if (data.description !== undefined && typeof data.description !== 'string') throw new Error(`${filename}: description must be text.`);
  if (data.order !== undefined && (typeof data.order !== 'number' || !Number.isFinite(data.order))) throw new Error(`${filename}: order must be a number.`);
  if (data.draft !== undefined && typeof data.draft !== 'boolean') throw new Error(`${filename}: draft must be true or false.`);
  if (data.toc !== undefined && typeof data.toc !== 'boolean') throw new Error(`${filename}: toc must be true or false.`);
  let date: string | undefined;
  if (data.date !== undefined) {
    date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
      throw new Error(`${filename}: date must be a valid YYYY-MM-DD date.`);
    }
  }
  if (!data.draft && !content.trim()) throw new Error(`${filename}: a published article needs a body.`);
  const tokens = markdown.parse(content, {});
  prefixMarkdownUrls(tokens, normalizeBase(base));
  return {
    id, title: data.title.trim(), path: `posts/${id}/`, date,
    description: data.description?.trim(), order: data.order ?? 100, draft: data.draft ?? false,
    ...renderArticleBody(tokens, data.toc === true, normalizeBase(base)),
  };
}

export function renderArticle(article: Article, base: string): string {
  const description = article.description ?? article.title;
  const date = article.date ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(article.date)) : '';
  return `<!doctype html>
${generatedMarker}
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#ffffff" />
    ${renderPageMetadata({ title: article.title, description, path: article.path, type: 'article' }, base)}
    <title>${escapeHtml(article.title)} — ${escapeHtml(site.name)}</title>
  </head>
  <body>
    <div class="site-shell article-shell">
      ${renderHeader(base, '/assets/inspo/header-logo.svg')}
      <main id="main-content" class="article-main${article.html.includes('data-benchmark-chart=') ? ' article-main--research' : ''}${article.contents ? ' article-main--contents' : ''}">
        <a class="back-link" href="${escapeHtml(base)}">← Back to home</a>
        <article${article.contents ? ' class="article-with-contents"' : ''} aria-labelledby="article-title">
          <header class="article-header">
            <h1 id="article-title">${escapeHtml(article.title)}</h1>
            ${article.date ? `<time class="article-date" datetime="${article.date}">${date}</time>` : ''}
          </header>
          ${article.contents ?? ''}
          <div class="article-body">${article.html}</div>
        </article>
      </main>
      ${renderFooter()}
    </div>
    <script type="module" src="/src/article.ts"></script>
  </body>
</html>
`;
}

async function writeChanged(path: string, content: string): Promise<void> {
  if (await readFile(path, 'utf8').catch(() => '') === content) return;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

export async function generatePosts(root = projectRoot, base = normalizeBase(process.env.BASE_PATH)): Promise<Article[]> {
  const directory = join(root, 'content/posts');
  const files = (await readdir(directory)).filter((file) => file.endsWith('.md')).sort();
  // Validate all sources before replacing the last working output.
  const articles = (await Promise.all(files.map(async (file) => parseArticle(await readFile(join(directory, file), 'utf8'), file, base))))
    .filter((article) => !article.draft)
    .sort((a, b) => a.order - b.order || (b.date ?? '').localeCompare(a.date ?? '') || a.id.localeCompare(b.id));
  for (const article of articles) await writeChanged(join(root, article.path, 'index.html'), renderArticle(article, base));
  const entries = articles.map(({ id, title, path, date, description }) => ({ id, title, path, date, description }));
  await writeChanged(join(root, '.generated/posts.ts'), `// Generated from content/posts/*.md. Do not edit.\nimport type { Post } from '../src/post.ts';\nexport const posts: Post[] = ${JSON.stringify(entries, null, 2)};\n`);
  // Remove only generated pages whose source was deleted or marked as a draft.
  const previous = await readdir(join(root, 'posts'), { withFileTypes: true }).catch(() => []);
  for (const entry of previous) {
    if (!entry.isDirectory() || articles.some((article) => article.id === entry.name)) continue;
    const path = join(root, 'posts', entry.name, 'index.html');
    if ((await readFile(path, 'utf8').catch(() => '')).includes(generatedMarker)) await rm(path);
  }
  return articles;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const articles = await generatePosts();
  console.log(`Generated ${articles.length} Markdown article(s).`);
}
