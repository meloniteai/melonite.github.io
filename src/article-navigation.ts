/** Keep the contents menu aligned with the section at the reader's scroll position. */
export function bindArticleNavigation(root: Document = document): () => void {
  const navigation = root.querySelector<HTMLElement>('.article-toc');
  const article = navigation?.closest('article');
  const view = root.defaultView;
  if (!navigation || !article || !view) return () => {};

  const sections = Array.from(navigation.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')).flatMap((link) => {
    const heading = root.getElementById(decodeURIComponent(link.hash.slice(1)));
    return heading ? [{ link, heading }] : [];
  });
  if (!sections.length) return () => {};

  let current: HTMLAnchorElement | undefined;
  let frame: number | undefined;
  let disposed = false;

  function update(): void {
    frame = undefined;
    // Hold a section through its full content, even when its heading is offscreen.
    // The small top offset also matches direct links with scroll-margin spacing.
    const readingLine = Math.min(160, view!.innerHeight * 0.2);
    let next: HTMLAnchorElement | undefined;
    for (const section of sections) {
      if (section.heading.getBoundingClientRect().top > readingLine) break;
      next = section.link;
    }
    // A short final section may never reach the reading line before scrolling ends.
    if (view!.scrollY > 0 && view!.scrollY + view!.innerHeight >= root.documentElement.scrollHeight - 2) {
      next = sections.at(-1)!.link;
    }
    if (next === current) return;
    current?.removeAttribute('aria-current');
    next?.setAttribute('aria-current', 'location');
    current = next;
  }

  function scheduleUpdate(): void {
    if (!disposed && frame === undefined) frame = view!.requestAnimationFrame(update);
  }

  view.addEventListener('scroll', scheduleUpdate, { passive: true });
  view.addEventListener('resize', scheduleUpdate);
  view.addEventListener('hashchange', scheduleUpdate);
  view.addEventListener('pageshow', scheduleUpdate);
  const resize = new ResizeObserver(scheduleUpdate);
  resize.observe(article);
  update();

  return () => {
    disposed = true;
    view.removeEventListener('scroll', scheduleUpdate);
    view.removeEventListener('resize', scheduleUpdate);
    view.removeEventListener('hashchange', scheduleUpdate);
    view.removeEventListener('pageshow', scheduleUpdate);
    resize.disconnect();
    if (frame !== undefined) view.cancelAnimationFrame(frame);
    current?.removeAttribute('aria-current');
  };
}
