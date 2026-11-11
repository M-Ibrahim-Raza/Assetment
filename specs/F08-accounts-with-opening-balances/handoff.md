# F08 – Accounts with opening balances

**What:** add bank accounts, mobile wallets and cash with today's balance, one question at a time: which one, how much, and whether there's another. Change a balance, or remove an account.

**Screens:** `/setup`, the Accounts step (`?step=bank`, `wallet` or `cash`).

**Decisions:** bank and wallet names are one-tap chips, with "Another bank" to type one. "+ Add another bank" sits under the list, and Next sits in a footer under a hairline, as in variant A.

**Edge cases:**

- Bank offers chips for Meezan Bank, HBL, UBL and others, or a typed name. Then it asks the amount, then "Any other bank account?".
- Wallet works the same, with JazzCash, Easypaisa, SadaPay and NayaPay.
- Cash asks only "How much cash do you have?", then moves on.
- The amount field opens the number keypad, adds commas as you type, shows the lakh or crore note, and takes a pasted "Rs 245,300". It allows up to 11 digits.
- Field errors show only after Next, such as "Enter the balance. Use 0 if it's empty."
- A failed save keeps the amount, says "We couldn't save HBL Current", and the button says Try again. A slow save shows "Saving…".
- Only the balance can be changed. The name can't be yet.
- Remove happens at once, with an Undo toast for 10 s.
- 12 accounts with long names wrap cleanly, and totals reach crores.
- PKR only. Foreign currency is F13.
