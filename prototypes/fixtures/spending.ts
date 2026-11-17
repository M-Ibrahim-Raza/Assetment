import { categories } from "./categories";
import { spendingByCategory } from "./entries";

/** One spent entry. Spending shows only money spent: money received or moved isn't here. */
export interface SpendEntry {
  id: string;
  title: string;
  /** Whole rupees, always positive. */
  amount: number;
  category: string;
  account: string;
  /** Day of the month, from 1. */
  day: number;
}

/**
 * Money moved in a month: between the user's own accounts, or paying a card bill, a loan or a
 * committee. It is never spending, so Spending shows it apart from the totals.
 */
export interface MovedMoney {
  /** Whole rupees. */
  total: number;
  /** Where the biggest share went. Null when nothing moved. */
  biggest: { to: string; amount: number } | null;
}

export interface SpendMonth {
  /** Year and month, e.g. "2026-11". */
  month: string;
  /** What was spent, in any order. */
  entries: readonly SpendEntry[];
  moved: MovedMoney;
}

/** The day the fixtures call today: 12 November 2026, mid-month. */
export const SPENDING_TODAY = { month: "2026-11", day: 12 } as const;

interface Slot {
  day: number;
  /** One title, or a few that take turns month by month. */
  title: string | readonly string[];
  account: string;
}

const MEEZAN = "Meezan Bank – Salary";
const HBL = "HBL Current";
const CARD = "HBL credit card";
const JAZZ = "JazzCash";
const EASY = "Easypaisa";
const CASH = "Cash in hand";
const UBL = "UBL Bachat Savings Account (joint with Ammi)";

// When each kind of spending tends to happen in a month, and where. Amounts are shared out later.
const PATTERNS: Readonly<Record<string, readonly Slot[]>> = {
  Rent: [{ day: 1, title: "House rent", account: MEEZAN }],
  Groceries: [
    { day: 2, title: ["Al-Fatah", "Naheed"], account: CARD },
    { day: 5, title: "Sabzi and fruit", account: CASH },
    { day: 9, title: ["Chase Up", "Carrefour"], account: CARD },
    { day: 12, title: "Imtiaz Super Market", account: MEEZAN },
    { day: 16, title: "Doodh wala", account: CASH },
    { day: 19, title: ["Imtiaz Super Market", "Al-Fatah"], account: CARD },
    { day: 23, title: "Sabzi and fruit", account: CASH },
    { day: 27, title: ["Chase Up", "Naheed"], account: MEEZAN },
  ],
  Bills: [
    { day: 4, title: "SSGC gas bill", account: HBL },
    { day: 8, title: "K-Electric bill", account: HBL },
    { day: 10, title: "KWSC water bill", account: HBL },
    { day: 22, title: "Building maintenance", account: CASH },
  ],
  Transport: [
    { day: 1, title: "PSO petrol", account: CARD },
    { day: 3, title: "Careem to office", account: JAZZ },
    { day: 6, title: "Bykea", account: JAZZ },
    { day: 7, title: "inDrive", account: EASY },
    { day: 10, title: "Shell petrol", account: CARD },
    { day: 12, title: "Careem to office", account: JAZZ },
    { day: 15, title: "Careem to office", account: JAZZ },
    { day: 18, title: "PSO petrol", account: CARD },
    { day: 24, title: "Bykea", account: JAZZ },
    { day: 28, title: "Shell petrol", account: CARD },
  ],
  "Eating out": [
    { day: 3, title: ["Kolachi", "Butt Karahi"], account: CARD },
    { day: 7, title: "foodpanda", account: JAZZ },
    { day: 11, title: ["Savour Foods", "Cafe Aylanto"], account: CASH },
    { day: 17, title: "foodpanda", account: JAZZ },
    { day: 25, title: ["Kolachi", "Ginsoy"], account: CARD },
    {
      day: 31,
      title: "Farewell dinner for Ayesha at Monal with the whole office team",
      account: CASH,
    },
  ],
  Other: [
    { day: 2, title: "Daraz order", account: CARD },
    { day: 6, title: "Barber", account: CASH },
    { day: 11, title: "TCS courier", account: EASY },
    { day: 20, title: "Dry cleaning", account: CASH },
    { day: 26, title: "Daraz order", account: CARD },
  ],
  Health: [
    { day: 4, title: "Dawaai pharmacy", account: JAZZ },
    { day: 14, title: "Aga Khan lab tests", account: CARD },
  ],
  "Children's school fees and tuition": [
    { day: 5, title: "Beaconhouse school fee", account: MEEZAN },
    { day: 10, title: "Tuition for Hamza", account: CASH },
  ],
  "Gifts and shaadi season": [
    { day: 6, title: "Salami at Sana's mehndi", account: CASH },
    { day: 9, title: "Wedding gift for Bilal", account: CARD },
    { day: 11, title: "Dholki dinner and mehndi", account: CASH },
    { day: 21, title: "Walima gift", account: CARD },
  ],
  "Mobile and internet": [
    { day: 3, title: "StormFiber internet", account: HBL },
    { day: 8, title: "Jazz monthly bundle", account: JAZZ },
  ],
  "Household help": [
    { day: 1, title: "Maasi's salary", account: CASH },
    { day: 2, title: "Driver's salary", account: MEEZAN },
  ],
  Clothes: [
    { day: 4, title: "Khaadi", account: CARD },
    { day: 10, title: "Shaadi suit stitching", account: CASH },
    { day: 22, title: "Outfitters", account: CARD },
  ],
  Entertainment: [
    { day: 7, title: "Cinepax tickets", account: CARD },
    { day: 20, title: "Bowling at Dolmen Mall", account: CARD },
  ],
  Travel: [
    { day: 6, title: "Daewoo to Lahore", account: EASY },
    { day: 18, title: "Hotel in Nathia Gali", account: CARD },
  ],
  "Charity and zakat": [
    { day: 1, title: "Edhi Foundation", account: UBL },
    { day: 15, title: "Shaukat Khanum", account: UBL },
  ],
  "Home repairs": [
    { day: 3, title: "Plumber", account: CASH },
    { day: 9, title: "AC service", account: CASH },
    { day: 24, title: "Electrician", account: CASH },
  ],
  "Personal care": [
    { day: 8, title: "Salon", account: CARD },
    { day: 23, title: "Toiletries", account: CARD },
  ],
  Education: [{ day: 6, title: "Coursera", account: CARD }],
  Qurbani: [{ day: 5, title: "Qurbani share", account: MEEZAN }],
  Subscriptions: [
    { day: 2, title: "Netflix", account: CARD },
    { day: 9, title: "YouTube Premium", account: CARD },
  ],
};

/** A category's amount for a month: one sum, or what was spent up to today's day and after it. */
type Amount = number | { early: number; late: number };

interface MonthPlan {
  month: string;
  amounts: Readonly<Record<string, Amount>>;
  /** Exact amounts for some entries, by category and day, so they match Home. */
  fixed?: Readonly<Record<string, Readonly<Record<number, number>>>>;
  moved: MovedMoney;
}

function daysIn(month: string): number {
  const [year = 2026, number = 1] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number, 0)).getUTCDate();
}

function titleOf(slot: Slot, monthIndex: number): string {
  if (typeof slot.title === "string") return slot.title;
  return slot.title[monthIndex % slot.title.length] ?? "";
}

/**
 * Shares `total` out over the slots: fixed amounts first, then the rest by an uneven weight that
 * is the same every time, rounded to Rs 10. The last slot takes what's left, so the sum is exact.
 */
function shareOut(
  slots: readonly Slot[],
  total: number,
  fixed: Readonly<Record<number, number>>,
): number[] {
  const fixedSum = slots.reduce((sum, slot) => sum + (fixed[slot.day] ?? 0), 0);
  const weights = slots.map((slot, index) =>
    fixed[slot.day] === undefined ? 2 + ((slot.day * 7 + index * 3) % 5) : 0,
  );
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const rest = total - fixedSum;
  const lastFree = weights.findLastIndex((weight) => weight > 0);
  let given = 0;
  return slots.map((slot, index) => {
    const pinned = fixed[slot.day];
    if (pinned !== undefined) return pinned;
    if (index === lastFree) return rest - given;
    const share =
      Math.round((rest * (weights[index] ?? 0)) / weightSum / 10) * 10;
    given += share;
    return share;
  });
}

function buildMonth(plan: MonthPlan, upToDay: number): SpendMonth {
  const lastDay = Math.min(upToDay, daysIn(plan.month));
  const monthIndex = Number(plan.month.slice(5));
  const entries: SpendEntry[] = [];

  for (const [category, amount] of Object.entries(plan.amounts)) {
    const slots = (PATTERNS[category] ?? []).filter(
      (slot) => slot.day <= lastDay,
    );
    const fixed = plan.fixed?.[category] ?? {};
    const parts =
      typeof amount === "number"
        ? [{ slots, total: amount }]
        : [
            {
              slots: slots.filter((slot) => slot.day <= SPENDING_TODAY.day),
              total: amount.early,
            },
            {
              slots: slots.filter((slot) => slot.day > SPENDING_TODAY.day),
              total: amount.late,
            },
          ];
    for (const part of parts) {
      if (part.total <= 0 || part.slots.length === 0) continue;
      const shares = shareOut(part.slots, part.total, fixed);
      part.slots.forEach((slot, index) => {
        const share = shares[index] ?? 0;
        // A fixed amount can take a part's whole total. No one logs a Rs 0 entry.
        if (share <= 0) return;
        entries.push({
          id: `${plan.month}-${category}-${String(slot.day)}`,
          title: titleOf(slot, monthIndex),
          amount: share,
          category,
          account: slot.account,
          day: slot.day,
        });
      });
    }
  }
  return { month: plan.month, entries, moved: plan.moved };
}

function moved(total: number, toCard: number): MovedMoney {
  return { total, biggest: { to: CARD, amount: toCard } };
}

// November 2025 to September 2026, oldest first: rent went up in July, bills rise with the AC in
// summer, and Ramzan and Eid (March) bring more groceries and eating out.
const PAST_MONTHS = [
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
] as const;

const PAST_AMOUNTS = {
  Rent: [
    60_000, 60_000, 60_000, 60_000, 60_000, 60_000, 60_000, 60_000, 65_000,
    65_000, 65_000,
  ],
  Groceries: [
    68_000, 71_500, 69_800, 72_400, 84_600, 70_300, 73_900, 75_200, 76_800,
    78_100, 77_400,
  ],
  Bills: [
    22_400, 19_800, 21_300, 20_600, 24_900, 31_200, 42_700, 48_300, 46_900,
    44_100, 38_600,
  ],
  Transport: [
    38_200, 41_000, 39_400, 37_800, 40_200, 42_600, 44_300, 43_100, 45_800,
    44_700, 46_200,
  ],
  "Eating out": [
    24_600, 31_800, 22_900, 21_400, 34_700, 25_300, 26_800, 23_900, 27_400,
    28_200, 29_600,
  ],
  Other: [
    31_200, 36_400, 28_700, 30_100, 42_800, 29_400, 33_600, 31_800, 35_200,
    32_900, 34_100,
  ],
} as const satisfies Record<string, readonly number[]>;

const MOVED_PAST = [
  moved(43_000, 36_500),
  moved(52_000, 44_800),
  moved(38_000, 31_200),
  moved(41_500, 35_000),
  moved(57_000, 48_900),
  moved(40_000, 33_700),
  moved(46_000, 38_200),
  moved(44_500, 37_100),
  moved(49_000, 41_600),
  moved(47_500, 40_300),
  moved(45_000, 38_800),
];

// Home's six categories. November so far, and October up to the same day, come from Home's own
// fixture, so the two screens agree: Rs 212,400 against Rs 203,100.
const homeCategories = spendingByCategory(6);

// What October added after the 12th.
const OCTOBER_LATE: Readonly<Record<string, number>> = {
  Rent: 0,
  Groceries: 30_000,
  Bills: 4_000,
  Transport: 18_000,
  "Eating out": 14_000,
  Other: 12_000,
};

function pastPlans(): MonthPlan[] {
  return PAST_MONTHS.map((month, index) => ({
    month,
    amounts: Object.fromEntries(
      Object.entries(PAST_AMOUNTS).map(([category, amounts]) => [
        category,
        amounts[index] ?? 0,
      ]),
    ),
    moved: MOVED_PAST[index] ?? moved(0, 0),
  }));
}

const october: MonthPlan = {
  month: "2026-10",
  amounts: Object.fromEntries(
    homeCategories.map(({ name, lastMonth }) => [
      name,
      { early: lastMonth, late: OCTOBER_LATE[name] ?? 0 },
    ]),
  ),
  fixed: { "Eating out": { 31: 6_900 } },
  moved: moved(47_000, 39_500),
};

// Home's latest entries: Imtiaz and Careem today, K-Electric on the 8th.
const NOVEMBER_FIXED = {
  Groceries: { 12: 4_250 },
  Transport: { 12: 680 },
  Bills: { 8: 11_340 },
};

// Rs 25,000 paid on the card and Rs 5,000 to JazzCash, as on Home.
const NOVEMBER_MOVED = moved(30_000, 25_000);

const november: MonthPlan = {
  month: SPENDING_TODAY.month,
  amounts: Object.fromEntries(
    homeCategories.map(({ name, spent }) => [name, spent]),
  ),
  fixed: NOVEMBER_FIXED,
  moved: NOVEMBER_MOVED,
};

function build(plans: readonly MonthPlan[]): SpendMonth[] {
  return plans.map((plan) =>
    buildMonth(
      plan,
      plan.month === SPENDING_TODAY.month ? SPENDING_TODAY.day : 31,
    ),
  );
}

/** Thirteen months of a typical salaried investor's spending, oldest first, ending today. */
export function spendingMonths(): SpendMonth[] {
  return build([...pastPlans(), october, november]);
}

/**
 * The same year, but November is shaadi season: gifts and new clothes add about Rs 95,000 to the
 * month so far.
 */
export function shaadiSeasonMonths(): SpendMonth[] {
  return build([
    ...pastPlans(),
    october,
    {
      ...november,
      amounts: {
        ...november.amounts,
        "Gifts and shaadi season": 61_500,
        Clothes: 33_800,
      },
    },
  ]);
}

/** Someone who joined on 3 November: this month so far, and nothing before it. */
export function firstSpendingMonth(): SpendMonth[] {
  return [
    buildMonth(
      {
        month: SPENDING_TODAY.month,
        amounts: {
          Groceries: 21_300,
          Transport: 8_460,
          Bills: 11_340,
          "Eating out": 6_200,
        },
        fixed: NOVEMBER_FIXED,
        moved: { total: 5_000, biggest: { to: JAZZ, amount: 5_000 } },
      },
      SPENDING_TODAY.day,
    ),
  ].map((month) => ({
    ...month,
    // They started logging on the 3rd.
    entries: month.entries.filter((entry) => entry.day >= 3),
  }));
}

/** This month with nothing logged yet. */
export function emptySpendingMonths(): SpendMonth[] {
  return [
    {
      month: SPENDING_TODAY.month,
      entries: [],
      moved: { total: 0, biggest: null },
    },
  ];
}

// A big household's usual month, across all twenty categories.
const HEAVY_BASE: Readonly<Record<string, number>> = {
  Groceries: 182_000,
  "Eating out": 96_500,
  Transport: 121_000,
  Bills: 143_000,
  Rent: 350_000,
  Health: 46_000,
  "Children's school fees and tuition": 212_000,
  "Gifts and shaadi season": 61_000,
  Other: 82_000,
  "Mobile and internet": 12_400,
  "Household help": 112_000,
  Clothes: 71_000,
  Entertainment: 35_500,
  Travel: 248_000,
  "Charity and zakat": 101_000,
  "Home repairs": 52_000,
  "Personal care": 25_800,
  Education: 30_500,
  Qurbani: 0,
  Subscriptions: 8_600,
};

/**
 * Twenty categories, long names and crore totals: a big household that is renovating its house
 * this month, Rs 1.15 crore so far.
 */
export function heavySpendingMonths(): SpendMonth[] {
  const names = categories("expense", 20);
  const scaled = (factor: number) =>
    Object.fromEntries(
      names.map((name) => [
        name,
        Math.round(((HEAVY_BASE[name] ?? 0) * factor) / 100) * 100,
      ]),
    );
  const past: MonthPlan[] = PAST_MONTHS.map((month, index) => ({
    month,
    amounts: {
      ...scaled(0.9 + (index % 4) * 0.07),
      // Eid ul Adha falls in May 2026.
      Qurbani: month === "2026-05" ? 465_000 : 0,
    },
    moved: moved(2_400_000 + index * 35_000, 1_850_000),
  }));
  const octoberHeavy: MonthPlan = {
    month: "2026-10",
    amounts: Object.fromEntries(
      Object.entries(scaled(1)).map(([name, amount]) => [
        name,
        { early: Math.round(amount * 0.45), late: Math.round(amount * 0.55) },
      ]),
    ),
    moved: moved(2_650_000, 1_920_000),
  };
  const novemberHeavy: MonthPlan = {
    month: SPENDING_TODAY.month,
    amounts: {
      ...Object.fromEntries(
        Object.entries(scaled(0.48)).map(([name, amount]) => [name, amount]),
      ),
      "Home repairs": 11_500_000,
    },
    moved: moved(3_100_000, 2_250_000),
  };
  return build([...past, octoberHeavy, novemberHeavy]);
}
