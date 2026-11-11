import type { Account } from "@proto/fixtures/accounts";
import type { Debt, DebtKind } from "@proto/fixtures/debts";

/**
 * Where money comes from or goes to: an account, which has a balance, or a debt (a credit card, a
 * loan or a committee), which has an amount still owed.
 */
export interface Place {
  id: string;
  name: string;
  /** An account's balance, or what is still owed on a debt, in whole rupees. */
  amount: number;
  /** The debt's kind. Null for an account. */
  debt: DebtKind | null;
}

/** Accounts first, then debts, each in the order given. */
export function toPlaces(
  accounts: readonly Account[],
  debts: readonly Debt[],
): Place[] {
  return [
    ...accounts.map(({ id, name, balance }) => ({
      id,
      name,
      amount: balance,
      debt: null,
    })),
    ...debts.map(({ id, name, kind, owed }) => ({
      id,
      name,
      amount: owed,
      debt: kind,
    })),
  ];
}
