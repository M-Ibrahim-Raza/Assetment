import type { Account } from "@proto/fixtures/accounts";
import type { Debt } from "@proto/fixtures/debts";
import type { CategorySpend, Entry } from "@proto/fixtures/entries";
import type { Dashboard } from "@proto/screens/dashboard/scenarios";
import type { Place } from "./places";

/** An entry saved in Quick add, with the accounts or debts it moved money between. */
export interface SavedEntry {
  entry: Entry;
  /** The id of the account or credit card the money left, or the account it landed in for income. */
  account: string;
  /** The id of the account or debt moved money went to. Empty otherwise. */
  toAccount: string;
  /** True when the money left a credit card: spending on the card. */
  fromDebt: boolean;
  /** True when moved money went to a debt: paying a card bill, an instalment or a committee. */
  toDebt: boolean;
}

/**
 * How far an entry moves what is owned and what is owed. Spending on a card adds to what is owed.
 * Paying a debt lowers both, so net worth stays where it was.
 */
function moves({ entry, fromDebt, toDebt }: SavedEntry): {
  owned: number;
  owed: number;
} {
  switch (entry.kind) {
    case "expense":
      return fromDebt
        ? { owned: 0, owed: entry.amount }
        : { owned: -entry.amount, owed: 0 };
    case "income":
      return { owned: entry.amount, owed: 0 };
    case "transfer":
      return toDebt
        ? { owned: -entry.amount, owed: -entry.amount }
        : { owned: 0, owed: 0 };
  }
}

function withSpend(
  spending: readonly CategorySpend[],
  entry: Entry,
): CategorySpend[] {
  if (spending.some((category) => category.name === entry.category)) {
    return spending.map((category) =>
      category.name === entry.category
        ? { ...category, spent: category.spent + entry.amount }
        : category,
    );
  }
  return [
    ...spending,
    { name: entry.category, spent: entry.amount, lastMonth: 0 },
  ];
}

/** Home's data after one more entry: it shows first in Latest, and the month and net worth move. */
export function applyEntry(dashboard: Dashboard, saved: SavedEntry): Dashboard {
  const { entry } = saved;
  const { owned, owed } = moves(saved);
  const change = owned - owed;
  const { netWorth, month } = dashboard;

  return {
    ...dashboard,
    netWorth: {
      ...netWorth,
      portfolio: netWorth.portfolio + owned,
      debts: netWorth.debts + owed,
      changeThisMonth: netWorth.changeThisMonth + change,
      trend: netWorth.trend.map((value, index) =>
        index === netWorth.trend.length - 1 ? value + change : value,
      ),
    },
    month: {
      ...month,
      received: month.received + (entry.kind === "income" ? entry.amount : 0),
      spent: month.spent + (entry.kind === "expense" ? entry.amount : 0),
    },
    spending:
      entry.kind === "expense"
        ? withSpend(dashboard.spending, entry)
        : dashboard.spending,
    recent: [entry, ...dashboard.recent],
  };
}

/**
 * How far one saved entry moves the account or debt with this id. Money leaving an account lowers
 * its balance. Spending on a card adds to what is owed on it, and a payment lowers it.
 */
function changeFor(
  id: string,
  debt: boolean,
  { entry, account: from, toAccount }: SavedEntry,
): number {
  if (id === from) {
    if (debt) return entry.amount;
    return entry.kind === "income" ? entry.amount : -entry.amount;
  }
  if (id === toAccount) return debt ? -entry.amount : entry.amount;
  return 0;
}

/** The accounts with their balances after the saved entries. */
export function applyToAccounts(
  accounts: readonly Account[],
  saved: readonly SavedEntry[],
): Account[] {
  return accounts.map((account) => ({
    ...account,
    balance: saved.reduce(
      (balance, row) => balance + changeFor(account.id, false, row),
      account.balance,
    ),
  }));
}

/** The debts with what is owed after the saved entries. */
export function applyToDebts(
  debts: readonly Debt[],
  saved: readonly SavedEntry[],
): Debt[] {
  return debts.map((debt) => ({
    ...debt,
    owed: saved.reduce(
      (owed, row) => owed + changeFor(debt.id, true, row),
      debt.owed,
    ),
  }));
}

/** What an account or debt holds after one more saved entry. */
export function placeAfter(place: Place, saved: SavedEntry): number {
  return place.amount + changeFor(place.id, place.debt !== null, saved);
}
