import { siteContent } from './content.ts';
import type { Post } from './post.ts';
import { escapeHtml, renderHeader, renderFooter } from './site-layout.ts';
import { bindPlaceholderLinks } from './navigation.ts';
import logoUrl from '../assets/inspo/header-logo.svg';

export const skylineDescription = 'A New York skyline with an Empire State Building silhouette and lower buildings tapering toward the left, formed from paragraphs inspired by E. B. White’s Here is New York. Fine white grain drifts gently through the sky. Moving the cursor anywhere on the page scrolls the text along the building faces.';

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: '2-digit', timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

function postRows(posts: readonly Post[]): string {
  return posts.map((post) => `
    <li class="post-row${post.date ? '' : ' post-row--undated'}">
      ${post.date ? `<time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>` : ''}
      <div class="post-copy">
        <a class="post-title" href="${post.path ? escapeHtml(import.meta.env.BASE_URL + post.path) : '#'}"${post.path ? '' : ' data-page-link aria-disabled="true"'}><span>${escapeHtml(post.title)}</span><span class="post-arrow" aria-hidden="true">→</span></a>
      </div>
    </li>`).join('');
}

export function renderSkyline(): string {
  return `<figure class="skyline-figure">
    <div id="skyline" class="skyline" role="img" aria-label="${escapeHtml(skylineDescription)}"></div>
    <p id="render-error" class="render-error" role="alert" hidden></p>
  </figure>`;
}

export function mountLanding(root: HTMLElement): () => void {
  const { name, introduction, posts } = siteContent;
  document.title = name;
  root.innerHTML = `
    <div class="site-shell">
      ${renderHeader(import.meta.env.BASE_URL, logoUrl)}
      <main id="main-content">
        <h1 class="introduction">${escapeHtml(introduction)}</h1>
        <section id="posts" class="journal-layout" aria-label="Articles">
          <div class="posts-column">
            <ol class="post-list">${postRows(posts)}</ol>
          </div>
          ${renderSkyline()}
        </section>
      </main>
      ${renderFooter()}
    </div>`;
  return bindPlaceholderLinks(root);
}
