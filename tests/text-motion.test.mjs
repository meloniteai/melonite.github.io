import test from 'node:test';
import assert from 'node:assert/strict';
import { createTextMotion } from '../src/text-motion.ts';

// A deterministic event/RAF harness tests motion lifecycle without a GPU.
// Shader output and real pointer input are checked in the local browser.
function setup(t, { reduced = false, enabled = true, pageInput = false } = {}) {
  let now = 0;
  let nextFrame = 1;
  const scheduled = new Map();
  const media = Object.assign(new EventTarget(), { matches: reduced });
  const document = Object.assign(new EventTarget(), {
    hidden: false, documentElement: { clientWidth: 1102 },
  });
  const window = Object.assign(new EventTarget(), { matchMedia: () => media });
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
  const inputTarget = pageInput ? document : element;
  const controller = createTextMotion(element, (delta) => { travel += delta; }, { enabled, inputTarget });
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
    element, document, window, media, pointer, step, gesture, controller,
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
