# Money model

How money that is owned or owed changes in the app. Every spec that touches money follows these rules.

## Basics

- Net worth is Portfolio minus Debts.
- Portfolio has 5 groups: Cash & equivalents, Stocks and funds, Gold and silver, Property, and Owed to you.
- Owed to you holds money lent to people and committees before the user's turn.
- Debts are credit cards, loans, and committees after the user's turn. All amounts are in PKR in v1.
- Moving money between the user's own things never changes net worth. That covers accounts, debts and Owed to you.
- Spent means purchases, from an account or a card, plus markup and fees.
- Received means income only.
- Borrowed money, debt payments, the committee pot and repaid loans never count as Spent or Received.

## Debt kinds

There are three: credit card, loan and committee. A loan covers bank loans, car and home finance and personal loans from family or friends.

## Loans

A loan counts what is owed today. That's the amount the lender would take to close it now.

The form asks "Do you pay a fixed amount each month?" The answer decides how the loan works. The lender doesn't.

**With a fixed monthly amount:**

- The loan saves the instalment, the instalments left, the payment day and the account it's paid from.
- The app adds each instalment by itself on its day.
- Each instalment has two parts: markup, and the part that lowers the loan.
- The app works out the markup rate from what's owed, the instalment and the instalments left. The user never types a rate. A loan with no markup works the same way.
- Markup counts as Spent, under "Loan markup". The rest lowers what's owed.
- The loan also shows "left to pay", which is the instalment times the instalments left.
- An extra payment lowers what's owed by the full amount. The instalment stays the same, so fewer instalments are left.

**Without a fixed amount:**

- The loan saves what's owed, plus an optional "repay by" date.
- The user logs each payment in Quick add as "Moved → loan". The whole payment lowers what's owed.

## Credit cards

- A card saves what's owed, the bill's due day and the credit limit.
- Spending on the card adds to what's owed.
- Paying the bill is "Moved → card". The bill changes every month, so the app never pays it by itself.
- Quick add shows what's left on the card and warns when it's close to the limit.
- For a refund, the user edits or deletes the original purchase.

## Committees

A committee saves its plan: the monthly amount, the number of members, the start month, the turns paid, and whether the user has had their turn. Each member gets one turn. The turn number is optional, because turns are often drawn.

- From that, the app works out the pot (members times the monthly amount), what's paid in, what's still owed and the end month.
- For a committee that has already started, turns paid starts at the months since the start month. The user can change it.
- Before the user's turn, what they've paid in counts in Portfolio, under Owed to you.
- After their turn, the turns left times the monthly amount counts in Debts.
- Net worth stays the same across the whole committee.
- The committee shows in the list where it counts. It has one page, reached from either list.

**Monthly payments wait for approval.**

- On the payment day, Things to check shows a draft, such as "Office committee · Rs 10,000 from HBL · March".
- The draft has Approve, Edit and Skip this month. Several drafts sit together under "Approve all".
- A payment only counts once it's approved.

**The pot:**

- If the turn is known, Things to check shows a draft in that month: "Your turn in Office committee: Rs 100,000 into HBL", with Approve, Edit and Not yet.
- If turns are drawn, the user taps "I got my turn" on the committee's page.
- Either way, the pot goes into the account and the committee moves to Debts.
- The pot never goes through Quick add and never counts as Received.

## Money lent

Money lent works like a loan in reverse. The user owns it, so it counts in Portfolio, under Owed to you.

- There's one item per person, such as "Lent to Ali bhai", with an optional "back by" date.
- It has its own Setup step, so Setup can show up to 6 steps.
- Lending is "Moved → Lent to Ali bhai". Getting paid back is "Moved from Lent to Ali bhai → HBL". Neither changes net worth.
- If some of it won't come back, the user lowers the amount, and net worth drops.
- It never shows in "Paid from" or "Received into".

## Stocks and funds

- A holding is one share, ETF or fund. A share or ETF is a holding for each place it's held, such as a broker or the CDC Investor Account.
- Its value is how many it holds × the day's PSX close or the fund's NAV. A fund the user added by name uses the NAV they typed until they change it.
- Its cost is what its buys cost, or how many × the average price. The price is the broker or fund app's figure, and no charges are added. A sales load counts when the price includes it.
- "Use today's price" makes the cost its value today, so the profit starts at Rs 0.
- Profit is value minus cost. Net worth moves with each day's prices.
- Dividends, bonus and right shares stay out of setup. Later ones come through Add trade.

## Property

A property counts at the value the user gives it. There's no price feed.

- Its value is what the whole property would sell for today. Only the user's share counts in Portfolio: all of it, a half, a third, a quarter, or another %.
- The price paid is the user's own money. Profit is their share of the value minus the price paid. Without a price, it counts from the day it's added, so it starts at Rs 0.
- A plot or file still being paid for counts at its value. What's left to pay is a loan in Debts, "Instalments for 1 kanal plot, DHA Phase 9 Prism, Lahore". Net worth moves by the share's value minus what's left.
- For such a plot, the price paid is the full price on the plan, with every instalment.
- The property and its loan save together and are removed together. The loan is changed only through the property, and it can't be removed on its own.
- The loan keeps the instalment and how often it's due: every month or every 3 months. DHA and Bahria plans are often quarterly.
- A file, a society booking with no plot number yet, counts at the file rate dealers quote, not at what's been paid in.
- Rent is Received, logged in Quick add. It never changes the property's value.

## New debts after setup

"Add debt" is on the Debts tab, with a link under Quick add's Save. It asks where the money went:

- **Into an account:** the account and the debt both go up, and net worth stays the same.
- **Paid for something**, such as a phone on BNPL or a car paid for with a loan: it counts as Spent in a category, and the debt goes up.
- **I already owed it:** it's a starting balance, the same as in Setup.

"Borrow more" on a debt's page asks the same question.

## Corrections

Sometimes the user updates a debt, and the new amount is different from the app's:

- **If the debt went up,** the difference counts as Spent, under "Markup and fees" by default. The user can pick another category, such as Shopping for a purchase they forgot to log.
- **If the debt went down,** the difference is a "Balance correction". It lowers the debt and doesn't count as Received.

Both show in Latest entries and change net worth.

## Paying more than is owed

Quick add warns "More than you owe." and says what will happen:

- **Loan or committee:** it goes to zero, and the extra counts as Spent, under "Markup and fees".
- **Card:** it goes below zero and shows as "Rs 1,501 in credit". That lowers the Debts total.
- **Money lent:** it goes to zero, and the extra counts as Received.

## Paid off

- A loan or committee at zero moves to a collapsed "Paid off" section at the bottom of its list. Money lent moves to "Paid back".
- Its scheduled payments stop, and it leaves Quick add's lists. Its history stays.
- A card stays active at zero.
- Only a debt with no entries can be deleted.

## Things to check

- **Committee:** each monthly payment draft, plus the pot draft when the turn is known.
- **Card:** a few days after the due day, a check to match the statement.
- **Loan with a fixed monthly amount:** every 6 months, a check that the instalment and the amount owed are still right. Banks reset KIBOR-based rates, so these drift.
- **Loan without one, and money lent:** on the "repay by" or "back by" date. With no date, once it's 3 months old.
- **Property:** 6 months after its value was typed, a check that it's still right.

All of them use Still right and Update, as in [F03](../specs/F03-things-to-check/handoff.md). For a debt, Update follows the [Corrections](#corrections) rules. For a property, it's "Update value": the new value changes net worth and isn't Spent or Received.
