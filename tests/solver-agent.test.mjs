import test from 'node:test';
import assert from 'node:assert/strict';
import { agentMoments, agentReplayNote, agentNarrationText, agentWindowTitle } from '../src/solver-agent-data.ts';
import { createAgentPlayback, agentPlaybackSpeed } from '../src/solver-agent-playback.ts';
import { renderSolverDesktop } from '../src/solver-desktop-view.ts';
import { solverTask } from '../src/solver-task.ts';

function setup(reducedMotion = false) {
  let state;
  let id = 0;
  const pending = new Map();
  const delays = [];
  const playback = createAgentPlayback(value => { state = value; }, {
    set(callback, delay) { delays.push(delay); pending.set(++id, callback); return id; },
    clear(handle) { pending.delete(handle); },
  }, reducedMotion);
  return {
    playback, pending, delays,
    state: () => state,
    tick() { const next = pending.entries().next().value; if (next) { pending.delete(next[0]); next[1](); } },
  };
}

test('replay starts once, preserves progress while hidden, and honors manual pause', () => {
  const p = setup();
  assert.equal(p.pending.size, 0);
  p.playback.setVisible(false);
  assert.equal(p.state().started, false);
  p.playback.setVisible(true);
  assert.equal(p.state().moment, 0);
  assert.equal(p.state().words, 3);
  p.tick(); p.tick();
  const words = p.state().words;
  p.playback.setVisible(false);
  assert.equal(p.pending.size, 0);
  p.tick();
  assert.equal(p.state().words, words);
  p.playback.setVisible(true);
  assert.equal(p.state().words, words);
  assert.equal(p.pending.size, 1);
  p.playback.togglePause();
  p.playback.setVisible(false); p.playback.setVisible(true);
  assert.equal(p.state().paused, true);
  assert.equal(p.pending.size, 0);
  p.playback.togglePause(); p.tick();
  assert(p.state().words > words);
  p.playback.dispose();
  assert.equal(p.pending.size, 0);
});

test('tools play in order and completed transcript persists until explicit replay', () => {
  const p = setup();
  p.playback.setVisible(true);
  const tools = new Map();
  for (let guard = 0; p.pending.size && guard < 1000; guard++) {
    p.tick();
    if (p.state().tool !== 'hidden') tools.set(p.state().moment, p.state().tool);
  }
  assert.equal(p.state().complete, true);
  assert.equal(p.pending.size, 0);
  for (const [i, moment] of agentMoments.entries()) if (moment.tool) assert.equal(tools.get(i), 'done');
  assert.equal(agentPlaybackSpeed, 1.5);
  assert.deepEqual([...new Set(p.delays)].sort((a,b)=>a-b), [90,700,1400,2200,3200].map(ms=>ms/1.5));
  p.playback.setVisible(false); p.playback.setVisible(true);
  assert.equal(p.state().complete, true);
  assert.equal(p.pending.size, 0);
  p.playback.restart();
  assert.equal(p.state().moment, 0);
  assert.equal(p.state().complete, false);
  p.playback.showAll();
  assert.equal(p.state().complete, true);
  assert.equal(p.pending.size, 0);
  p.playback.dispose();
  p.playback.restart();
  assert.equal(p.pending.size, 0);
});

test('reduced motion reveals the full transcript without scheduling animation', () => {
  const p = setup(true);
  p.playback.setVisible(true);
  assert.equal(p.state().complete, true);
  assert.equal(p.state().moment, agentMoments.length - 1);
  assert.equal(p.pending.size, 0);
});

test('replay uses original excerpts without staged headings, failed recalculation, or evaluation', () => {
  const publicText = JSON.stringify({ agentMoments, agentReplayNote });
  assert(!/hope|gaia|argon|gemini|google|openai|anthropic|desimone|gershon|harbor|williamsburg|brooklyn|RESULTS_MAP|libfile_|trial_uuid|run_id|https?:|\/Users\/|\/home\//i.test(publicText));
  assert(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i.test(publicText));
  assert.match(agentMoments[0].narration, /^Inspecting the candidate and output directories is the initial step/);
  assert.match(agentNarrationText(agentMoments.at(-1).narration), /^I have completed the acquisition underwriting for 55 Alderwick Street/);
  assert(!agentNarrationText(agentMoments.at(-1).narration).includes('file:'));
  assert(agentMoments.every(m=>!('phase' in m)));
  assert(!/soffice|command not found|Essential checks|Benchmark evaluation/.test(publicText));
  assert.match(agentReplayNote, /excerpts.*anonymized.*filenames redacted/i);
  const html = renderSolverDesktop();
  assert.match(html, /data-window="agent"[^>]*hidden/);
  assert.match(html, /data-app="agent"[^>]*aria-pressed="false"/);
  assert.match(html, /aria-label="Open Agy"/);
  assert(html.includes(agentWindowTitle));
  assert.match(html, /class="sd-icon sd-agent-icon[^"]*" src="\/assets\/cre-bench\/lab-icons\/google.png"/);
  assert(html.indexOf('data-app="task"') < html.indexOf('data-app="agent"'));
});

test('public desktop and replay omit filenames and the file browser', () => {
  const html = renderSolverDesktop();
  const publicText = JSON.stringify({ solverTask, agentMoments, agentReplayNote, html });
  assert.doesNotMatch(publicText, /\.(?:xlsx?|pdf|msg|csv|docx?|py)\b|file:\/\/\//i);
  assert.doesNotMatch(html, /data-(?:app|window)="files"|sd-file-|data-folder|data-file/);
  assert.match(html, /Analyst workbook/);
  assert.match(html, /Task instructions/);
  assert.match(publicText, /\[assumptions workbook\]/);
  assert.match(publicText, /\[output workbook\]/);
});
