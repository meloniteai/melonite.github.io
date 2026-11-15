import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateSiteContent } from '../scripts/generate-content.ts';

test('new published posts get crawler-visible previews and unpublishing removes the image', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'melonite-social-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const content = join(root, 'content/posts');
  await mkdir(content, { recursive: true });
  await writeFile(join(content, 'research.md'), '---\ntitle: Research & results\ndescription: Findings from a new evaluation.\n---\nThe article text stays here.');
  await writeFile(join(content, 'draft.md'), '---\ntitle: Unpublished\ndraft: true\n---\nPrivate draft.');
  await generateSiteContent(root, '/preview/');
  const html = await readFile(join(root, 'posts/research/index.html'), 'utf8');
  assert(html.includes('<meta property="og:title" content="Research &amp; results"'));
  assert(html.includes('<meta property="og:url" content="https://melonite.ai/preview/posts/research/"'));
  assert(html.includes('<meta property="og:image" content="https://melonite.ai/preview/social/posts-research.png"'));
  assert(html.includes('The article text stays here.'));
  const image = join(root, 'public/social/posts-research.png');
  const png = await readFile(image);
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630]);
  await assert.rejects(readFile(join(root, 'public/social/posts-draft.png')), { code: 'ENOENT' });
  await writeFile(join(content, 'research.md'), '---\ntitle: Research & results\ndraft: true\n---\nPrivate now.');
  await generateSiteContent(root, '/preview/');
  await assert.rejects(readFile(image), { code: 'ENOENT' });
  await assert.rejects(readFile(join(root, 'posts/research/index.html')), { code: 'ENOENT' });
});
