// Reset password: step 3 of J6. The link from Forgot password opens it, to pick a new password.
// Faked in memory. Feature F24.
//
// Finalized on 2026-11-17 as "Quiet card", the same card as Sign in
// (components/signed-out/card.tsx).
//
// After saving, "Password changed" sends them to Sign in. An old or used link shows "This link
// has expired", with a way to ask for a new one.
//
// `empty` is Save new password pressed with nothing typed. `many` is a password at the
// 128-character limit, to test the field at 320 px.
//
// Decided while finalizing:
// - Saving signs out every other device. Then they sign in with the new password, so password
//   managers can save it. No automatic sign-in.
// - The link works for 1 hour and only once. The spec confirms Better Auth's setting.
//
// Open questions: None.

import { GOOD_PASSWORD } from "@proto/fixtures/people";
import { LONGEST_PASSWORD } from "@proto/fixtures/sign-in";
import type { Scenarios } from "@proto/kit/scenarios";

/** The View's props. Saving and its failure are states the View shows, so they are props too. */
export type ResetPasswordViewProps =
  | {
      status: "form";
      password: string;
      /** True once Save new password was pressed, so field errors show. */
      submitted: boolean;
      /** Our side failed. */
      failed: boolean;
      /** True while the password is being saved. */
      saving: boolean;
    }
  /** "Password changed". */
  | { status: "done" }
  /** The link is too old, or was used already. */
  | { status: "expired" };

const form = {
  status: "form",
  password: "",
  submitted: false,
  failed: false,
  saving: false,
} as const;

export const scenarios = {
  default: form,
  empty: { ...form, submitted: true },
  "too-short": { ...form, password: "chai7", submitted: true },
  loading: { ...form, password: GOOD_PASSWORD, submitted: true, saving: true },
  error: { ...form, password: GOOD_PASSWORD, submitted: true, failed: true },
  "password-changed": { status: "done" },
  "link-expired": { status: "expired" },
  many: { ...form, password: LONGEST_PASSWORD, submitted: true },
} satisfies Scenarios<ResetPasswordViewProps>;
