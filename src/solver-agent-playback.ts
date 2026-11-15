import { agentMoments, agentNarrationText } from './solver-agent-data.ts';

export const agentPlaybackSpeed = 1.5;

export type ReplayFrame = { moment: number; words: number; tool: 'hidden' | 'running' | 'done'; complete: boolean };
export type ReplayState = ReplayFrame & { started: boolean; playing: boolean; paused: boolean };
type Scheduler = { set: (callback: () => void, delay: number) => unknown; clear: (handle: unknown) => void };

// Frames are deterministic; pausing stops the clock without rebuilding the view.
export function createAgentPlayback(
  onChange: (state: ReplayState) => void,
  scheduler: Scheduler,
  reducedMotion = false,
) {
  const frames: (ReplayFrame & { delay: number })[] = [];
  for (const [moment, entry] of agentMoments.entries()) {
    const count = agentNarrationText(entry.narration).split(' ').length;
    for (let words = Math.min(3, count); ; words = Math.min(words + 3, count)) {
      frames.push({ moment, words, tool: 'hidden', complete: false, delay: words <= 3 ? 3200 : 90 });
      if (words === count) break;
    }
    if (entry.tool) {
      frames.push({ moment, words: count, tool: 'running', complete: false, delay: 700 });
      frames.push({ moment, words: count, tool: 'done', complete: false, delay: 1400 });
    }
  }
  frames.push({ ...frames.at(-1)!, complete: true, delay: 2200 });
  let cursor = -1;
  let visible = false;
  let paused = false;
  let disposed = false;
  let timer: unknown;
  const current = () => frames[cursor];
  const playing = () => !disposed && visible && !paused && cursor >= 0 && !current().complete;
  function cancel() { if (timer !== undefined) scheduler.clear(timer); timer = undefined; }
  function emit() {
    if (!disposed) onChange({ ...(current() ?? { moment: 0, words: 0, tool: 'hidden', complete: false }), started: cursor >= 0, playing: playing(), paused });
  }
  function schedule() {
    cancel();
    if (!playing()) return;
    timer = scheduler.set(() => { timer = undefined; cursor++; emit(); schedule(); }, frames[cursor + 1].delay / agentPlaybackSpeed);
  }
  return {
    setVisible(value: boolean) {
      if (disposed) return;
      visible = value;
      if (visible && cursor < 0) cursor = reducedMotion ? frames.length - 1 : 0;
      emit(); schedule();
    },
    togglePause() { if (disposed || cursor < 0 || current().complete) return; paused = !paused; emit(); schedule(); },
    showAll() { if (disposed) return; cursor = frames.length - 1; paused = false; cancel(); emit(); },
    restart() { if (disposed) return; cursor = reducedMotion ? frames.length - 1 : 0; paused = false; emit(); schedule(); },
    dispose() { disposed = true; cancel(); },
  };
}
