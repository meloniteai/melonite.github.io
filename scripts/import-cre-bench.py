"""Export only reviewed chart fields from the sibling private source repository.
Usage: python scripts/import-cre-bench.py /path/to/gaiabench
No raw reports, run identities, tasks, rubric definitions or traces are copied.
"""
import hashlib
import ast
import inspect
import json
from pathlib import Path
import sys

source = Path(sys.argv[1]).resolve()
sys.path.insert(0, str(source))
from tools.financial_report.analytics import summarize, quantile, stats
from tools.financial_report.pareto import pareto_points
from tools.financial_report.pass_bands import bands
from tools.financial_report.generate import audit_public_html, build as build_source_report

reports = source / 'reports/financial-reasoning-handoff'
raw = (reports / 'benchmark-analytics.json').read_bytes()
private = json.loads(raw)
summary = summarize(private)
trajectory = json.loads((reports / 'trajectory-analytics.json').read_text())
assert trajectory['report_sha256'] == hashlib.sha256(raw).hexdigest()
fields = ['score', 'duration_minutes', 'cost', 'tokens_input', 'tokens_output', 'tokens_cache']
stat_fields = ['mean', 'median', 'p90', 'min', 'max']
configs = []
for config in summary['configurations']:
    # Sorting each measurement separately removes cross-measurement run linkage.
    series = {k: sorted(v for v in config['series'][k] if v is not None) for k in fields}
    configs.append({
        'label': config['label'], 'family': config['model_label'], 'effort': config['effort'],
        'passRate': 100 * config['validity'].get('pass', 0) / config['n'],
        'series': series,
        'stats': {k: {**{s: config['stats'][k][s] for s in stat_fields},
                      'q1': quantile(series[k], .25), 'q3': quantile(series[k], .75)} for k in fields},
    })
# Reuse the source report's anonymization order without copying its private taxonomy.
assignments = [node for node in ast.walk(ast.parse(inspect.getsource(build_source_report)))
               if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'category_order' for t in node.targets)]
assert len(assignments) == 1, 'Source report category mapping changed; review the projection.'
category_order = ast.literal_eval(assignments[0].value)
assert set(r['category'] for r in summary['categories']) == set(category_order)
public = {
    'schemaVersion': 1,
    'assessmentCount': summary['n'],
    'costCoverage': sum(c['stats']['cost']['n'] for c in summary['configurations']),
    'tokenCoverage': sum(c['stats']['tokens_input']['n'] for c in summary['configurations']),
    'score': {s: summary['score'][s] for s in stat_fields},
    'duration': {s: stats([v for c in configs for v in c['series']['duration_minutes']])[s] for s in stat_fields},
    'passRate': 100 * summary['validity'].get('pass', 0) / summary['n'],
    'configurations': configs,
    'pareto': [{k: p[k] for k in ['label', 'mean_score', 'mean_cost', 'frontier']} for p in pareto_points(summary)],
    'categories': [{'label': r['label'], 'category': category_order.index(r['category']) + 1, 'mean': r['mean']} for r in summary['categories']],
    'rewardBands': [{'lower': r['lower'], 'upper': r['upper'], 'submissions': r['n'], 'passing': r['pass'], 'rate': r['rate']} for r in bands(private)],
    'interactions': {
        'assessmentCount': trajectory['analysis_n'],
        'groups': [{'label': g['family'] + ' / ' + g['effort'],
                    **{k: {s: g[k][s] for s in ['median', 'p10', 'p90']} for k in ['agent_steps', 'tool_calls']}} for g in trajectory['groups']],
    },
}
encoded = json.dumps(public, indent=2, ensure_ascii=False, allow_nan=False) + '\n'
audit_public_html(encoded, private)
# Verify source totals and the separate interaction cohort before writing.
assert public['assessmentCount'] == 459
assert public['costCoverage'] == public['tokenCoverage'] == 457
assert public['interactions']['assessmentCount'] == 435
assert sum(r['submissions'] for r in public['rewardBands']) == public['assessmentCount']
assert sum(r['passing'] for r in public['rewardBands']) == summary['validity']['pass']
out = Path(__file__).resolve().parents[1] / 'public/research/cre-bench'
out.mkdir(parents=True, exist_ok=True)
(out / 'chart-data.json').write_text(encoded)
print(f'Exported chart data for {len(configs)} configurations; source privacy audit passed.')
