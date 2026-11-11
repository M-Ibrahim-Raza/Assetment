import type { EntryKind } from "./entries";

/** Money going out or coming in has a category. Money moved between accounts has none. */
export type CategoryKind = Exclude<EntryKind, "transfer">;

// Most used first, as the app would learn them, with one long name to test wrapping.
const SAMPLES = {
  expense: [
    "Groceries",
    "Eating out",
    "Transport",
    "Bills",
    "Rent",
    "Health",
    "Children's school fees and tuition",
    "Gifts and shaadi season",
    "Other",
    "Mobile and internet",
    "Household help",
    "Clothes",
    "Entertainment",
    "Travel",
    "Charity and zakat",
    "Home repairs",
    "Personal care",
    "Education",
    "Qurbani",
    "Subscriptions",
  ],
  income: [
    "Salary",
    "Freelance",
    "Profit and dividends",
    "Rent received",
    "Gift",
    "Refund",
    "Bonus",
    "Other",
  ],
} as const satisfies Record<CategoryKind, readonly string[]>;

/** The first `count` categories of a kind, most used first, the same every time. */
export function categories(kind: CategoryKind, count: number): string[] {
  return SAMPLES[kind].slice(0, count);
}
