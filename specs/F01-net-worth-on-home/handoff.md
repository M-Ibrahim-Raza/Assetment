# F01 – Net worth on Home

**What:** today's net worth (Portfolio minus Debts) as the one big number on Home, with the change this month, the day prices were taken and a 12-month line. Portfolio and Debts tiles under it open their tabs.

**Screens:** `/dashboard`

**Decisions:** Rounded blocks (variant D) won over Calm Ledger, Midnight and Colour block: one big net worth number and answer headlines on rounded colour blocks read best. Bottle green, sage and ink on a mist page.

**Edge cases:**

- First use shows "Let's find your number." and "Set up your net worth", which picks the setup wizard back up. New users get the wizard after sign-up.
- The amount stays on one line from 320 px. It steps down a size for long amounts and tops out at 72 px. Lakh and crore totals get their note.
- A down month shows an arrow and a minus sign. Gain and loss colours don't show on green.
- The percentage is hidden when net worth was zero or less on the 1st.
- Hide amounts shows "Rs •••••", hides the lakh note, and nothing shifts.
- Loading shows blocks shaped like the screen. Error says what happened, with Try again.
