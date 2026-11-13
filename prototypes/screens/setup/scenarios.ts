// Setup: the wizard a new user goes through right after sign-up (J1 steps 2–6), ending on Home.
// A welcome, a board to tick what they have, then one question at a time about those only, and
// their net worth at the end. The place is in the URL (`?step=`). Features F07 and F08.
//
// The accounts step and the gold and silver step are working forms. Stocks, property and debts are
// stand-ins that add sample data, until their forms are designed here (F10 to F12).
//
// F09, gold and silver by weight: "Add a piece" (it was variant d) won over Jeweller's slip, One at a
// time and Piece by piece (prototypes/components/metals/). The `gold-` scenarios open on its step.
// - One panel holds everything about a piece, open for the first one: name, gold or silver,
//   jewellery or a bar or coin (21K and 24K at first), karat, and the weight in tola, masha and
//   ratti, or grams. Today's value shows under the weight as it's typed.
// - "I don't know the exact weight" opens a pop-up that asks for the exact weight first. A rough
//   weight is the quieter way out: marked ≈, counted, and a Things to check reminder.
// - When it was bought: the month and year (both or neither, with Today), then the price paid.
//   The month's average Sarafa rate shows as the price is typed. A price under half or over 3
//   times that gets a warning that never blocks saving.
// - A deduction per piece, for jewellery only, starting at the last % typed.
// - A summary: today's value, the cost (the price paid, or ≈ from the month's rate), and the
//   profit or loss as of today. Saved pieces are rows with a total, and a row opens in place.
//
// Decided while finalizing, for the forms still to design:
// - A committee counts by turn. Before your turn, what you've paid in is in Portfolio. After it,
//   what's still to pay is in Debts. Its step asks whether your turn has come.
// - Foreign-currency accounts are their own feature, F13. Setup is PKR only until then.
// - A half-done setup shows in Home's Things to check: "Finish setting up: gold and debts left".
//
// Decided while finalizing F09 (handoff: specs/F09-gold-and-silver-by-weight/handoff.md):
// - The typical weights for a rough guess stay, and get checked with a jeweller before launch.
// - The last deduction % and the last unit are saved on the user's account.
// - The ≈ reminder ("Get your wedding set weighed") is F03's item, built with Home's Things to check.
// - With no rate at all, a piece saves by weight and is priced once the rate is in.
// - Silver has one rate, as pure.
// - The rate source, its daily refresh and how far back past rates go are for the spec and an ADR.
//   A month uses its average rate.
// - With no price and no date, profit counts from the day it's added: the cost is its value that
//   day, after any deduction, so it starts at Rs 0.
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
import { valueOf } from "@proto/components/metals/weight";
import {
  metalPieces,
  metalRates,
  staleMetalRates,
  type MetalPiece,
  type MetalRates,
} from "@proto/fixtures/metals";
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
  /** Gold and silver only: the piece by weight. Its amount is its value at the day's rate. */
  piece?: MetalPiece;
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
  /** The day's Sarafa rates, per tola. */
  metalRates: MetalRates;
  /** The user's buy-back deduction on jewellery, as a share: 0.1 is 10%. 0 is the full rate. */
  metalDeduction: number;
  /** A gold or silver piece whose save failed, or is still saving. Its form shows it again. */
  metalsDraft: { piece: MetalPiece; status: "failed" | "saving" } | null;
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

/** A piece as a setup item, worth its weight at the given rates. */
const pieceItem = (
  piece: MetalPiece,
  rates: MetalRates = metalRates,
  deduction = 0,
): SetupItem => ({
  id: piece.id,
  kind: "metals",
  name: piece.name,
  amount: valueOf(piece, rates, deduction),
  piece,
});

// 2 tola of 22K at today's rate is Rs 912,000, and it cost what Home's Portfolio says it did.
const gold = pieceItem({
  id: "item-gold",
  metal: "gold",
  form: "jewellery",
  name: "Gold jewellery",
  karat: "22K",
  tola: 2,
  unit: "tola",
  estimated: false,
  paid: groups.find((group) => group.kind === "metals")?.cost ?? null,
  cut: null,
  bought: "2023-04",
});

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
  metalRates,
  metalDeduction: 0,
  metalsDraft: null,
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
    ...metalPieces(3).map((piece) => pieceItem(piece)),
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

// The gold and silver step, for comparing its forms. Typical's accounts are in, and the bar shows
// Accounts, Gold and silver, and Debts.
const onGold: Setup = { ...typical, at: "metals" };
const twoPieces = metalPieces(2).map((piece) => pieceItem(piece));

// Bangles of 2 tola 4 masha, typed in full, whose save didn't go through.
const bangles: MetalPiece = {
  id: "metal-draft",
  metal: "gold",
  form: "jewellery",
  name: "Bangles",
  karat: "21K",
  tola: 2 + 4 / 12,
  unit: "tola",
  estimated: false,
  paid: 980_000,
  cut: null,
  bought: "2025-08",
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
  gold: { status: "ready", setup: { ...onGold, items: twoPieces } },
  "gold-empty": { status: "ready", setup: onGold },
  "gold-many": {
    status: "ready",
    setup: {
      ...onGold,
      items: metalPieces(8).map((piece) => pieceItem(piece, metalRates, 0.1)),
      metalDeduction: 0.1,
    },
  },
  "gold-save-error": {
    status: "ready",
    setup: {
      ...onGold,
      items: twoPieces,
      metalsDraft: { piece: bangles, status: "failed" },
    },
  },
  "gold-saving": {
    status: "ready",
    setup: {
      ...onGold,
      items: twoPieces,
      metalsDraft: { piece: bangles, status: "saving" },
    },
  },
  "gold-stale-price": {
    status: "ready",
    setup: {
      ...onGold,
      items: metalPieces(2).map((piece) => pieceItem(piece, staleMetalRates)),
      metalRates: staleMetalRates,
    },
  },
  error: {
    status: "error",
    message:
      "What you added is safe. Check your connection and try again in a moment.",
  },
} satisfies Scenarios<SetupViewProps>;
