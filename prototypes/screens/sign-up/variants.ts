import type { Variants } from "@proto/kit/scenarios";
import type { SignUpViewProps } from "./scenarios";
import { SignUpView } from "./sign-up";

// Finalized on 2026-11-12: "Green split" (it was variant A) won over One question at a time and
// Preview first. Future changes go into this one View.
export const variants = {
  a: { name: "Green split", View: SignUpView },
} satisfies Variants<SignUpViewProps>;
