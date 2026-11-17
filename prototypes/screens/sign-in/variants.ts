import type { Variants } from "@proto/kit/scenarios";
import type { SignInViewProps } from "./scenarios";
import { SignInView } from "./sign-in";

// Finalized on 2026-11-17: "Quiet card" (it was variant B) won over Green split, mirrored and
// Hidden number. Future changes go into this one View.
export const variants = {
  a: { name: "Quiet card", View: SignInView },
} satisfies Variants<SignInViewProps>;
