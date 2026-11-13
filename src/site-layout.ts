import { site } from './site.ts';

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

export function renderHeader(base: string, logoUrl: string, currentPage?: 'partners'): string {
  return `<header class="site-header">
    <a class="site-name" href="${escapeHtml(base)}" aria-label="${escapeHtml(site.name)} home">
      <img class="site-logo" src="${escapeHtml(logoUrl)}" width="60" height="51" alt="" />
      <span>${escapeHtml(site.name)}</span>
    </a>
    <nav class="site-nav" aria-label="Main navigation">
      <a href="mailto:${escapeHtml(site.contactEmail)}">Contact</a>
      <span aria-hidden="true">·</span>
      <a href="${escapeHtml(base + 'partners/')}"${currentPage === 'partners' ? ' aria-current="page"' : ''}>Partners</a>
    </nav>
  </header>`;
}

export function renderFooter(): string {
  return `<footer class="site-footer"><p>${escapeHtml(site.copyright)}</p></footer>`;
}
