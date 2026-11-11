# F14 – Quick add

**What:** the form behind Add, for logging money spent, received or moved. The amount is the big field, with the keypad open at once. Category, account and day come filled in, so most entries are: type, Save.

**Screens:** `/add`, which keeps the kind in `?kind=`. Add in the phone tab bar and in the sidebar opens it.

**Decisions:** "Big number" won over "Sentence" and "Your usuals": the amount first, with everything else filled in, was the fastest. It took the usuals row from "Your usuals" (F15). For where Add leads, "With links" won over "Money only" and "Menu first".

**Edge cases:**

- It opens over the screen the user is on: the whole screen on phones, a centred box on desktop. ✕ and Esc close it; a tap outside doesn't. Every later form uses this panel.
- The kinds are Spent, Received and Moved, with Spent first. Colour says the kind: ink, bottle green, sage. Switching keeps the amount, the day and the note.
- The kind lives in the link: `/add`, `/add?kind=income`, `/add?kind=transfer`. Switching adds no Back steps. An unknown kind opens on Spent.
- The line under the amount says what is being saved, such as "Careem · JazzCash", so it can be checked while the keypad covers the fields. Large amounts show the lakh or crore note.
- The account shows its balance and what it will be after this entry. More than it holds is a warning, not a block.
- The most used categories and accounts show as chips, the rest under More. Date: Today, Yesterday, or another day from the device's own picker. The note is optional and becomes the entry's name.
- Save stays at the bottom. On Android the number keypad's ✓ key saves; on iPhone the user taps Done, then Save.
- No amount: "Enter an amount." next to the field, after the first try. A failed save keeps everything, with Try again.
- After Save the panel closes and Home updates. A toast says what was saved and the account's new balance, with Undo and Add another, for 10 s. Add another keeps the kind, category, account and day.
- Closing keeps what was typed. Opening Add again brings it back with "Picked up where you left off" and Clear. Clear keeps the kind.
- A line under Save reads "Bought gold, shares or property? Add a trade · Add gold or property", so an investment isn't logged as spending.
- Money in is "Received", here and on Home's month block.
- No accounts yet: "Add an account first", with a button to add one.
- Foreign-currency accounts come with F13. Then the amount is typed in the account's own currency, with its rupee value at today's rate under it, and a move between currencies asks for both amounts. Until then, PKR only.
- To settle in production: check on a real iPhone that the keypad opens by itself. The amount field comes from Setup's prototype and belongs in `components/`. The panel needs a wrapper in `components/` around the dialog.
