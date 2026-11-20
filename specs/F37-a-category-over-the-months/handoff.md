# F37 – A category over the months

**What:** one category in depth. Month by month on top: its average a month, its usual range and trend, and a chart of its months with how this one is likely to end. Then where it went, by place, and its entries for every month in the range, with search and sort. Picking a month narrows the page to it.

**Screens:** `/spending/categories/<slug>`, such as `groceries` or `eating-out`, with `?month=2026-08` and `?range=6m`. Scenarios: `rare` (Travel), `new` (Health), `empty`, `long-name`, `many` and `not-found`.

**Decisions:** "Mix" (d), in Categories' look. Cards sit two to a row, as on Spending, with the entries beside a column of cards that stays in view. The way back is "‹ Categories" over the name, and the name opens a list of the categories: picked over a breadcrumb, a one-line path and a round back button, since Spending's tabs already say it's in Spending. No tabs here, a level down.

**Edge cases:**

- Month by month: "Usually Rs 72,000 to Rs 77,100 a month", "Steady over these months" (a trend under 1.5% of the average reads as steady), totals on the bars, the biggest month, and this month's likely end as a dashed box.
- A picked month: its total against its average and usual range, arrows to the next and previous months, and "See August on Spending", which opens that month with the category picked. Its chip clears it.
- Where it went: places by entry name, each with its share, how many times, the cost each time and its change. The top 6 show, then "Show 1 more".
- Entries: every month in the range, newest first, each with its total. Search and sort live in the URL. "Open in Entries" goes to the Entries page once it's built.
- Beside the side column, the entries' head stays at the top while the list scrolls, and the month headings stop under it. "Rows" in Customize (F41) puts the entries on a row of their own. Phones stack everything in order.
- Another category from the name's list opens on the same range.
- Rare: "Spent in 2 of 12 months". New: nothing before it to compare with. Long names wrap, and crore amounts fit.
- Loading: a skeleton shaped like the page. Error: "We couldn't load your categories", with Try again.
