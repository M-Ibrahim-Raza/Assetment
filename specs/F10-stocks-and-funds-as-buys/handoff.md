# F10 – Stocks and funds as buys

**What:** add PSX shares and ETFs, and mutual funds, buy by buy or as how many and the average price. See each one's value at today's close or NAV, and the profit or loss as of today. Change or remove a holding.

**Screens:** `/setup`, the Shares or ETFs step (`?step=shares`) and the Mutual funds step (`?step=funds`). Quick add's Add trade and Portfolio will use the same form later.

**Decisions:** "Add a holding" (it was stocks-a) won over Copy from your broker app and Pick, then fill because it's Gold's panel pattern: everything about a holding, from buys to profit, is in one panel.

**Edge cases:**

- Shares and ETFs, and mutual funds, are two steps, each with its own tile, search, rows and total. Someone with only funds never sees shares.
- An empty step starts on its search: "Which share do you hold?" or "Which fund do you hold?". A pick opens the panel. After that, "Add a share or ETF" or "Add a mutual fund" opens it, and a tapped row opens in place to change or remove it.
- Search finds a name, a symbol, or a fund's AMC. Each result shows its kind, sector or AMC, and today's price. At most 8 show.
- "Separate buys" comes first: each buy's day, how many and the price a share. A fund's buys take units, up to 4 decimals, and the "NAV paid". "One average" takes how many and the average price. Switching keeps what was typed.
- Buys show their labels once, over columns, from tablet width. Under them: a dashed "Add another buy", then a total row with how many and the average.
- The price is needed. "Use today's price, Rs …", or "Use today's NAV" for a fund, fills it in, and a buy's day too, so the profit counts from today. A price over 10 times or under a tenth of today's warns, and still saves.
- The price is the broker or fund app's figure. Charges (brokerage, its tax, CDC, NCCPL and SECP fees) aren't added, so the profit matches the app. Check what the main brokers' averages include.
- The fund help says to enter a price with its sales load, the statement's offer price. A new fund then shows a small loss at first, and the help says why.
- "Held at (optional)", for shares and ETFs: a broker or the CDC Investor Account, from one searchable list. A broker that isn't there is added from the list's last choice, then offered as "Added by you". A new holding starts at the last one's place. Funds don't ask: their AMC holds them.
- A share held in two places is a holding for each, entered in one go as place tabs. The same share twice at one place is an error. Picking an added share starts a holding for another place, with "Change the one at … instead".
- A fund picked again opens the one added: its units are the total across every account.
- A fund that isn't on the list is added by name: "Add “…” as a fund". Its panel asks for "Today's NAV" first, which stays until the user changes it. The totals then say "and the NAVs you entered". Later: matching it to MUFAP's list, and a Things to check item (F03) to update its NAV.
- The panel ends on a sum: today's value and how it's worked out, less the investment, then the profit or loss with + or − and a percentage.
- Saved holdings list as a broker app does: from tablet width, "Shares" or "Units", "Avg price" and "Today's value", each figure under its own. A row names its place only when holdings are in more than one place. Averages show in whole rupees; typed prices keep their paisa.
- Under the rows: today's value with its lakh note and the prices' day, then the profit as of today. A holding with no price paid counts from today.
- Old prices say "Prices from 10 Nov. Today's closing prices aren't out yet."
- A failed save keeps everything typed, says "We couldn't save Systems Limited (SYS)", and the button says Try again. A slow save shows "Saving…". Remove is at once, with an Undo toast.
- 17 holdings with a long fund name wrap cleanly.
- A money market fund pays its profit as new units, which Separate buys miss. How to mark such funds (MUFAP's fund types), and how J4 keeps their units current, are for the spec.
- Dividends, bonus and right shares stay out of setup. The quantity includes bonus and right shares, and later ones come through J4.
- A share or fund with no price at all isn't in the prototype yet.
- Where prices come from and when they refresh each day are for the spec and an ADR. PKR only.
