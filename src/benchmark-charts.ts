import { init, use } from 'echarts/core';
import { BarChart, BoxplotChart, HeatmapChart, LineChart, ScatterChart } from 'echarts/charts';
import { AriaComponent, GridComponent, LegendComponent, MarkLineComponent, TitleComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { LabelLayout } from 'echarts/features';
import type { EChartsOption, SeriesOption } from 'echarts';
import type { ECharts } from 'echarts/core';
import type { BenchmarkData, Configuration, FigureId, Metric } from './benchmark-data.ts';
import { figureTitles, format, isFigureId, leaderboardRows, paretoRows } from './benchmark-data.ts';
import { benchmarkProvider, chartPalette as palette, configurationColor } from './benchmark-theme.ts';
import { mountBenchmarkUI } from './benchmark-ui.ts';
import openaiIcon from '../assets/cre-bench/lab-icons/openai.png';
import anthropicIcon from '../assets/cre-bench/lab-icons/anthropic.png';
import geminiIcon from '../assets/cre-bench/lab-icons/google.png';
import mistralIcon from '../assets/cre-bench/lab-icons/mistral.png';
import nvidiaIcon from '../assets/cre-bench/lab-icons/nvidia.png';
import zaiIcon from '../assets/cre-bench/lab-icons/zai.png';

const providerIcons = { openai: openaiIcon, anthropic: anthropicIcon, google: geminiIcon, mistral: mistralIcon, nvidia: nvidiaIcon, zai: zaiIcon };

use([BarChart, BoxplotChart, HeatmapChart, LineChart, ScatterChart, AriaComponent, GridComponent, LegendComponent, MarkLineComponent, TitleComponent, TooltipComponent, VisualMapComponent, SVGRenderer, LabelLayout]);

const ink = palette.navy;
const headingTextStyle = { fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600, fontSize: 16, color: ink };
const color = (c: Configuration) => configurationColor(c.family);
const axisLine = { show: true, lineStyle: { color: palette.sand } };
const splitLine = { show: true, lineStyle: { color: palette.chalk, opacity: .65 } };
const tooltip: EChartsOption['tooltip'] = { trigger: 'item', confine: true, textStyle: { fontSize: 13, color: ink }, backgroundColor: '#fff', borderColor: palette.chalk };
const f = format;
const money = (n: number) => '$' + f(n, 2);

function base(id: FigureId): EChartsOption {
  return {
    animation: false,
    color: [palette.teal, palette.brown, palette.plum, palette.mauve, palette.rose, palette.sand, palette.navy],
    textStyle: { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 13, color: ink },
    aria: { enabled: true, description: `${figureTitles[id]}. The accompanying data table provides the chart values.` },
    tooltip,
    // Let ECharts reserve only the measured axis-label width at the article edge.
    grid: { left: 0, right: 48, top: 28, bottom: 55, outerBoundsContain: 'all' },
  };
}
function xAxis(name: string, max?: number): EChartsOption['xAxis'] {
  return { type: 'value', name, nameLocation: 'middle', nameGap: 34, min: 0, ...(max === undefined ? {} : { max }), axisLine, splitLine, axisLabel: { color: ink }, nameTextStyle: { fontSize: 13 } };
}
function rowsAxis(labels: string[]): EChartsOption['yAxis'] {
  return { type: 'category', data: labels, inverse: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: ink, fontSize: 12, margin: 14, interval: 0 } };
}
function scatterData(configs: Configuration[], field: Metric, scale = 1) {
  return configs.flatMap((c, row) => c.series[field].map((v, i) => ({
    value: [v / scale, row], name: c.label,
    // Stable visual jitter; never alters the measured horizontal coordinate.
    symbolOffset: [0, ((i * 37 % 101) / 100 - .5) * 16],
    itemStyle: { color: color(c), opacity: .58 },
  })));
}
function distribution(data: BenchmarkData, field: Metric, name: string, box = false): EChartsOption {
  const cs = data.configurations;
  const summary = box ? 'mean' : 'median';
  const best = field === 'score'
    ? Math.max(...cs.map(c=>c.stats[field][summary]))
    : Math.min(...cs.map(c=>c.stats[field][summary]));
  const series: SeriesOption[] = [];
  if (box) series.push({
    type: 'boxplot', layout: 'horizontal', boxWidth: [10, 22],
    data: cs.map(c => ({ value: [c.stats[field].min, c.stats[field].q1, c.stats[field].median, c.stats[field].q3, c.stats[field].max], itemStyle: { color: palette.chalk, borderColor: color(c) } })),
    tooltip: { formatter: (p) => {
      const item = Array.isArray(p) ? p[0] : p;
      const c = cs[item.dataIndex]; const s = c.stats[field];
      return `${c.label}<br>Range: ${f(s.min)}–${f(s.max)}<br>Q1: ${f(s.q1)} · Median: ${f(s.median)} · Q3: ${f(s.q3)}`;
    } },
  });
  series.push({ type: 'scatter', symbolSize: 5, data: scatterData(cs, field), tooltip: { formatter: (p) => {
    const item = Array.isArray(p) ? p[0] : p;
    const values = item.value as number[];
    return `${item.name}<br>${name}: ${field === 'cost' ? money(values[0]) : f(values[0])}`;
  } } });
  series.push({ type: 'scatter', symbol: 'diamond', symbolSize: 10, z: 5,
    itemStyle: { color: palette.plum, borderColor: '#fff', borderWidth: 1, opacity: 1 },
    data: cs.map((c, i) => ({ value: [c.stats[field][summary], i], name: c.label,
      ...(c.stats[field][summary] === best ? {
        symbolSize: 15, itemStyle: { color: palette.navy, borderWidth: 2 },
      } : {}),
    })),
    tooltip: { formatter: (p) => {
      const item = Array.isArray(p) ? p[0] : p;
      return `${item.name}<br>${box ? 'Mean' : 'Median'}: ${f((item.value as number[])[0], field==='cost'?2:1)}`;
    } },
  });
  return { xAxis: xAxis(name, field === 'score' ? 100 : undefined), yAxis: rowsAxis(cs.map(c=>c.label)), series };
}

export function chartOption(id: FigureId, data: BenchmarkData): EChartsOption {
  const cs = data.configurations;
  const common = base(id);
  if (id === 'pass-rate' || id === 'baseline') {
    const ranked = leaderboardRows(data);
    if (id === 'pass-rate') ranked.sort((a,b)=>b.passRate-a.passRate);
    const score = (c: typeof ranked[number]) => id === 'pass-rate' ? c.passRate : c.meanReward;
    const best = score(ranked[0]);
    return { ...common, xAxis: xAxis(id === 'pass-rate' ? 'Passing submissions (%)' : 'Mean reward (0–100)', 100), yAxis: rowsAxis(ranked.map(c=>c.label)),
      series: [{ type: 'bar', barMaxWidth: 22, showBackground: id==='pass-rate', backgroundStyle: { color: palette.chalk, opacity: .3 },
        data: ranked.map(c=>({ value: score(c), itemStyle: { color: score(c) === best ? palette.navy : configurationColor(c.family) }, label: { fontWeight: score(c) === best ? 600 : 400 } })),
        label: { show: true, position: 'right', color: ink, formatter: p=>f(Number(p.value))+(id==='pass-rate'?'%':'') },
        tooltip: { valueFormatter: v=>f(Number(v))+(id==='pass-rate'?'%':' / 100') },
      }],
    };
  }
  if (id === 'pareto') {
    // Explicit offsets keep the dense low-cost configurations separately labeled.
    const offsets: Record<string, [number, number]> = {
      'GPT 6.1 Sol / medium': [0, 48], 'GPT 6.1 Sol / high': [0, 76], 'GPT 6.1 Sol / xhigh': [10, -32],
      'GPT 6 Astra / high': [14, -30], 'GPT 6 Astra / xhigh': [16, 22],
      'Gemini Argon / high': [35, 18], 'Gemini Argon / medium': [35, 26],
      'Gemini Flash / medium': [-8, 35], 'Gemini Flash / high': [35, 72],
      'Anthropic Opus / xhigh': [-75, -28], 'Anthropic Fable / high': [-110, 36],
      'Mistral Large 4 / high': [20, -43],
      'GLM 5.3 / max': [24, 2],
      'NVIDIA Nemotron 3.5 Super VL': [28, 8],
    };
    const points = paretoRows(data);
    const frontier = points.filter(p=>p.frontier).sort((a,b)=>a.mean_cost-b.mean_cost);
    return { ...common, grid: { left: 0, right: 35, top: 40, bottom: 65 },
      xAxis: xAxis('Mean cost per submission (USD)',20),
      yAxis: { type: 'value', name: 'Mean reward (0–100)', nameLocation: 'end', nameTextStyle: { align: 'left' }, min: 40, max: 90, interval: 10, axisLine, splitLine },
      series: [{ type: 'line', name: 'Observed frontier', data: frontier.map(p=>[p.mean_cost,p.mean_score]), symbol: 'none', lineStyle: { color: palette.teal, width: 2.5 }, silent: true },
        ...points.map((p): SeriesOption => {
          const family = cs.find(c=>c.label===p.label)?.family;
          const provider = benchmarkProvider(family ?? leaderboardRows(data).find(c=>c.label===p.label)?.family);
          const providerIcon = provider ? providerIcons[provider] : null;
          const [dx,dy] = offsets[p.label] ?? [0,0];
          return { type: 'scatter', name: p.label, symbol: providerIcon ? `image://${providerIcon}` : 'diamond', symbolSize: providerIcon ? 20 : 13, symbolKeepAspect: true, z: 4,
            data: [[p.mean_cost,p.mean_score]], itemStyle: { opacity: 1, ...(providerIcon ? {} : { color: palette.brown }) },
            label: { show: true, formatter: p.label, position: 'right', fontSize: 12, color: p.frontier ? palette.teal : ink, fontWeight: p.frontier ? 600 : 400 },
            labelLine: { show: true, lineStyle: { color: p.frontier ? palette.teal : palette.rose, width: 1 } },
            labelLayout: { dx, dy },
            tooltip: { formatter: () => `${p.label}<br>Mean reward: ${f(p.mean_score)} / 100<br>Mean cost: ${money(p.mean_cost)}<br>${p.frontier ? 'On observed frontier' : 'Below observed frontier'}` },
          };
        })],
    };
  }
  if (id === 'reward-bands' || id === 'histogram') {
    const histogram = id === 'histogram';
    const bestRate = Math.max(...data.rewardBands.flatMap(b=>b.rate===null?[]:[b.rate]));
    return { ...common, grid: { left: 0, right: 26, top: 45, bottom: 60 },
      xAxis: { type: 'value', min: 0, max: 100, interval: 10, axisLine, splitLine: { show: false }, axisLabel: { fontSize: 12 }, name: 'Reward (five-point bands)', nameLocation: 'middle', nameGap: 35 },
      yAxis: { type: 'value', min: 0, ...(histogram?{}:{max:100}), name: histogram?'Submissions':'Passing submissions (%)', nameTextStyle: { align: 'left' }, splitLine, axisLine: { show: false } },
      series: [{ type: 'bar', barWidth: '86%',
        data: data.rewardBands.map(b=>({ value: [b.lower + 2.5, histogram ? b.submissions : b.rate], itemStyle: { color: !histogram && b.rate === bestRate ? palette.navy : palette.sand }, label: { fontWeight: !histogram && b.rate === bestRate ? 600 : 400 } })),
        label: { show: !histogram, position: 'top', formatter: p => {
          const rate = Number((p.value as number[])[1]);
          return rate > 0 ? `${f(rate)}%` : '';
        }, color: ink },
        tooltip: { formatter: p => {
          const item = Array.isArray(p)?p[0]:p; const b = data.rewardBands[item.dataIndex];
          const counts = histogram ? `<br>Submissions: ${b.submissions}<br>Passing: ${b.passing}` : '';
          return `Reward ${b.lower}–${b.upper}${b.upper===100?' (inclusive)':' (upper excluded)'}${counts}<br>Pass rate: ${b.rate===null?'Unavailable (empty band)':f(b.rate)+'%'}`;
        } },
        ...(histogram ? { markLine: { symbol: 'none', silent: true, label: { position: 'end', fontSize: 12, formatter: '{b}' }, data: [
          { xAxis: data.score.mean, name: `Mean ${f(data.score.mean)}`, lineStyle: { color: palette.brown }, label: { offset: [-35,-5] } },
          { xAxis: data.score.median, name: `Median ${f(data.score.median)}`, lineStyle: { color: palette.mauve }, label: { offset: [-25,-22] } },
          { xAxis: data.score.p90, name: `P90 ${f(data.score.p90)}`, lineStyle: { color: palette.navy, width: 2 }, label: { fontWeight: 600 } },
        ] } } : {}),
      }, ...(!histogram ? [{ type: 'scatter' as const, symbol: 'rect', symbolSize: [10,2], data: data.rewardBands.flatMap(b=>b.rate===0?[[b.lower+2.5,0]]:[]), itemStyle: { color: palette.brown }, silent: true },
        { type: 'scatter' as const, symbol: 'emptyCircle', symbolSize: 5, data: data.rewardBands.flatMap(b=>b.rate===null?[[b.lower+2.5,0]]:[]), itemStyle: { color: palette.mauve }, silent: true }] : [])],
    };
  }
  if (id === 'distribution') return { ...common, ...distribution(data,'score','Reward (0–100)',true) };
  if (id === 'duration') return { ...common, ...distribution(data,'duration_minutes','Minutes') };
  if (id === 'cost') return { ...common, ...distribution(data,'cost','Cost per submission (USD)') };
  if (id === 'categories') {
    const heatColors = ['#bc2023', '#eb442c', '#f29238', '#f8b324', '#0c6b37', '#094a25'];
    const bounds = [0,30,50,70,80,90,100];
    const band = (v: number) => bounds.slice(1,-1).filter(bound=>v>=bound).length;
    const bestByCategory = Array.from({length:9},(_,i)=>Math.max(...data.categories.flatMap(r=>r.category===i+1&&r.mean!==null?[r.mean]:[])));
    return { ...common, grid: { left: 0, right: 25, top: 25, bottom: 100 },
      xAxis: { type: 'category', data: Array.from({length:9},(_,i)=>`Cat. ${i+1}`), axisLine: {show:false}, axisTick:{show:false}, axisLabel:{interval:0,fontSize:12} },
      yAxis: rowsAxis(cs.map(c=>c.label)),
      visualMap: { type: 'piecewise', orient: 'horizontal', left: 'center', bottom: 12, itemWidth: 16, itemHeight: 12, itemGap: 12, textStyle: {color:ink,fontSize:11}, selectedMode: false, pieces: heatColors.map((c,i)=>({gte:bounds[i],...(i===heatColors.length-1?{lte:100}:{lt:bounds[i+1]}),label:`${bounds[i]}–${bounds[i+1]}`,color:c})), outOfRange: {color:palette.chalk}, seriesIndex: 0 },
      series: [{ type: 'heatmap', data: data.categories.map(r=>{
        const level = r.mean === null ? 0 : band(r.mean);
        const best = r.mean !== null && r.mean === bestByCategory[r.category-1];
        return { value:[r.category-1,cs.findIndex(c=>c.label===r.label),r.mean ?? -1],
          itemStyle:{color:r.mean===null?palette.chalk:heatColors[level],borderColor:'#fff',borderWidth:1},
          label:{color:r.mean===null?ink:level===0||level>=4?'#fff':'#111',fontWeight:best?700:400},
        };
      }),
        label: { show: true, fontSize: 11, formatter: p=>{
          const [category,,value] = p.value as number[];
          return value < 0 ? '—' : `${f(value)}${value===bestByCategory[category]?' ★':''}`;
        } },
        tooltip: { formatter: p=>{const item=Array.isArray(p)?p[0]:p;const [cat,row,value]=item.value as number[];return `${cs[row].label}<br>Category ${cat+1}: ${value<0?'Unavailable':f(value)+'% credit'}`;} },
      }],
    };
  }
  if (id === 'tokens') {
    const fields = ['tokens_input','tokens_output','tokens_cache'] as const;
    const names = ['Input (includes cache)','Output','Cache reads'];
    return { ...common,
      // The first panel includes its row labels; subsequent panels share those labels.
      grid: fields.map((_,i)=>({left:i===0?0:`${20+i*26}%`,width:i===0?'42%':'22%',top:45,bottom:55})),
      title: names.map((text,i)=>({text,left:`${20+i*26}%`,top:3,textStyle:headingTextStyle})),
      xAxis: fields.map((_,i)=>({ type:'value',gridIndex:i,min:0,name:'Million tokens',nameLocation:'middle',nameGap:33,splitLine,axisLine,splitNumber:3,axisLabel:{fontSize:12} })),
      yAxis: fields.map((_,i)=>({type:'category',gridIndex:i,data:cs.map(c=>c.label),inverse:true,axisTick:{show:false},axisLine:{show:false},axisLabel:{show:i===0,fontSize:12,color:ink,margin:14}})),
      series: fields.map((field,i)=>({type:'scatter',xAxisIndex:i,yAxisIndex:i,symbolSize:4,data:scatterData(cs,field,1e6),tooltip:{formatter:p=>{const item=Array.isArray(p)?p[0]:p;return `${item.name}<br>${names[i]}: ${f((item.value as number[])[0]*1e6,0)} tokens`;}}})),
    };
  }
  const groups = data.interactions.groups;
  const fields = ['agent_steps','tool_calls'] as const;
  const intervalColors = [palette.teal, palette.brown];
  return { ...common,
    grid: fields.map((_,i)=>({left:i===0?0:`${20+i*40}%`,width:i===0?'55%':'35%',top:45,bottom:45})),
    title: ['Agent steps','Top-level tool calls'].map((text,i)=>({text,left:`${20+i*40}%`,top:3,textStyle:headingTextStyle})),
    xAxis: fields.map((_,i)=>({type:'value',gridIndex:i,min:0,max:220,interval:50,axisLine,splitLine,axisLabel:{showMaxLabel:false}})),
    yAxis: fields.map((_,i)=>({type:'category',gridIndex:i,data:groups.map(g=>g.label),inverse:true,axisTick:{show:false},axisLine:{show:false},axisLabel:{show:i===0,fontSize:12,color:ink,margin:14}})),
    series: fields.flatMap((field,i): SeriesOption[] => [
      ...groups.map((g,row): SeriesOption=>({type:'line',xAxisIndex:i,yAxisIndex:i,data:[[g[field].p10,row],[g[field].p90,row]],symbol:'none',lineStyle:{color:intervalColors[i],width:3},silent:true})),
      {type:'scatter',xAxisIndex:i,yAxisIndex:i,symbolSize:10,z:5,itemStyle:{color:intervalColors[i],opacity:1},data:groups.map((g,row)=>({name:g.label,value:[g[field].median,row]})),
        tooltip:{formatter:p=>{const item=Array.isArray(p)?p[0]:p;const g=groups[item.dataIndex];return `${g.label}<br>Median: ${f(g[field].median)}<br>P10–P90: ${f(g[field].p10)}–${f(g[field].p90)}`;}},
      },
      {type:'scatter',xAxisIndex:i,yAxisIndex:i,symbolSize:0,silent:true,
        data:groups.map((g,row)=>[g[field].p90,row,g[field].median]),
        label:{show:true,position:'right',distance:8,color:intervalColors[i],fontWeight:600,formatter:p=>f((p.value as number[])[2]).replace(/\.0$/,'')},
      },
    ]),
  };
}

function compactChartOption(id: FigureId, data: BenchmarkData): EChartsOption {
  const option = chartOption(id,data);
  const panels = id==='tokens'||id==='interactions';
  option.textStyle = {...option.textStyle,fontSize:10};
  const grids = Array.isArray(option.grid)?option.grid:[option.grid ?? {}];
  option.grid = grids.map(grid=>({...grid,top:id==='histogram'?45:panels?34:26,bottom:42,...(!panels?{right:12}:{})}));
  const xAxes = Array.isArray(option.xAxis)?option.xAxis:option.xAxis?[option.xAxis]:[];
  option.xAxis = xAxes.map(axis=>{
    axis.nameGap = 27;
    axis.nameTextStyle = {...axis.nameTextStyle,fontSize:10};
    Object.assign(axis.axisLabel ??= {},{fontSize:9,color:ink});
    if (axis.type==='value') {
      axis.splitNumber = 2;
      if (['histogram','reward-bands'].includes(id)) axis.interval = 20;
    }
    return axis;
  });
  const yAxes = Array.isArray(option.yAxis)?option.yAxis:option.yAxis?[option.yAxis]:[];
  option.yAxis = yAxes.map(axis=>{
    axis.nameTextStyle = {...axis.nameTextStyle,fontSize:10};
    Object.assign(axis.axisLabel ??= {},{fontSize:9,margin:7,color:ink});
    return axis;
  });
  const titles = Array.isArray(option.title)?option.title:option.title?[option.title]:[];
  option.title = titles.map(title=>({...title,textStyle:{...headingTextStyle,fontSize:15}}));
  const series = Array.isArray(option.series)?option.series:option.series?[option.series]:[];
  option.series = series.map(series=>{
    if (series.type==='scatter') return {...series,symbolSize:series.symbol==='diamond'?8:series.symbolSize===0?0:series.symbolSize===10?7:3,
      label:{...series.label,fontSize:9},
    };
    if (series.type==='boxplot') return {...series,boxWidth:[6,14]};
    if (series.type==='bar') return {...series,label:{...series.label,show:false},...(series.markLine?{markLine:{...series.markLine,label:{...series.markLine.label,fontSize:9}}}:{})};
    return series;
  });
  return option;
}

export async function mountBenchmarkCharts(): Promise<() => void> {
  const response = await fetch(`${import.meta.env.BASE_URL}research/cre-bench/chart-data.json`);
  if (!response.ok) throw new Error(`Chart data request failed (${response.status}).`);
  const data = await response.json() as BenchmarkData;
  if (data.schemaVersion !== 1) throw new Error('Unsupported benchmark data version.');
  const disposeUI = mountBenchmarkUI();
  const charts = new Map<HTMLElement, ECharts>();
  const compactModes = new Map<HTMLElement,boolean>();
  const resizer = new ResizeObserver(entries=>{ for (const entry of entries) {
    const element = entry.target as HTMLElement;
    const chart = charts.get(element);
    if (!chart || !element.clientWidth || !element.clientHeight) continue;
    chart.resize();
    const compact = Boolean(element.closest('.benchmark-widget'));
    const id = element.dataset.benchmarkChart!;
    if (isFigureId(id) && compact!==compactModes.get(element)) {
      chart.setOption(compact?compactChartOption(id,data):chartOption(id,data),{notMerge:true});
      compactModes.set(element,compact);
      element.dataset.chartLayout = compact?'compact':'full';
    }
  } });
  const observer = new IntersectionObserver(entries=>{
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target as HTMLElement;
      const id = element.dataset.benchmarkChart!;
      if (!isFigureId(id)) continue;
      try {
        element.replaceChildren();
        const chart = init(element, undefined, {renderer:'svg'});
        charts.set(element,chart);
        const compact = Boolean(element.closest('.benchmark-widget'));
        chart.setOption(compact?compactChartOption(id,data):chartOption(id,data));
        compactModes.set(element,compact);
        element.dataset.chartLayout = compact?'compact':'full';
        element.dataset.chartReady = 'true';
        resizer.observe(element);
      } catch (error) {
        console.error(`Could not render ${id}.`,error);
        charts.get(element)?.dispose();
        charts.delete(element);
        element.textContent = 'The interactive chart could not load. Use the data table below.';
      }
      observer.unobserve(element);
    }
  }, {rootMargin:'300px'});
  document.querySelectorAll<HTMLElement>('[data-benchmark-chart]').forEach(el=>observer.observe(el));
  return ()=>{observer.disconnect();resizer.disconnect();charts.forEach(chart=>chart.dispose());disposeUI();};
}
