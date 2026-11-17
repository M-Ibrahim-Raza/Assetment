// People signing in. The accounts here all use GOOD_PASSWORD from people.ts.

import { ayesha, TAKEN_EMAIL } from "./people";

/** An account whose email isn't confirmed yet, so signing in asks for that first (F19). */
export const UNCONFIRMED_EMAIL = "hamza.qureshi@yahoo.com";

/** Emails with an account. */
export const ACCOUNT_EMAILS: readonly string[] = [
  ayesha.email,
  TAKEN_EMAIL,
  UNCONFIRMED_EMAIL,
];

/** A typo of GOOD_PASSWORD, so the email and password don't match. */
export const WRONG_PASSWORD = "chai-at-7pm";

/** Wrong tries in a row before signing in pauses. */
export const MAX_TRIES = 5;

/** How long signing in pauses after too many tries, in seconds. */
export const PAUSE_SECONDS = 5 * 60;

/** A new password at the 128-character limit, to test the field at 320 px. */
export const LONGEST_PASSWORD = "Chai-at-7pm-on-the-roof-"
  .repeat(6)
  .slice(0, 128);

/** Where a signed-out person was going: Quick add, saved to their phone's home screen. */
export const RETURN_TO = "/add";
