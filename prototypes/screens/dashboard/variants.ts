import type { Variants } from "@proto/kit/scenarios";
import { DashboardView } from "./dashboard";
import type { DashboardViewProps } from "./scenarios";

// Finalized on 2026-11-11: "Rounded blocks" (it was variant D) won over Calm Ledger, Midnight and
// Colour block. Future changes go into this one View.
export const variants = {
  a: { name: "Rounded blocks", View: DashboardView },
} satisfies Variants<DashboardViewProps>;
