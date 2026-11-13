/** A quiet, 30 fps ambient clock independent of pointer-driven typography. */
export function createSkyMotion(element: HTMLElement, onFrame: (seconds: number) => void, enabled = true) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let suspended = false;
  let disposed = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let sincePaint = 0;
  const interval = 1 / 30;
  const allowed = () => enabled && visible && !suspended && !disposed && !document.hidden && !preference.matches;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    sincePaint = 0;
    element.dataset.skyMotion = 'paused';
  }

  function tick(now: number) {
    frame = 0;
    if (!allowed()) return stop();
    const dt = Math.min(Math.max((now - previous) / 1000, 0), 0.05);
    previous = now;
    elapsed += dt;
    sincePaint += dt;
    if (sincePaint >= interval) {
      sincePaint %= interval;
      onFrame(elapsed);
    }
    frame = requestAnimationFrame(tick);
  }

  function synchronize() {
    if (!allowed()) return stop();
    if (frame) return;
    previous = performance.now();
    element.dataset.skyMotion = 'running';
    frame = requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    synchronize();
  });
  observer.observe(element);
  document.addEventListener('visibilitychange', synchronize);
  preference.addEventListener('change', synchronize);
  synchronize();

  return {
    suspend() { suspended = true; stop(); },
    resume() { suspended = false; synchronize(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', synchronize);
      preference.removeEventListener('change', synchronize);
    },
  };
}
