"use client";

import { useState } from "react";
import type { Account } from "@proto/fixtures/accounts";
import type { DebtPlan } from "@proto/fixtures/debt-plans";
import type { LentPlan } from "@proto/fixtures/lent";
import type { InstalmentEvery } from "@proto/fixtures/property";
import { formatPkr } from "@proto/kit/format";
import { useProtoAction } from "@proto/kit/use-proto-action";
import type { DebtKind, DebtRow } from "./forms";
import {
  addMonths,
  leftToPayOf,
  monthsBetween,
  nextDue,
  startingPaid,
  stepOf,
  THIS_MONTH,
} from "./plan";

// A debt as it's being typed: every field as text, so a half-typed form survives a failed save.

export type YesNo = "yes" | "no" | "";

/** A month as its two menus show it: "1" to "12", and "2026". Either may be empty. */
export interface MonthParts {
  month: string;
  year: string;
}

/** The kinds of loan the "start with its kind" idea offers. */
export type LoanKind = "car" | "home" | "personal" | "family" | "other";

export interface DebtFields {
  /** Null while it's a new debt. */
  id: string | null;
  kind: DebtKind;
  name: string;
  /** A loan's or card's balance today, as digits. */
  owed: string;
  // A loan.
  fixed: YesNo;
  instalment: string;
  left: string;
  every: InstalmentEvery;
  /** The day of the month it's paid, "1" to "31". */
  day: string;
  /** Every 3 months only: when the next one is due. */
  next: MonthParts;
  /** An account's id. Empty when there's none. */
  paidFrom: string;
  repayBy: MonthParts;
  // ProtoBar ideas for a loan (components/debts/options.ts).
  /** The kind of loan, when it's asked first. Empty until picked. */
  loanKind: LoanKind | "";
  /** The bank a bank chip picked, e.g. "Meezan". Empty when none. */
  bank: string;
  /** The name the kind and bank chips last filled in, so a name the user typed is kept. */
  autoName: string;
  /** Instalments left as a count, or as the month of the last one. */
  leftBy: "count" | "last";
  last: MonthParts;
  // A card.
  dueDay: string;
  limit: string;
  // A committee.
  monthly: string;
  members: string;
  start: MonthParts;
  paid: string;
  /** True once the user changed turns paid, so a new start month no longer resets it. */
  paidTyped: boolean;
  hadTurn: YesNo;
  turn: string;
}

export type DebtField =
  | "name"
  | "owed"
  | "fixed"
  | "instalment"
  | "left"
  | "last"
  | "day"
  | "next"
  | "paidFrom"
  | "repayBy"
  | "dueDay"
  | "limit"
  | "monthly"
  | "members"
  | "start"
  | "paid"
  | "hadTurn"
  | "turn";

/** The fields each kind asks, in order, so the first one with an error takes focus. */
export const FIELDS_OF: Readonly<Record<DebtKind, readonly DebtField[]>> = {
  loan: [
    "name",
    "owed",
    "fixed",
    "instalment",
    "left",
    "last",
    "day",
    "next",
    "paidFrom",
    "repayBy",
  ],
  card: ["name", "owed", "dueDay", "limit"],
  committee: ["name", "monthly", "members", "start", "paid", "hadTurn", "turn"],
};

/** The id of a field inside a form, so the form can move focus there. */
export const fieldId = (
  base: string,
  field: DebtField | "to" | "amount" | "backBy",
) => `${base}-${field}`;

const EMPTY_MONTH: MonthParts = { month: "", year: "" };

/** "2026-03", or null unless both are picked. */
export function monthOf({ month, year }: MonthParts): string | null {
  if (month === "" || year === "") return null;
  return `${year}-${month.padStart(2, "0")}`;
}

export function partsOfMonth(month: string | null): MonthParts {
  if (month === null) return EMPTY_MONTH;
  const [year = "", number = ""] = month.split("-");
  return { month: number === "" ? "" : String(Number(number)), year };
}

/** Digits from what was typed, at most `max` of them. */
export function digitsIn(text: string, max: number): string {
  return text
    .replaceAll(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, max);
}

const numberOf = (digits: string): number | null =>
  digits === "" ? null : Number(digits);

/**
 * The account a new loan is paid from: the last one picked, else the first bank added, which is
 * usually where the salary lands. Empty with no accounts.
 */
export function defaultPaidFrom(
  accounts: readonly Account[],
  rows: readonly DebtRow[],
): string {
  const last = rows.findLast(
    (row) => row.plan?.kind === "loan" && row.plan.fixed?.paidFrom != null,
  )?.plan;
  const lastId = last?.kind === "loan" ? (last.fixed?.paidFrom ?? null) : null;
  if (lastId !== null && accounts.some((account) => account.id === lastId)) {
    return lastId;
  }
  return (
    accounts.find((account) => account.kind === "bank")?.id ??
    accounts[0]?.id ??
    ""
  );
}

/** A new debt of a kind, with nothing typed. */
export function freshFields(kind: DebtKind, paidFrom: string): DebtFields {
  return {
    id: null,
    kind,
    name: "",
    owed: "",
    fixed: "",
    instalment: "",
    left: "",
    every: "month",
    day: "",
    next: EMPTY_MONTH,
    paidFrom,
    repayBy: EMPTY_MONTH,
    loanKind: "",
    bank: "",
    autoName: "",
    leftBy: "count",
    last: EMPTY_MONTH,
    dueDay: "",
    limit: "",
    monthly: "",
    members: "",
    start: EMPTY_MONTH,
    paid: "",
    paidTyped: false,
    hadTurn: "",
    turn: "",
  };
}

/** A saved debt back as the fields its form shows. */
export function fieldsOfPlan(plan: DebtPlan, paidFrom: string): DebtFields {
  const fields = {
    ...freshFields(plan.kind, paidFrom),
    id: plan.id,
    name: plan.name,
  };
  switch (plan.kind) {
    case "loan":
      return {
        ...fields,
        owed: String(plan.owed),
        fixed: plan.fixed === null ? "no" : "yes",
        instalment: plan.fixed === null ? "" : String(plan.fixed.amount),
        left: plan.fixed === null ? "" : String(plan.fixed.left),
        every: plan.fixed?.every ?? "month",
        day: plan.fixed === null ? "" : String(plan.fixed.day),
        next: partsOfMonth(plan.fixed?.next ?? null),
        paidFrom: plan.fixed?.paidFrom ?? paidFrom,
        repayBy: partsOfMonth(plan.repayBy),
      };
    case "card":
      return {
        ...fields,
        owed: String(plan.owed),
        dueDay: String(plan.dueDay),
        limit: String(plan.limit),
      };
    case "committee":
      return {
        ...fields,
        monthly: String(plan.monthly),
        members: String(plan.members),
        start: partsOfMonth(plan.start),
        paid: String(plan.paid),
        paidTyped: true,
        hadTurn: plan.hadTurn ? "yes" : "no",
        turn: plan.turn === null ? "" : String(plan.turn),
      };
  }
}

/** A saved row as the fields its form shows. An old sample has only its name and what's owed. */
export function fieldsOfRow(
  row: DebtRow,
  kind: DebtKind,
  paidFrom: string,
): DebtFields {
  if (row.plan !== null) return fieldsOfPlan(row.plan, paidFrom);
  return {
    ...freshFields(kind, paidFrom),
    id: row.id,
    name: row.name,
    owed: kind === "committee" ? "" : String(row.amount),
  };
}

/** A debt's fields and their setter. A committee's turns paid follow its start until typed. */
export function useDebtFields(initial: DebtFields) {
  const [fields, setFields] = useState(initial);
  const set = (patch: Partial<DebtFields>) => {
    setFields((current) => {
      const next = { ...current, ...patch };
      if (patch.paid !== undefined) return { ...next, paidTyped: true };
      const start = monthOf(next.start);
      const members = numberOf(next.members);
      if (next.paidTyped || start === null || members === null) return next;
      return { ...next, paid: String(startingPaid(start, members)) };
    });
  };
  return { fields, set };
}

/**
 * Instalments left from the month of the last one: the months from the next one to it, in steps of
 * how often they're due, counting both. Null until both months are known. Zero when it's before.
 */
function leftFromLast(fields: DebtFields): number | null {
  const last = monthOf(fields.last);
  const next = nextDue({
    every: fields.every,
    day: numberOf(fields.day) ?? 0,
    next: monthOf(fields.next),
  });
  if (last === null || next === null) return null;
  const months = monthsBetween(next, last);
  return months < 0 ? 0 : Math.floor(months / stepOf(fields)) + 1;
}

/** The numbers typed so far, for the sums that show as the user types. */
export function numbersOf(fields: DebtFields) {
  return {
    owed: numberOf(fields.owed),
    instalment: numberOf(fields.instalment),
    left:
      fields.leftBy === "last" ? leftFromLast(fields) : numberOf(fields.left),
    day: numberOf(fields.day),
    dueDay: numberOf(fields.dueDay),
    limit: numberOf(fields.limit),
    monthly: numberOf(fields.monthly),
    members: numberOf(fields.members),
    paid: numberOf(fields.paid),
    turn: numberOf(fields.turn),
    next: monthOf(fields.next),
    repayBy: monthOf(fields.repayBy),
    start: monthOf(fields.start),
  };
}

/** What's wrong with a month: half picked, or before this month when it can't be. */
function monthError(
  parts: MonthParts,
  { required, future }: { required: string | null; future: boolean },
): string | null {
  if (parts.month === "" && parts.year === "") return required;
  if (parts.year === "") return "Pick the year too.";
  if (parts.month === "") return "Pick the month too.";
  const month = monthOf(parts);
  if (future && month !== null && month < THIS_MONTH) {
    return "That's before this month.";
  }
  return null;
}

/** What's wrong with each field, in plain words. Only the fields this kind asks are checked. */
export function debtErrors(
  fields: DebtFields,
): Partial<Record<DebtField, string>> {
  const n = numbersOf(fields);
  const errors: Partial<Record<DebtField, string | null>> = {
    name: fields.name.trim() === "" ? "Give it a name." : null,
  };
  switch (fields.kind) {
    case "loan": {
      errors.owed =
        n.owed === null || n.owed === 0 ? "Enter what you owe today." : null;
      errors.fixed = fields.fixed === "" ? "Pick Yes or No." : null;
      if (fields.fixed === "yes") {
        errors.instalment =
          n.instalment === null || n.instalment === 0
            ? "Enter the instalment."
            : null;
        const short =
          n.owed !== null &&
          n.instalment !== null &&
          n.left !== null &&
          n.left > 0 &&
          leftToPayOf({ amount: n.instalment, left: n.left }) < n.owed
            ? `${String(n.left)} instalments of ${formatPkr(n.instalment)} come to less than you owe. Check both.`
            : null;
        if (fields.leftBy === "last") {
          errors.last =
            monthError(fields.last, {
              required: "Pick the month of the last one.",
              future: true,
            }) ?? (n.left === 0 ? "That's before the next one is due." : short);
        } else {
          errors.left =
            n.left === null || n.left === 0
              ? "Enter how many are left."
              : short;
        }
        errors.day = fields.day === "" ? "Pick the day it's paid." : null;
        if (fields.every === "quarter") {
          errors.next = monthError(fields.next, {
            required: "Pick the month the next one is due.",
            future: true,
          });
        }
      } else if (fields.fixed === "no") {
        errors.repayBy = monthError(fields.repayBy, {
          required: null,
          future: true,
        });
      }
      break;
    }
    case "card":
      errors.owed =
        n.owed === null
          ? "Enter what you owe on it today. Rs 0 is fine."
          : null;
      errors.dueDay =
        fields.dueDay === "" ? "Pick the day the bill is due." : null;
      errors.limit =
        n.limit === null || n.limit === 0
          ? "Enter the card's limit. It's on your statement."
          : null;
      break;
    case "committee": {
      errors.monthly =
        n.monthly === null || n.monthly === 0
          ? "Enter what you pay each month."
          : null;
      errors.members =
        n.members === null
          ? "Enter how many people are in it."
          : n.members < 2
            ? "A committee needs at least 2 people."
            : null;
      const start = n.start;
      errors.start =
        monthError(fields.start, {
          required: "Pick the month it started.",
          future: false,
        }) ??
        (start !== null && monthsBetween(THIS_MONTH, start) > 12
          ? "That's more than a year away."
          : null);
      errors.paid =
        n.paid === null
          ? "Enter how many turns you've paid."
          : n.members !== null && n.paid > n.members
            ? `There are only ${String(n.members)} turns.`
            : null;
      errors.hadTurn =
        fields.hadTurn === ""
          ? "Pick Yes or Not yet."
          : fields.hadTurn === "no" &&
              n.members !== null &&
              n.paid === n.members
            ? `All ${String(n.members)} turns are paid, so your turn has come.`
            : null;
      errors.turn =
        n.turn === null || n.members === null
          ? null
          : n.turn < 1 || n.turn > n.members
            ? `Turns go from 1 to ${String(n.members)}.`
            : fields.hadTurn === "yes" && n.paid !== null && n.turn > n.paid
              ? `Turn ${String(n.turn)} comes after the ${String(n.paid)} you've paid.`
              : null;
      break;
    }
  }
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message != null),
  );
}

/** A word of warning that never blocks saving. */
export function debtWarning(fields: DebtFields): string | null {
  const n = numbersOf(fields);
  if (
    fields.kind === "card" &&
    n.owed !== null &&
    n.limit !== null &&
    n.limit > 0
  ) {
    return n.owed > n.limit
      ? "That's over the card's limit. It still saves."
      : null;
  }
  if (
    fields.kind === "committee" &&
    fields.hadTurn === "no" &&
    n.turn !== null &&
    n.paid !== null &&
    n.turn <= n.paid
  ) {
    return `Turn ${String(n.turn)} should have come by now. If you got the pot, pick Yes.`;
  }
  return null;
}

/** The first field with an error, in the order the form asks them. */
export function firstError(
  fields: DebtFields,
  errors: Partial<Record<DebtField, string>>,
): DebtField | null {
  return (
    FIELDS_OF[fields.kind].find((field) => errors[field] !== undefined) ?? null
  );
}

/** The fields as a plan to save. Call it only once they have no errors. */
export function planOf(fields: DebtFields): DebtPlan {
  const n = numbersOf(fields);
  const id = fields.id ?? crypto.randomUUID();
  const name = fields.name.trim();
  switch (fields.kind) {
    case "loan":
      return {
        kind: "loan",
        id,
        name,
        owed: n.owed ?? 0,
        fixed:
          fields.fixed === "yes"
            ? {
                amount: n.instalment ?? 0,
                left: n.left ?? 0,
                every: fields.every,
                day: n.day ?? 1,
                next: fields.every === "quarter" ? n.next : null,
                paidFrom: fields.paidFrom === "" ? null : fields.paidFrom,
              }
            : null,
        repayBy: fields.fixed === "no" ? n.repayBy : null,
      };
    case "card":
      return {
        kind: "card",
        id,
        name,
        owed: n.owed ?? 0,
        dueDay: n.dueDay ?? 1,
        limit: n.limit ?? 0,
      };
    case "committee":
      return {
        kind: "committee",
        id,
        name,
        monthly: n.monthly ?? 0,
        members: n.members ?? 0,
        start: n.start ?? THIS_MONTH,
        paid: n.paid ?? 0,
        hadTurn: fields.hadTurn === "yes",
        turn: n.turn,
      };
  }
}

/** The last month a "back by" or "repay by" menu offers. */
export const LAST_PLAN_YEAR = Number(
  addMonths(THIS_MONTH, 12 * 15).slice(0, 4),
);

// Money lent.

export interface LentFields {
  id: string | null;
  /** Who it's lent to: "Ali bhai". */
  to: string;
  amount: string;
  backBy: MonthParts;
}

export const freshLent = (): LentFields => ({
  id: null,
  to: "",
  amount: "",
  backBy: EMPTY_MONTH,
});

export const fieldsOfLent = (plan: LentPlan): LentFields => ({
  id: plan.id,
  to: plan.to,
  amount: String(plan.amount),
  backBy: partsOfMonth(plan.backBy),
});

export function lentErrors(
  fields: LentFields,
): Partial<Record<"to" | "amount" | "backBy", string>> {
  const amount = numberOf(fields.amount);
  const errors = {
    to: fields.to.trim() === "" ? "Enter who you lent it to." : null,
    amount:
      amount === null || amount === 0
        ? "Enter how much is still to come back."
        : null,
    backBy: monthError(fields.backBy, { required: null, future: true }),
  };
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== null),
  );
}

export const lentPlanOf = (fields: LentFields): LentPlan => ({
  id: fields.id ?? crypto.randomUUID(),
  to: fields.to.trim(),
  amount: Number(fields.amount),
  backBy: monthOf(fields.backBy),
});

/**
 * Saving in memory, after `?latency=slow`'s delay. A scenario's draft can start it as saving or
 * failed: a failed save keeps everything typed, and trying again goes through.
 */
export function useSave<Saved>(
  onSaved: (saved: Saved) => void,
  status: "failed" | "saving" | "open" | null,
) {
  const action = useProtoAction(onSaved);
  const [failed, setFailed] = useState(status === "failed");
  return {
    pending: action.pending || status === "saving",
    failed,
    run: (saved: Saved) => {
      setFailed(false);
      action.run(saved);
    },
  };
}
