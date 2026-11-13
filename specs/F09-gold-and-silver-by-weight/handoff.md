# F09 – Gold and silver by weight

**What:** add gold and silver pieces by weight and see each one's value at today's Sarafa rate. Optionally add when it was bought and what was paid, to see the profit or loss as of today. Change or remove a piece.

**Screens:** `/setup`, the Gold and silver step (`?step=metals`). Quick add's "Add gold or property" and Portfolio will use the same form later.

**Decisions:** "Add a piece" (variant d) won over Jeweller's slip, One at a time and Piece by piece because it's complete: everything about a piece, from weight to profit, is in one panel.

**Edge cases:**

- The step says "Your gold and silver" and "Jewellery, bars and coins. Enter the weight and we work out today's value."
- The panel is open for the first piece. After that, pieces are rows with a total, "Add a piece" opens the panel at the end, and a tapped row opens in place to change or remove it.
- The panel asks: name (optional), gold or silver, jewellery or bar or coin, karat, weight. Jewellery sets 21K and a bar or coin 24K, and the user can change it. Silver has no karat and one rate, priced as pure.
- Weight is tola, masha and ratti, each optional, or grams. Masha go up to 11 and ratti to 7. Switching unit keeps the weight, and rates show in that unit.
- Today's value shows under the weight as it's typed, with the rate and its date. Old rates say today's isn't out yet. With no rate at all, a piece saves by weight, reads "Priced once today's rate is in", and stays out of net worth until then. That state isn't in the prototype yet.
- "I don't know the exact weight" opens a pop-up: "Enter the exact weight if you can", with the receipt, a jeweller and a kitchen scale as ways to find it. "Use a rough weight" opens typical pieces, from a ring at ½ tola to a bridal set at 10 tola, or the user's own guess. Check these weights with a jeweller before launch.
- A rough weight is marked ≈, counts in net worth, and adds "Get your wedding set weighed" to Home's Things to check. F03 builds that item.
- When it was bought (optional): the month and year, both or neither, with Today. Then the price paid.
- A typed price is the cost. Without one, the cost is the weight at that month's average Sarafa rate, marked ≈. How far back past rates go is for the spec.
- With no price and no date, the piece counts as bought the day it's added. Its cost is its value that day, after any deduction, so profit starts at Rs 0 and Portfolio tracks it from then.
- As the price is typed, the hint gives what that month's rate puts it at. A price under half or over 3 times that warns "Check for a missing zero" or an extra one, and still saves.
- Deduction (optional): a % per piece, for jewellery only, starting at the last % used. Bars and coins always get the full rate.
- The last deduction % and the last unit are saved on the user's account, so every place that uses the form starts from them.
- The panel ends on the sum: today's value (less any deduction), the cost, and the profit or loss as of today, with + or − and a percentage. A line with text under its label gets no lakh note.
- A failed save keeps everything typed, says "We couldn't save Bangles", and the button says Try again. A slow save shows "Saving…". Remove is at once, with an Undo toast for 10 s.
- 8 pieces with a long name wrap cleanly, and the total reaches crores.
- The rate source and when it refreshes each day are for the spec and an ADR. PKR only.
