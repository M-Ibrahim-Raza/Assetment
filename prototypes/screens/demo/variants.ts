import type { Variants } from "@proto/kit/scenarios";
import type { DemoViewProps } from "./scenarios";
import { DemoCards } from "./variants/cards";
import { DemoList } from "./variants/list";

export const variants = {
  a: { name: "List", View: DemoList },
  b: { name: "Cards by type", View: DemoCards },
} satisfies Variants<DemoViewProps>;
