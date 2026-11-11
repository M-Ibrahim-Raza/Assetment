export type DebtKind = "card" | "loan" | "committee";

export interface Debt {
  id: string;
  name: string;
  kind: DebtKind;
  /** Still owed, in whole rupees. */
  owed: number;
}

// Realistic Pakistani debts, including a long name to test wrapping.
const SAMPLES = [
  { name: "HBL credit card", kind: "card", owed: 45_000 },
  { name: "Meezan car loan", kind: "loan", owed: 425_000 },
  { name: "Office committee", kind: "committee", owed: 120_000 },
  {
    name: "Loan from Chacha Jameel, to repay after Eid",
    kind: "loan",
    owed: 60_000,
  },
] as const satisfies readonly Omit<Debt, "id">[];

/** `count` debts, the same every time. The first three add up to Rs 590,000. */
export function debts(count: number): Debt[] {
  return Array.from({ length: count }, (_, index) => {
    const sample = SAMPLES[index % SAMPLES.length] ?? SAMPLES[0];
    const round = Math.floor(index / SAMPLES.length);
    return {
      ...sample,
      id: `debt-${String(index + 1)}`,
      name: round === 0 ? sample.name : `${sample.name} ${String(round + 1)}`,
    };
  });
}

/** Everything owed across the given debts. */
export function debtsOwed(list: readonly Debt[]): number {
  return list.reduce((sum, debt) => sum + debt.owed, 0);
}
