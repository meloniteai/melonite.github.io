import { agentMoments, agentNarrationText, agentReplayNote, agentRunMetrics } from './solver-agent-data.ts';
import { createAgentPlayback } from './solver-agent-playback.ts';
import { escapeHtml } from './site-layout.ts';

export function renderAgent(): string {
  const number = new Intl.NumberFormat('en-US');
  const tokens = number.format(agentRunMetrics.inputTokens + agentRunMetrics.outputTokens);
  const seconds = Math.round(agentRunMetrics.executionSeconds);
  const duration = `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m ${seconds % 60}s`;
  return `<div class="sd-agent-heading"><strong>55 Alderwick Street</strong><span title="${escapeHtml(agentReplayNote)}">Trajectory excerpts · Redacted</span></div>
    <div class="sd-agent-transcript" tabindex="0" role="region" aria-label="Agy trajectory"><div data-agent-messages></div></div>
    <div class="sd-agent-progress" aria-hidden="true"><span data-agent-progress></span></div>
    <div class="sd-agent-controls"><div class="sd-agent-status-group"><span data-agent-status role="status" aria-live="polite">Ready</span><div class="sd-agent-run-totals" data-agent-run-totals aria-label="Original run totals" hidden>
      <span title="${number.format(agentRunMetrics.inputTokens)} input tokens (including cache reads) + ${number.format(agentRunMetrics.outputTokens)} output tokens (including thinking)">${tokens} tokens</span>
      <span title="Agent execution time, excluding environment setup and grading">${duration}</span>
      <span title="${agentRunMetrics.trajectorySteps} total trajectory steps, including ${agentRunMetrics.agentSteps} agent steps">${agentRunMetrics.trajectorySteps} steps</span>
    </div></div><button data-agent-action="pause">Pause</button><button data-agent-action="all">Show all</button><button data-agent-action="replay" hidden>Replay</button></div>`;
}

function renderMoment(index: number): string {
  const moment = agentMoments[index];
  return `<article class="sd-agent-moment" data-agent-moment="${index}">
    <time class="sd-agent-time" title="Elapsed time in the original run">${moment.elapsed}</time>
    <p class="sd-agent-narration" data-agent-narration></p>
    ${moment.tool ? `<details class="sd-agent-tool" data-agent-tool hidden open>
      <summary><span>${escapeHtml(moment.tool.label)}</span><span data-agent-tool-status>Running</span></summary>
      <pre><code>${escapeHtml(moment.tool.code)}</code></pre>
      <div class="sd-agent-output" data-agent-output hidden>${escapeHtml(moment.tool.output)}</div>
    </details>` : ''}</article>`;
}

export function mountAgent(app: HTMLElement) {
  const transcript = app.querySelector<HTMLElement>('.sd-agent-transcript')!;
  const messages = app.querySelector<HTMLElement>('[data-agent-messages]')!;
  const pauseButton = app.querySelector<HTMLButtonElement>('[data-agent-action="pause"]')!;
  const allButton = app.querySelector<HTMLButtonElement>('[data-agent-action="all"]')!;
  const replayButton = app.querySelector<HTMLButtonElement>('[data-agent-action="replay"]')!;
  const status = app.querySelector<HTMLElement>('[data-agent-status]')!;
  const progress = app.querySelector<HTMLElement>('[data-agent-progress]')!;
  const runTotals = app.querySelector<HTMLElement>('[data-agent-run-totals]')!;
  const controller = new AbortController();
  const { signal } = controller;
  let rendered = -1;
  let previousContent = '';

  const playback = createAgentPlayback((state) => {
    if (!state.started) return;
    const content = `${state.moment}:${state.words}:${state.tool}:${state.complete}`;
    const changed = previousContent !== content;
    previousContent = content;
    const following = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 48;
    // Only an explicit Replay clears the existing transcript.
    for (let i = rendered + 1; i <= state.moment; i++) messages.insertAdjacentHTML('beforeend', renderMoment(i));
    rendered = state.moment;
    for (const [i, element] of [...messages.querySelectorAll<HTMLElement>('[data-agent-moment]')].entries()) {
      const entry = agentMoments[i];
      const finished = i < state.moment || state.complete;
      const narration = element.querySelector<HTMLElement>('[data-agent-narration]')!;
      const sourceText = agentNarrationText(entry.narration);
      const text = finished ? sourceText : sourceText.split(' ').slice(0, state.words).join(' ');
      if (narration.textContent !== text) narration.textContent = text;
      if (entry.tool) {
        const shown = finished || state.tool !== 'hidden';
        const done = finished || state.tool === 'done';
        element.querySelector<HTMLElement>('[data-agent-tool]')!.hidden = !shown;
        element.querySelector<HTMLElement>('[data-agent-output]')!.hidden = !done;
        element.querySelector<HTMLElement>('[data-agent-tool-status]')!.textContent = done ? 'Finished' : 'Running';
      }
    }
    const statusText = state.complete ? 'Replay complete' : `${state.playing ? 'Playing' : 'Paused'} · ${state.moment + 1} / ${agentMoments.length}`;
    if (status.textContent !== statusText) status.textContent = statusText;
    pauseButton.textContent = state.paused ? 'Resume' : 'Pause';
    pauseButton.hidden = allButton.hidden = state.complete;
    replayButton.hidden = !state.complete;
    runTotals.hidden = !state.complete;
    progress.style.width = `${state.complete ? 100 : (state.moment + 1) / agentMoments.length * 100}%`;
    if (changed && following) transcript.scrollTop = transcript.scrollHeight;
  }, {
    set: (callback, delay) => window.setTimeout(callback, delay),
    clear: (handle) => window.clearTimeout(handle as number),
  }, window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const syncVisibility = () => playback.setVisible(!app.hidden && !document.hidden);
  app.addEventListener('click', (event) => {
    const action = (event.target as Element).closest<HTMLButtonElement>('[data-agent-action]')?.dataset.agentAction;
    if (action === 'pause') playback.togglePause();
    else if (action === 'all') { playback.showAll(); replayButton.focus({ preventScroll: true }); }
    else if (action === 'replay') {
      messages.replaceChildren(); rendered = -1; previousContent = '';
      transcript.scrollTop = 0;
      playback.restart();
      (pauseButton.hidden ? replayButton : pauseButton).focus({ preventScroll: true });
    }
  }, { signal });
  document.addEventListener('visibilitychange', syncVisibility, { signal });
  return { syncVisibility, dispose: () => { controller.abort(); playback.dispose(); } };
}
