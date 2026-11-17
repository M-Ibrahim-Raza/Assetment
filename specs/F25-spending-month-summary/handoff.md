# F25 – Spending month summary

**What:** the top of Spending, always first, on the ink block: the month with arrows to past months, what was spent with its lakh note, and one line that answers how it's going, "Rs 9,300 more than this time last month, mostly Eating out and Bills".

**Screens:** `/spending`, and `/spending?month=2026-10` for a past month. Home's Spent row opens it.

**Decisions:** "Days" (variant c) won over "Answer first" (a) and "Month pace" (b): the answer leads on the ink block, and the month as a calendar of days makes it easy to see when money went and to narrow everything to a few days.

**Edge cases:**

- Money spent only. Money received isn't here, and moved money (transfers, card bills, loan and committee payments) is never counted or mentioned.
- Past months: the arrows on the ink block, or a swipe on the calendar. Changing month clears picked days and keeps the rest.
- The current month compares up to the same day, "so far". A past month compares whole months.
- Spending more isn't an error: arrows, words and signs, never red.
- Each pick, a category, an account or days, shows as a chip on the ink block, and a tap on it clears it. Everything below follows the picks.
- First month: "Nothing from last month to compare with yet."
- Nothing logged yet: "See where your money goes", with "Log your first expense". There's nothing to customize until there's data.
- Loading: a skeleton shaped like the ink block, the categories and the calendar. Error: "We couldn't load your spending", with Try again.
- Totals are sized to fit at 320 px, crore amounts too, with the lakh or crore note under them.
- The month, comparison, picks, sorts and search live in the URL, so Back and reload keep the view.
- Hide amounts, in the header, hides every amount on the screen.
