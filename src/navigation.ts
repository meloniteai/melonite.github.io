/** Keep unpublished page links inert until their real destinations exist. */
export function bindPlaceholderLinks(root: HTMLElement | Document): () => void {
  function onClick(event: Event): void {
    if (event.target instanceof Element && event.target.closest('a[data-page-link][aria-disabled="true"]')) {
      event.preventDefault();
    }
  }
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
