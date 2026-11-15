import { appNames, renderSheet, sheetNames } from './solver-desktop-view.ts';
import type { AppId, SheetName } from './solver-desktop-view.ts';
import { mountAgent } from './solver-agent.ts';

export function mountSolverDesktop(): () => void {
  const root = document.querySelector<HTMLElement>('[data-solver-desktop]');
  if (!root) return () => {};
  const desktop = root;
  const stage = desktop.querySelector<HTMLElement>('.sd-stage')!;
  const windows = [...desktop.querySelectorAll<HTMLElement>('[data-window]')];
  const terminal = desktop.querySelector<HTMLElement>('.sd-terminal-body')!;
  const terminalInput = terminal.querySelector<HTMLInputElement>('.sd-terminal-input')!;
  const terminalHistory = terminal.querySelector<HTMLElement>('.sd-terminal-history')!;
  const sheetPanel = desktop.querySelector<HTMLElement>('.sd-sheet-scroll')!;
  const clock = desktop.querySelector<HTMLTimeElement>('[data-desktop-clock]')!;
  const clockFormat = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const controller = new AbortController();
  const { signal } = controller;
  const agent = mountAgent(desktop.querySelector<HTMLElement>('[data-window="agent"]')!);
  let layer = 1;
  let clockTimer: number;
  let drag: { window: HTMLElement; pointer: number; x: number; y: number; left: number; top: number } | undefined;

  function updateClock() {
    window.clearTimeout(clockTimer);
    const now = new Date();
    const parts = Object.fromEntries(clockFormat.formatToParts(now).map(({ type, value }) => [type, value]));
    clock.textContent = `${parts.weekday} ${parts.day} ${parts.month} ${parts.hour}:${parts.minute}`;
    clock.dateTime = now.toISOString();
    clockTimer = window.setTimeout(updateClock, 60_000 - now.getTime() % 60_000);
  }

  function updateApps() {
    const visible = windows.filter((window) => !window.hidden);
    const active = visible.sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))[0];
    desktop.querySelector<HTMLElement>('[data-active-app]')!.textContent = active ? appNames[active.dataset.window as AppId] : 'Desktop';
    for (const window of windows) {
      window.classList.toggle('sd-window-active', window === active);
      desktop.querySelector(`[data-app="${window.dataset.window}"]`)?.setAttribute('aria-pressed', String(!window.hidden));
    }
  }

  function raise(window: HTMLElement) {
    window.style.zIndex = String(++layer);
    updateApps();
  }

  function move(window: HTMLElement, left: number, top: number) {
    if (window.classList.contains('sd-maximized') || stage.clientWidth <= 600) return;
    window.style.left = `${Math.max(0, Math.min(left, stage.clientWidth - window.offsetWidth))}px`;
    window.style.top = `${Math.max(0, Math.min(top, stage.clientHeight - window.offsetHeight))}px`;
  }

  function maximize(window: HTMLElement) {
    const maximized = window.classList.toggle('sd-maximized');
    const button = window.querySelector<HTMLButtonElement>('[data-window-action="maximize"]')!;
    button.setAttribute('aria-label', `${maximized ? 'Restore' : 'Maximize'} ${appNames[window.dataset.window as AppId]}`);
    button.title = maximized ? 'Restore' : 'Maximize';
    if (!maximized) move(window, window.offsetLeft, window.offsetTop);
  }

  function selectCell(button: HTMLButtonElement, focus = false) {
    const old = sheetPanel.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    old?.removeAttribute('aria-pressed');
    if (old) old.tabIndex = -1;
    button.setAttribute('aria-pressed', 'true');
    button.tabIndex = 0;
    desktop.querySelector<HTMLElement>('[data-cell-address]')!.textContent = button.dataset.cell!;
    desktop.querySelector<HTMLElement>('[data-cell-value]')!.textContent = button.textContent;
    if (focus) button.focus({ preventScroll: true });
  }

  function switchSheet(tab: HTMLButtonElement) {
    const sheet = tab.dataset.sheet as SheetName;
    desktop.querySelectorAll<HTMLButtonElement>('[data-sheet]').forEach((button) => {
      button.setAttribute('aria-selected', String(button === tab));
      button.tabIndex = button === tab ? 0 : -1;
    });
    sheetPanel.innerHTML = renderSheet(sheet);
    sheetPanel.setAttribute('aria-labelledby', tab.id);
    sheetPanel.scrollTop = 0;
    sheetPanel.scrollLeft = 0;
    selectCell(sheetPanel.querySelector<HTMLButtonElement>('[data-cell="B1"]')!);
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  terminal.addEventListener('submit', (event) => {
    event.preventDefault();
    const command = terminalInput.value.trim();
    if (!command) return;
    terminalInput.value = '';
    if (command === 'clear') {
      terminalHistory.replaceChildren();
      return;
    }
    const entry = document.createElement('div');
    entry.className = 'sd-terminal-entry';
    const line = document.createElement('div');
    line.className = 'sd-prompt';
    line.textContent = `${terminal.querySelector('label')!.textContent} ${command}`;
    const response = document.createElement('div');
    response.className = 'sd-terminal-response';
    const email = document.createElement('a');
    email.href = 'mailto:contact@melonite.ai';
    email.textContent = 'contact@melonite.ai';
    response.append("You're curious, we respect that. Come work with us — shoot us an email at ", email);
    entry.append(line, response);
    terminalHistory.append(entry);
    if (terminalHistory.childElementCount > 20) terminalHistory.firstElementChild!.remove();
    terminal.scrollTop = terminal.scrollHeight;
  }, { signal });
  terminal.addEventListener('click', (event) => {
    if (event.target === terminal) terminalInput.focus({ preventScroll: true });
  }, { signal });

  desktop.addEventListener('click', (event) => {
    const target = event.target as Element;
    const button = target.closest<HTMLButtonElement>('button');
    if (!button) return;
    if (button.dataset.app) {
      const window = windows.find((window) => window.dataset.window === button.dataset.app)!;
      window.hidden = false;
      raise(window);
      move(window, window.offsetLeft, window.offsetTop);
      window.focus({ preventScroll: true });
      if (button.dataset.app === 'terminal') terminalInput.focus({ preventScroll: true });
      if (button.dataset.app === 'agent') agent.syncVisibility();
    } else if (button.dataset.windowAction) {
      const window = button.closest<HTMLElement>('[data-window]')!;
      if (button.dataset.windowAction === 'maximize') maximize(window);
      else {
        window.hidden = true;
        if (window.dataset.window === 'agent') agent.syncVisibility();
        updateApps();
        desktop.querySelector<HTMLButtonElement>(`[data-app="${window.dataset.window}"]`)!.focus({ preventScroll: true });
      }
    } else if (button.dataset.sheet) switchSheet(button);
    else if (button.dataset.cell) selectCell(button);
  }, { signal });

  desktop.addEventListener('focusin', (event) => {
    const window = (event.target as Element).closest<HTMLElement>('[data-window]');
    if (window && !window.classList.contains('sd-window-active')) raise(window);
  }, { signal });
  stage.addEventListener('pointerdown', (event) => {
    const target = event.target as Element;
    const window = target.closest<HTMLElement>('[data-window]');
    if (!window) return;
    raise(window);
    const handle = target.closest<HTMLElement>('[data-drag]');
    if (!handle || target.closest('button') || event.button !== 0 || window.classList.contains('sd-maximized') || stage.clientWidth <= 600) return;
    event.preventDefault();
    handle.focus({ preventScroll: true });
    drag = { window, pointer: event.pointerId, x: event.clientX, y: event.clientY, left: window.offsetLeft, top: window.offsetTop };
    handle.setPointerCapture(event.pointerId);
    window.classList.add('sd-dragging');
  }, { signal });
  stage.addEventListener('pointermove', (event) => {
    if (drag && event.pointerId === drag.pointer) move(drag.window, drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
  }, { signal });
  const endDrag = () => {
    drag?.window.classList.remove('sd-dragging');
    drag = undefined;
  };
  stage.addEventListener('pointerup', endDrag, { signal });
  stage.addEventListener('pointercancel', endDrag, { signal });
  stage.addEventListener('lostpointercapture', endDrag, { signal });
  stage.addEventListener('dblclick', (event) => {
    const target = event.target as Element;
    if (target.closest('[data-drag]') && !target.closest('button')) maximize(target.closest<HTMLElement>('[data-window]')!);
  }, { signal });
  desktop.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement;
    const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (target.dataset.sheet && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const index = sheetNames.indexOf(target.dataset.sheet as SheetName);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? sheetNames.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + sheetNames.length) % sheetNames.length;
      const tab = desktop.querySelector<HTMLButtonElement>(`[data-sheet="${sheetNames[next]}"]`)!;
      switchSheet(tab);
      tab.focus({ preventScroll: true });
    } else if (target.dataset.cell && directions[event.key]) {
      event.preventDefault();
      const [dx, dy] = directions[event.key];
      const cell = target.dataset.cell;
      const table = sheetPanel.querySelector<HTMLElement>('.sd-sheet-table')!;
      const column = Math.max(65, Math.min(64 + Number(table.dataset.columnCount), cell.charCodeAt(0) + dx));
      const row = Math.max(1, Math.min(Number(table.dataset.rowCount), Number(cell.slice(1)) + dy));
      const button = sheetPanel.querySelector<HTMLButtonElement>(`[data-cell="${String.fromCharCode(column)}${row}"]`)!;
      selectCell(button, true);
      button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else if (target.dataset.drag && directions[event.key]) {
      event.preventDefault();
      const [dx, dy] = directions[event.key];
      const window = target.closest<HTMLElement>('[data-window]')!;
      move(window, window.offsetLeft + dx * 16, window.offsetTop + dy * 16);
    }
  }, { signal });
  const observer = new ResizeObserver(() => windows.filter((window) => !window.hidden).forEach((window) => move(window, window.offsetLeft, window.offsetTop)));
  observer.observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateClock(); }, { signal });
  updateClock();
  updateApps();
  return () => { controller.abort(); agent.dispose(); observer.disconnect(); window.clearTimeout(clockTimer); };
}
