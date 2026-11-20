import type { Variants } from "@proto/kit/scenarios";
import type { CategoryDetailViewProps } from "./scenarios";
import { MixDetail } from "./variants/mix";

// d (Mix), picked on 2026-11-20 from a, b and c, which were then deleted. It pairs with d on
// Categories. The key stays "d", so links with ?variant=d still open it.
export const variants = {
  d: { name: "Mix", View: MixDetail },
} satisfies Variants<CategoryDetailViewProps>;
