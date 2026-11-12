// Sign up: the first step of J1, right before Setup's welcome (`/setup`). Signed out, so there is
// no app shell. Email and password through Better Auth, plus what to call the user, so Setup and
// Home can greet them. Everything here is faked in memory. Features F18 and F19.
//
// Finalized on 2026-11-12 as "Green split": a promise on green beside a plain form.
// Verify later: the account works at once. "Account made" says a link was sent, with Start setup
// as the next step, Send it again, and a way to fix a mistyped email. Opening an old link shows
// "This link has expired".
//
// `empty` is the form sent with nothing in it, as the blank form is `default`. `many` is
// "Account made" with a long name and a 61-character email, to test wrapping at 320 px.
//
// Decided while finalizing:
// - Sign in, password reset, 2FA and Settings come with a sign-in journey, not drafted yet. Sign
//   in is a stand-in link until then.
// - The first session works before the email is confirmed. Signing in again needs it confirmed.
// - Under Create account: "By creating an account, you agree to our Terms and Privacy policy."
//   Both pages are stand-ins until written.
// - The logo is shared with Setup, in components/logo.tsx.
//
// Open questions: None.

import {
  ayesha,
  GOOD_PASSWORD,
  longPerson,
  TAKEN_EMAIL,
} from "@proto/fixtures/people";
import type { Scenarios } from "@proto/kit/scenarios";

/** What the user has typed into the form. */
export interface SignUpDraft {
  name: string;
  email: string;
  password: string;
}

/** Why Create account didn't go through: our side failed, or the email already has an account. */
export type Failure = "server" | "email-taken";

/** The View's props. Creating the account and its failures are states the View shows, so they are props too. */
export type SignUpViewProps =
  | {
      status: "form";
      draft: SignUpDraft;
      /** True once Create account was pressed, so field errors show. */
      submitted: boolean;
      failure: Failure | null;
      /** True while the account is being created. */
      creating: boolean;
    }
  /** "Account made": the link was sent to `email`. */
  | { status: "sent"; name: string; email: string }
  /** The user opened a verification link that has expired. */
  | { status: "expired"; name: string; email: string };

const blank: SignUpDraft = { name: "", email: "", password: "" };
const typed: SignUpDraft = { ...ayesha, password: GOOD_PASSWORD };

const form = {
  status: "form",
  draft: blank,
  submitted: false,
  failure: null,
  creating: false,
} as const;

export const scenarios = {
  default: form,
  empty: { ...form, submitted: true },
  loading: { ...form, draft: typed, submitted: true, creating: true },
  error: { ...form, draft: typed, submitted: true, failure: "server" },
  "email-taken": {
    ...form,
    draft: { ...typed, email: TAKEN_EMAIL },
    submitted: true,
    failure: "email-taken",
  },
  "check-inbox": { status: "sent", ...ayesha },
  "link-expired": { status: "expired", ...ayesha },
  many: { status: "sent", ...longPerson },
} satisfies Scenarios<SignUpViewProps>;
