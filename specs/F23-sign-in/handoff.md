# F23 – Sign in

**What:** signs a person with an account back in with email and password, through Better Auth. Then it opens the page they tried to open, or Home.

**Screens:** `/sign-in`

**Decisions:** "Quiet card" (variant B) won over "Green split, mirrored" (A) and "Hidden number" (C): a familiar form on one card, with a full-width button, reads as professional and is quick to use.

**Edge cases:**

- A real form, so password managers can fill it: `autocomplete` email and current-password, paste allowed, Show and Hide on the password. "Forgot password?" sits at the right of the Password label.
- A wrong email or password gets one message under the password: "That email and password don't match." Both fields are marked, what was typed is kept, and focus moves to the password. It never says which emails have accounts.
- After 5 wrong tries in a row, signing in pauses for 5 minutes, through Better Auth's rate limit. An alert counts down and links to Reset your password.
- An unconfirmed email (F19) gets "Confirm your email first", the email, and "Send the link again". A new link goes out only from that button. The note shows only once the password matches. The spec confirms Better Auth checks the password first.
- "Keep me signed in" is ticked by default: the session lasts 7 days and renews on each visit. Unticked, it ends when the browser closes (Better Auth's `rememberMe`). Nothing about the last person stays on the device.
- After signing in, it opens `next` when that's one of Assetment's own paths, else Home. Paths starting `//` or `/\` go Home.
- "Forgot password?" and "Reset your password" carry the typed email over to Forgot password (F24), in memory only.
- "Caps Lock is on" shows under the password while it is. On tablets and wider, the email field takes focus when the page opens. On phones it doesn't, so the keyboard doesn't cover the page.
- If our side fails, an alert says so, the button says "Try again", and everything typed is kept. While signing in, the button keeps its colour and shows a spinner and "Signing in…". The fields are locked.
- From tablet width, the form sits on a card centred on the page. On phones the page is the card. The button is as wide as the fields at every width, as on Sign up.
- Under the card: "Only you can see what you own and owe." and Terms · Privacy policy · Help, stand-ins until written. The card's foot and the header link to Sign up.
- A long email breaks anywhere, so a 320 px phone never scrolls sideways.
