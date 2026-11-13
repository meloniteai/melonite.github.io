import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { normalizeBase, projectRoot, parseArticle } from './generate-posts.ts';
import { partnerPaths, partnerEndpoint } from './generate-partners.ts';

const base = normalizeBase(process.env.BASE_PATH);
const output = join(projectRoot, 'dist');
const files = await readdir(join(projectRoot, 'content/posts'));
const pages = ['index.html', ...partnerPaths.map((path) => path + 'index.html')];
const partners = await readFile(join(output, 'partners/index.html'), 'utf8');
assert(partners.includes(`data-endpoint="${partnerEndpoint()}"`), 'Partners form must use the configured Worker endpoint.');
assert(!partners.includes('formsubmit.co'), 'Partners must not use the retired form provider.');
assert(partners.includes(`data-success-url="${base}partners/thank-you/"`), 'Partners return URL must respect BASE_PATH.');
for (const file of files.filter((name) => name.endsWith('.md'))) {
  const article = parseArticle(await readFile(join(projectRoot, 'content/posts', file), 'utf8'), file, base);
  if (article.draft) continue;
  const page = join(article.path, 'index.html');
  const html = await readFile(join(output, page), 'utf8');
  // Vite can rewrite image URLs while retaining the same article content.
  const body = html.match(/<div class="article-body">([\s\S]*?)<\/div>/)?.[1] ?? '';
  const text = (value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(text(body), text(article.html), `${page}: Markdown body must be in the built HTML.`);
  assert(html.includes('<article '), `${page}: missing article markup.`);
  assert(html.includes(`href="${base}"`), `${page}: home link must respect BASE_PATH.`);
  pages.push(page);
}

async function checkUrl(raw: string, from: string): Promise<void> {
  if (!raw || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(raw)) return;
  const path = new URL(raw, `https://static.example${base}${from}`).pathname;
  assert(path.startsWith(base), `${from}: URL ${raw} is outside BASE_PATH ${base}.`);
  let local = decodeURIComponent(path.slice(base.length));
  if (!local || local.endsWith('/')) local += 'index.html';
  assert((await stat(join(output, local))).isFile(), `${from}: missing ${local}.`);
}
for (const page of pages) {
  const html = await readFile(join(output, page), 'utf8');
  assert(!/<script[^>]+src="[^"]*\/src\//.test(html), `${page}: source-module URL remains in production.`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) await checkUrl(match[1], page);
}
for (const file of (await readdir(join(output, 'assets'))).filter((name) => name.endsWith('.css'))) {
  const css = await readFile(join(output, 'assets', file), 'utf8');
  for (const match of css.matchAll(/url\(["']?([^\s)"']+)["']?\)/g)) await checkUrl(match[1], `assets/${file}`);
}
console.log(`Verified ${pages.length} static HTML page(s), compiled Markdown, links, and font/assets under ${base}.`);
