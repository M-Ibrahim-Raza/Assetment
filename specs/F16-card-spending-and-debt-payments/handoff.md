# F16 – Card spending and debt payments

**What:** in Quick add, spending can come from a credit card, which adds to what is owed on it. Moved money can pay a card bill, a loan instalment or a committee, which lowers what is owed and leaves net worth the same.

**Screens:** `/add`

**Decisions:** cards and debts in Quick add, the simple way, won over a markup field on loan payments and over keeping debts out. Logging a card bill as spending would count the purchases twice.

**Edge cases:**

- "Paid from" lists credit cards after the accounts. Loans and committees can't be spent from.
- "Moved → To" lists the other accounts, then all debts. More shows them under the headings Accounts and Debts.
- A debt shows what is owed and what it will be, such as "Owed Rs 45,000 → Rs 20,000". Paying more than is owed warns "More than you owe."
- The whole payment counts as paid off. Any markup in it is corrected later, when Things to check (F03) asks about the debt.
- A card can't receive money or be moved from, so switching to Received or Moved goes back to the first account.
- The toast says "You now owe Rs 48,499 on HBL credit card". Home's Debts tile and net worth update.
