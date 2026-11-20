# F28 – Spending entries

**What:** every spent entry in what's picked, newest first, with search and a sort menu, grouped under days with their totals. It's last by default and can't be hidden, since Home's "See all entries" lands on it.

**Screens:** `/spending#entries`, with `?q=` and `?sort=amount`. A tap on an entry opens Entry detail (J3 step 4).

**Decisions:** one list of the month's spent entries, narrowed by the sections' picks and its own search. A Filters sheet with an amount range was tried and removed: the picks and search are enough.

**Edge cases:**

- Search matches names, categories, accounts and amounts, "4250". A result line counts what the list shows: "12 entries · Rs 34,500".
- Sorting: Date (Newest first, Oldest first), Amount, Name, Category or Account. By date, entries group under days; by category or account, under each one with its total; by amount or name, one list, each row with its day. The sort menu sits at the right, on its own row under the search, as on By category and By account.
- Its settings in Customize: Layout on computers, Side column or Rows (F25), not on the Phone tab. Day totals, on. Running total, off: "Rs 207,470 by then". Compact rows, off: one line per entry. Sorting, on.
- Day headings stay at the top while their entries scroll. Beside a side column on a computer, the list's head (heading, search, sort and count) stays at the top too, and the day headings stop under it.
- No results: what caused it, such as "No entries match “Daraz” in Groceries", with Clear filters.
- Opening `/spending#entries` scrolls to the list once the page has drawn, from Home too.
- Money received and moved isn't listed here. An account's own screen will list and edit it, once there is one.
