import { EVERY_LABEL, formatMonth } from "@proto/components/property/value";
import {
  type CardPlan,
  type CommitteePlan,
  DEBTS_TODAY,
  type DebtPlan,
  type FixedInstalment,
} from "@proto/fixtures/debt-plans";
import type { LentPlan } from "@proto/fixtures/lent";
import { formatPkr } from "@proto/kit/format";

// The sums and words the debts and money lent forms share (docs/money-model.md). Pure, so Setup's
// scenarios can use them too.

/** This month, "2026-11". */
export const THIS_MONTH = DEBTS_TODAY.slice(0, 7);
const TODAY_DAY = Number(DEBTS_TODAY.slice(8, 10));

const indexOf = (month: string): number => {
  const [year = "0", number = "1"] = month.split("-");
  return Number(year) * 12 + Number(number) - 1;
};

const monthAt = (index: number): string =>
  `${String(Math.floor(index / 12))}-${String((index % 12) + 1).padStart(2, "0")}`;

/** The month `count` months after `month`. */
export const addMonths = (month: string, count: number): string =>
  monthAt(indexOf(month) + count);

/** Whole months from `from` to `to`. Negative when `to` is earlier. */
export const monthsBetween = (from: string, to: string): number =>
  indexOf(to) - indexOf(from);

/** "Jan 2027", with a no-break space. */
export { formatMonth };

/** "1st", "2nd", "3rd", "12th", "21st". */
export function ordinal(day: number): string {
  const tens = day % 100;
  if (tens >= 11 && tens <= 13) return `${String(day)}th`;
  const end = ["th", "st", "nd", "rd"][day % 10] ?? "th";
  return `${String(day)}${end}`;
}

// Committees

/** What the user gets on their turn: everyone's monthly amount. */
export const potOf = ({
  members,
  monthly,
}: Pick<CommitteePlan, "members" | "monthly">): number => members * monthly;

/** What the user has paid in so far. */
const paidInOf = ({
  paid,
  monthly,
}: Pick<CommitteePlan, "paid" | "monthly">): number => paid * monthly;

/** What the user still has to pay in: the turns left. */
export const stillToPayOf = ({
  members,
  paid,
  monthly,
}: Pick<CommitteePlan, "members" | "paid" | "monthly">): number =>
  Math.max(members - paid, 0) * monthly;

/** The month of the last payment. */
export const endOf = ({
  start,
  members,
}: Pick<CommitteePlan, "start" | "members">): string =>
  addMonths(start, members - 1);

/** The month a turn falls in. Turn 1 is the start month. */
export const turnMonth = (start: string, turn: number): string =>
  addMonths(start, turn - 1);

/** Turns paid to start with: the months since the start month, as many as there are turns. */
export function startingPaid(start: string, members: number): number {
  return Math.min(Math.max(monthsBetween(start, THIS_MONTH), 0), members);
}

/**
 * What a committee counts at. Before the user's turn, what they've paid in, which is owned. After
 * it, the turns left, which is owed. Net worth stays the same across the whole committee.
 */
export const committeeAmount = (plan: CommitteePlan): number =>
  plan.hadTurn ? stillToPayOf(plan) : paidInOf(plan);

// Loans

/** How many months apart its instalments are. */
export const stepOf = (fixed: Pick<FixedInstalment, "every">): number =>
  fixed.every === "quarter" ? 3 : 1;

/** Everything still to pay: the instalment times the instalments left. */
export const leftToPayOf = (
  fixed: Pick<FixedInstalment, "amount" | "left">,
): number => fixed.amount * fixed.left;

/** The month the next instalment is due. A monthly one is due this month until its day has passed. */
export function nextDue(
  fixed: Pick<FixedInstalment, "every" | "day" | "next">,
): string | null {
  if (fixed.every === "quarter") return fixed.next;
  return fixed.day > TODAY_DAY ? THIS_MONTH : addMonths(THIS_MONTH, 1);
}

/** The month of the last instalment. Null until the next one's month is known. */
export function lastDue(
  fixed: Pick<FixedInstalment, "every" | "day" | "next" | "left">,
): string | null {
  const next = nextDue(fixed);
  return next === null
    ? null
    : addMonths(next, (fixed.left - 1) * stepOf(fixed));
}

/**
 * The markup rate a year that makes the instalments pay off what's owed. The user never types a
 * rate: it's worked out from what's owed, the instalment and how many are left. Null when the
 * instalments come to less than what's owed.
 */
export function yearlyRate(
  owed: number,
  fixed: Pick<FixedInstalment, "amount" | "left" | "every">,
): number | null {
  const total = leftToPayOf(fixed);
  if (owed <= 0 || fixed.left <= 0 || total < owed) return null;
  if (total === owed) return 0;
  // What the instalments are worth today at a rate a period. It falls as the rate rises.
  const worth = (rate: number) =>
    (fixed.amount * (1 - (1 + rate) ** -fixed.left)) / rate;
  let low = 1e-9;
  let high = 1;
  for (let step = 0; step < 60; step += 1) {
    const middle = (low + high) / 2;
    if (worth(middle) > owed) low = middle;
    else high = middle;
  }
  return ((low + high) / 2) * (12 / stepOf(fixed));
}

/** "about 11% a year", or "no markup". */
export function rateText(rate: number): string {
  if (rate === 0) return "no markup";
  const percent = rate * 100;
  return `about ${String(percent < 10 ? Math.round(percent * 10) / 10 : Math.round(percent))}% a year`;
}

// Cards

/** What's left to spend before the limit. Below zero when it's over. */
export const leftOnCard = ({
  owed,
  limit,
}: Pick<CardPlan, "owed" | "limit">): number => limit - owed;

// Every debt

/** What a debt counts at: what's owed, or a committee's amount for where it stands. */
export function amountOf(plan: DebtPlan): number {
  switch (plan.kind) {
    case "loan":
    case "card":
      return plan.owed;
    case "committee":
      return committeeAmount(plan);
  }
}

/** True for a committee before the user's turn: it's owned, so it counts in Portfolio. */
export const isOwned = (plan: DebtPlan): boolean =>
  plan.kind === "committee" && !plan.hadTurn;

/** "Rs 38,500 a month", "Rs 150,000 every 3 months". */
function instalmentText(
  fixed: Pick<FixedInstalment, "amount" | "every">,
): string {
  return fixed.every === "quarter"
    ? `${formatPkr(fixed.amount)} ${EVERY_LABEL.quarter.toLowerCase()}`
    : `${formatPkr(fixed.amount)} a month`;
}

/** The line under a saved debt's name, saying where it stands. */
export function debtLine(plan: DebtPlan): string {
  switch (plan.kind) {
    case "loan": {
      if (plan.fixed === null) {
        return plan.repayBy === null
          ? "No fixed instalment"
          : `No fixed instalment · repay by ${formatMonth(plan.repayBy)}`;
      }
      const last = lastDue(plan.fixed);
      return [
        instalmentText(plan.fixed),
        `${String(plan.fixed.left)} left`,
        last === null ? null : `ends ${formatMonth(last)}`,
      ]
        .filter((part) => part !== null)
        .join(" · ");
    }
    case "card":
      return `Bill due on the ${ordinal(plan.dueDay)} · ${formatPkr(Math.max(leftOnCard(plan), 0))} left of ${formatPkr(plan.limit)}`;
    case "committee": {
      const turns = `${String(plan.paid)} of ${String(plan.members)} turns paid`;
      if (!plan.hadTurn) return `${turns} · your turn to come`;
      const had =
        plan.turn === null ? "Had your turn" : `Had turn ${String(plan.turn)}`;
      return `${had} · ${turns}`;
    }
  }
}

// Money lent

/** What the app calls it: "Lent to Ali bhai". */
export const lentName = (to: string): string => `Lent to ${to.trim()}`;

/** The line under a person's name: "Back by Mar 2027", or nothing set. */
export const lentLine = ({ backBy }: Pick<LentPlan, "backBy">): string =>
  backBy === null ? "No date set" : `Back by ${formatMonth(backBy)}`;
