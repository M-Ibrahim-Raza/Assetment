import type { Variants } from "@proto/kit/scenarios";
import type { CategoriesViewProps } from "./scenarios";
import { Mix } from "./variants/mix";

// d (Mix), picked on 2026-11-20 from a, b and c, which were then deleted. It pairs with d on
// Category detail. The key stays "d", so links with ?variant=d still open it.
export const variants = {
  d: { name: "Mix", View: Mix },
} satisfies Variants<CategoriesViewProps>;
