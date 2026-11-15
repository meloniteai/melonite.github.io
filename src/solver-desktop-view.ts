import { solverTask } from './solver-task.ts';
import { renderAgent } from './solver-agent.ts';
import { agentConfig, agentWindowTitle } from './solver-agent-data.ts';
import { escapeHtml } from './site-layout.ts';

export type AppId = 'terminal' | 'excel' | 'task' | 'agent';
export const appNames: Record<AppId, string> = { terminal: 'Terminal', excel: 'Excel', task: 'Instructions', agent: agentConfig.name };
const appIcons: Record<AppId, string> = { terminal: 'terminal', excel: 'excel', task: 'text', agent: 'agent' };
export const sheetNames = [
  'Executive Summary', 'Assumptions', 'CF-Monthly', 'CF-Yearly', 'RR', 'RR Raw',
  'Pro Forma', 'Unit Mix & Expanses', 'Rental Comparables', 'Retail', 'T-12',
  'T-12 Raw', 'Tax Analysis', 'Waterfall',
] as const;
export type SheetName = typeof sheetNames[number];

export function icon(name: string, className = ''): string {
  if (name === 'agent') return `<img class="sd-icon sd-agent-icon ${className}" src="/assets/cre-bench/lab-icons/google.png" alt="" aria-hidden="true">`;
  const paths: Record<string, string> = {
    terminal: '<rect x="2.5" y="3.5" width="19" height="17" rx="2"/><path d="m6 9 3 3-3 3m6 0h5"/>',
    excel: '<path d="M9 3h12v18H9Z"/><path d="M14 3v18m-5-12h12m-12 6h12"/><rect x="2" y="6" width="11" height="12" rx="1" fill="currentColor"/><path d="m5 9 5 6m0-6-5 6" stroke="white"/>',
    text: '<path d="M5 2h9l5 5v15H5Z"/><path d="M14 2v6h5M8 12h8m-8 4h8m-8 3h5"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    minimize: '<path d="M5 17h14"/>',
    maximize: '<rect x="5" y="5" width="14" height="14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  };
  return `<svg class="sd-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.text}</svg>`;
}

function windowFrame(app: AppId, title: string, body: string): string {
  return `<section class="sd-window sd-window-${app}" data-window="${app}" role="dialog" aria-label="${appNames[app]}" tabindex="-1" hidden>
    <div class="sd-titlebar" data-drag="${app}" tabindex="0" aria-label="${appNames[app]} title bar. Use arrow keys to move the window.">
      <span class="sd-window-title">${icon(appIcons[app])}<span title="${escapeHtml(title)}">${title}</span></span>
      <div class="sd-window-controls">${(['minimize', 'maximize', 'close'] as const).map((action) => `<button data-window-action="${action}" aria-label="${action[0].toUpperCase() + action.slice(1)} ${appNames[app]}" title="${action[0].toUpperCase() + action.slice(1)}">${icon(action)}</button>`).join('')}</div>
    </div>${body}</section>`;
}

export function renderSheet(sheet: SheetName): string {
  const layouts: Record<SheetName, { headers: string[]; rows: string[] }> = {
    'Executive Summary': { headers: ['INVESTMENT SUMMARY', 'BASE CASE', 'UPSIDE CASE', 'DOWNSIDE CASE'], rows: ['Property overview', 'Acquisition price', 'Recommended offer', 'As-is market value', '', 'Underwriting summary', 'Net operating income', 'Acquisition cap rate', 'Loan amount', 'Required equity', '', 'Investment returns', 'Equity IRR', 'Equity multiple', 'Cash-on-cash return', '', 'Investment recommendation', 'Key risks & diligence'] },
    Assumptions: { headers: ['INPUT', 'VALUE', 'UNIT', 'SOURCE'], rows: ['Acquisition', 'Purchase price', 'Acquisition date', 'Holding period', '', 'Operating assumptions', 'Market rent growth', 'Vacancy allowance', 'Expense growth', '', 'Financing', 'Loan amount', 'Interest rate', 'Interest-only term', '', 'Disposition', 'Exit cap rate', 'Selling costs'] },
    'CF-Monthly': { headers: ['CASH FLOW', 'Month 01', 'Month 02', 'Month 03', 'Month 04', 'Month 05', 'Month 06'], rows: ['Rental revenue', 'Other income', 'Vacancy & concessions', 'Effective gross income', '', 'Operating expenses', 'Net operating income', '', 'Capital expenditures', 'Debt service', 'Net cash flow', '', 'Acquisition equity', 'Sale proceeds', 'Equity cash flow'] },
    'CF-Yearly': { headers: ['CASH FLOW', 'Year 1', 'Year 2', 'Year 3', 'Year 4'], rows: ['Rental revenue', 'Other income', 'Vacancy & concessions', 'Effective gross income', '', 'Operating expenses', 'Net operating income', '', 'Capital expenditures', 'Debt service', 'Net cash flow', '', 'Cash-on-cash return', 'Debt service coverage'] },
    RR: { headers: ['UNIT', 'TYPE', 'AREA · SF', 'MONTHLY RENT', 'LEASE START', 'LEASE END'], rows: Array.from({ length: 18 }, () => '') },
    'RR Raw': { headers: ['SOURCE UNIT', 'SOURCE TYPE', 'AREA · SF', 'REPORTED RENT', 'LEASE START', 'LEASE END', 'SOURCE FILE'], rows: Array.from({ length: 18 }, () => '') },
    'Pro Forma': { headers: ['OPERATING STATEMENT', 'T12', 'Year 1', 'Year 2', 'Year 3'], rows: ['Residential rent', 'Retail rent', 'Parking income', 'Other income', 'Gross potential income', 'Vacancy & credit loss', 'Effective gross income', '', 'Real estate taxes', 'Insurance', 'Utilities', 'Repairs & maintenance', 'Management fees', 'Total operating expenses', '', 'Net operating income'] },
    'Unit Mix & Expanses': { headers: ['UNIT TYPE / EXPENSE', 'UNITS', 'AREA · SF', 'RENT / UNIT', 'ANNUAL AMOUNT', 'SOURCE'], rows: ['Studio', '1BR', '1.5BR', '2BR', 'Total residential', '', 'Operating expenses', 'Real estate taxes', 'Insurance', 'Utilities', 'Repairs & maintenance', 'Payroll', 'Management fees', 'Other expenses', 'Total operating expenses'] },
    'Rental Comparables': { headers: ['COMPARABLE', 'UNIT TYPE', 'AREA · SF', 'ASKING RENT', 'CONCESSIONS', 'NET EFFECTIVE RENT', 'SOURCE'], rows: Array.from({ length: 18 }, () => '') },
    Retail: { headers: ['SUITE', 'AREA · SF', 'MONTHLY RENT', 'LEASE START', 'LEASE END', 'REIMBURSEMENTS', 'SOURCE'], rows: Array.from({ length: 18 }, () => '') },
    'T-12': { headers: ['OPERATING STATEMENT', 'REPORTED', 'ADJUSTMENTS', 'NORMALIZED', 'SOURCE'], rows: ['Residential rent', 'Retail rent', 'Parking income', 'Other income', 'Total revenue', '', 'Real estate taxes', 'Insurance', 'Utilities', 'Repairs & maintenance', 'Payroll', 'Management fees', 'Other expenses', 'Total operating expenses', '', 'Net operating income'] },
    'T-12 Raw': { headers: ['SOURCE ACCOUNT', 'PERIOD START', 'PERIOD END', 'REPORTED AMOUNT', 'SOURCE FILE', 'SOURCE CELL'], rows: Array.from({ length: 18 }, () => '') },
    'Tax Analysis': { headers: ['PROPERTY TAX', 'CURRENT', 'Year 1', 'Year 2', 'Year 3', 'SOURCE'], rows: ['Assessed value', 'Taxable value', 'Tax rate', 'Gross property tax', 'Exemptions & abatements', 'Net property tax', '', 'Assessment growth', 'Abatement expiration', 'Post-abatement tax', '', 'Underwritten property tax'] },
    Waterfall: { headers: ['EQUITY DISTRIBUTIONS', 'TOTAL', 'LP', 'GP', 'BASIS'], rows: ['Capital contributions', 'Operating distributions', 'Sale proceeds', 'Cash available for distribution', '', 'Return of capital', 'Preferred return', 'Catch-up', 'Promote tier 1', 'Promote tier 2', 'Residual distributions', '', 'Total distributions', 'Net profit', 'Equity multiple', 'IRR'] },
  };
  const layout = layouts[sheet];
  // Framing follows the supervision model's compact, mostly grid-free schedules:
  // narrow margins, unequal columns, side-by-side blocks, dark section bands,
  // subtotal rules and frozen schedule labels. All labels below are generic;
  // no source cell values, formulas or identifying names are imported.
  const overview = sheet === 'Executive Summary' || sheet === 'Assumptions';
  const monthly = sheet === 'CF-Monthly';
  const raw = sheet.endsWith('Raw');
  const widths = overview
    ? [12, 160, 62, 62, 16, 160, 62, 62, 12]
    : [14, raw ? 160 : 190, ...Array.from({ length: monthly ? 19 : 9 }, () => raw ? 105 : 82), 14];
  const rowCount = 48;
  type Cell = { text: string; tone: string };
  const cells: Cell[][] = Array.from({ length: rowCount }, () => widths.map(() => ({ text: '', tone: '' })));
  const put = (row: number, column: number, text = '', tone = '') => { cells[row - 1][column] = { text, tone }; };
  const band = (row: number, start: number, end: number, label = '', tone = 'section') => {
    for (let column = start; column <= end; column++) put(row, column, column === start ? label : '', tone);
  };
  const block = (row: number, column: number, heading: string, labels: string[], input = false) => {
    band(row, column, column + 2, heading.toUpperCase());
    labels.forEach((label, index) => {
      const total = /^(Total|Net|Equity required|Cash available)/.test(label);
      band(row + index + 1, column, column + 2, label, total ? 'total' : 'detail');
      if (input && !total) for (let c = column + 1; c <= column + 2; c++) put(row + index + 1, c, '', 'input');
    });
  };
  put(1, 1, '55 ALDERWICK STREET', 'title');
  put(2, 1, sheet, 'subtitle');
  if (overview) {
    if (sheet === 'Executive Summary') {
      block(4, 1, 'Property overview', ['Property type', 'Residential units', 'Residential area', 'Retail area', 'Parking spaces', 'Acquisition date', 'Holding period']);
      block(4, 5, 'Investment returns', ['Levered IRR', 'Unlevered IRR', 'Equity multiple', 'Average cash-on-cash', 'Net profit']);
      block(14, 1, 'Sources & uses', ['Purchase price', 'Closing costs', 'Financing fees', 'Initial reserves', 'Total uses', '', 'Acquisition loan', 'Equity required', 'Total sources']);
      block(12, 5, 'Financing', ['Loan proceeds', 'Loan-to-value', 'Loan-to-cost', 'Interest rate', 'Interest-only period', 'Loan term']);
      block(26, 1, 'Operating summary', ['Effective gross income', 'Operating expenses', 'Net operating income', 'Debt service', 'Net cash flow']);
      block(21, 5, 'Valuation & exit', ['As-is value', 'Recommended offer', 'Exit cap rate', 'Gross sale value', 'Selling costs', 'Net sale proceeds']);
      block(35, 1, 'Investment assessment', ['Investment recommendation', 'Key risks', 'Required diligence']);
    } else {
      block(4, 1, 'Acquisition', ['Purchase price', 'Closing date', 'Holding period', 'Acquisition costs', 'Initial reserves', 'Total acquisition basis'], true);
      block(4, 5, 'Operating assumptions', ['Market rent growth', 'Vacancy allowance', 'Credit loss', 'Expense growth', 'Management fee', 'Replacement reserves'], true);
      block(14, 1, 'Property & unit mix', ['Residential units', 'Residential area', 'Retail suites', 'Retail area', 'Parking spaces'], true);
      block(14, 5, 'Financing', ['Loan amount', 'Loan-to-value', 'Base rate', 'Interest spread', 'Rate cap', 'Interest-only term', 'Loan fees'], true);
      block(25, 1, 'Disposition', ['Exit cap rate', 'Selling costs', 'Exit timing', 'Debt repayment'], true);
      block(25, 5, 'Capital & fees', ['Acquisition fee', 'Asset management fee', 'Capital improvements', 'Working capital', 'Reserve contribution'], true);
    }
  } else {
    const lastColumn = widths.length - 2;
    let headers = layout.headers;
    if (monthly) headers = ['CASH FLOW', 'T12', ...Array.from({ length: 18 }, (_, i) => `Month ${String(i + 1).padStart(2, '0')}`)];
    band(4, 1, lastColumn, sheet.toUpperCase());
    for (let c = 1; c <= lastColumn; c++) put(5, c, headers[c - 1] ?? '', 'columns');
    const scheduleRows = sheet.startsWith('CF-') ? [
      'REVENUE', 'Residential rent', 'Retail rent', 'Parking income', 'Other income',
      'Gross potential income', 'Vacancy & concessions', 'Credit loss', 'Effective gross income', '',
      'OPERATING EXPENSES', 'Real estate taxes', 'Insurance', 'Utilities', 'Repairs & maintenance',
      'Payroll', 'Management fees', 'Other expenses', 'Total operating expenses', '',
      'Net operating income', '', 'CAPITAL & FINANCING', 'Capital expenditures', 'Reserve contributions',
      'Cash flow before debt', 'Interest expense', 'Principal amortization', 'Net cash flow', '',
      'EQUITY CASH FLOW', 'Initial investment', 'Operating distributions', 'Sale proceeds',
      'Debt repayment', 'Net equity cash flow', '', 'RETURNS', 'Cash-on-cash return', 'Debt service coverage',
    ] : layout.rows;
    const blankSchedule = scheduleRows.every((label) => !label);
    if (blankSchedule) {
      for (let row = 6; row <= 39; row++) band(row, 1, lastColumn, '', row % 2 === 0 ? 'record' : 'record-alt');
      if (!raw) band(40, 1, lastColumn, 'TOTAL / WEIGHTED AVERAGE', 'total');
    } else {
      scheduleRows.forEach((label, index) => {
        if (!label) return;
        const section = label === label.toUpperCase() && /[A-Z]/.test(label);
        const total = /^(Total|Net |Effective gross|Gross potential|Cash available|Cash flow before)/.test(label);
        band(index + 6, 1, lastColumn, label, section ? 'section' : total ? 'total' : 'detail');
      });
    }
  }
  const tableWidth = 30 + widths.reduce((sum, width) => sum + width, 0);
  return `<table class="sd-sheet-table ${overview ? 'sd-sheet-overview' : 'sd-sheet-schedule'} ${raw ? 'sd-sheet-raw' : ''}" style="width:${tableWidth}px;min-width:100%" data-row-count="${rowCount}" data-column-count="${widths.length}" aria-label="${escapeHtml(sheet)} worksheet preview">
    <colgroup><col style="width:30px">${widths.map((width) => `<col style="width:${width}px">`).join('')}</colgroup>
    <thead><tr><th aria-label="Row number"></th>${widths.map((_, c) => `<th scope="col">${String.fromCharCode(65 + c)}</th>`).join('')}</tr></thead>
    <tbody>${cells.map((row, r) => `<tr class="${r === 0 ? 'sd-sheet-title-row' : ''} ${!overview && r === 4 ? 'sd-sheet-freeze-row' : ''}"><th scope="row">${r + 1}</th>${row.map((cell, c) => {
      const address = `${String.fromCharCode(65 + c)}${r + 1}`;
      const selected = address === 'B1';
      return `<td class="${cell.tone ? `sd-cell-${cell.tone}` : ''} ${!overview && c === 1 ? 'sd-cell-frozen' : ''}"><button data-cell="${address}" tabindex="${selected ? '0' : '-1'}" aria-label="${address}${cell.text ? `: ${escapeHtml(cell.text)}` : ', empty'}"${selected ? ' aria-pressed="true"' : ''}${cell.text ? ` title="${escapeHtml(cell.text)}"` : ''}>${escapeHtml(cell.text)}</button></td>`;
    }).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderDesktopWidgets(): string {
  // Fixed illustrative values; these widgets do not fetch market or weather data.
  const stocks = [
    { ticker: 'AAPL', name: 'Apple', price: '198.45', change: '+1.24%', direction: 'up', line: 'M1 20 5 17 9 18 13 12 17 14 21 9 25 12 29 8 33 9 37 4 43 3' },
    { ticker: 'MSFT', name: 'Microsoft', price: '421.18', change: '−0.38%', direction: 'down', line: 'M1 5 5 8 9 6 13 10 17 8 21 14 25 12 29 16 33 13 37 18 43 20' },
  ];
  return `<div class="sd-widgets" aria-label="Desktop widgets">
    <section class="sd-widget sd-stock-widget" aria-label="Simulated stocks">
      <div class="sd-widget-heading"><strong>Stocks</strong></div>
      ${stocks.map((stock) => `<div class="sd-stock-row">
        <div class="sd-stock-name"><strong>${stock.ticker}</strong><span>${stock.name}</span></div>
        <svg class="sd-sparkline sd-stock-${stock.direction}" viewBox="0 0 44 24" fill="none" aria-hidden="true"><path d="${stock.line}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="sd-stock-quote"><span>$${stock.price}</span><span class="sd-stock-${stock.direction}">${stock.change}</span></div>
      </div>`).join('')}
    </section>
    <section class="sd-widget sd-weather-widget" aria-label="Simulated New York weather">
      <div class="sd-widget-heading"><strong>Weather</strong></div>
      <div class="sd-weather-city">New York</div>
      <div class="sd-weather-current"><span aria-label="72 degrees Fahrenheit">72°<small>F</small></span>${icon('sun')}</div>
      <div class="sd-weather-summary"><span>Sunny</span><span>H:75° L:63°</span></div>
    </section>
  </div>`;
}

export function renderSolverDesktop(): string {
  const terminal = `<div class="sd-terminal-body">
    <div class="sd-terminal-history" role="log" aria-label="Terminal output" aria-live="polite" aria-relevant="additions"></div>
    <form class="sd-terminal-form"><label class="sd-prompt" for="solver-terminal-command">solver@blue-cell-bench:/workspace$</label><input id="solver-terminal-command" class="sd-terminal-input" aria-label="Terminal command" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" maxlength="200"></form>
  </div>`;
  const task = `<div class="sd-task-body" tabindex="0" role="document" aria-label="Task instructions"><div class="sd-task-text">${escapeHtml(solverTask)}</div></div><div class="sd-task-status">Markdown</div>`;
  const excel = `<div class="sd-workbook-toolbar"><span class="sd-workbook-app">Excel</span><span>Analyst workbook</span><span class="sd-workbook-preview">Layout preview</span></div>
    <div class="sd-formula-bar"><span data-cell-address>B1</span><span class="sd-fx">ƒx</span><span data-cell-value>55 ALDERWICK STREET</span></div>
    <div class="sd-sheet-scroll" id="solver-sheet-panel" role="tabpanel" aria-labelledby="solver-tab-0">${renderSheet(sheetNames[0])}</div>
    <div class="sd-sheet-tabs" role="tablist" aria-label="Workbook sheets">${sheetNames.map((sheet, i) => `<button role="tab" id="solver-tab-${i}" data-sheet="${escapeHtml(sheet)}" aria-controls="solver-sheet-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? '0' : '-1'}">${escapeHtml(sheet)}</button>`).join('')}</div><div class="sd-workbook-status"><span>Ready</span><span>100%</span></div>`;
  return `<figure class="solver-desktop" data-solver-desktop aria-label="Interactive solver desktop">
    <div class="sd-screen"><div class="sd-system-bar"><span class="sd-system-name"><span>Blue Cell Bench</span><span class="sd-system-divider" aria-hidden="true">|</span><span data-active-app>Desktop</span></span><span class="sd-session">Alderwick-St-55</span><time class="sd-clock" data-desktop-clock title="Local time"></time></div>
      <div class="sd-stage">${renderDesktopWidgets()}${windowFrame('terminal', 'Terminal — /workspace', terminal)}${windowFrame('excel', 'Analyst workbook', excel)}${windowFrame('task', 'Task instructions', task)}${windowFrame('agent', agentWindowTitle, renderAgent())}</div>
      <nav class="sd-dock" aria-label="Desktop applications">${(['task', 'terminal', 'excel', 'agent'] as const).map((app) => `<button data-app="${app}" aria-label="Open ${appNames[app]}" aria-pressed="false" title="${appNames[app]}"><span class="sd-dock-icon sd-dock-icon-${app}">${icon(appIcons[app])}</span><span>${appNames[app]}</span><span class="sd-running" aria-hidden="true"></span></button>`).join('')}</nav>
    </div><noscript><p>Enable JavaScript to explore the desktop applications.</p></noscript>
  </figure>`;
}
