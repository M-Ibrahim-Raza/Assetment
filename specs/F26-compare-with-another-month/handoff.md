# F26 – Compare with another month

**What:** what the whole Spending screen compares with: last month, the usual month (the average of up to 3 months before) or a month picked in a sheet. The answer line, the figures under it, the pace chart and every category and account row follow it.

**Screens:** `/spending`, with `?compare=usual` or `?compare=2026-03`. Last month is the default and isn't in the URL.

**Decisions:** one choice for the whole screen, as pills on the ink block under the answer. Until 2026-11-17 they sat on the pace chart and changed only the chart. "Usual" stays the name.

**Edge cases:**

- "Compare with": Last month · Usual · Pick a month. On phones the pills are 36 px tall with a 44 px tap area; from tablet width, 44 px.
- Pick a month opens a sheet of every month with data but the one shown. A past month can't pick the unfinished current month. The pill then shows the month, "Mar 2026".
- The figures under it: "October by now · Rs 203,100" and "October in all · Rs 281,100". For picked days, the same dates: "3–9 Oct".
- Sentences follow the choice: "Rs 4,000 more than usual by now", and the rows' mark "Usual by the 12th".
- Usual averages the same days of up to 3 months before, and needs 2. A choice without data falls back to last month.
- One picked day isn't compared.
