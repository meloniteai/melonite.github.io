import { leaderboardAddenda } from './benchmark-addenda.ts';

export type Metric = 'score' | 'duration_minutes' | 'cost' | 'tokens_input' | 'tokens_output' | 'tokens_cache';
export interface Stats { mean: number; median: number; p90: number; min: number; max: number; q1: number; q3: number }
export interface Configuration {
  label: string; family: string; effort: string; passRate: number;
  series: Record<Metric, number[]>; stats: Record<Metric, Stats>;
}
export interface BenchmarkData {
  schemaVersion: number; assessmentCount: number; costCoverage: number; tokenCoverage: number;
  score: Stats; duration: Stats; passRate: number;
  configurations: Configuration[];
  pareto: { label: string; mean_score: number; mean_cost: number; frontier: boolean }[];
  categories: { label: string; category: number; mean: number | null }[];
  rewardBands: { lower: number; upper: number; submissions: number; passing: number; rate: number | null }[];
  interactions: { assessmentCount: number; groups: { label: string; agent_steps: Interval; tool_calls: Interval }[] };
}
export interface Interval { median: number; p10: number; p90: number }
export const figureTitles = {
  'pass-rate': 'Binary pass rate',
  pareto: 'Reward and cost',
  'reward-bands': 'Pass rate within each reward band',
  baseline: 'Mean reward and pass rate',
  distribution: 'Reward distribution by model and effort',
  histogram: 'Pooled reward distribution',
  categories: 'Mean rubric credit by category',
  duration: 'Agent execution time',
  cost: 'Cost per submission',
  tokens: 'Token use by model and effort',
  interactions: 'Agent steps and tool calls',
} as const;
export type FigureId = keyof typeof figureTitles;
export function isFigureId(value: string): value is FigureId { return Object.hasOwn(figureTitles, value); }
export const format = (n: number | null, digits = 1): string => n === null ? 'Unavailable' : n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function leaderboardRows(data: BenchmarkData) {
  return [
    ...data.configurations.map(c => ({ label: c.label, family: c.family, meanReward: c.stats.score.mean, passRate: c.passRate })),
    ...leaderboardAddenda,
  ].sort((a, b) => b.meanReward - a.meanReward);
}

export function paretoRows(data: BenchmarkData): BenchmarkData['pareto'] {
  const points = [
    ...data.pareto,
    ...leaderboardAddenda.map(c => ({ label: c.label, mean_score: c.meanReward, mean_cost: c.meanCost })),
  ];
  return points.map(p => ({
    ...p,
    frontier: !points.some(q => q.mean_cost <= p.mean_cost && q.mean_score >= p.mean_score
      && (q.mean_cost < p.mean_cost || q.mean_score > p.mean_score)),
  }));
}

/** The same reviewed measurements feed the static accessible tables and ECharts. */
export function figureTable(id: FigureId, data: BenchmarkData): { headers: string[]; rows: string[][] } {
  const cs = data.configurations;
  if (id === 'baseline') return { headers: ['Model / effort', 'Mean reward (0–100)', 'Pass rate (%)'], rows: leaderboardRows(data).map(c=>[c.label,format(c.meanReward),format(c.passRate)]) };
  if (id === 'pass-rate') return { headers: ['Model / effort', 'Pass rate (%)'], rows: leaderboardRows(data).sort((a,b) => b.passRate-a.passRate).map(c => [c.label, format(c.passRate)]) };
  if (id === 'pareto') return {
    headers: ['Model / effort', 'Mean reward', 'Mean cost (USD)', 'On frontier'],
    rows: paretoRows(data).map(p => [p.label, format(p.mean_score), format(p.mean_cost, 2), p.frontier ? 'Yes' : 'No']),
  };
  if (id === 'reward-bands') return { headers: ['Reward band', 'Pass rate (%)'], rows: data.rewardBands.map(b => [`${b.lower}–${b.upper}${b.upper === 100 ? ' (inclusive)' : ' (upper excluded)'}`, format(b.rate)]) };
  if (id === 'histogram') return { headers: ['Reward band', 'Submissions', 'Passing', 'Pass rate (%)'], rows: data.rewardBands.map(b => [`${b.lower}–${b.upper}${b.upper === 100 ? ' (inclusive)' : ' (upper excluded)'}`, format(b.submissions,0), format(b.passing,0), format(b.rate)]) };
  if (id === 'categories') return { headers: ['Model / effort', ...Array.from({length:9},(_,i)=>`Category ${i+1} (%)`)], rows: cs.map(c=>[c.label,...Array.from({length:9},(_,i)=>format(data.categories.find(r=>r.label===c.label && r.category===i+1)?.mean ?? null))]) };
  if (id === 'tokens') return { headers: ['Model / effort', 'Mean input (incl. cache)', 'Mean output', 'Mean cache reads'], rows: cs.map(c=>[c.label,...(['tokens_input','tokens_output','tokens_cache'] as const).map(k=>format(c.stats[k].mean,0))]) };
  if (id === 'interactions') return { headers: ['Model / effort','Steps P10','Steps median','Steps P90','Calls P10','Calls median','Calls P90'], rows: data.interactions.groups.map(g=>[g.label,...(['agent_steps','tool_calls'] as const).flatMap(k=>(['p10','median','p90'] as const).map(s=>format(g[k][s])))]) };
  const metric = id === 'duration' ? 'duration_minutes' : id === 'cost' ? 'cost' : 'score';
  const unit = id === 'duration' ? ' (min)' : id === 'cost' ? ' (USD)' : '';
  const keys = id === 'distribution' ? ['min','q1','median','q3','max','mean'] as const : ['mean','median','p90'] as const;
  return { headers: ['Model / effort',...keys.map(k=>k.toUpperCase()+unit)], rows: cs.map(c=>[c.label,...keys.map(k=>format(c.stats[metric][k],id==='cost'?2:1))]) };
}
