import { accounts } from "./accounts";

export type PortfolioGroupKind = "cash" | "stocks" | "metals" | "property";

export interface PortfolioGroup {
  kind: PortfolioGroupKind;
  label: string;
  /** Today's value, in whole rupees. */
  value: number;
  /** What was paid for it. Null for cash, which has no profit or loss. */
  cost: number | null;
}

/** Everything a typical user owns, in its four groups. Cash is the first five sample accounts. */
export function portfolioGroups(): PortfolioGroup[] {
  const cash = accounts(5).reduce((sum, account) => sum + account.balance, 0);
  return [
    { kind: "cash", label: "Cash & equivalents", value: cash, cost: null },
    {
      kind: "stocks",
      label: "Stocks and funds",
      value: 1_142_455,
      cost: 1_048_736,
    },
    {
      kind: "metals",
      label: "Gold and silver",
      value: 912_000,
      cost: 702_478,
    },
    {
      kind: "property",
      label: "Property",
      value: 3_000_000,
      cost: 2_500_000,
    },
  ];
}

/** The Portfolio total: what all the groups are worth today. */
export function portfolioValue(groups: readonly PortfolioGroup[]): number {
  return groups.reduce((sum, group) => sum + group.value, 0);
}
