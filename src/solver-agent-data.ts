export type AgentMoment = {
  elapsed: string;
  narration: string;
  tool?: { label: string; code: string; output: string };
};

// Selected excerpts, with identifying names replaced and filenames redacted.
// Tool calls and outputs are excerpts; the requested recommendation
// includes the original offer, while source schedules and private grading maps
// are omitted. These commands are never executed.
export const agentConfig = { name: 'Agy', model: 'Gemini Argon', effort: 'high' } as const;
export const agentWindowTitle = `${agentConfig.name} · ${agentConfig.model} · ${agentConfig.effort}`;
// Recorded totals for this same run. Input includes cache reads; output includes
// thinking tokens. Execution is the agent phase, excluding setup and grading.
export const agentRunMetrics = {
  inputTokens: 20_043_273,
  outputTokens: 262_500,
  executionSeconds: 4218.49429,
  trajectorySteps: 126,
  agentSteps: 123,
} as const;
// Keep the source Markdown in the data; display its words without file links.
export const agentNarrationText = (text: string) => text.replace(/\[([^\]]+)\]\(file:[^)]+\)/g, '$1').replace(/\*\*|`/g, '');
export const agentMoments: readonly AgentMoment[] = [
  {
    "elapsed": "00:00",
    "narration": "Inspecting the candidate and output directories is the initial step, followed by examining the required outputs. This will provide a foundation for understanding the real estate underwriting task related to the \"55 Alderwick Street\" acquisition. The goal is to identify the critical information necessary for an acquisition recommendation."
  },
  {
    "elapsed": "00:17",
    "narration": "Inspecting the contents of `[assumptions workbook]` is the initial step to understand the expected input and desired output formats. Examining the structure and data within these files will inform how to process and present the results appropriately. The goal is to identify all sheets, cells, and their details.",
    "tool": {
      "label": "run_command",
      "code": "python3 -c \"\nimport openpyxl\nwb = openpyxl.load_workbook('[assumptions workbook]', data_only=False)\nprint('ASSUMPTIONS sheets:', wb.sheetnames)\nfor name in wb.sheetnames:\n    ws = wb[name]\n    print(f'=== {name} ({ws.max_row}x{ws.max_column}) ===')\n    for r in range(1, ws.max_row+1):\n        row_vals = [ws.cell(r, c).value for c in range(1, ws.max_column+1)]\n        if any(v is not None for v in row_vals):\n            print(f'R{r}:', row_vals)\n\"",
      "output": "ASSUMPTIONS sheets: ['Assumptions']"
    }
  },
  {
    "elapsed": "01:48",
    "narration": "Investigating the remaining Excel files to uncover additional relevant data. Reviewing the August and June rent rolls, along with the utilities audit, to identify patterns or discrepancies. The aim is to find connections to the initial rent roll data.",
    "tool": {
      "label": "run_command",
      "code": "python3 -c \"\nimport openpyxl\nfor fn in ['[source workbook 1]', '[source workbook 2]', '[source workbook 3]']:\n    print('====================================')\n    print('FILE:', fn)\n    wb = openpyxl.load_workbook('/workspace/candidate/evidence/' + fn, data_only=True)\n    for s in wb.sheetnames:\n        ws = wb[s]\n        print(f'--- Sheet: {s} ({ws.max_row}x{ws.max_column}) ---')\n        for r in range(1, min(60, ws.max_row+1)):\n            vals = [ws.cell(r, c).value for c in range(1, ws.max_column+1)]\n            if any(v is not None for v in vals):\n                print(f'R{r}:', vals)\n        for r in range(max(61, ws.max_row-40), ws.max_row+1):\n            vals = [ws.cell(r, c).value for c in range(1, ws.max_column+1)]\n            if any(v is not None for v in vals):\n                print(f'R{r}:', vals)\n\"",
      "output": "Command exited with code 0."
    }
  },
  {
    "elapsed": "07:26",
    "narration": "Now focusing on the data normalization process, several factors influence rent calculations: lease term, free-rent periods, unit square footage, and rent per square foot on either an annual or monthly basis. Understanding the 'conversion' type (`supplied`, `gross_to_net`, or `net_to_gross`) is critical for accurate calculations.\n\nThe presence of fees introduces complexity, including whether the fee amount is known, who pays the fee, and how the fee is treated (excluded, included in net rent, separate, or tenant-paid). The inclusion or exclusion of any separate owner fees also needs clear identification.\n\nIt's crucial to map the raw fee source amount to how the fee is treated; discrepancies or missing data could significantly impact the normalized rent. The relationship between documented fees and the anchor economics requires careful reconciliation."
  },
  {
    "elapsed": "21:03",
    "narration": "The concession allowance from `[assumptions workbook]` must be considered, since documented free rent takes precedence over a concessions allowance, requiring careful reconciliation of these two data points."
  },
  {
    "elapsed": "48:57",
    "narration": "Analyzing average monthly rents for 1BR, 1.5BR, and 2BR units, comparing them against comparable market data and prior leasing information reveals key performance indicators. The total stabilized market rent is calculated and validated against the initial rent roll, showing a substantial increase.\n\nVerifying the rent escalation calculation within the 48-month unit rollover tree is crucial, particularly confirming the initial market rent for the first month reflects the specified monthly escalation rate. This precise check ensures accurate projections for the upcoming period.",
    "tool": {
      "label": "run_command",
      "code": "# Let's simulate the 48-month unit_months schedule (m = 1..48, 2022-09-01 to 2026-08-01)\nmonths = []\nfor m in range(48):\n    yr = 2022 + (8 + m) // 12\n    mo = (8 + m) % 12 + 1\n    first_day = datetime.date(yr, mo, 1)\n    # month end\n    if mo == 12:\n        last_day = datetime.date(yr, 12, 31)\n    else:\n        last_day = datetime.date(yr, mo + 1, 1) - datetime.timedelta(days=1)\n    months.append((m + 1, first_day, last_day))",
      "output": "Command exited with code 0."
    }
  },
  {
    "elapsed": "49:55",
    "narration": "Initial calculations are complete; the unit-month rows are verified and weight conservation is confirmed at 100%. Year 1 potential, scheduled vacancy, and leasing figures are now available. These numbers provide a foundation for further analysis."
  },
  {
    "elapsed": "50:42",
    "narration": "Examining the subsequent years, NOI consistently increases. The forward year reveals segmented NOIs for residential, retail, and parking components. Applying exit capitalization rates allows for the calculation of gross sale values for each segment."
  },
  {
    "elapsed": "56:39",
    "narration": "Focus is on crafting a script that generates the target Excel file. Goal is precise preservation of template formatting within the 'Results' sheet. The script will populate data into the existing structure, leaving labels, units, and headers intact.",
    "tool": {
      "label": "run_command",
      "code": "python3 [workbook-generation script]",
      "output": "Populated units, comparables, and unit_months on Results."
    }
  },
  {
    "elapsed": "59:40",
    "narration": "Creating supporting sheets: Executive Summary, Assumptions and Citations, Comps and Valuation, Rent Roll and Rewrite, Pro Forma and T12 Comparison, Scenarios and Sensitivities. These will be appended to the /tmp/ directory for documentation.\n\nVerifying that the cell references from the `Results` sheet are correctly mapped to the `Assumptions_and_Citations`, `Rent_Roll_and_Rewrite`, and `Comps_and_Valuation` sheets, ensuring data integrity. Specifically, confirming that the 36-month financing rate schedule, equity cash flow schedules, stabilized market rents, and weighted cap rate calculations are accurate. These validations are critical for the financial model's reliability.",
    "tool": {
      "label": "run_command",
      "code": "python3 [workbook-generation script]",
      "output": "Successfully generated: [output workbook]"
    }
  },
  {
    "elapsed": "1:08:00",
    "narration": "Template and formula checks show no issues. All expected fields are present in the results map. This suggests the data structure and calculations are sound based on these checks. Proceeding to evaluate other potential failure points.",
    "tool": {
      "label": "run_command",
      "code": "import openpyxl\nwb = openpyxl.load_workbook('[output workbook]', read_only=True, data_only=False)\nprint('Sheets in workbook:', wb.sheetnames)",
      "output": "Sheets in workbook: ['Results', 'Executive_Summary', 'Assumptions_and_Citations', 'Comps_and_Valuation', 'Rent_Roll_and_Rewrite', 'Pro_Forma_and_T12_Comparison', 'Scenarios_and_Sensitivities']"
    }
  },
  {
    "elapsed": "1:08:00",
    "narration": "I have completed the acquisition underwriting for **55 Alderwick Street** (including its exterior parking lots at 51 Alderwick Street / Lot A and 67 Alderwick Street / Lot B) as of **August 25, 2022**, and saved the completed workbook to [output workbook].\n\n**Recommendation**: **PURSUE ACQUISITION AT A $73,000,000 OFFER PRICE** (`$821.59/SF` across `88,852 SF` of combined apartment and leased retail area; `$623,932/apartment`), representing a `$528,738` (`0.72%`) negotiation discount to our concluded **As-Is Market Value of $73,528,738** (`$827.54/SF`) as of August 25, 2022."
  }
];

export const agentReplayNote = 'Selected excerpts from a recorded trajectory; names anonymized and filenames redacted. Elapsed times are from the original run, rounded after one hour.';
