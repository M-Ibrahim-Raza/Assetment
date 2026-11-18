import type { Variants } from "@proto/kit/scenarios";
import type { SpendingViewProps } from "./scenarios";
import { Days } from "./spending";

// Finalized on 2026-11-17: "Days" (c) won over "Answer first" (a) and "Month pace" (b): the
// answer leads on the ink block, and the month as a calendar of days makes it easy to see when
// money went and to narrow everything to a few days. It took b's ink block, with the pace chart.
// The key stays c, so earlier links still work. Future changes go into this one View.
// Finalized on 2026-11-18: "By shape" (d) replaced c's two columns split by count, which left
// empty page beside the entries and cards at different widths and heights. Its "Side column" and
// "Rows" were tried as d and e; both stay, as "Layout on computers" in Customize.
export const variants = {
  c: { name: "Days", View: Days },
} satisfies Variants<SpendingViewProps>;
