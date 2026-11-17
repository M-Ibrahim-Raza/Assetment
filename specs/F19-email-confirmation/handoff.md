# F19 – Email confirmation

**What:** sends a link that confirms the user's email. They can start Setup before opening it, and must confirm before their next sign-in.

**Screens:** `/sign-up`, in its "Account made" and expired-link states. `/sign-in`, in its "Confirm your email first" state.

**Decisions:** confirm later, through an "Account made" step between sign-up and Setup. It won over going straight to Setup: it's the one moment to catch a mistyped email.

**Edge cases:**

- "Account made" greets the user on the green block ("Welcome, Ayesha.") and says "We sent a link to <email>". Start setup is the main button and goes to `/setup`.
- "Send it again" sends a new link, with a toast.
- "Wrong email? Change it" opens the email field in place. "Send the link there" updates the account's email and sends a new link. It doesn't go back to the form: the account already exists.
- An old link shows "This link has expired", one line on why, "Send a new link", and "Carry on with setup".
- The first session works before the email is confirmed. Signing in again needs it confirmed, through Better Auth's own check. The spec confirms that check doesn't also block the first session. If it needs a different setup from `tech-stack.md`'s "Require email verification", record it with `/new-adr` and update that note in the same change.
- Signing in with an unconfirmed email shows "Confirm your email first" on Sign in (F23), with the email and "Send the link again". A new link goes out only from that button, not on every try.
- A long email breaks anywhere, so a 320 px phone never scrolls sideways.
