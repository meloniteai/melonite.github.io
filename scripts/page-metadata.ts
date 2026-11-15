import { site } from '../src/site.ts';
import { escapeHtml } from '../src/site-layout.ts';

export interface PageMetadata {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
}

export const homeMetadata: PageMetadata = {
  title: site.name, description: site.introduction, path: '',
};

export function socialImagePath(path: string): string {
  return `social/${path.replace(/\/$/, '').replaceAll('/', '-') || 'home'}.png`;
}

export function renderPageMetadata(page: PageMetadata, base: string): string {
  const absolute = (path: string) => new URL(base + path, site.url).href;
  const image = absolute(socialImagePath(page.path));
  const imageAlt = `${site.name} — ${page.path ? page.title : page.description}`;
  const meta = (attribute: 'name' | 'property', key: string, value: string) =>
    `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`;
  return [
    meta('name', 'description', page.description),
    `<link rel="canonical" href="${escapeHtml(absolute(page.path))}" />`,
    `<link rel="icon" href="${base}favicon.ico" sizes="16x16 32x32 48x48" />`,
    `<link rel="icon" type="image/png" href="${base}favicon-32x32.png" sizes="32x32" />`,
    `<link rel="icon" type="image/svg+xml" href="${base}favicon.svg" sizes="any" />`,
    `<link rel="apple-touch-icon" href="${base}apple-touch-icon.png" sizes="180x180" />`,
    meta('property', 'og:type', page.type ?? 'website'),
    meta('property', 'og:site_name', site.name),
    meta('property', 'og:locale', 'en_US'),
    meta('property', 'og:title', page.title),
    meta('property', 'og:description', page.description),
    meta('property', 'og:url', absolute(page.path)),
    meta('property', 'og:image', image),
    meta('property', 'og:image:secure_url', image),
    meta('property', 'og:image:type', 'image/png'),
    meta('property', 'og:image:width', '1200'),
    meta('property', 'og:image:height', '630'),
    meta('property', 'og:image:alt', imageAlt),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', page.title),
    meta('name', 'twitter:description', page.description),
    meta('name', 'twitter:image', image),
    meta('name', 'twitter:image:alt', imageAlt),
  ].join('\n    ');
}
