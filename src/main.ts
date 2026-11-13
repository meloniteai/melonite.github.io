import './typography.ts';
import '@fontsource/cormorant-garamond/latin-700.css';
import './styles.css';
import { createSkyline } from './skyline.ts';
import { mountLanding, renderSkyline } from './landing.ts';
import type { Skyline } from './skyline.ts';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing application root.');
const view = new URLSearchParams(window.location.search).get('view');
const standalone = view === 'artwork' || view === 'slot' || view === 'portrait';
document.body.classList.toggle('slot-preview', view === 'slot');
document.body.classList.toggle('portrait-preview', view === 'portrait');
let unmountPage: (() => void) | undefined;
if (standalone) {
  root.innerHTML = `<main class="artwork-preview">${renderSkyline()}</main>`;
  document.title = 'New York — Typographic skyline';
} else {
  unmountPage = mountLanding(root);
}

const container = root.querySelector<HTMLElement>('#skyline');
const error = root.querySelector<HTMLParagraphElement>('#render-error');
if (!container || !error) throw new Error('Missing skyline container.');
const errorElement = error;
function showError(message: string): void {
  errorElement.textContent = message;
  errorElement.hidden = false;
}

let artwork: Skyline | undefined;
let disposed = false;
async function initializeArtwork(element: HTMLElement): Promise<void> {
  // Canvas text is baked into GPU textures: load the actual font faces before
  // typesetting, so a first visit cannot permanently capture a fallback font.
  try {
    await Promise.all([
      document.fonts.load('400 16px "Cormorant Garamond"'),
      document.fonts.load('500 16px "Cormorant Garamond"'),
      document.fonts.load('600 16px "Cormorant Garamond"'),
      document.fonts.load('700 16px "Cormorant Garamond"'),
    ]);
  } catch (cause) {
    console.error(cause);
    if (!disposed) showError('The artwork font could not load. Please reload the page.');
    return;
  }
  if (disposed) return;
  try {
    artwork = createSkyline(element, { onError: showError, motionTarget: document, extendLeft: !standalone });
  } catch (cause) {
    console.error(cause);
    showError('This artwork needs WebGL. Please enable hardware acceleration or open it in a browser with WebGL support.');
  }
}
void initializeArtwork(container);
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposed = true;
    artwork?.dispose();
    unmountPage?.();
  });
}
