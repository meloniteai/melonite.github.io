import test from 'node:test';
import assert from 'node:assert/strict';
import { createSkyMotion } from '../src/sky-motion.ts';

function setup(t, { enabled = true, reduced = false } = {}) {
  let now = 0;
  let nextId = 1;
  let intersection;
  let disconnected = false;
  const pending = new Map();
  const frames = [];
  const media = Object.assign(new EventTarget(), { matches: reduced });
  const document = Object.assign(new EventTarget(), { hidden: false });
  const element = { dataset: {} };
  const globals = {
    window: { matchMedia: () => media }, document,
    performance: { now: () => now },
    requestAnimationFrame: (callback) => { const id = nextId++; pending.set(id, callback); return id; },
    cancelAnimationFrame: (id) => pending.delete(id),
    IntersectionObserver: class {
      constructor(callback) { intersection = callback; }
      observe() {}
      disconnect() { disconnected = true; }
    },
  };
  const originals = new Map();
  for (const [key, value] of Object.entries(globals)) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const controller = createSkyMotion(element, (seconds) => frames.push(seconds), enabled);
  t.after(() => {
    controller.dispose();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return {
    controller, document, media, frames, element,
    get pending() { return pending.size; },
    get disconnected() { return disconnected; },
    intersect: (visible) => intersection([{ isIntersecting: visible }]),
    step(milliseconds = 1000 / 60) {
      now += milliseconds;
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(now));
    },
  };
}

test('sky advances at about 30 fps without any pointer input', (t) => {
  const h = setup(t);
  assert.equal(h.pending, 0);
  h.intersect(true);
  for (let i = 0; i < 120; i++) h.step();
  assert.equal(h.element.dataset.skyMotion, 'running');
  assert.ok(h.frames.length >= 59 && h.frames.length <= 60);
  assert.ok(h.frames.at(-1) > 1.95);
});

test('hidden and offscreen sky pauses, then resumes without a time jump', (t) => {
  const h = setup(t);
  h.intersect(true);
  for (let i = 0; i < 10; i++) h.step();
  const before = h.frames.at(-1);
  const count = h.frames.length;
  h.document.hidden = true;
  h.document.dispatchEvent(new Event('visibilitychange'));
  h.step(60000);
  assert.equal(h.pending, 0);
  assert.equal(h.frames.length, count);
  h.document.hidden = false;
  h.document.dispatchEvent(new Event('visibilitychange'));
  h.step(40);
  assert.ok(h.frames.at(-1) - before < 0.08);
  h.intersect(false);
  assert.equal(h.pending, 0);
  h.step(60000);
  h.intersect(true);
  assert.equal(h.pending, 1);
});

test('reduced motion and explicit suspension freeze the grain', (t) => {
  const h = setup(t, { reduced: true });
  h.intersect(true);
  h.step(100);
  assert.equal(h.frames.length, 0);
  h.media.matches = false;
  h.media.dispatchEvent(new Event('change'));
  h.step(40);
  assert.equal(h.frames.length, 1);
  h.controller.suspend();
  h.step(1000);
  assert.equal(h.frames.length, 1);
  h.controller.resume();
  h.step(40);
  assert.equal(h.frames.length, 2);
  h.media.matches = true;
  h.media.dispatchEvent(new Event('change'));
  assert.equal(h.pending, 0);
});

test('static instances and disposed clocks never restart', (t) => {
  const h = setup(t, { enabled: false });
  h.intersect(true);
  h.controller.resume();
  h.step(100);
  assert.equal(h.frames.length, 0);
  h.controller.dispose();
  h.document.dispatchEvent(new Event('visibilitychange'));
  h.media.dispatchEvent(new Event('change'));
  h.controller.resume();
  assert.equal(h.pending, 0);
  assert.equal(h.disconnected, true);
});
