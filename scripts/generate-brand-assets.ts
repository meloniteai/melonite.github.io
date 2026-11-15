import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { site } from '../src/site.ts';
import { socialImagePath } from './page-metadata.ts';
import type { PageMetadata } from './page-metadata.ts';

const fonts = Promise.all([400, 500, 600].map(async (weight) => ({
  name: 'Cormorant Garamond', weight: weight as 400 | 500 | 600,
  data: await readFile(new URL(import.meta.resolve(`@fontsource/cormorant-garamond/files/cormorant-garamond-latin-${weight}-normal.woff`))),
})));
const logoSource = readFile(new URL('../assets/inspo/header-logo.svg', import.meta.url), 'utf8');

async function writeChanged(path: string, data: string | Buffer): Promise<void> {
  const bytes = Buffer.from(data);
  if ((await readFile(path).catch(() => Buffer.alloc(0))).equals(bytes)) return;
  await writeFile(path, bytes);
}

function ico(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + i * 16;
    header[entry] = header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(({ png }) => png)]);
}

export async function renderSocialCard(page: PageMetadata): Promise<Buffer> {
  const title = page.path ? page.title : page.description;
  const logo = `data:image/svg+xml;base64,${Buffer.from(await logoSource).toString('base64')}`;
  const node = {
    type: 'div', props: { style: {
      width: 1200, height: 630, display: 'flex', flexDirection: 'column',
      backgroundColor: '#fbfaf7', color: '#20211f',
      fontFamily: 'Cormorant Garamond',
    }, children: [
      { type: 'div', props: { style: { position: 'absolute', left: 72, top: 56, display: 'flex', alignItems: 'center', gap: 16 }, children: [
        { type: 'img', props: { src: logo, width: 68, height: 58 } },
        { type: 'div', props: { style: { fontSize: 42, fontWeight: 600 }, children: site.name } },
      ] } },
      { type: 'div', props: { style: { position: 'absolute', left: 72, top: 170, width: 1056, height: 340, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }, children: [
        { type: 'div', props: { style: { width: 1056, fontSize: title.length > 110 ? 52 : title.length > 75 ? 62 : 76, fontWeight: 500, lineHeight: 1.06, lineClamp: 3 }, children: title } },
        ...(page.path && page.description !== page.title ? [{ type: 'div', props: { style: { fontSize: 28, lineHeight: 1.3, color: '#62655f', maxWidth: 1000, lineClamp: 2 }, children: page.description } }] : []),
      ] } },
      { type: 'div', props: { style: { position: 'absolute', left: 72, top: 548, width: 1056, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #d5d8d0', paddingTop: 20, color: '#62655f', fontSize: 24 }, children: [
        { type: 'div', props: { children: new URL(site.url).hostname } },
        { type: 'div', props: { children: page.type === 'article' ? 'Research & insights' : 'Finance & knowledge work' } },
      ] } },
    ] },
  };
  const svg = await satori(node, { width: 1200, height: 630, fonts: await fonts });
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng();
}

export async function generateBrandAssets(root: string, pages: PageMetadata[]): Promise<void> {
  const directory = join(root, 'public');
  await mkdir(join(directory, 'social'), { recursive: true });
  // Keep the existing mark's proportions and add a small, square transparent margin.
  const logo = (await logoSource).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><g transform="translate(2 6.5)">${logo}</g></svg>`;
  await writeChanged(join(directory, 'favicon.svg'), icon);
  const raster = (size: number, background?: string) => new Resvg(icon, {
    fitTo: { mode: 'width', value: size }, background, font: { loadSystemFonts: false },
  }).render().asPng();
  await writeChanged(join(directory, 'favicon-32x32.png'), raster(32));
  await writeChanged(join(directory, 'apple-touch-icon.png'), raster(180, '#ffffff'));
  await writeChanged(join(directory, 'favicon.ico'), ico([16, 32, 48].map(size => ({ size, png: raster(size) }))));
  for (const page of pages) await writeChanged(join(directory, socialImagePath(page.path)), await renderSocialCard(page));
  // This generated directory must not retain preview cards for unpublished posts.
  const current = new Set(pages.map(page => socialImagePath(page.path).split('/').at(-1)));
  for (const file of await readdir(join(directory, 'social'))) {
    if (file.endsWith('.png') && !current.has(file)) await unlink(join(directory, 'social', file));
  }
}
