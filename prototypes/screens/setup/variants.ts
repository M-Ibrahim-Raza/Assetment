import type { Variants } from "@proto/kit/scenarios";
import type { SetupViewProps } from "./scenarios";
import { SetupView } from "./setup";

// Finalized on 2026-11-11: "Tick what you have" (it was variant C) won over Build your number and
// One question at a time. It took A's named step bar and white card. Future changes go into this
// one View.
export const variants = {
  a: { name: "Tick what you have", View: SetupView },
} satisfies Variants<SetupViewProps>;
