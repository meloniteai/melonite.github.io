import { readFileSync } from 'node:fs';
import { escapeHtml } from '../src/site-layout.ts';
import { figureTitles, figureTable, isFigureId, leaderboardRows, format } from '../src/benchmark-data.ts';
import type { BenchmarkData, FigureId } from '../src/benchmark-data.ts';
import { benchmarkProvider, chartPalette, configurationColor } from '../src/benchmark-theme.ts';

const data: BenchmarkData = JSON.parse(readFileSync(new URL('../public/research/cre-bench/chart-data.json', import.meta.url), 'utf8'));
function renderLeaderboard(): string {
  const ranked = leaderboardRows(data);
  const bestReward = ranked[0].meanReward;
  const bestPass = Math.max(...ranked.map(c=>c.passRate));
  const cell = (value: number, color: string, suffix: string, best: boolean) => `<td class="benchmark-score${best?' benchmark-score-best':''}"><span class="benchmark-meter" aria-hidden="true"><span style="width:${value}%;background:${color}"></span></span><span class="benchmark-score-value">${format(value)}${suffix}</span></td>`;
  const name = (label: string, family: string) => {
    const provider = benchmarkProvider(family);
    const icon = provider ? `<img class="benchmark-provider-icon" src="../../assets/cre-bench/lab-icons/${provider}.png" width="16" height="16" alt="">` : '';
    return `<span class="benchmark-model-name">${icon}<span>${escapeHtml(label)}</span></span>`;
  };
  return `<figure class="benchmark-figure benchmark-leaderboard" id="figure-baseline" aria-labelledby="title-baseline">
    <figcaption id="title-baseline">${figureTitles.baseline}</figcaption>
    <div class="benchmark-leaderboard-scroll"><table class="benchmark-leaderboard-table" aria-label="Mean reward and pass rate by model and effort">
      <colgroup><col style="width:36%"><col style="width:32%"><col style="width:32%"></colgroup>
      <thead><tr><th scope="col">Model / effort</th><th scope="col" aria-sort="descending"><button data-leaderboard-sort="score">Mean reward <span>(0–100)</span><span class="benchmark-sort-arrow" aria-hidden="true"> ↓</span></button></th><th scope="col" aria-sort="none"><button data-leaderboard-sort="passRate">Pass rate <span>(%)</span><span class="benchmark-sort-arrow" aria-hidden="true"></span></button></th></tr></thead>
      <tbody>${ranked.map(c=>`<tr data-score="${c.meanReward}" data-pass-rate="${c.passRate}"><th scope="row">${name(c.label,c.family)}</th>${cell(c.meanReward,c.meanReward===bestReward?chartPalette.navy:configurationColor(c.family),'',c.meanReward===bestReward)}${cell(c.passRate,c.passRate===bestPass?chartPalette.navy:chartPalette.teal,'%',c.passRate===bestPass)}</tr>`).join('')}</tbody>
    </table></div><span class="benchmark-sr-only" data-leaderboard-status aria-live="polite">Sorted by mean reward, descending.</span>
  </figure>`;
}

export function renderBenchmarkFigure(id: string, notes = ''): string {
  if (!isFigureId(id)) throw new Error(`Unknown Blue Cell Bench figure: ${id}`);
  if (id === 'baseline') return renderLeaderboard();
  const { headers, rows } = figureTable(id, data);
  const title = figureTitles[id];
  return `<figure class="benchmark-figure" id="figure-${id}" aria-labelledby="title-${id}">
    <figcaption id="title-${id}">${escapeHtml(title)}</figcaption>
    <div class="benchmark-scroll" tabindex="0" role="region" aria-label="${escapeHtml(title)} chart; scroll horizontally on small screens">
      <div class="benchmark-chart" data-benchmark-chart="${id}" role="img" aria-label="${escapeHtml(title)}. Exact values are in the data table below."><p class="chart-loading">Interactive chart loading. The data table below is available without JavaScript.</p></div>
    </div>
    <details class="benchmark-table"><summary>View data table</summary>
      <div class="benchmark-table-scroll" tabindex="0" role="region" aria-label="${escapeHtml(title)} data"><table><caption>${escapeHtml(title)}</caption><thead><tr>${headers.map(h=>`<th scope="col">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((v,i)=>i===0?`<th scope="row">${escapeHtml(v)}</th>`:`<td>${escapeHtml(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    </details>
    ${notes?`<div class="benchmark-metric-notes">${notes}</div>`:''}
  </figure>\n`;
}

export const dashboardWidgets = [
  { id: 'reward-distributions', title: 'Reward distributions', panels: [{id:'distribution',label:'By model'},{id:'histogram',label:'Overall'}] },
  { id: 'reward-and-passing', title: 'Reward and passing', panels: [{id:'reward-bands',label:'Pass rate by reward'}] },
  { id: 'execution-time', title: 'Execution time', panels: [{id:'duration',label:'Duration'}] },
  { id: 'cost-per-submission', title: 'Cost per submission', panels: [{id:'cost',label:'Cost'}] },
  { id: 'agent-activity', title: 'Agent activity', wide: true, panels: [{id:'tokens',label:'Token use'},{id:'interactions',label:'Steps and tool calls'}] },
] satisfies {id:string;title:string;wide?:boolean;panels:{id:FigureId;label:string}[]}[];

export function renderMetricsDashboard(source: string, renderMarkdown: (source: string)=>string): string {
  const allowed = new Set<string>(dashboardWidgets.flatMap(w=>w.panels.map(p=>p.id)));
  const notes = new Map<string,string>();
  for (const section of source.split(/(?=^## )/m).filter(s=>s.trim())) {
    const body = section.replace(/^## [^\n]+\n/, '');
    const charts = [...body.matchAll(/^```cre-chart\s*\n([a-z-]+)\s*\n```[ \t]*$/gm)];
    if (!charts.length) throw new Error('A dashboard section must contain a Blue Cell Bench chart.');
    charts.forEach((match,i)=>{
      const id = match[1];
      if (!allowed.has(id) || notes.has(id)) throw new Error(`Unknown or duplicate dashboard chart: ${id}`);
      const introduction = i===0 ? body.slice(0,match.index) : '';
      const commentary = body.slice(match.index!+match[0].length,charts[i+1]?.index ?? body.length);
      notes.set(id,renderMarkdown(`${introduction}\n${commentary}`));
    });
  }
  if (notes.size !== allowed.size) throw new Error('The metrics dashboard must include all seven supplementary charts.');
  return `<section class="benchmark-dashboard" aria-label="Supplementary metrics dashboard" data-metrics-dashboard>
    <div class="benchmark-dashboard-grid">${dashboardWidgets.map((widget)=>`<section class="benchmark-widget${'wide' in widget&&widget.wide?' benchmark-widget-wide':''}" aria-labelledby="metric-widget-${widget.id}">
      <header class="benchmark-widget-header"><h3 id="metric-widget-${widget.id}">${widget.title} <a class="section-permalink" href="#metric-widget-${widget.id}" aria-label="Link to ${widget.title}"><span aria-hidden="true">#</span></a></h3><button class="benchmark-expand" data-metric-expand aria-label="Expand ${widget.title}">Expand ↗</button></header>
      ${widget.panels.length>1?`<div class="benchmark-widget-tabs" role="tablist" aria-label="${widget.title} views">${widget.panels.map((panel,j)=>`<button role="tab" id="metric-tab-${panel.id}" aria-controls="metric-panel-${panel.id}" aria-selected="${j===0}" tabindex="${j===0?0:-1}" data-metric-tab="${panel.id}">${panel.label}</button>`).join('')}</div>`:''}
      ${widget.panels.map(panel=>`<div id="metric-panel-${panel.id}" class="benchmark-widget-panel"${widget.panels.length>1?` role="tabpanel" aria-labelledby="metric-tab-${panel.id}"`:''}>${renderBenchmarkFigure(panel.id,notes.get(panel.id))}</div>`).join('')}
    </section>`).join('')}</div>
    <dialog class="benchmark-metric-dialog" data-metric-dialog><div class="benchmark-dialog-bar"><span>Metrics dashboard</span><button data-metric-close aria-label="Close expanded metric">Close ×</button></div><div data-metric-dialog-body></div></dialog>
  </section>`;
}
