import type { Variants } from "@proto/kit/scenarios";
import { ForgotPasswordView } from "./forgot-password";
import type { ForgotPasswordViewProps } from "./scenarios";

// Finalized on 2026-11-17: "Quiet card" (it was variant B), the same card as Sign in, won over
// Green split, mirrored and Hidden number. Future changes go into this one View.
export const variants = {
  a: { name: "Quiet card", View: ForgotPasswordView },
} satisfies Variants<ForgotPasswordViewProps>;
