# F15 – Your usuals

**What:** a row of what the user logs most, above the amount in Quick add: its name, account and last amount. One tap fills the category and account, so only the amount is left.

**Screens:** `/add`

**Decisions:** taken from the "Your usuals" variant into "Big number" (F14). Above the amount won over inside the amount block, in place of Category, and a guess from the amount: it stays in view while the keypad is up.

**Edge cases:**

- Up to 8 usuals of the selected kind, most used first. Before there is any history the row is hidden, and the category chips do the job.
- On phones it is a swipe strip that runs to the screen's edges, with the third card peeking in and cards snapping one by one. Wider screens show a grid of three.
- A tap fills the category and account and keeps the keypad up. It offers last time's amount as "Rs 680 again" without filling it in. "Again" moves focus to Save.
- The usual that matches the form shows pressed, also when the form opens on it. Changing the account by hand un-presses it.
- The usual's name, such as "Careem", becomes the entry's name, unless the user typed a note of their own.
- An amount typed before tapping a usual is kept.
- Moved has its own usuals, such as an ATM withdrawal, a wallet top-up, a card bill and a loan instalment.
