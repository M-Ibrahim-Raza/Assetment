import type { InstalmentEvery } from "@proto/fixtures/property";
import type { DebtRow } from "./forms";
import {
  debtLine,
  endOf,
  isOwned,
  lastDue,
  leftOnCard,
  leftToPayOf,
  nextDue,
  potOf,
  startingPaid,
  stillToPayOf,
  turnMonth,
  yearlyRate,
} from "./plan";
import { type DebtFields, numbersOf } from "./use-debt";

// What a debt adds up to, worked out from what's typed so far. Every variant shows these: the
// receipt in a, the labels on the drawing in b, and the answer sentence in c.

export type Sums =
  | {
      kind: "loan-fixed";
      owed: number;
      instalment: number;
      left: number;
      every: InstalmentEvery;
      leftToPay: number;
      /** Left to pay less what's owed. Zero for a loan with no markup. */
      markup: number;
      /** A year, as a share. Null when the instalments come to less than what's owed. */
      rate: number | null;
      next: string | null;
      last: string | null;
    }
  | { kind: "loan-open"; owed: number; repayBy: string | null }
  | {
      kind: "card";
      owed: number;
      limit: number;
      left: number;
      dueDay: number | null;
    }
  | {
      kind: "committee";
      monthly: number;
      members: number;
      pot: number;
      paid: number;
      paidIn: number;
      stillToPay: number;
      start: string;
      end: string;
      /** Null until the user says. */
      hadTurn: boolean | null;
      turn: number | null;
      /** The month of the user's turn, when it's known. */
      turnAt: string | null;
    };

/** The sums for what's typed, or null until there's enough to work them out. */
export function sumsOf(fields: DebtFields): Sums | null {
  const n = numbersOf(fields);
  switch (fields.kind) {
    case "loan": {
      if (n.owed === null || n.owed === 0) return null;
      if (fields.fixed === "no") {
        return { kind: "loan-open", owed: n.owed, repayBy: n.repayBy };
      }
      if (
        fields.fixed !== "yes" ||
        n.instalment === null ||
        n.instalment === 0 ||
        n.left === null ||
        n.left === 0
      ) {
        return null;
      }
      const fixed = {
        amount: n.instalment,
        left: n.left,
        every: fields.every,
        // Before the day is picked, the next one counts from next month.
        day: n.day ?? 0,
        next: n.next,
      };
      const leftToPay = leftToPayOf(fixed);
      return {
        kind: "loan-fixed",
        owed: n.owed,
        instalment: n.instalment,
        left: n.left,
        every: fields.every,
        leftToPay,
        markup: Math.max(leftToPay - n.owed, 0),
        rate: yearlyRate(n.owed, fixed),
        next: nextDue(fixed),
        last: lastDue(fixed),
      };
    }
    case "card":
      if (n.owed === null || n.limit === null || n.limit === 0) return null;
      return {
        kind: "card",
        owed: n.owed,
        limit: n.limit,
        left: leftOnCard({ owed: n.owed, limit: n.limit }),
        dueDay: n.dueDay,
      };
    case "committee": {
      if (
        n.monthly === null ||
        n.monthly === 0 ||
        n.members === null ||
        n.members < 2 ||
        n.start === null
      ) {
        return null;
      }
      const plan = {
        monthly: n.monthly,
        members: n.members,
        start: n.start,
        paid: Math.min(n.paid ?? startingPaid(n.start, n.members), n.members),
      };
      const turn =
        n.turn !== null && n.turn >= 1 && n.turn <= n.members ? n.turn : null;
      return {
        kind: "committee",
        ...plan,
        pot: potOf(plan),
        paidIn: plan.paid * plan.monthly,
        stillToPay: stillToPayOf(plan),
        end: endOf(plan),
        hadTurn: fields.hadTurn === "" ? null : fields.hadTurn === "yes",
        turn,
        turnAt: turn === null ? null : turnMonth(plan.start, turn),
      };
    }
  }
}

/** The line under a saved row's name. */
export function rowLine(row: DebtRow): string {
  if (row.fromProperty)
    return "Instalments on your property. Change them there.";
  if (row.plan === null) return "Owed today";
  return debtLine(row.plan);
}

/** A row's amount with its sign: owed is a minus, a committee before the turn a plus. */
export function signedAmount(row: DebtRow): number {
  return row.plan !== null && isOwned(row.plan) ? row.amount : -row.amount;
}

/** What the rows owe, and what committees before the turn have paid in, which is owned. */
export function totalsOf(rows: readonly DebtRow[]): {
  owed: number;
  owned: number;
} {
  return rows.reduce(
    (totals, row) =>
      row.plan !== null && isOwned(row.plan)
        ? { ...totals, owned: totals.owned + row.amount }
        : { ...totals, owed: totals.owed + row.amount },
    { owed: 0, owned: 0 },
  );
}
