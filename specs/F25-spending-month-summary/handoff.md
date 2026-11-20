# F25 – Spending month summary

**What:** the top of Spending, always first, on the ink block: the month with arrows to past months, what was spent with its lakh note, and one line that answers how it's going, "Rs 9,300 more than this time last month, mostly Eating out and Bills".

**Screens:** `/spending`, and `/spending?month=2026-10` for a past month. Home's Spent row opens it.

**Decisions:** "Days" (variant c) won over "Answer first" (a) and "Month pace" (b): the answer leads on the ink block, and the month as a calendar of days makes it easy to see when money went and to narrow everything to a few days. On computers, "By shape" (d, 2026-11-18) replaced c's two columns split by count, which left empty page beside the entries and cards at different widths and heights.

**Edge cases:**

- Money spent only. Money received isn't here, and moved money (transfers, card bills, loan and committee payments) is never counted or mentioned.
- Past months: the arrows on the ink block, or a swipe on the calendar. Changing month clears picked days and keeps the rest.
- The current month compares up to the same day, "so far". A past month compares whole months.
- Spending more isn't an error: arrows, words and signs, never red.
- Each pick, a category, an account or days, shows as a chip on the ink block, and a tap on it clears it. Everything below follows the picks.
- First month: "Nothing from last month to compare with yet."
- Nothing logged yet: "See where your money goes", with "Log your first expense". There's nothing to customize until there's data.
- Layout on computers: the sections keep the person's order. With the sections area at least 44rem wide, by its own width, not the window's, they sit two to a row by shape. The pace chart takes its own row; By category, By account and the calendar are tiles.
- Two tiles share a row and one height: two breakdowns half each, the calendar 3 of 5. A tile left alone before the pace chart takes a full row. A donut sits in the middle of its card, and lists keep to the top. A calendar on its own row has cells shorter than square.
- "Layout on computers", first in Entries' Options in Customize (F32): Side column, the default, puts the entries beside the tiles next to them, in a column that stays in view while the list scrolls, scrolling to its bottom first when it's taller than the window. Tiles before the entries sit on the left, tiles after them on the right, and a tile left over before them takes its own row. A column with the calendar gets 3 of 5, else the entries do. Rows puts the entries on a row of their own. Phones stack the sections in order either way.
- Width on computers, in Customize for the whole page, under "Same layout on phone and computer" (F32): Focused (up to 1,024 px), Balanced (up to 1,280 px) or Full, the default, the whole screen as on Home. Saved with the computers' layout; Reset sets it back. Phones always use the whole screen.
- Loading: a skeleton shaped like the ink block and the default sections, in their places. Error: "We couldn't load your spending", with Try again.
- Totals are sized to fit at 320 px, crore amounts too, with the lakh or crore note under them.
- The month, comparison, picks, sorts and search live in the URL, so Back and reload keep the view.
- Hide amounts, in the header, hides every amount on the screen.
