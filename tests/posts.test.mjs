import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generatePosts, parseArticle, normalizeBase, renderArticle } from '../scripts/generate-posts.ts';

test('Markdown preserves paragraph breaks and literal angle brackets', () => {
  // A fixed fixture lets authors freely edit the real article without breaking CI.
  const source = String.raw`---
title: Formatting example
---
We’re \<very> excited.

A second paragraph.`;
  const article = parseArticle(source, 'formatting-example.md');
  assert.equal((article.html.match(/<p>/g) ?? []).length, 2);
  assert.match(article.html, /We’re &lt;very&gt; excited/);
  assert.match(article.html, /<p>A second paragraph\.<\/p>/);
  assert.equal(article.date, undefined);
});

test('Markdown supports formatting and local links under a GitHub project path', () => {
  const article = parseArticle('---\ntitle: Test\n---\n## Details\n\n**Strong** and [home](/).\n\n![View](/images/view.jpg)', 'test.md', '/repo/');
  assert.match(article.html, /<h2 id="details" class="article-section-heading">Details /);
  assert.match(article.html, /href="#details" aria-label="Link to Details"/);
  assert.match(article.html, /<strong>Strong<\/strong>/);
  assert.match(article.html, /href="\/repo\/"/);
  assert.match(article.html, /src="\/repo\/images\/view.jpg"/);
  const html = renderArticle(article, '/repo/');
  assert.match(html, /class="back-link" href="\/repo\/"/);
});

test('section links have unique readable IDs and optional contents precede the article body', () => {
  const source = '---\ntitle: Navigation\ntoc: true\n---\nIntro text.\n\n## **Reward–Cost** & `risk`\n\nDetails.\n\n### A subsection\n\n## Reward–Cost & risk\n\n## Article title\n\n> ## Quoted heading';
  const article = parseArticle(source, 'navigation.md', '/repo/');
  const { html, contents } = article;
  assert(contents);
  assert.equal((contents.match(/<li>/g) ?? []).length, 3);
  assert(contents.includes('href="#reward-cost-risk">Reward–Cost &amp; risk</a>'));
  assert(!contents.includes('A subsection'));
  assert(!contents.includes('Quoted heading'));
  const page = renderArticle(article, '/repo/');
  assert(page.indexOf('id="article-title"') < page.indexOf(contents));
  assert(page.indexOf(contents) < page.indexOf('<div class="article-body">'));
  assert(page.includes('class="article-with-contents"'));
  const ids = [...html.matchAll(/<h[1-6] id="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(ids, ['reward-cost-risk', 'a-subsection', 'reward-cost-risk-2', 'article-title-2', 'quoted-heading']);
  for (const id of ids) assert(html.includes(`href="#${id}"`));
  assert.equal(parseArticle(source.replace('toc: true', 'toc: false'), 'navigation.md').contents, undefined);
  assert.equal(parseArticle('---\ntitle: Short\ntoc: true\n---\nJust a paragraph.', 'short.md').contents, undefined);
});

test('raw HTML and unsafe Markdown links do not become executable content', () => {
  const article = parseArticle('---\ntitle: \'<script>bad</script>\'\n---\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))', 'test.md');
  const html = renderArticle(article, '/');
  assert(!html.includes('<script>alert'));
  assert(!html.includes('<script>bad'));
  assert(!html.includes('href="javascript:'));
  assert.match(html, /&lt;script&gt;/);
});

test('closing CTA preserves email and project-relative links while escaping raw HTML', () => {
  const source = '---\ntitle: Invitation\n---\n```article-cta\nCome work with us.\n\n[Get in touch →](mailto:contact@melonite.ai) [Partner with us →](/partners/)\n\n<script>alert(1)</script>\n```';
  const { html } = parseArticle(source, 'invitation.md', '/repo/');
  assert.match(html, /<footer class="article-cta" aria-label="Work with us">/);
  assert.match(html, /href="mailto:contact@melonite.ai"/);
  assert.match(html, /href="\/repo\/partners\/"/);
  assert.match(html, /&lt;script&gt;/);
  assert(!html.includes('<script>'));
});

test('invalid metadata and paths fail with clear errors', () => {
  assert.throws(() => parseArticle('No metadata', 'test.md'), /title is required/);
  assert.throws(() => parseArticle('---\ntitle: Test\n---\nText', 'Bad Name.md'), /hyphenated/);
  assert.throws(() => parseArticle('---\ntitle: Test\ndate: "2026-02-30"\n---\nText', 'test.md'), /valid YYYY-MM-DD/);
  assert.throws(() => parseArticle('---\ntitle: Test\ndraft: "false"\n---\nText', 'test.md'), /true or false/);
  assert.throws(() => parseArticle('---\ntitle: Test\ntoc: "true"\n---\nText', 'test.md'), /toc must be true or false/);
  assert.throws(() => normalizeBase('/../escape/'), /BASE_PATH/);
  assert.equal(normalizeBase('repository'), '/repository/');
});

test('editing, adding, drafting, and deleting Markdown regenerates the site index and pages', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'melonite-posts-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sources = join(root, 'content/posts');
  await mkdir(sources, { recursive: true });
  const source = join(sources, 'first.md');
  await writeFile(source, '---\ntitle: First\norder: 2\n---\nOriginal body.');
  await generatePosts(root, '/repo/');
  assert.match(await readFile(join(root, 'posts/first/index.html'), 'utf8'), /Original body/);
  await writeFile(source, '---\ntitle: Revised\norder: 2\n---\nEdited body.');
  await writeFile(join(sources, 'second.md'), '---\ntitle: Second\norder: 1\n---\nSecond body.');
  const articles = await generatePosts(root, '/repo/');
  assert.deepEqual(articles.map((article) => article.id), ['second', 'first']);
  assert.match(await readFile(join(root, 'posts/first/index.html'), 'utf8'), /Edited body/);
  assert.match(await readFile(join(root, '.generated/posts.ts'), 'utf8'), /Revised/);
  await writeFile(source, '---\ntitle: Revised\ndraft: true\n---\nPrivate draft.');
  await rm(join(sources, 'second.md'));
  assert.deepEqual(await generatePosts(root), []);
  await assert.rejects(readFile(join(root, 'posts/first/index.html')), { code: 'ENOENT' });
  await assert.rejects(readFile(join(root, 'posts/second/index.html')), { code: 'ENOENT' });
});
