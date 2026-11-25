import type { AccountKind } from "@proto/fixtures/accounts";
import type { ItemKind, SetupGroup, SetupItem, Thing } from "./scenarios";

// The words setup uses, so the same thing has the same name everywhere.

/** The short name of each group, for progress and tallies. */
export const GROUP_LABEL: Readonly<Record<SetupGroup, string>> = {
  accounts: "Accounts",
  metals: "Gold and silver",
  stocks: "Stocks and funds",
  property: "Property",
  lent: "Money lent",
  debts: "Debts",
};

/** One line under the question, saying what counts. */
export const GROUP_HELP: Readonly<Record<SetupGroup, string>> = {
  accounts: "Bank accounts, wallets and cash.",
  metals:
    "Jewellery, bars and coins. Enter the weight and we work out today's value.",
  stocks: "PSX shares and mutual funds, as buys.",
  property: "A house, a plot or a shop, at the value you give it.",
  lent: "Money family or friends will pay you back.",
  debts: "Loans, card balances and committees.",
};

/** The group an item belongs to. Loans, cards and committees are all debts. Money lent is owned. */
export const ITEM_GROUP: Readonly<Record<ItemKind, SetupGroup>> = {
  metals: "metals",
  shares: "stocks",
  funds: "stocks",
  property: "property",
  lent: "lent",
  loan: "debts",
  card: "debts",
  committee: "debts",
};

export const KIND_LABEL: Readonly<Record<AccountKind, string>> = {
  bank: "Bank",
  wallet: "Wallet",
  cash: "Cash",
};

/** Each thing on the board: its tile's name and line, and its name in the plural. */
export const THINGS: Readonly<
  Record<Thing, { label: string; plural: string; hint: string }>
> = {
  bank: {
    label: "Bank account",
    plural: "Bank accounts",
    hint: "Meezan, HBL, UBL…",
  },
  wallet: {
    label: "Mobile wallet",
    plural: "Mobile wallets",
    hint: "JazzCash, Easypaisa…",
  },
  cash: {
    label: "Cash in hand",
    plural: "Cash in hand",
    hint: "Notes at home or in your pocket",
  },
  metals: {
    label: "Gold or silver",
    plural: "Gold and silver",
    hint: "Jewellery, bars, coins",
  },
  shares: {
    label: "Shares or ETFs",
    plural: "Shares and ETFs",
    hint: "On PSX: Lucky, Meezan Bank…",
  },
  funds: {
    label: "Mutual funds",
    plural: "Mutual funds",
    hint: "Meezan, NBP, Mahaana…",
  },
  property: {
    label: "Property",
    plural: "Property",
    hint: "A house, a plot, a shop",
  },
  lent: {
    label: "Money lent",
    plural: "Money lent",
    hint: "To family or friends",
  },
  loan: {
    label: "Loan",
    plural: "Loans",
    hint: "From a bank or a person",
  },
  card: {
    label: "Credit card",
    plural: "Credit cards",
    hint: "The balance you owe on it",
  },
  committee: {
    label: "Committee",
    plural: "Committees",
    hint: "Turns you still have to pay",
  },
};

export const OWNED_THINGS: readonly Thing[] = [
  "bank",
  "wallet",
  "cash",
  "metals",
  "shares",
  "funds",
  "property",
  "lent",
];
export const OWED_THINGS: readonly Thing[] = ["loan", "card", "committee"];

const ACCOUNT_KINDS: readonly string[] = ["bank", "wallet", "cash"];

export const isAccountKind = (thing: string): thing is AccountKind =>
  ACCOUNT_KINDS.includes(thing);

/** True for what's owed. A committee before the user's turn is owned: it counts in Portfolio. */
export const isDebt = (item: SetupItem): boolean =>
  ITEM_GROUP[item.kind] === "debts" &&
  !(item.plan?.kind === "committee" && !item.plan.hadTurn);

/** The amounts of the given rows, added up. */
export const sum = (amounts: readonly number[]): number =>
  amounts.reduce((total, amount) => total + amount, 0);
