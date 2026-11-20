# F27 – Spending by category

**What:** where the money went: the biggest categories, each with a bar, a mark for the comparison and the change in words. The top 5 show first, then "Show 14 more · Rs 324,500". Picking a category narrows the whole screen. It can show as a donut chart instead (F33).

**Screens:** `/spending`, with `?category=Groceries` and `?category-order=change`. A picked category offers "See its entries" and "Open Groceries", which opens its own page (F37). The heading, "By category ›", opens Categories (F35).

**Decisions:** a list of bars, each with a mark for the comparison: sizes and change read at a glance, with the exact amounts in words. Not added: budgets (a v1 non-goal) and category groups (no such data).

**Edge cases:**

- Its settings in Customize: Keep the biggest changes in view, on: the categories the answer names stay in view, tagged "Biggest rise". Share of spending, on: "31%". Sorting, on.
- Sorting: one menu, Sort by Amount, Change, Name or Entries, each either way. A new field starts its natural way. Change isn't offered with nothing to compare. By Entries, each row says "9 entries".
- A picked category stays in view, even at Rs 0. The chip on the ink block clears it. Picking a category keeps a picked account, so any row can still be picked.
- Categories spent on before but not now come last, at Rs 0.
- One hidden row just shows: no "Show 1 more" button.
- Nothing spent in the picks: "Nothing spent in Groceries in October."
