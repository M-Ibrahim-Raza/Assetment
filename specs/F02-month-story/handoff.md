# F02 – Month story

**What:** the month so far as one sentence, "You kept Rs 97,600", with a bar of what was spent and kept. Under it: earned, spent and how far the Portfolio moved, ending in the net worth change this month.

**Screens:** `/dashboard`

**Decisions:** Rounded blocks (variant D) won over Calm Ledger, Midnight and Colour block: one big net worth number and answer headlines on rounded colour blocks read best. Bottle green, sage and ink on a mist page.

**Edge cases:**

- Overspent: "You spent Rs 33,700 more than you earned", and the bar shows Spent 100%.
- No income yet: no bar.
- Portfolio fell: an arrow and a minus sign.
- The net worth change always equals kept plus Portfolio moved.
- Earned and Spent open Spending. Portfolio moved opens Portfolio.
