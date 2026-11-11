# F03 – Things to check

**What:** values that may no longer be true, as a short to-do list on Home. Balances to confirm get "Still right" or "Update". Old hand-typed values, such as property, get "Update value".

**Screens:** `/dashboard`

**Decisions:** Rounded blocks (variant D) won over Calm Ledger, Midnight and Colour block: one big net worth number and answer headlines on rounded colour blocks read best. Bottle green, sage and ink on a mist page.

**Edge cases:**

- Home shows up to 3, then "Show N more".
- "Still right" removes the check at once, with a 10-second Undo toast, and focus moves to the heading.
- After the last one: "All checked". With no checks, there's no block.
- Long names wrap, and a slow save shows "Saving…".
- "Still right" is outlined, so Add stays the only primary button.
- How old a balance must be before it becomes a check is left to the spec.
