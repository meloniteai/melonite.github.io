import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { normalizeBase, projectRoot, parseArticle } from './generate-posts.ts';
import { partnerPaths, partnerEndpoint } from './generate-partners.ts';
import { site } from '../src/site.ts';

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
  const body = html.match(/<div class="article-body">([\s\S]*?)<\/div>\s*<\/article>/)?.[1] ?? '';
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
  // Link-preview crawlers must get complete metadata from the initial HTML.
  const meta = (name: string) => {
    const tags = [...html.matchAll(/<meta\s[^>]*>/g)].map(match => match[0])
      .filter(tag => tag.includes(`property="${name}"`) || tag.includes(`name="${name}"`));
    assert.equal(tags.length, 1, `${page}: expected one ${name} tag.`);
    const content = tags[0].match(/content="([^"]*)"/)?.[1];
    assert(content, `${page}: ${name} must not be empty.`);
    return content;
  };
  const canonical = new URL(base + page.replace(/index\.html$/, ''), site.url).href;
  assert.equal(meta('og:url'), canonical);
  assert(html.includes(`<link rel="canonical" href="${canonical}"`), `${page}: incorrect canonical URL.`);
  assert.equal(meta('og:type'), page.startsWith('posts/') ? 'article' : 'website');
  assert.equal(meta('og:site_name'), site.name);
  assert.equal(meta('twitter:card'), 'summary_large_image');
  for (const field of ['title', 'description', 'image', 'image:alt']) assert.equal(meta(`twitter:${field}`), meta(`og:${field}`));
  const image = new URL(meta('og:image'));
  assert.equal(image.origin, new URL(site.url).origin);
  assert.equal(image.protocol, 'https:');
  assert(image.pathname.startsWith(base + 'social/'), `${page}: image URL must respect BASE_PATH.`);
  assert.equal(meta('og:image:secure_url'), image.href);
  assert.equal(meta('og:image:type'), 'image/png');
  assert.equal(meta('og:image:width'), '1200');
  assert.equal(meta('og:image:height'), '630');
  const png = await readFile(join(output, image.pathname.slice(base.length)));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert(png.length < 300_000, `${page}: keep preview images small for messaging apps.`);
  for (const icon of ['favicon.ico', 'favicon.svg', 'favicon-32x32.png', 'apple-touch-icon.png']) {
    assert(html.includes(`href="${base}${icon}"`), `${page}: missing ${icon} link.`);
  }
}
for (const [name, size] of [['favicon-32x32.png', 32], ['apple-touch-icon.png', 180]] as const) {
  const png = await readFile(join(output, name));
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
}
const ico = await readFile(join(output, 'favicon.ico'));
assert.equal(ico.readUInt16LE(2), 1);
assert.equal(ico.readUInt16LE(4), 3);
assert.deepEqual([0, 1, 2].map(index => ico[6 + index * 16]), [16, 32, 48]);
for (const file of (await readdir(join(output, 'assets'))).filter((name) => name.endsWith('.css'))) {
  const css = await readFile(join(output, 'assets', file), 'utf8');
  for (const match of css.matchAll(/url\(["']?([^\s)"']+)["']?\)/g)) await checkUrl(match[1], `assets/${file}`);
}
console.log(`Verified ${pages.length} static HTML page(s), compiled Markdown, links, fonts, favicons, and social previews under ${base}.`);
