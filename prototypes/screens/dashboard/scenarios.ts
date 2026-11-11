// Dashboard: the Home tab, and the first screen after sign-in (J1 step 7, J2 step 5).
//
// Finalized on 2026-11-11 as "Rounded blocks": rounded blocks of bottle green, sage and ink on a
// mist page, with one big net worth number. It also set the prototype's look (app/theme.css) and
// app shell. Decided while finalizing:
// - New users get a setup wizard after sign-up. Empty Home is for someone who skipped it, and
//   its button picks the wizard up again.
// - "Still right" on a balance check removes it at once, with an Undo toast.
// - Home shows only the Portfolio total. The four groups are on the Portfolio tab.
//
// The sidebar collapses to an icon rail (added after finalizing), with a round handle on its edge
// or Ctrl/⌘ + B. The rail shows small names under the icons, so it works on touch. Tablets start
// with the rail and desktops with the full sidebar, until the user chooses; the browser remembers.
//
// Open questions (write them here while exploring, resolve them in /prototype-finalize):
// None.

import { debts, debtsOwed } from "@proto/fixtures/debts";
import {
  type CategorySpend,
  entries,
  type Entry,
  spendingByCategory,
} from "@proto/fixtures/entries";
import { portfolioGroups, portfolioValue } from "@proto/fixtures/portfolio";
import type { Scenarios } from "@proto/kit/scenarios";

export interface NetWorth {
  /** Everything owned, in whole rupees. */
  portfolio: number;
  /** Everything owed. Net worth is `portfolio - debts`. */
  debts: number;
  /** How far net worth has moved since the 1st of this month. */
  changeThisMonth: number;
  /** Net worth at each month end, oldest first, ending with today. */
  trend: readonly number[];
  /** The day the daily prices were taken, e.g. "9 Nov". */
  pricesAsOf: string;
}

/** What moved net worth this month. Kept is `received - spent`, and the change is kept plus `portfolioMoved`. */
export interface MonthStory {
  /** The month's name, e.g. "November". */
  name: string;
  /** All money in: salary, freelance, gifts, refunds. Called "Received", as in Quick add. */
  received: number;
  spent: number;
  /** Rise or fall in what the Portfolio is worth, from prices and typed-in values. */
  portfolioMoved: number;
}

/** A value that may no longer be true: an account balance to confirm, or a hand-typed value that is getting old. */
export interface Check {
  id: string;
  kind: "balance" | "stale";
  /** The account or asset. */
  name: string;
  /** The value on record, in whole rupees. */
  amount: number;
  /** How long ago it was last confirmed, e.g. "12 days ago". */
  age: string;
}

export interface Dashboard {
  netWorth: NetWorth;
  month: MonthStory;
  checks: readonly Check[];
  /** This month's spending by category, in any order. */
  spending: readonly CategorySpend[];
  /** The latest entries, newest first. */
  recent: readonly Entry[];
}

/** The View's props. Loading and error are states the View shows, so they are props too. */
export type DashboardViewProps =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; dashboard: Dashboard };

const portfolio = portfolioValue(portfolioGroups());
const owed = debtsOwed(debts(3));

// A salaried investor part-way through November: kept Rs 97,600, and prices added Rs 41,200.
const typical: Dashboard = {
  netWorth: {
    portfolio,
    debts: owed,
    changeThisMonth: 138_800,
    trend: [
      4_200_000,
      4_236_000,
      4_251_500,
      4_318_000,
      4_296_400,
      4_372_900,
      4_441_000,
      4_468_700,
      4_529_300,
      4_601_800,
      4_673_500,
      portfolio - owed,
    ],
    pricesAsOf: "9 Nov",
  },
  month: {
    name: "November",
    received: 310_000,
    spent: 212_400,
    portfolioMoved: 41_200,
  },
  checks: [
    {
      id: "check-1",
      kind: "balance",
      name: "JazzCash",
      amount: 6_420,
      age: "12 days ago",
    },
    {
      id: "check-2",
      kind: "stale",
      name: "Plot in Bahria Town",
      amount: 3_000_000,
      age: "4 months ago",
    },
  ],
  spending: spendingByCategory(6),
  recent: entries(5),
};

// Someone who has just signed up and added nothing yet.
const firstUse: Dashboard = {
  netWorth: {
    portfolio: 0,
    debts: 0,
    changeThisMonth: 0,
    trend: [],
    pricesAsOf: "9 Nov",
  },
  month: { name: "November", received: 0, spent: 0, portfolioMoved: 0 },
  checks: [],
  spending: [],
  recent: [],
};

// Large totals, long names, many rows, and a month that went down: spent more than received, and prices fell.
const heavy: Dashboard = {
  netWorth: {
    portfolio: 128_450_000,
    debts: 23_400_000,
    changeThisMonth: -1_264_300,
    trend: [
      98_300_000, 99_150_000, 101_400_000, 100_900_000, 102_750_000,
      104_100_000, 103_600_000, 105_200_000, 106_050_000, 105_700_000,
      106_314_300, 105_050_000,
    ],
    pricesAsOf: "9 Nov",
  },
  month: {
    name: "November",
    received: 245_000,
    // The nine spending categories below add up to this.
    spent: 278_700,
    portfolioMoved: -1_230_600,
  },
  checks: [
    {
      id: "check-1",
      kind: "balance",
      name: "UBL Bachat Savings Account (joint with Ammi)",
      amount: 1_250_000,
      age: "3 weeks ago",
    },
    {
      id: "check-2",
      kind: "balance",
      name: "Cash in hand",
      amount: 12_000,
      age: "9 days ago",
    },
    {
      id: "check-3",
      kind: "stale",
      name: "10 marla house in DHA Phase 6, Lahore (half share with Bhai)",
      amount: 42_500_000,
      age: "7 months ago",
    },
    {
      id: "check-4",
      kind: "stale",
      name: "Plot in Bahria Town",
      amount: 3_000_000,
      age: "4 months ago",
    },
    {
      id: "check-5",
      kind: "stale",
      name: "Office committee",
      amount: 120_000,
      age: "2 months ago",
    },
    {
      id: "check-6",
      kind: "balance",
      name: "Easypaisa",
      amount: 1_975,
      age: "5 weeks ago",
    },
  ],
  spending: spendingByCategory(9),
  recent: entries(40),
};

export const scenarios = {
  default: { status: "ready", dashboard: typical },
  empty: { status: "ready", dashboard: firstUse },
  many: { status: "ready", dashboard: heavy },
  loading: { status: "loading" },
  error: {
    status: "error",
    message:
      "Your data is safe. Check your connection and try again in a moment.",
  },
} satisfies Scenarios<DashboardViewProps>;
