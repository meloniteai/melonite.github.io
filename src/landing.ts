import { siteContent } from './content.ts';
import type { Post } from './post.ts';
import { escapeHtml, renderHeader, renderFooter } from './site-layout.ts';
import { bindPlaceholderLinks } from './navigation.ts';
import logoUrl from '../assets/inspo/header-logo.svg';

export const skylineDescription = 'A New York skyline with an Empire State Building silhouette and lower buildings tapering toward the left, formed from paragraphs inspired by E. B. White’s Here is New York. Soft lithographic crayon shading, delicate straight hatching, and sparse, flat cloud streaks color the sky from blue to a warm sunset, with paper grain showing through the pigment. Text scrolls automatically on touch screens and follows cursor movement on desktop, unless reduced motion is enabled.';

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

export function renderSkyline(showCredit = false): string {
  return `<figure class="skyline-figure">
    <div id="skyline" class="skyline" role="img" aria-label="${escapeHtml(skylineDescription)}"></div>
    <p id="render-error" class="render-error" role="alert" hidden></p>
    ${showCredit ? '<figcaption class="skyline-credit">A love letter to New York, inspired by E. B. White’s <a href="https://cpb-us-w2.wpmucdn.com/campuspress.yale.edu/dist/b/3011/files/2018/08/Here-is-NY_EB-White1-yk0d8g.pdf"><cite>Here Is New York</cite></a>.</figcaption>' : ''}
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
          ${renderSkyline(true)}
        </section>
      </main>
      ${renderFooter()}
    </div>`;
  return bindPlaceholderLinks(root);
}
