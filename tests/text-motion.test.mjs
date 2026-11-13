import test from 'node:test';
import assert from 'node:assert/strict';
import { createTextMotion } from '../src/text-motion.ts';

// A deterministic event/RAF harness tests motion lifecycle without a GPU.
// Shader output and real pointer input are checked in the local browser.
function setup(t, { reduced = false, enabled = true, pageInput = false, touch = false, visible = true } = {}) {
  let now = 0;
  let nextFrame = 1;
  const scheduled = new Map();
  const media = Object.assign(new EventTarget(), { matches: reduced });
  const touchMedia = Object.assign(new EventTarget(), { matches: touch });
  const document = Object.assign(new EventTarget(), {
    hidden: false, documentElement: { clientWidth: 1102 },
  });
  const window = Object.assign(new EventTarget(), {
    matchMedia: (query) => query === '(prefers-reduced-motion: reduce)' ? media : touchMedia,
  });
  const element = Object.assign(new EventTarget(), { dataset: {}, clientWidth: 360 });
  let intersection;
  let observerDisconnected = false;
  const globals = {
    window, document,
    performance: { now: () => now },
    requestAnimationFrame: (callback) => {
      const id = nextFrame++;
      scheduled.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => scheduled.delete(id),
    IntersectionObserver: class {
      constructor(callback) { intersection = callback; }
      observe() {}
      disconnect() { observerDisconnected = true; }
    },
  };
  const originals = new Map();
  for (const [key, value] of Object.entries(globals)) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  let travel = 0;
  const paints = [];
  const inputTarget = pageInput ? document : element;
  const controller = createTextMotion(element, (delta) => { travel += delta; paints.push(delta); }, { enabled, inputTarget });
  intersection([{ isIntersecting: visible }]);
  t.after(() => {
    controller.dispose();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  function pointer(type, x = 0, y = 0, pointerType = 'mouse') {
    inputTarget.dispatchEvent(Object.assign(new Event(type), { clientX: x, clientY: y, pointerType }));
  }
  function step(milliseconds = 16) {
    now += milliseconds;
    const callbacks = [...scheduled.values()];
    scheduled.clear();
    callbacks.forEach((callback) => callback(now));
  }
  function gesture() {
    pointer('pointerenter');
    for (let i = 1; i <= 12; i++) {
      step();
      pointer('pointermove', i * 12, 60);
    }
    step();
  }
  return {
    element, document, window, media, touchMedia, paints, pointer, step, gesture, controller,
    get pending() { return scheduled.size; },
    get travel() { return travel; },
    get disconnected() { return observerDisconnected; },
    intersect: (visible) => intersection([{ isIntersecting: visible }]),
  };
}

test('moves after cursor input, coasts to a stop, and resumes without resetting', (t) => {
  const h = setup(t);
  assert.equal(h.pending, 0);
  h.gesture();
  assert.equal(h.element.dataset.motion, 'running');
  assert.ok(h.travel > 0);
  for (let i = 0; i < 240; i++) h.step();
  assert.equal(h.element.dataset.motion, 'idle');
  assert.equal(h.pending, 0);
  const stoppedAt = h.travel;
  h.step(1000);
  assert.equal(h.travel, stoppedAt);
  h.gesture();
  assert.ok(h.travel > stoppedAt);
});

test('pointer exit eases out and background/offscreen states stop immediately', (t) => {
  const h = setup(t);
  h.gesture();
  h.pointer('pointerleave');
  for (let i = 0; i < 100; i++) h.step();
  assert.equal(h.pending, 0);
  h.gesture();
  h.document.hidden = true;
  h.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.pending, 0);
  h.document.hidden = false;
  h.gesture();
  h.intersect(false);
  assert.equal(h.pending, 0);
  h.gesture();
  assert.equal(h.pending, 0);
});

test('respects reduced motion initially and when changed during movement', (t) => {
  const h = setup(t, { reduced: true });
  h.gesture();
  assert.equal(h.travel, 0);
  assert.equal(h.pending, 0);
  h.media.matches = false;
  h.media.dispatchEvent(new Event('change'));
  h.gesture();
  assert.ok(h.travel > 0);
  h.media.matches = true;
  h.media.dispatchEvent(new Event('change'));
  const stoppedAt = h.travel;
  h.step(1000);
  assert.equal(h.pending, 0);
  assert.equal(h.travel, stoppedAt);
});

test('touch scrolling does not trigger row motion', (t) => {
  const h = setup(t);
  h.pointer('pointerenter', 0, 0, 'touch');
  h.pointer('pointermove', 100, 100, 'touch');
  h.step();
  assert.equal(h.pending, 0);
  assert.equal(h.travel, 0);
});

test('the static option disables pointer animation', (t) => {
  const h = setup(t, { enabled: false });
  h.gesture();
  assert.equal(h.pending, 0);
  assert.equal(h.travel, 0);
});

test('disposal cancels frames and removes the interaction lifecycle', (t) => {
  const h = setup(t);
  h.gesture();
  h.controller.dispose();
  const stoppedAt = h.travel;
  h.gesture();
  h.step();
  assert.equal(h.pending, 0);
  assert.equal(h.travel, stoppedAt);
  assert.equal(h.disconnected, true);
});

test('page input drives the artwork outside its bounds and only exits at the document edge', (t) => {
  const h = setup(t, { pageInput: true });
  h.gesture();
  assert.ok(h.travel > 0);
  assert.equal(h.element.dataset.motion, 'running');
  // Leaving the artwork or crossing a page child must not stop page input.
  h.element.dispatchEvent(new Event('pointerleave'));
  h.document.dispatchEvent(Object.assign(new Event('pointerout'), { relatedTarget: h.element }));
  h.step();
  assert.equal(h.element.dataset.motion, 'running');
  h.document.dispatchEvent(Object.assign(new Event('pointerout'), { relatedTarget: null }));
  for (let i = 0; i < 100; i++) h.step();
  assert.equal(h.pending, 0);
  assert.equal(h.element.dataset.motion, 'idle');
});

test('disposal removes document-level pointer listeners', (t) => {
  const h = setup(t, { pageInput: true });
  h.gesture();
  const stoppedAt = h.travel;
  h.controller.dispose();
  h.gesture();
  assert.equal(h.pending, 0);
  assert.equal(h.travel, stoppedAt);
  assert.equal(h.disconnected, true);
});

for (const refreshRate of [60, 120]) {
  test(`touch screens scroll continuously without input at 30 fps on a ${refreshRate} Hz display`, (t) => {
    const h = setup(t, { touch: true });
    assert.equal(h.element.dataset.motion, 'running');
    for (let i = 0; i < refreshRate * 3; i++) h.step(1000 / refreshRate);
    assert.ok(h.travel > 40 && h.travel < 49);
    assert.ok(h.paints.length >= 89 && h.paints.length <= 90);
    assert.equal(h.pending, 1);
    const beforeTouch = h.travel;
    h.pointer('pointerenter', 0, 0, 'touch');
    h.pointer('pointermove', 100, 100, 'touch');
    h.pointer('pointercancel', 100, 100, 'touch');
    for (let i = 0; i < refreshRate; i++) h.step(1000 / refreshRate);
    assert.ok(h.travel > beforeTouch);
  });
}

test('touch autoplay waits until visible and resumes after background or offscreen pauses without jumping', (t) => {
  const h = setup(t, { touch: true, visible: false });
  assert.equal(h.pending, 0);
  h.intersect(true);
  for (let i = 0; i < 60; i++) h.step();
  const before = h.travel;
  h.document.hidden = true;
  h.document.dispatchEvent(new Event('visibilitychange'));
  h.step(60000);
  assert.equal(h.travel, before);
  assert.equal(h.pending, 0);
  h.document.hidden = false;
  h.document.dispatchEvent(new Event('visibilitychange'));
  h.step(40);
  assert.ok(h.travel > before && h.travel - before < 1);
  h.intersect(false);
  const offscreen = h.travel;
  h.step(60000);
  assert.equal(h.travel, offscreen);
  h.intersect(true);
  h.step(40);
  assert.ok(h.travel > offscreen && h.travel - offscreen < 1);
});

test('touch autoplay honors reduced motion and returns to pointer-only behavior when the input mode changes', (t) => {
  const h = setup(t, { touch: true, reduced: true });
  h.step(1000);
  assert.equal(h.travel, 0);
  assert.equal(h.pending, 0);
  h.media.matches = false;
  h.media.dispatchEvent(new Event('change'));
  h.step(40);
  assert.ok(h.travel > 0);
  h.media.matches = true;
  h.media.dispatchEvent(new Event('change'));
  assert.equal(h.pending, 0);
  h.touchMedia.matches = false;
  h.touchMedia.dispatchEvent(new Event('change'));
  h.media.matches = false;
  h.media.dispatchEvent(new Event('change'));
  const desktopIdle = h.travel;
  h.step(1000);
  assert.equal(h.travel, desktopIdle);
  assert.equal(h.pending, 0);
  h.gesture();
  assert.ok(h.travel > desktopIdle);
  h.touchMedia.matches = true;
  h.touchMedia.dispatchEvent(new Event('change'));
  for (let i = 0; i < 180; i++) h.step();
  assert.equal(h.element.dataset.motion, 'running');
});

test('touch autoplay survives focus changes and export suspension; disposed motion cannot restart', (t) => {
  const h = setup(t, { touch: true });
  h.step(40);
  h.window.dispatchEvent(new Event('blur'));
  h.intersect(true);
  assert.equal(h.pending, 0);
  h.window.dispatchEvent(new Event('focus'));
  assert.equal(h.pending, 1);
  h.controller.suspend();
  h.document.dispatchEvent(new Event('visibilitychange'));
  h.touchMedia.dispatchEvent(new Event('change'));
  assert.equal(h.pending, 0);
  h.controller.resume();
  h.step(40);
  assert.equal(h.pending, 1);
  h.controller.dispose();
  const stopped = h.travel;
  h.controller.resume();
  h.window.dispatchEvent(new Event('focus'));
  h.media.dispatchEvent(new Event('change'));
  h.touchMedia.dispatchEvent(new Event('change'));
  h.step(1000);
  assert.equal(h.travel, stopped);
  assert.equal(h.pending, 0);
});

test('static artwork stays still on touch screens', (t) => {
  const h = setup(t, { touch: true, enabled: false });
  h.intersect(true);
  h.controller.resume();
  h.window.dispatchEvent(new Event('focus'));
  h.step(1000);
  assert.equal(h.travel, 0);
  assert.equal(h.pending, 0);
});
