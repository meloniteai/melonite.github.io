export function mountBenchmarkUI(): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  const dashboard = document.querySelector<HTMLElement>('[data-metrics-dashboard]');
  const dialog = dashboard?.querySelector<HTMLDialogElement>('[data-metric-dialog]');
  let expanded: { figure: HTMLElement; placeholder: Comment; opener: HTMLButtonElement } | undefined;

  function selectTab(tab: HTMLButtonElement) {
    const widget = tab.closest<HTMLElement>('.benchmark-widget')!;
    widget.querySelectorAll<HTMLButtonElement>('[data-metric-tab]').forEach(button=>{
      const selected = button === tab;
      button.setAttribute('aria-selected',String(selected));
      button.tabIndex = selected ? 0 : -1;
      document.getElementById(button.getAttribute('aria-controls')!)!.hidden = !selected;
    });
  }

  dashboard?.querySelectorAll<HTMLButtonElement>('[data-metric-tab][aria-selected="true"]').forEach(selectTab);
  if (dashboard) dashboard.dataset.dashboardEnhanced = 'true';

  document.addEventListener('click',event=>{
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button) return;
    if (button.dataset.leaderboardSort) {
      const table = button.closest<HTMLTableElement>('table')!;
      const header = button.closest<HTMLTableCellElement>('th')!;
      const ascending = header.getAttribute('aria-sort') === 'descending';
      const key = button.dataset.leaderboardSort;
      const rows = [...table.tBodies[0].rows];
      rows.sort((a,b)=>(ascending?1:-1)*(Number(a.dataset[key])-Number(b.dataset[key])));
      table.tBodies[0].append(...rows);
      table.querySelectorAll<HTMLElement>('[aria-sort]').forEach(th=>th.setAttribute('aria-sort',th===header?(ascending?'ascending':'descending'):'none'));
      table.querySelectorAll<HTMLElement>('.benchmark-sort-arrow').forEach(span=>{span.textContent=span.closest('button')===button?(ascending?' ↑':' ↓'):'';});
      table.closest('.benchmark-leaderboard')!.querySelector('[data-leaderboard-status]')!.textContent = `Sorted by ${key==='score'?'mean reward':'pass rate'}, ${ascending?'ascending':'descending'}.`;
    } else if (button.dataset.metricTab) selectTab(button);
    else if (button.hasAttribute('data-metric-expand') && dialog) {
      const figure = button.closest('.benchmark-widget')!.querySelector<HTMLElement>('.benchmark-widget-panel:not([hidden]) .benchmark-figure')!;
      const placeholder = document.createComment('Expanded metric');
      figure.before(placeholder);
      expanded = {figure,placeholder,opener:button};
      dialog.querySelector('[data-metric-dialog-body]')!.append(figure);
      dialog.setAttribute('aria-labelledby',figure.getAttribute('aria-labelledby')!);
      dialog.showModal();
    } else if (button.hasAttribute('data-metric-close')) dialog?.close();
  }, {signal});

  dashboard?.addEventListener('keydown',event=>{
    const tab = (event.target as Element).closest<HTMLButtonElement>('[data-metric-tab]');
    if (!tab || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...tab.closest('[role="tablist"]')!.querySelectorAll<HTMLButtonElement>('[data-metric-tab]')];
    const index = event.key==='Home'?0:event.key==='End'?tabs.length-1:(tabs.indexOf(tab)+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    selectTab(tabs[index]);
    tabs[index].focus();
  }, {signal});

  function restoreMetric() {
    if (!expanded) return;
    const {figure,placeholder,opener} = expanded;
    placeholder.replaceWith(figure);
    expanded = undefined;
    opener.focus({preventScroll:true});
  }
  dialog?.addEventListener('close',restoreMetric,{signal});
  return ()=>{
    dialog?.close();
    restoreMetric();
    controller.abort();
    dashboard?.removeAttribute('data-dashboard-enhanced');
    dashboard?.querySelectorAll<HTMLElement>('.benchmark-widget-panel').forEach(panel=>{panel.hidden=false;});
  };
}
