import type { InstalmentEvery } from "./property";

// Debts with their plans, as Setup's debts step saves them (docs/money-model.md). A loan is what's
// owed today, with a fixed instalment or without one. A card is what's owed, the bill's due day and
// the limit. A committee is its plan: the app works out the rest.

/** The prototype's today. A loan's next instalment and a committee's turns count from it. */
export const DEBTS_TODAY = "2026-11-20";

/** A loan paid in fixed instalments. The app adds each one by itself on its day. */
export interface FixedInstalment {
  /** Each instalment, in whole rupees. */
  amount: number;
  /** How many are still to pay. */
  left: number;
  every: InstalmentEvery;
  /** The day of the month it's paid, 1 to 31. */
  day: number;
  /** The month the next one is due, "2027-01". Only for every 3 months: a monthly one is due each month. */
  next: string | null;
  /** The account it's paid from. Null when the user hadn't added an account yet. */
  paidFrom: string | null;
}

export interface LoanPlan {
  kind: "loan";
  id: string;
  name: string;
  /** What the lender would take to close it today, in whole rupees. */
  owed: number;
  /** Null when there's no fixed amount: each payment is logged by hand. */
  fixed: FixedInstalment | null;
  /** Without a fixed amount, when the user means to repay it by: "2027-06". Optional. */
  repayBy: string | null;
}

export interface CardPlan {
  kind: "card";
  id: string;
  name: string;
  /** What's owed on the card today, in whole rupees. */
  owed: number;
  /** The day of the month the bill is due, 1 to 31. */
  dueDay: number;
  /** The most the bank lets the user owe on it, in whole rupees. */
  limit: number;
}

export interface CommitteePlan {
  kind: "committee";
  id: string;
  name: string;
  /** What each member pays in each month, in whole rupees. */
  monthly: number;
  /** How many people are in it. Each gets one turn, so it runs this many months. */
  members: number;
  /** The month of the first payment: "2026-05". */
  start: string;
  /** How many monthly payments the user has made. */
  paid: number;
  /** True once the user has had their turn and got the pot. */
  hadTurn: boolean;
  /** The user's turn, 1 to `members`. Null when it isn't known: turns are often drawn. */
  turn: number | null;
}

export type DebtPlan = LoanPlan | CardPlan | CommitteePlan;

// Realistic Pakistani debts, with a long name to test wrapping. 0, 1 and 2 are a typical user's.
const SAMPLES = [
  {
    kind: "loan",
    name: "Meezan car loan",
    owed: 1_180_000,
    fixed: {
      amount: 38_500,
      left: 36,
      every: "month",
      day: 5,
      next: null,
      paidFrom: "account-1",
    },
    repayBy: null,
  },
  {
    kind: "card",
    name: "HBL credit card",
    owed: 45_000,
    dueDay: 12,
    limit: 200_000,
  },
  {
    kind: "committee",
    name: "Office committee",
    monthly: 20_000,
    members: 12,
    start: "2026-05",
    paid: 6,
    hadTurn: true,
    turn: 2,
  },
  {
    kind: "loan",
    name: "Loan from Chacha Jameel, to pay back after Eid ul-Adha",
    owed: 60_000,
    fixed: null,
    repayBy: "2027-06",
  },
  {
    kind: "committee",
    name: "Family committee with Khala",
    monthly: 10_000,
    members: 10,
    start: "2026-03",
    paid: 8,
    hadTurn: false,
    turn: null,
  },
  {
    kind: "card",
    name: "Standard Chartered Platinum card",
    owed: 128_400,
    dueDay: 3,
    limit: 500_000,
  },
  {
    kind: "loan",
    name: "HBL home finance",
    owed: 4_850_000,
    fixed: {
      amount: 62_000,
      left: 140,
      every: "month",
      day: 1,
      next: null,
      paidFrom: "account-1",
    },
    repayBy: null,
  },
  {
    kind: "loan",
    name: "Bank Alfalah personal loan",
    owed: 280_000,
    fixed: {
      amount: 26_000,
      left: 12,
      every: "month",
      day: 10,
      next: null,
      paidFrom: "account-3",
    },
    repayBy: null,
  },
  // Family, so no markup: what's left to pay is what's owed.
  {
    kind: "loan",
    name: "Loan from Mamoo for the plot file",
    owed: 600_000,
    fixed: {
      amount: 150_000,
      left: 4,
      every: "quarter",
      day: 1,
      next: "2027-01",
      paidFrom: "account-1",
    },
    repayBy: null,
  },
  {
    kind: "card",
    name: "Bank Alfalah Ultra Cashback card",
    owed: 8_200,
    dueDay: 25,
    limit: 150_000,
  },
] as const satisfies readonly (
  Omit<LoanPlan, "id"> | Omit<CardPlan, "id"> | Omit<CommitteePlan, "id">
)[];

/** One sample by its place: 0 the car loan, 2 the committee after the turn, 4 one before it. */
export function samplePlan(index: number): DebtPlan {
  const sample = SAMPLES[index % SAMPLES.length] ?? SAMPLES[0];
  return { ...sample, id: `plan-${String(index + 1)}` };
}

/** `count` debts with their plans, the same every time. After the samples run out, names get a number. */
export function debtPlans(count: number): DebtPlan[] {
  return Array.from({ length: count }, (_, index) => {
    const plan = samplePlan(index);
    const round = Math.floor(index / SAMPLES.length);
    return round === 0
      ? plan
      : { ...plan, name: `${plan.name} ${String(round + 1)}` };
  });
}
