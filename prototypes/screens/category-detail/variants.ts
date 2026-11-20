import type { Variants } from "@proto/kit/scenarios";
import { MixDetail } from "./category-detail";
import type { CategoryDetailViewProps } from "./scenarios";

// Finalized on 2026-11-21 (F37 to F41, with F36's menu): "Mix" (d), in Categories' look, picked
// with it from a, b and c, which were deleted. The key stays d, so earlier links still work.
// Future changes go into this one View.
export const variants = {
  d: { name: "Mix", View: MixDetail },
} satisfies Variants<CategoryDetailViewProps>;
