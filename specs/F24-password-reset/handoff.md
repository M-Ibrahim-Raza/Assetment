# F24 – Password reset

**What:** lets someone who can't sign in ask for a link by email, then pick a new password from it.

**Screens:** `/forgot-password`, `/reset-password`

**Decisions:** "Quiet card" (variant B), the same card as Sign in (F23), won over A and C for the same reason: familiar, calm and professional.

**Edge cases:**

- Forgot password opens with the email typed on Sign in. It's carried in memory only, never in the URL or on the device, so a reload or a direct visit starts blank.
- "Check your inbox" says the same words whether or not the email has an account: "If <email> has an Assetment account, we sent it a link to pick a new password." "Send it again" shows a toast. "Wrong email? Change it" goes back to the form with the email kept.
- The link works for 1 hour and only once. The spec confirms Better Auth's setting. An old or used link shows "This link has expired", with "Send a new link", which opens Forgot password.
- The new password needs at least 8 characters, shown as a hint. It has Show and Hide, a Caps Lock warning, and no "confirm password" field.
- After saving, every other device is signed out. "Password changed" sends them to Sign in with the new password, so password managers can save it. No automatic sign-in.
- If our side fails, an alert says so, the button says "Try again", and what was typed is kept. While working, the button shows a spinner and "Sending…" or "Saving…".
- The same card, privacy line and footer links as Sign in. The header says "Remembered it? Sign in", and Forgot password's card foot has "Back to sign in".
- A long email breaks anywhere, so a 320 px phone never scrolls sideways.
