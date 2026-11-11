# F07 – Setup wizard

**What:** the screens a new user goes through after sign-up to get their net worth: a welcome, a board to tick what they have, one question at a time about only those, and their net worth at the end.

**Screens:** `/setup`, which keeps its place in `?step=`. Home's first-use button on `/dashboard` opens it.

**Decisions:** "Tick what you have" (variant C) won over "Build your number" (A) and "One question at a time" (B): ticking first means people only answer about what they have. From A it takes the named step bar and the white card. From B it takes one question per screen.

**Edge cases:**

- The welcome says "Let's find your number.", lists the three things setup does, and has Start. It also says setup takes about 5 minutes and can be stopped with Finish later.
- The board opens with Bank account ticked. Continue waits for one tick, and counts the tiles that are ticked or have something added.
- A tile with something added stays ticked, shows "2 added · Rs 327,450", and opens its step. It can be unticked only once its entries are removed.
- The step bar shows only the groups with something ticked, so at most 5. Tapping a step opens it. A group gets its tick when the user leaves it, even through "Skip for now".
- A step with 2 or more ticked tiles shows them as pills under the bar. A pill gets a tick once something is added under it, and tapping it opens it.
- "So far" shows the running net worth at the end of the bar, hidden at zero. On phones it drops under the step count.
- Back on the first question returns to the board. The place is in the URL, so browser Back and reload keep it.
- "Finish later" goes to Home at any point. Coming back shows "Welcome back" on the step where the user left.
- A half-done setup shows in Home's Things to check as "Finish setting up: gold and debts left". That item isn't in Home's prototype yet.
- The finish counts the net worth up from zero, with no motion when the device asks for reduced motion. It has the lakh or crore note, Portfolio and Debts tiles, "Go to Home" and "Change what I have". Its total matches Home's.
- Loading shows a board-shaped skeleton. A load error says what was added is safe, with Try again.
- Main buttons are 48 px tall. Production gets a proper large Button size for them, not one-off classes.
