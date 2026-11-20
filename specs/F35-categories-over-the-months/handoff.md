# F35 – Categories over the months

**What:** every spending category over 6 months, 12 months or this year. On top, Spending by month: the average a month, a line on which categories take most and what's new, the range's figures, and a chart of each month split into the top 5 categories and the rest. Under it, Every category: a bar for each month, its average a month, its total and how often.

**Screens:** `/spending/categories`, with `?range=6m`, `?range=this-year`, `?sort=average`, `?month=2026-08` and `?category=Groceries`. Reached from Spending's tabs, "Overview | Categories", on `/spending` and here, and from Spending's "By category ›" heading.

**Decisions:** "Mix" (d), built from the three tried: b's ranked rows with a Total column, and c's split-bar chart, with the answer, the figures and the chart in one block. Tabs won over a Categories item in the sidebar: they work on phones, and the places stay five. Later, not v1: an icon or colour per category, category groups, a place's own page with moving all its entries, a median line, export.

**Edge cases:**

- This month is unfinished: drawn outlined, "Nov so far", and left out of the average.
- Average a month: the finished months in the range since the first with any data. A month with nothing in a category counts as Rs 0, so a rare one says "Spent in 2 of 12 months". A new one says "New this month", with no average.
- The chart's key picks a category, and "Rest · 12" opens a menu of the others. Each bar shows its total, and the biggest month is labelled.
- A picked month: its total against the average, and its categories with their share. The top 6 show, and "And 5 more" opens a menu. "See August on Spending" opens that month.
- A picked category: its average a month, total, how often and this month against usual, with "Open Groceries". With a month too: that category in that month, and "See its entries in April", which goes to the Entries page once it's built.
- Sort by total, average, change or name, either way. Categories with nothing in the range sit in a closed "Nothing spent · 3" row.
- Spent categories only. Change is never red: arrows, words and signs.
- Nothing logged yet: "Your categories, month by month", with Log your first expense. Loading: a skeleton. Error: "We couldn't load your categories", with Try again. Many: 20 categories over 24 months, with crore totals.
- The range, sort, month and category live in the URL, so Back and reload keep the view. Opening a category keeps the range.
