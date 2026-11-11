import type { Variants } from "@proto/kit/scenarios";
import { QuickAddView } from "./quick-add";
import type { QuickAddViewProps } from "./scenarios";

// Finalized on 2026-11-11. The form: "Big number", with a row of usuals added from the old
// variant C, won over Sentence and Your usuals. Where Add leads: "With links" won over Money only
// and Menu first. Future changes go into this one View.
export const variants = {
  a: { name: "Big number", View: QuickAddView },
} satisfies Variants<QuickAddViewProps>;
