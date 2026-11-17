// Sign in: step 1 of J6, where people with an account come back. Signed out, so there is no app
// shell. Email and password through Better Auth. Everything here is faked in memory. Feature F23,
// with F19's check that the email is confirmed.
//
// Finalized on 2026-11-17 as "Quiet card": the form on one card, a full-width button, and a
// privacy line and footer links under it. Forgot password and Reset password use the same card
// (components/signed-out/card.tsx). Nothing about the last person is remembered on the device,
// as phones are often shared in a family.
//
// In memory: the emails in fixtures/sign-in.ts have accounts, all with GOOD_PASSWORD from
// people.ts. Anything else gets "That email and password don't match". The unconfirmed email
// asks for its link first. After signing in, it goes to `next` when that's one of Assetment's own
// paths, else Home.
//
// `empty` is Sign in pressed with nothing typed. `many` is the unconfirmed note with a
// 61-character email, to test wrapping at 320 px. `return-to` came from a Quick add shortcut on
// the phone's home screen, so signing in goes back to `/add`.
//
// Decided while finalizing:
// - 5 wrong tries in a row pause signing in for 5 minutes, with a countdown (Better Auth's rate
//   limit).
// - An unconfirmed email gets a new link only from "Send the link again", not on every try. The
//   note shows only once the password matches, so it doesn't say which emails have accounts. The
//   spec confirms Better Auth checks the password first.
// - "Forgot password?" and "Reset your password" carry the typed email over to Forgot password,
//   in memory only (carry-email.ts). Never in the URL or on the device.
// - "Keep me signed in" is ticked by default. Unticked, the session ends when the browser closes
//   (Better Auth's `rememberMe`).
// - Caps Lock shows a warning under the password. On tablets and wider, the email field takes
//   focus when the page opens. On phones it doesn't, so the keyboard doesn't cover the page.
// - The main button is as wide as the fields at every width, on Sign up too.
// - Terms, Privacy policy and Help under the card are stand-ins until those pages are written.
//
// Open questions: None.

import { ayesha, GOOD_PASSWORD, longPerson } from "@proto/fixtures/people";
import {
  PAUSE_SECONDS,
  RETURN_TO,
  UNCONFIRMED_EMAIL,
  WRONG_PASSWORD,
} from "@proto/fixtures/sign-in";
import type { Scenarios } from "@proto/kit/scenarios";

/** What the user has typed and ticked in the form. */
export interface SignInDraft {
  email: string;
  password: string;
  /** Ticked: the session lasts 7 days and renews on each visit. Unticked: it ends when the browser closes. */
  keepSignedIn: boolean;
}

/** Why Sign in didn't go through. */
export type SignInFailure =
  /** Our side failed. */
  | { kind: "server" }
  /** No account has this email and password. One message for both, so it doesn't say which emails have accounts. */
  | { kind: "wrong-details" }
  /** Too many wrong tries. `seconds` counts down to when they can try again. */
  | { kind: "paused"; seconds: number };

/** The View's props. Signing in and its failures are states the View shows, so they are props too. */
export type SignInViewProps =
  | {
      status: "form";
      draft: SignInDraft;
      /** True once Sign in was pressed, so field errors show. */
      submitted: boolean;
      failure: SignInFailure | null;
      /** True while signing in. */
      signingIn: boolean;
      /** The page they tried to open while signed out. Null goes to Home. */
      next: string | null;
    }
  /** The email and password match, but the email isn't confirmed yet (F19). */
  | { status: "unconfirmed"; email: string; next: string | null };

const blank: SignInDraft = { email: "", password: "", keepSignedIn: true };
const typed: SignInDraft = {
  ...blank,
  email: ayesha.email,
  password: GOOD_PASSWORD,
};
const mistyped: SignInDraft = { ...typed, password: WRONG_PASSWORD };

const form = {
  status: "form",
  draft: blank,
  submitted: false,
  failure: null,
  signingIn: false,
  next: null,
} as const;

export const scenarios = {
  default: form,
  empty: { ...form, submitted: true },
  loading: { ...form, draft: typed, submitted: true, signingIn: true },
  error: {
    ...form,
    draft: typed,
    submitted: true,
    failure: { kind: "server" },
  },
  "wrong-details": {
    ...form,
    draft: mistyped,
    submitted: true,
    failure: { kind: "wrong-details" },
  },
  unconfirmed: { status: "unconfirmed", email: UNCONFIRMED_EMAIL, next: null },
  "too-many-tries": {
    ...form,
    draft: mistyped,
    submitted: true,
    failure: { kind: "paused", seconds: PAUSE_SECONDS },
  },
  many: { status: "unconfirmed", email: longPerson.email, next: null },
  "return-to": { ...form, next: RETURN_TO },
} satisfies Scenarios<SignInViewProps>;
