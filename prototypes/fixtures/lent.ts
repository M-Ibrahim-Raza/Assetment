// Money lent to family and friends. It's owned, so it counts in Portfolio, under Owed to you
// (docs/money-model.md). One item per person, with an optional date it should come back by.

export interface LentPlan {
  id: string;
  /** Who it's lent to, as the user calls them: "Ali bhai". The item is "Lent to Ali bhai". */
  to: string;
  /** Still to come back, in whole rupees. */
  amount: number;
  /** When it should come back by: "2027-03". Optional. */
  backBy: string | null;
}

// Realistic people and amounts, with a long one to test wrapping.
const SAMPLES = [
  { to: "Ali bhai", amount: 50_000, backBy: "2027-03" },
  { to: "Sana", amount: 15_000, backBy: null },
  {
    to: "Faisal from the office, for his mother's operation",
    amount: 120_000,
    backBy: "2027-06",
  },
  { to: "Cousin Bilal", amount: 8_000, backBy: null },
] as const satisfies readonly Omit<LentPlan, "id">[];

/** `count` people the user lent to, the same every time. After the samples run out, names get a number. */
export function lentPlans(count: number): LentPlan[] {
  return Array.from({ length: count }, (_, index) => {
    const sample = SAMPLES[index % SAMPLES.length] ?? SAMPLES[0];
    const round = Math.floor(index / SAMPLES.length);
    return {
      ...sample,
      id: `lent-${String(index + 1)}`,
      to: round === 0 ? sample.to : `${sample.to} ${String(round + 1)}`,
    };
  });
}
