export type EntryKind = "expense" | "income" | "transfer";

export interface Entry {
  id: string;
  title: string;
  kind: EntryKind;
  /** Whole rupees, always positive. The kind says which way the money went. */
  amount: number;
  category: string;
  account: string;
  /** When it happened, as a list shows it, e.g. "Today" or "8 Nov". */
  day: string;
}

// Newest first, including a long title to test wrapping.
const ENTRY_SAMPLES = [
  {
    title: "Imtiaz Super Market",
    kind: "expense",
    amount: 4_250,
    category: "Groceries",
    account: "Meezan Bank – Salary",
    day: "Today",
  },
  {
    title: "Careem to office",
    kind: "expense",
    amount: 680,
    category: "Transport",
    account: "JazzCash",
    day: "Today",
  },
  {
    title: "K-Electric bill",
    kind: "expense",
    amount: 11_340,
    category: "Bills",
    account: "HBL Current",
    day: "8 Nov",
  },
  {
    title: "To JazzCash",
    kind: "transfer",
    amount: 5_000,
    category: "Transfer",
    account: "Meezan Bank – Salary",
    day: "7 Nov",
  },
  {
    title: "Salary",
    kind: "income",
    amount: 310_000,
    category: "Salary",
    account: "Meezan Bank – Salary",
    day: "1 Nov",
  },
  {
    title: "Farewell dinner for Ayesha at Monal with the whole office team",
    kind: "expense",
    amount: 6_900,
    category: "Eating out",
    account: "Cash in hand",
    day: "31 Oct",
  },
] as const satisfies readonly Omit<Entry, "id">[];

/** `count` entries, newest first, the same every time. */
export function entries(count: number): Entry[] {
  return Array.from({ length: count }, (_, index) => {
    const sample =
      ENTRY_SAMPLES[index % ENTRY_SAMPLES.length] ?? ENTRY_SAMPLES[0];
    return { ...sample, id: `entry-${String(index + 1)}` };
  });
}

export interface CategorySpend {
  name: string;
  /** Spent this month so far, in whole rupees. */
  spent: number;
  /** Spent by the same day last month. */
  lastMonth: number;
}

// The first six are a typical month so far: Rs 212,400, against Rs 203,100 last month.
const CATEGORY_SAMPLES = [
  { name: "Rent", spent: 65_000, lastMonth: 65_000 },
  { name: "Groceries", spent: 48_600, lastMonth: 45_500 },
  { name: "Bills", spent: 31_800, lastMonth: 27_900 },
  { name: "Transport", spent: 22_400, lastMonth: 26_000 },
  { name: "Eating out", spent: 18_900, lastMonth: 14_200 },
  { name: "Other", spent: 25_700, lastMonth: 24_500 },
  {
    name: "Children's school fees and tuition",
    spent: 42_000,
    lastMonth: 42_000,
  },
  { name: "Health", spent: 9_300, lastMonth: 0 },
  { name: "Gifts and shaadi season", spent: 15_000, lastMonth: 31_000 },
] as const satisfies readonly CategorySpend[];

/** The first `count` spending categories, at most nine. */
export function spendingByCategory(count: number): CategorySpend[] {
  return CATEGORY_SAMPLES.slice(0, count);
}
