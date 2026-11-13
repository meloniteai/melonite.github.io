/** Cursor-driven type on desktop, continuous type on touch screens. */
export interface TextMotionOptions {
  enabled?: boolean;
  inputTarget?: HTMLElement | Document;
}

export function createTextMotion(
  element: HTMLElement,
  onFrame: (distance: number) => void,
  { enabled = true, inputTarget = element }: TextMotionOptions = {},
) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const touchScreen = window.matchMedia('(hover: none) and (pointer: coarse)');
  let frame = 0;
  let lastFrame = 0;
  let lastInput = 0;
  let previousPoint: { x: number; y: number; time: number } | null = null;
  let inside = false;
  let visible = false;
  let disposed = false;
  let suspended = false;
  let focused = true;
  let velocity = 0;
  let targetVelocity = 0;
  let pendingDistance = 0;
  let sincePaint = 0;

  const allowed = () => enabled && !disposed && !suspended && focused && visible && !document.hidden && !reducedMotion.matches;
  element.dataset.motion = 'idle';

  function pause() {
    cancelAnimationFrame(frame);
    frame = 0;
    velocity = 0;
    targetVelocity = 0;
    pendingDistance = 0;
    sincePaint = 0;
    previousPoint = null;
    inside = false;
    element.dataset.motion = 'idle';
  }

  function start() {
    if (!allowed() || frame) return;
    lastFrame = performance.now();
    element.dataset.motion = 'running';
    frame = requestAnimationFrame(advance);
  }

  function synchronize() {
    if (!allowed()) pause();
    else if (touchScreen.matches) start();
  }

  function advance(now: number) {
    frame = 0;
    if (!allowed()) {
      pause();
      return;
    }
    // Cap time steps after a blocked frame, so returning to the tab never jumps.
    const dt = Math.min(Math.max((now - lastFrame) / 1000, 0), 0.05);
    lastFrame = now;
    const automatic = touchScreen.matches;
    const target = automatic ? 16 : inside && now - lastInput < 100 ? targetVelocity : 0;
    const smoothing = target > velocity ? 0.10 : inside ? 0.28 : 0.14;
    velocity += (target - velocity) * (1 - Math.exp(-dt / smoothing));

    if (!target && velocity < 0.04) {
      velocity = 0;
      element.dataset.motion = 'idle';
      return;
    }
    pendingDistance += velocity * dt;
    sincePaint += dt;
    // Match the ambient sky's 30 fps cadence on phones, including 120 Hz
    // screens. Desktop pointer motion keeps its existing frame cadence.
    if (!automatic || sincePaint >= 1 / 30) {
      onFrame(pendingDistance);
      pendingDistance = 0;
      sincePaint %= 1 / 30;
    }
    frame = requestAnimationFrame(advance);
  }

  function enter(event: PointerEvent) {
    if (event.pointerType === 'touch' || touchScreen.matches) return;
    inside = true;
    previousPoint = { x: event.clientX, y: event.clientY, time: performance.now() };
  }

  function move(event: PointerEvent) {
    if (event.pointerType === 'touch' || touchScreen.matches || !allowed()) return;
    const now = performance.now();
    inside = true;
    if (!previousPoint) {
      previousPoint = { x: event.clientX, y: event.clientY, time: now };
      return;
    }
    const distance = Math.hypot(event.clientX - previousPoint.x, event.clientY - previousPoint.y);
    const dt = Math.max((now - previousPoint.time) / 1000, 0.008);
    previousPoint = { x: event.clientX, y: event.clientY, time: now };
    if (distance < 0.1) return;

    // Normalize against the input surface, not the smaller artwork. Page-wide
    // input should have the same feel regardless of the skyline's visual size.
    const inputWidth = 'clientWidth' in inputTarget
      ? inputTarget.clientWidth : inputTarget.documentElement.clientWidth;
    const pointerSpeed = distance / Math.max(inputWidth, 1) / dt;
    targetVelocity = 16 + Math.min(pointerSpeed * 85, 64);
    lastInput = now;
    start();
  }

  function leave() {
    inside = false;
    previousPoint = null;
    targetVelocity = 0;
    // The active frame loop eases out; do not return the text to its start.
  }

  function pointerOut(event: PointerEvent) {
    // Ignore transitions between page elements. A null related target means
    // the cursor left the document itself (e.g. into browser chrome).
    if (event.relatedTarget === null) leave();
  }

  function inputChanged() {
    pause();
    synchronize();
  }

  function blur() { focused = false; pause(); }
  function focus() { focused = true; synchronize(); }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    synchronize();
  });
  observer.observe(element);
  // Document and HTMLElement expose different event-map overloads. These
  // named DOM pointer events share the same PointerEvent payload at runtime.
  const pointerListeners: readonly [string, EventListener][] = [
    ['pointerenter', (event) => enter(event as PointerEvent)],
    ['pointermove', (event) => move(event as PointerEvent)],
    ['pointerleave', leave],
    ['pointerout', (event) => pointerOut(event as PointerEvent)],
    ['pointercancel', leave],
  ];
  for (const [name, listener] of pointerListeners) {
    inputTarget.addEventListener(name, listener, { passive: true });
  }
  window.addEventListener('blur', blur);
  window.addEventListener('focus', focus);
  document.addEventListener('visibilitychange', synchronize);
  reducedMotion.addEventListener('change', synchronize);
  touchScreen.addEventListener('change', inputChanged);

  return {
    pause,
    suspend() { suspended = true; pause(); },
    resume() { suspended = false; synchronize(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      pause();
      observer.disconnect();
      for (const [name, listener] of pointerListeners) {
        inputTarget.removeEventListener(name, listener);
      }
      window.removeEventListener('blur', blur);
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', synchronize);
      reducedMotion.removeEventListener('change', synchronize);
      touchScreen.removeEventListener('change', inputChanged);
    },
  };
}
