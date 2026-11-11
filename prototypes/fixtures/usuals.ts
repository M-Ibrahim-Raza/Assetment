import type { EntryKind } from "./entries";

/** Something the user logs often. One tap fills its category and account. */
export interface Usual {
  id: string;
  kind: EntryKind;
  /** What the user calls it, e.g. "Careem". */
  title: string;
  /** Empty for money moved between accounts. */
  category: string;
  /** The id of the account or credit card the money leaves, or the account it lands in for income. */
  account: string;
  /** The id of the account or debt moved money goes to. Empty otherwise. */
  toAccount: string;
  /** What it came to last time, in whole rupees. */
  lastAmount: number;
}

interface Sample {
  kind: EntryKind;
  title: string;
  category: string;
  /** Account and debt names, as in fixtures/accounts.ts and fixtures/debts.ts. */
  from: string;
  to: string | null;
  lastAmount: number;
}

// Most used first, including a long title to test wrapping. A cash withdrawal, a wallet top-up and
// the monthly payments on debts are the transfers most people repeat.
const SAMPLES = [
  {
    kind: "expense",
    title: "Groceries",
    category: "Groceries",
    from: "Cash in hand",
    to: null,
    lastAmount: 4_250,
  },
  {
    kind: "expense",
    title: "Careem",
    category: "Transport",
    from: "JazzCash",
    to: null,
    lastAmount: 680,
  },
  {
    kind: "expense",
    title: "Lunch at the office",
    category: "Eating out",
    from: "Cash in hand",
    to: null,
    lastAmount: 450,
  },
  {
    kind: "expense",
    title: "Petrol",
    category: "Transport",
    from: "HBL Current",
    to: null,
    lastAmount: 3_000,
  },
  {
    kind: "expense",
    title: "K-Electric bill",
    category: "Bills",
    from: "HBL Current",
    to: null,
    lastAmount: 11_340,
  },
  {
    kind: "expense",
    title: "School fees for both children, with the van",
    category: "Children's school fees and tuition",
    from: "Meezan Bank – Salary",
    to: null,
    lastAmount: 42_000,
  },
  {
    kind: "expense",
    title: "Daraz order",
    category: "Clothes",
    from: "HBL credit card",
    to: null,
    lastAmount: 3_499,
  },
  {
    kind: "income",
    title: "Salary",
    category: "Salary",
    from: "Meezan Bank – Salary",
    to: null,
    lastAmount: 310_000,
  },
  {
    kind: "income",
    title: "Freelance",
    category: "Freelance",
    from: "HBL Current",
    to: null,
    lastAmount: 45_000,
  },
  {
    kind: "transfer",
    title: "ATM withdrawal",
    category: "",
    from: "Meezan Bank – Salary",
    to: "Cash in hand",
    lastAmount: 10_000,
  },
  {
    kind: "transfer",
    title: "To JazzCash",
    category: "",
    from: "Meezan Bank – Salary",
    to: "JazzCash",
    lastAmount: 5_000,
  },
  {
    kind: "transfer",
    title: "HBL card bill",
    category: "",
    from: "Meezan Bank – Salary",
    to: "HBL credit card",
    lastAmount: 25_000,
  },
  {
    kind: "transfer",
    title: "Car loan instalment",
    category: "",
    from: "Meezan Bank – Salary",
    to: "Meezan car loan",
    lastAmount: 30_000,
  },
  {
    kind: "transfer",
    title: "Office committee",
    category: "",
    from: "HBL Current",
    to: "Office committee",
    lastAmount: 10_000,
  },
] as const satisfies readonly Sample[];

/**
 * The usuals whose accounts and debts are in `places`, most used first, the same every time. A
 * usual whose card or debt the user doesn't have is left out.
 */
export function usuals(
  places: readonly { id: string; name: string }[],
): Usual[] {
  const idOf = (name: string) =>
    places.find((place) => place.name === name)?.id;

  return SAMPLES.flatMap((sample, index) => {
    const account = idOf(sample.from);
    const toAccount = sample.to === null ? "" : idOf(sample.to);
    if (account === undefined || toAccount === undefined) return [];
    return [
      {
        id: `usual-${String(index + 1)}`,
        kind: sample.kind,
        title: sample.title,
        category: sample.category,
        account,
        toAccount,
        lastAmount: sample.lastAmount,
      },
    ];
  });
}
