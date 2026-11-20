import type { Variants } from "@proto/kit/scenarios";
import { Mix } from "./categories";
import type { CategoriesViewProps } from "./scenarios";

// Finalized on 2026-11-21 (F35, F36, F41): "Mix" (d), built from parts of a (Ledger), b (Story)
// and c (Chart and panel), which were deleted: b's ranked rows with a Total column, c's split-bar
// chart, with the answer, the figures and the chart in one block. It pairs with Category detail.
// The key stays d, so earlier links still work. Future changes go into this one View.
export const variants = {
  d: { name: "Mix", View: Mix },
} satisfies Variants<CategoriesViewProps>;
