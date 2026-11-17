// Forgot password: step 2 of J6. Someone who can't sign in asks for a link to pick a new password.
// Faked in memory. Feature F24.
//
// Finalized on 2026-11-17 as "Quiet card", the same card as Sign in
// (components/signed-out/card.tsx).
//
// "Check your inbox" says the same words whether or not the email has an account, so the screen
// doesn't say which emails have one. The link opens Reset password.
//
// `empty` is Send reset link pressed with nothing typed. `many` is "Check your inbox" with a
// 61-character email, to test wrapping at 320 px.
//
// Decided while finalizing:
// - Coming from Sign in, the email typed there is filled in, carried in memory only. Never in the
//   URL, which ends up in history, or on the device. A reload or a direct visit starts blank.
// - The link works for 1 hour and only once. The spec confirms Better Auth's setting.
//
// Open questions: None.

import { ayesha, longPerson } from "@proto/fixtures/people";
import type { Scenarios } from "@proto/kit/scenarios";

/** The View's props. Sending and its failure are states the View shows, so they are props too. */
export type ForgotPasswordViewProps =
  | {
      status: "form";
      email: string;
      /** True once Send reset link was pressed, so field errors show. */
      submitted: boolean;
      /** Our side failed. */
      failed: boolean;
      /** True while the link is being sent. */
      sending: boolean;
    }
  /** "Check your inbox", for `email`. */
  | { status: "sent"; email: string };

const form = {
  status: "form",
  email: "",
  submitted: false,
  failed: false,
  sending: false,
} as const;

export const scenarios = {
  default: form,
  empty: { ...form, submitted: true },
  loading: { ...form, email: ayesha.email, submitted: true, sending: true },
  error: { ...form, email: ayesha.email, submitted: true, failed: true },
  "check-inbox": { status: "sent", email: ayesha.email },
  many: { status: "sent", email: longPerson.email },
} satisfies Scenarios<ForgotPasswordViewProps>;
