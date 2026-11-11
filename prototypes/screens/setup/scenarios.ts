// Setup: the wizard a new user goes through right after sign-up (J1 steps 2–6), ending on Home.
// A welcome, a board to tick what they have, then one question at a time about those only, and
// their net worth at the end. The place is in the URL (`?step=`). Features F07 and F08.
//
// Only the accounts step is a working form. Gold, stocks, property and debts are stand-ins that
// add sample data, until their forms are designed here (F09 to F12).
//
// Decided while finalizing, for the forms still to design:
// - A committee counts by turn. Before your turn, what you've paid in is in Portfolio. After it,
//   what's still to pay is in Debts. Its step asks whether your turn has come.
// - Foreign-currency accounts are their own feature, F13. Setup is PKR only until then.
// - A half-done setup shows in Home's Things to check: "Finish setting up: gold and debts left".
//
// Open questions: None.

import {
  accounts,
  type Account,
  type AccountKind,
} from "@proto/fixtures/accounts";
import { debts } from "@proto/fixtures/debts";
import {
  portfolioGroups,
  type PortfolioGroupKind,
} from "@proto/fixtures/portfolio";
import type { Scenarios } from "@proto/kit/scenarios";

/** The five things setup asks about, in order. */
export const GROUPS = [
  "accounts",
  "metals",
  "stocks",
  "property",
  "debts",
] as const;
export type SetupGroup = (typeof GROUPS)[number];

/** Where the user is in setup. Each variant maps it to its own screen. */
export type SetupPlace = "start" | SetupGroup | "done";

/** Something owned or owed that isn't an account. Its step is a stand-in in this build. */
export type ItemKind =
  "metals" | "stocks" | "property" | "loan" | "card" | "committee";

export interface SetupItem {
  id: string;
  kind: ItemKind;
  name: string;
  /** What it is worth today, or what is still owed, in whole rupees. */
  amount: number;
}

/** What the user can tick on the board. */
export type Thing = AccountKind | ItemKind;

/** An account as typed into the form, before it is saved. */
export interface AccountDraft {
  kind: AccountKind;
  name: string;
  /** Whole rupees. */
  balance: number;
}

export interface Setup {
  at: SetupPlace;
  accounts: readonly Account[];
  /** Gold, stocks, property and debts added so far. */
  items: readonly SetupItem[];
  /** Groups the user has answered, with something added or with "I don't have any". */
  answered: readonly SetupGroup[];
  /** What the user ticked on the board. */
  ticked: readonly Thing[];
  /** What each stand-in step adds when asked. */
  samples: readonly SetupItem[];
  /** An account whose save just failed. The form shows it again, with the error. */
  failedDraft: AccountDraft | null;
  /** True when the user comes back to a setup they left half-way. */
  resumed: boolean;
}

/** The View's props. Loading and error are states the View shows, so they are props too. */
export type SetupViewProps =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; setup: Setup };

const groups = portfolioGroups();
const worth = (kind: PortfolioGroupKind) =>
  groups.find((group) => group.kind === kind)?.value ?? 0;

const debtItems = (count: number): SetupItem[] =>
  debts(count).map((debt) => ({
    id: debt.id,
    kind: debt.kind,
    name: debt.name,
    amount: debt.owed,
  }));

const gold: SetupItem = {
  id: "item-gold",
  kind: "metals",
  name: "Gold jewellery, 2 tola",
  amount: worth("metals"),
};

// The same values Home's Portfolio uses, so a finished setup adds up to Home's net worth.
const samples: SetupItem[] = [
  gold,
  {
    id: "item-stocks",
    kind: "stocks",
    name: "PSX stocks and funds",
    amount: worth("stocks"),
  },
  {
    id: "item-plot",
    kind: "property",
    name: "Plot in Bahria Town",
    amount: worth("property"),
  },
  ...debtItems(3),
];

const EVERYTHING: Thing[] = [
  "bank",
  "wallet",
  "cash",
  "metals",
  "stocks",
  "property",
  "loan",
  "card",
  "committee",
];

// Just signed up: the welcome, then the board with "Bank account" ticked, as the persona's salary
// lands in one.
const fresh: Setup = {
  at: "start",
  accounts: [],
  items: [],
  answered: [],
  ticked: ["bank"],
  samples,
  failedDraft: null,
  resumed: false,
};

// A salaried investor part-way through the first step: the salary account and a wallet are in.
const typical: Setup = {
  ...fresh,
  at: "accounts",
  accounts: accounts(2),
  ticked: ["bank", "wallet", "metals", "card"],
};

// Many accounts, long names and a crore-sized total, back on the accounts step to add more.
const heavy: Setup = {
  ...fresh,
  at: "accounts",
  accounts: accounts(12),
  items: [
    {
      id: "item-gold",
      kind: "metals",
      name: "Gold jewellery, 12 tola (wedding set, kept at Ammi's)",
      amount: 5_472_000,
    },
    {
      id: "item-silver",
      kind: "metals",
      name: "Silver, 40 tola",
      amount: 328_000,
    },
    {
      id: "item-stocks",
      kind: "stocks",
      name: "PSX stocks and funds",
      amount: 6_850_300,
    },
    {
      id: "item-house",
      kind: "property",
      name: "10 marla house in DHA Phase 6, Lahore (half share with Bhai)",
      amount: 42_500_000,
    },
    {
      id: "item-plot",
      kind: "property",
      name: "Plot in Bahria Town",
      amount: 3_000_000,
    },
    ...debtItems(4),
  ],
  answered: [...GROUPS],
  ticked: EVERYTHING,
};

// Left after gold and came back another day.
const halfWay: Setup = {
  ...fresh,
  at: "stocks",
  accounts: accounts(3),
  items: [gold],
  answered: ["accounts", "metals"],
  ticked: ["bank", "wallet", "metals", "stocks", "card"],
  resumed: true,
};

// Everything answered: the finish, with the same total as Home.
const finished: Setup = {
  ...fresh,
  at: "done",
  accounts: accounts(5),
  items: samples,
  answered: [...GROUPS],
  ticked: EVERYTHING,
};

export const scenarios = {
  default: { status: "ready", setup: typical },
  empty: { status: "ready", setup: fresh },
  many: { status: "ready", setup: heavy },
  partial: { status: "ready", setup: halfWay },
  done: { status: "ready", setup: finished },
  "save-error": {
    status: "ready",
    setup: {
      ...typical,
      failedDraft: { kind: "bank", name: "HBL Current", balance: 82_150 },
    },
  },
  loading: { status: "loading" },
  error: {
    status: "error",
    message:
      "What you added is safe. Check your connection and try again in a moment.",
  },
} satisfies Scenarios<SetupViewProps>;
