# F11 – Property at your own value

**What:** add a house, flat, plot, file, shop or farmland at the value the user gives it, and only their share counts. Optionally add when it was bought and the price paid, to see the profit or loss as of today. A plot or file still being paid for adds what's left as a loan in Debts. Change or remove a property.

**Screens:** `/setup`, the Property step (`?step=property`). Quick add's "Add gold or property" and Portfolio will use the same form later.

**Decisions:** "Size × rate" (it was property-c) won over Add a property and Value first, then was reworked into an address-first form that asks in the order people describe a property.

**Edge cases:**

- The step says "Your property" and "A house, a plot or a shop, at the value you give it."
- The panel is open for the first property. After that, properties are rows with a total, "Add a property" opens the panel at the end, and a tapped row opens in place to change or remove it.
- The panel asks, in this order: What it is, Where it is, Size and share, When you bought it (optional), What it would sell for today, then shows the profit.
- What it is: House, Flat, Plot, File, Shop or Land. Plot is picked first. A file is a society booking with no plot number yet, valued at the file rate dealers quote.
- Where it is: City is required, a select of 11 cities plus "Somewhere else", which saves as no city. The area is required. The other lines are optional and follow the kind:

  | | House | Flat | Plot | File | Shop | Land |
  |---|---|---|---|---|---|---|
  | Area | Area or society | Area | Society or scheme | Society | Market or area | Village and tehsil |
  | Building | – | Building name | – | – | Building or plaza | – |
  | Block | Block or sector | Block or phase | Block or sector | Phase or sector | – | – |
  | Number | House no. | Flat no. | Plot no. | none until balloting | Shop no. | Khasra no. |
  | City label | City | City | City | City | City | Nearest city |

- Size is required, in the kind's units, and never converted: a marla isn't the same size everywhere. A house, plot or file takes marla, kanal or sq yd. A flat or shop takes sq ft or sq yd. Land takes acres or kanal. The city picks the usual unit: square yards in Karachi and Hyderabad, marla elsewhere. Switching kind changes a unit that doesn't fit.
- There's no name field. The name is built from the size, kind and address: "10 marla house, DHA Phase 6, Lahore", with a flat's building or a shop's plaza. A row adds the number and block, the share, any rate, and "Value from Nov 2026".
- Your share: Whole, Half, A third, A quarter, or Other, from 1 to 99%. The value typed is the whole property's. Only the share counts in net worth. The price paid is the user's own money.
- When you bought it (optional): "Date bought", a day, month and year side by side. The day is optional: "Just the month and year is fine." The gold form uses the same field. Then "Price paid". A shared property's says "Your part only."
- "Still paying instalments?" is a switch, for every kind but land. While it's on: Left to pay (required), Each instalment (optional), and Every 3 months or Every month. The price becomes "Full price", with every instalment, and says how much is paid so far. Left to pay can't be more than the full price.
- Saving a property on instalments adds a loan to Debts, "Instalments for 1 kanal plot, DHA Phase 9 Prism, Lahore". They save together and are removed together, with one Undo. In Debts the loan opens the property, and can't be changed or removed on its own. F12's loan model needs instalments every 3 months.
- What it would sell for today: one amount, for the whole property. For a plot, file or land, "Total | Per marla" by the heading switches to a rate per unit ("Per kanal", "Per acre" with that unit). The value is then the size times the rate, shown large with "5 marla × Rs 13 lakh per marla". Switching back keeps the amount.
- A shared property shows "Your share: Rs …" under the value. "Not sure? See Zameen's price index." links out in a new tab. The value stays the user's.
- Profit as of today shows once a price is in: large, with + or −, the % and "since 14 May 2025". With instalments, it also shows what it adds to net worth after what's left. Without a price, profit counts from today and the row shows none.
- A typed value gets old. Rows show "Value from Nov 2026", and Things to check (F03) asks to update it 6 months later.
- Errors show next to the field after a save is tried, and focus moves to the first: the city, the area, the size, the value or rate, a share %, the date (a missing month or year, a day that month doesn't have, or after this month), and what's left to pay.
- A failed save keeps everything typed, says "We couldn't save 1,150 sq ft flat, Sea View Apartments, Clifton, Karachi", and the button says Try again. A slow save shows "Saving…". Remove is at once, with an Undo toast for 10 s.
- 8 properties with a long village address wrap cleanly, and the total reaches crores. The total under the rows shows "Left to pay, in Debts" when any are on instalments.
- Rent stays out: it's Received in Quick add. PKR only.
