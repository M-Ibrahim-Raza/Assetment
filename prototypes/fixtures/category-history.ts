import { categories } from "./categories";
import {
  build,
  emptySpendingMonths,
  firstSpendingMonth,
  heavySpendingMonths,
  type MonthPlan,
  type SpendMonth,
  spendingMonths,
} from "./spending";

/** Every spending category the person has, most used first, the long one to test wrapping. */
export const CATEGORY_NAMES = categories("expense", 20);

/** Two categories put away: Coursera stopped in March, and nothing was ever spent on Subscriptions. */
export const HIDDEN_SAMPLE = ["Education", "Subscriptions"] as const;

// The months of Spending's year, oldest first: November 2025 to November 2026, which is this month
// up to the 12th.
const MONTHS = [
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
  "2026-09",
  "2026-10",
  "2026-11",
] as const;

// Spending's six categories come from its own fixture, so a category opened from Spending shows the
// same months. These add the rest of a typical household's year, one amount a month, in the order
// of MONTHS. The school year starts in August with a fee rise and has no tuition in July. Ramzan
// and Eid ul Fitr fall in March (zakat, Eidi, new clothes, the help's bonus), Eid ul Adha in May
// (Qurbani). Shaadi season peaks in December. Travel is rare: April and August only. Health is new
// this month.
const EXTRA_AMOUNTS: Readonly<Record<string, readonly number[]>> = {
  "Children's school fees and tuition": [
    38_000, 38_000, 38_000, 38_000, 38_000, 38_000, 38_000, 38_000, 26_000,
    42_000, 42_000, 42_000, 42_000,
  ],
  "Household help": [
    36_000, 36_000, 36_000, 36_000, 52_000, 36_000, 36_000, 36_000, 38_000,
    38_000, 38_000, 38_000, 38_000,
  ],
  "Mobile and internet": [
    6_200, 6_200, 6_200, 6_400, 6_400, 6_400, 6_400, 6_400, 6_400, 7_100, 7_100,
    7_100, 7_100,
  ],
  "Gifts and shaadi season": [
    18_000, 42_000, 16_000, 8_000, 22_000, 0, 0, 0, 0, 0, 0, 31_000, 15_000,
  ],
  "Charity and zakat": [
    3_000, 3_000, 3_000, 3_000, 85_000, 3_000, 3_000, 3_000, 3_000, 3_000,
    3_000, 3_000, 3_000,
  ],
  Clothes: [0, 18_000, 0, 0, 28_000, 0, 0, 0, 9_000, 0, 0, 0, 0],
  Entertainment: [0, 0, 6_500, 4_000, 0, 0, 0, 7_800, 0, 0, 5_200, 0, 0],
  Education: [0, 0, 4_500, 4_500, 4_500, 0, 0, 0, 0, 0, 0, 0, 0],
  Travel: [0, 0, 0, 0, 0, 38_000, 0, 0, 0, 64_000, 0, 0, 0],
  Qurbani: [0, 0, 0, 0, 0, 0, 95_000, 0, 0, 0, 0, 0, 0],
  Health: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9_300],
};

const NOTHING_MOVED = { total: 0, biggest: null };

/** Adds each extra month's entries to the base month with the same key. */
function withExtra(
  base: readonly SpendMonth[],
  extra: readonly SpendMonth[],
): SpendMonth[] {
  return base.map((month) => ({
    ...month,
    entries: [
      ...month.entries,
      ...(extra.find((other) => other.month === month.month)?.entries ?? []),
    ],
  }));
}

/**
 * A typical salaried investor's year by category, oldest first, ending today: Spending's thirteen
 * months, plus school fees, the help, gifts, zakat, Eid and the rest. Home repairs, Personal care
 * and Subscriptions have nothing yet.
 */
export function categoryHistory(): SpendMonth[] {
  const plans: MonthPlan[] = MONTHS.map((month, index) => ({
    month,
    amounts: Object.fromEntries(
      Object.entries(EXTRA_AMOUNTS)
        .map(([name, amounts]) => [name, amounts[index] ?? 0] as const)
        .filter(([, amount]) => amount > 0),
    ),
    moved: NOTHING_MOVED,
  }));
  return withExtra(spendingMonths(), build(plans));
}

// December 2024 to October 2025, before Spending's heavy year starts.
const EARLIER_MONTHS = [
  "2024-12",
  "2025-01",
  "2025-02",
  "2025-03",
  "2025-04",
  "2025-05",
  "2025-06",
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
] as const;

/**
 * Twenty categories over twenty-four months, with crore totals: Spending's big household, which is
 * renovating its house this month, plus the year before, scaled from its October. Eid ul Adha fell
 * in June 2025.
 */
export function manyCategoryHistory(): SpendMonth[] {
  const heavy = heavySpendingMonths();
  const october = heavy.find((month) => month.month === "2026-10");
  const usual = new Map<string, number>();
  for (const entry of october?.entries ?? []) {
    usual.set(entry.category, (usual.get(entry.category) ?? 0) + entry.amount);
  }
  const earlier: MonthPlan[] = EARLIER_MONTHS.map((month, index) => {
    const factor = 0.82 + (index % 5) * 0.04;
    return {
      month,
      amounts: {
        ...Object.fromEntries(
          [...usual].map(([name, amount]) => [
            name,
            Math.round((amount * factor) / 100) * 100,
          ]),
        ),
        Qurbani: month === "2025-06" ? 420_000 : 0,
      },
      moved: NOTHING_MOVED,
    };
  });
  return [...build(earlier), ...heavy];
}

/** Someone who joined on 3 November: this month so far, and nothing before it. */
export function newUserCategoryHistory(): SpendMonth[] {
  return firstSpendingMonth();
}

/** Nothing logged yet. */
export function emptyCategoryHistory(): SpendMonth[] {
  return emptySpendingMonths();
}
