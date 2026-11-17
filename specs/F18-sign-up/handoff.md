# F18 – Sign up

**What:** creates an account with what to call the user, an email and a password, through Better Auth. Right after, the user sees "Account made" and goes on to Setup.

**Screens:** `/sign-up`

**Decisions:** "Green split" (variant A) won over "One question at a time" (B) and "Preview first" (C): a big promise on green beside a plain form says what the app does and why it's safe, with no extra taps, and leads into Setup's green welcome.

**Edge cases:**

- The name field asks "What should we call you?", not "First name". Many Pakistani men's first name is Muhammad, and they go by the next one. Setup and Home greet the user by it.
- The password needs at least 8 characters, Better Auth's default, shown as a hint under the field. It has Show and Hide, and no "confirm password" field.
- Errors show only after Create account, as text under each field. Focus moves to the first field with a problem. Everything typed is kept.
- If the email already has an account, the email field says "An account with this email already exists." with "Sign in instead".
- If our side fails, an alert over the form says so, the button says "Try again", and everything typed is kept.
- While the account is created, the button keeps its colour and shows a spinner and "Creating your account…". The fields are locked.
- The green block says "Your net worth, in one number." with three lines: assess all your assets in one place and measure how you're doing, only you can see what you own and owe, and your net worth in about 5 minutes.
- On phones the green block is a short band with the headline only, and the three lines come after the button. Under desktop width, the form sits in a centred column under the green band.
- Under the button: "By creating an account, you agree to our Terms and Privacy policy." Both pages are stand-ins until written.
- Signed out, so there's no app shell. The header has only the logo and "Have an account? Sign in".
- Create account is as wide as the form at every width, like the other signed-out screens.
- Sign in (F23) and password reset (F24) are in J6. 2FA and Settings come later.
