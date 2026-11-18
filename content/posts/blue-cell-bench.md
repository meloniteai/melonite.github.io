---
title: "Blue Cell Bench: Can AI Underwrite the Deal?"
description: Results from 459 commercial real estate underwriting submissions across 11 model and effort configurations.
order: 1
toc: true
---

We're happy to announce Blue Cell Bench, our commercial real estate underwriting evaluation built on real-world deal materials. We partnered with GAIA Real Estate, a long-standing US-based real estate firm, to create this evaluation and test frontier AI capabilities in this domain.

Private equity CRE analysis is about assessing risk and allocating capital: deciding where to invest, at what price, and on what terms. Analysts turn fragmented deal materials into discounted cash flows, IRR projections, and risk measures such as debt-service coverage and downside sensitivity, then judge whether expected returns justify the risks.

The underwriting process brings all of these together, and we explore why training models for intricate financial modeling remains in its early days, with much still to unravel.

## Environment

Each task includes a directory containing dozens of anonymized files from a real deal room. Solvers receive an environment with terminal access and Python and are required to produce a completed Excel underwriting workbook.

Some of the existing work in adjacent finance evals include Computer Use. In Blue Cell Bench, we focus on the nuanced underwriting process itself, while largely deferring the complexity of navigating human interfaces. CRE underwriting involves specialized software beyond Excel, but this evaluation focuses on the core financial methodology. This leaves labs free to train interface navigation through separate, specialized workloads.

```cre-desktop
Alderwick-St-55
```

*Explore the environment to inspect the task prompt, trajectory excerpts, and analyst workbook.*

## Leaderboard

Blue Cell Bench is challenging for frontier models. Binary pass rates range from 0.0% to 40.5% across all configurations, while grader rewards show a promising mix of positive and negative polarities and a clear correlation with pass rate (see [Reward, Cost and Trajectory Analysis](#reward-cost-and-trajectory-analysis)). Only GPT Astra and GPT 6.1 Sol produced submissions that met all critical requirements. GPT 6 Astra at xhigh effort has the highest pass rate, at 40.5%.

```cre-chart
baseline
```

*Mean reward (0–100) and passing submissions (%). Select a column heading to sort.*

## Reward–Cost Pareto

```cre-chart
pareto
```

*Mean reward versus mean cost per submission. Teal line: observed Pareto frontier · reward axis: 50–90.*

## Grader Criteria


The criteria are derived from real supervision materials: investment memos, investment committee notes, and populated analyst workbooks. The reward rubric uses approximately 127 criteria per task. These criteria treat underwriting as an incremental, layered analysis, reflecting how financial analysts work in practice. Solvers encounter varied deal room files including PDF, XLSX, and MSG files, and a realistic prompt resembling the everyday work of a private equity CRE analyst. Mean rubric credit varies substantially by category.

The dilemma between using a deterministic verifier, a judge, or some hybrid is real. On one hand, verifiers that stem from good quality supervision are what surface real errors in model submissions. These are exactly the quality checks you cannot and should not handwave. On the other, translating supervision material into code is an engineering challenge that comes with a slew of problems that can make a grader unfair or outright useless.

Fairness and calibration are not just questions of tolerance, or whether an answer is right or wrong depending on context, but ultimately a question of whether the verifier is a useful instrument for hillclimbing on the actual task, rewarding effectively within the resource constraints of training. 

In BCB, we’ve landed on a somewhat hybrid animal. The graders are deterministic, but the solver gets the full list of fields, units, basis, and calculation periods, and is asked to fill in a dedicated sheet from which the code can predictably extract calculations. That comes with the tradeoff of being somewhat easier to game or reward hack, so we have to work a little harder on producing good and bad fixtures to minimize the chance that a fabricated workbook scores high. The verifier also checks the workbook itself to ensure the underwriting process was gradually built before the solver submitted the results.

```cre-chart
categories
```

*Mean percentage of available credit within each category. Colors indicate credit bands, with green reserved for 80% and above. ★ marks the highest mean in each category.*

We designed the graders to reward precise evidence reconciliation, numerical accuracy, economic impact, and the modularity and robustness of the analyst workbook. A separate pass/fail verdict captures whether a submission meets all critical underwriting requirements. These requirements address the failures that can force an analyst to discard a frontier model's work entirely and start from scratch.

As the breakdown above shows, modular grading exposes multiple areas where frontier performance is lacking. Failures tend to cluster where evidence reconciliation meets intricate, long-term cash-flow projections. We like to think of financial modeling as the older brother of arithmetic, whose exact, step-by-step logic is itself a learned capability in LLMs, not a given. CoT helps models work through those steps, and learning how to verify them is a further training concern that's baked into the training corpora. It’s not that financial modeling is not verifiable, but its verification methodology differs from coding, where implementations can be checked to “behave right” within certain contextual boundaries. In financial modeling, those boundaries can be harder to establish and reproduce. Capturing how an analyst verifies while working, and making that process available as training data is therefore an important frontier of its own.

## Summary

Agents achieve a mean reward of 71.7, but only 12.0% of submissions meet every essential requirement. The solver's work remains net-not-useful if verifying and correcting it takes more work than it saves.

We believe progress in frontier AI depends heavily on realistic benchmarks like Blue Cell Bench to close the gap between potentially useful and trustworthy work. Outside of coding, math and other highly verifiable domains, much of the world's data remains out of reach and within organizations, yet data realism and the presence of high-quality supervision materials is often overlooked in discussions of RSI and superintelligence. We look forward to building more finance benchmarks through partnerships like ours with GAIA Real Estate.

## Reward, Cost, and Trajectory Analysis

Expand a widget for its full chart, commentary, and data table.

````cre-dashboard
## Relationship Between Reward and Pass Rate

The 95–100 reward band, approximately the 93.2nd percentile and above, has the highest observed pass rate at 35.5%.

```cre-chart
reward-bands
```

*Pass rate within each five-point reward band, pooling all models and tasks. Empty bands have no estimated pass rate.*

## Reward Distributions

```cre-chart
distribution
```

*Dots: submissions · diamond: mean · box: interquartile range · center line: median · whiskers: range.*

```cre-chart
histogram
```

*Pooled rewards in five-point intervals. Reference lines mark the mean, median, and 90th percentile.*

## Agent Execution Time

Agent execution time includes tool use and waiting. The mean is 34.7 minutes, the median is 27.2 minutes, and the 90th percentile is 61.1 minutes. Configuration means range from 14.9 minutes for GPT 6.1 Sol at medium effort to 68.5 minutes for Gemini Argon at high effort.

```cre-chart
duration
```

*Dots: individual execution times · diamond: median.*

## Cost per Submission

Mean cost per submission ranges from $0.92 for GPT 6.1 Sol at medium effort to $17.00 for Anthropic Fable at high effort.

```cre-chart
cost
```

*Costs in US dollars, using recorded costs or API-equivalent estimates at October 2026 prices. Diamond: median.*

## Token Use by Model and Effort

Input totals include cache reads; output totals include billable thinking tokens where applicable.

```cre-chart
tokens
```

*Dots: individual measurements. Axes are in millions of tokens, with separate scales for each panel.*

## Agent Steps and Tool Calls

Agent steps and top-level tool calls across 435 executions.

```cre-chart
interactions
```

*Dots: medians · lines: 10th–90th percentiles · labels: median values.*
````

```article-cta
If this kind of work interests you, come work with us.

[Get in touch →](mailto:contact@melonite.ai) [Partner with us →](/partners/)
```
