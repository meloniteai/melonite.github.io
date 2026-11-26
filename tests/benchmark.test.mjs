import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseArticle } from '../scripts/generate-posts.ts';
import { figureTitles, figureTable, paretoRows } from '../src/benchmark-data.ts';

const raw = await readFile(new URL('../public/research/cre-bench/chart-data.json', import.meta.url), 'utf8');
const data = JSON.parse(raw);
const mean = values => values.reduce((sum,v)=>sum+v,0)/values.length;
const near = (a,b) => assert(Math.abs(a-b)<1e-8, `${a} != ${b}`);

test('public snapshot reconciles chart distributions, headline figures and reward bands', () => {
  assert.equal(data.configurations.length,11);
  const scores=data.configurations.flatMap(c=>c.series.score);
  assert.equal(scores.length,data.assessmentCount);
  assert.equal(scores.length,459);
  near(mean(scores),data.score.mean);
  assert.equal(data.costCoverage,457);
  assert.equal(data.configurations.flatMap(c=>c.series.cost).length,data.costCoverage);
  assert.equal(data.configurations.flatMap(c=>c.series.tokens_input).length,data.tokenCoverage);
  const bins=Array(20).fill(0);
  for(const score of scores) bins[Math.min(19,Math.floor(score/5))]++;
  assert.deepEqual(data.rewardBands.map(b=>b.submissions),bins);
  for(const band of data.rewardBands) {
    if(!band.submissions) assert.equal(band.rate,null);
    else near(band.rate,100*band.passing/band.submissions);
  }
  near(data.passRate,100*data.rewardBands.reduce((sum,b)=>sum+b.passing,0)/scores.length);
  for(const config of data.configurations) for(const [field,values] of Object.entries(config.series)) {
    near(mean(values),config.stats[field].mean);
    assert.equal(Math.min(...values),config.stats[field].min);
    assert.equal(Math.max(...values),config.stats[field].max);
  }
});

test('Pareto membership is exactly the nondominated set of plotted means', () => {
  for(const point of data.pareto) {
    const dominated=data.pareto.some(other=>other.mean_cost<=point.mean_cost && other.mean_score>=point.mean_score && (other.mean_cost<point.mean_cost || other.mean_score>point.mean_score));
    assert.equal(point.frontier,!dominated,point.label);
    const c=data.configurations.find(c=>c.label===point.label);
    near(point.mean_score,c.stats.score.mean);
    near(point.mean_cost,c.stats.cost.mean);
  }
  assert.equal(data.interactions.assessmentCount,435);
  for(const g of data.interactions.groups) for(const key of ['agent_steps','tool_calls']) {
    assert(g[key].p10<=g[key].median && g[key].median<=g[key].p90);
  }
});

test('public data contains only anonymous measurements and explicitly allowed summaries', () => {
  const forbidden=/^(?:run_id|task|tasks|task_groups|rows|coverage_rows|excluded|tool_names|model|criteria|criterion_id|criterion_contracts|assessment_provenance|source_path|source_index|grader_commit|canonical_docx_library_file_id)$/;
  function inspect(value) {
    if(Array.isArray(value)) return value.forEach(inspect);
    if(value && typeof value==='object') for(const [key,v] of Object.entries(value)) { assert(!forbidden.test(key),key); inspect(v); }
  }
  inspect(data);
  assert(!/\/Users\/|\/home\/|source:\/\/|libfile_|harbor\.melonite|https?:\/\//.test(raw));
  assert.equal(data.categories.length,99);
  assert.deepEqual([...new Set(data.categories.map(c=>c.category))].sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9]);
});

test('all report figures and accessible tables survive static generation under a project base', async () => {
  const source=await readFile(new URL('../content/posts/blue-cell-bench.md',import.meta.url),'utf8');
  const article=parseArticle(source,'blue-cell-bench.md','/preview/');
  assert.equal((article.html.match(/data-benchmark-chart=/g)||[]).length,9);
  assert.equal((article.html.match(/<table>/g)||[]).length,9);
  for(const id of Object.keys(figureTitles).filter(id=>!['baseline','pass-rate'].includes(id))) assert(article.html.includes(`data-benchmark-chart="${id}"`));
  assert(article.html.includes('class="benchmark-leaderboard-table"'));
  const icons = [...article.html.matchAll(/class="benchmark-provider-icon" src="[^"]+\/(openai|anthropic|google|mistral|nvidia|zai)\.png"/g)].map(match=>match[1]);
  assert.equal(icons.length,14);
  assert.deepEqual([...new Set(icons)].sort(),['anthropic','google','mistral','nvidia','openai','zai']);
  const ids = [...article.html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Article IDs must remain unique.');
  for (const [, target] of (article.html + article.contents).matchAll(/href="#([^"]+)"/g)) assert(ids.includes(target), `Missing section target: ${target}`);
  assert(article.html.includes('href="#reward-cost-and-trajectory-analysis">Reward, Cost and Trajectory Analysis</a>'));
  const contents = article.contents;
  assert(contents);
  assert.equal((contents.match(/<li>/g) ?? []).length, (article.html.match(/<h2 /g) ?? []).length);
  assert.equal((article.html.match(/data-metric-expand /g)||[]).length,5);
  assert(article.html.indexOf('data-solver-desktop')<article.html.indexOf('id="figure-pareto"'));
  assert(article.html.indexOf('data-metrics-dashboard')>article.html.indexOf('We need realistic benchmarks'));
  assert(article.html.includes('435 executions'));
  assert(article.html.includes('recorded costs or API-equivalent estimates'));
  assert.throws(()=>parseArticle('---\ntitle: Bad figure\n---\n```cre-chart\nunknown\n```','bad.md'),/Unknown Blue Cell Bench figure/);
  assert.throws(()=>parseArticle('---\ntitle: Bad dashboard\n---\n````cre-dashboard\n```cre-chart\ncost\n```\n````','bad.md'),/all seven supplementary charts/);
});

test('combined leaderboard pairs both metrics by model and preserves source ordering',()=>{
  const originalLabels=data.configurations.map(c=>c.label);
  const {headers,rows}=figureTable('baseline',data);
  assert.deepEqual(headers,['Model / effort','Mean reward (0–100)','Pass rate (%)']);
  assert.equal(rows.length,14);
  for(const [i,row] of rows.entries()) {
    if(i) assert(Number(rows[i-1][1])>=Number(row[1]));
    if(row[0]==='Mistral Large 4 / high') {
      assert.deepEqual(row,['Mistral Large 4 / high','59.6','0.0']);
      continue;
    }
    if(row[0]==='NVIDIA Nemotron 3.5 Super VL') {
      assert.deepEqual(row,['NVIDIA Nemotron 3.5 Super VL','43.4','0.0']);
      continue;
    }
    if(row[0]==='GLM 5.3 / max') {
      assert.deepEqual(row,['GLM 5.3 / max','60.9','0.0']);
      continue;
    }
    const configuration=data.configurations.find(c=>c.label===row[0]);
    assert.equal(Number(row[1]),Number(configuration.stats.score.mean.toFixed(1)));
    assert.equal(Number(row[2]),Number(configuration.passRate.toFixed(1)));
  }
  assert.deepEqual(data.configurations.map(c=>c.label),originalLabels);
});

test('Model addenda appear only in the leaderboard, pass rate and Pareto', () => {
  const label='Mistral Large 4 / high';
  assert.deepEqual(figureTable('pass-rate',data).rows.find(row=>row[0]===label),[label,'0.0']);
  assert.deepEqual(figureTable('pareto',data).rows.find(row=>row[0]===label),[label,'59.6','1.16','No']);
  assert.deepEqual(paretoRows(data).find(point=>point.label===label),
    {label,mean_score:59.64496869928124,mean_cost:1.157,frontier:false});
  const nemotron='NVIDIA Nemotron 3.5 Super VL';
  assert.deepEqual(figureTable('pass-rate',data).rows.find(row=>row[0]===nemotron),[nemotron,'0.0']);
  assert.deepEqual(figureTable('pareto',data).rows.find(row=>row[0]===nemotron),[nemotron,'43.4','0.27','Yes']);
  assert.deepEqual(paretoRows(data).filter(point=>point.frontier && point.label!==nemotron), data.pareto.filter(point=>point.frontier));
  const glm='GLM 5.3 / max';
  assert.deepEqual(figureTable('pass-rate',data).rows.find(row=>row[0]===glm),[glm,'0.0']);
  assert.deepEqual(figureTable('pareto',data).rows.find(row=>row[0]===glm),[glm,'60.9','1.64','No']);
  assert(!data.pareto.some(point=>point.label===label || point.label===glm));
  for(const id of Object.keys(figureTitles).filter(id=>!['baseline','pass-rate','pareto'].includes(id))) {
    assert(!figureTable(id,data).rows.some(row=>row[0]===label || row[0]===nemotron || row[0]===glm),id);
  }
});
