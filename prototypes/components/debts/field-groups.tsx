"use client";

import { useState } from "react";
import { useProtoOption } from "@proto/kit/use-proto-option";
import { AmountField } from "@proto/screens/setup/amount-field";
import type { Account } from "@proto/fixtures/accounts";
import {
  CountField,
  DayField,
  EveryField,
  MonthField,
  PaidFromField,
  TextField,
  YesNoField,
} from "./parts";
import {
  AnswerCards,
  FoldedSchedule,
  LeftBySwitch,
  LiveSum,
  WhereToFind,
} from "./loan-ideas";
import {
  LOAN_ANSWERS,
  LOAN_FOLD,
  LOAN_HELP,
  LOAN_LEFT,
  LOAN_LIVE,
  LOAN_TIGHT,
} from "./options";
import { THIS_MONTH } from "./plan";
import { sumsOf } from "./sums";
import {
  type DebtField,
  type DebtFields,
  fieldId,
  LAST_PLAN_YEAR,
  type LentFields,
  numbersOf,
} from "./use-debt";

// Each kind's fields, in the order people think of them, for the panel to stack.

const THIS_YEAR = Number(THIS_MONTH.slice(0, 4));

/** What a kind's name field hints. */
export const NAME_HINT = {
  loan: "Like “Meezan car loan” or “Loan from Chacha”.",
  card: "Like “HBL credit card”.",
  committee: "Like “Office committee”.",
} as const;

interface GroupProps {
  /** Ids inside start with it. */
  id: string;
  fields: DebtFields;
  set: (patch: Partial<DebtFields>) => void;
  /** A field's error, once the user tried to save. */
  error: (field: DebtField) => string | null;
}

/** The name, first for every kind. */
export function NameRow({ id, fields, set, error }: GroupProps) {
  return (
    <TextField
      id={fieldId(id, "name")}
      label="Name"
      value={fields.name}
      onValue={(name) => {
        set({ name });
      }}
      hint={NAME_HINT[fields.kind]}
      error={error("name")}
    />
  );
}

/**
 * A loan: what's owed today, then whether there's a fixed instalment. Yes asks how much, how often,
 * how many are left, the day and the account. No asks only for an optional date to repay it by.
 * The ProtoBar's loan ideas change how some of these are asked (components/debts/options.ts).
 */
export function LoanFields({
  id,
  fields,
  set,
  error,
  accounts,
}: GroupProps & { accounts: readonly Account[] }) {
  const cards = useProtoOption(LOAN_ANSWERS) === "cards";
  const either = useProtoOption(LOAN_LEFT) === "either";
  const live = useProtoOption(LOAN_LIVE) === "on";
  const fold = useProtoOption(LOAN_FOLD) === "on";
  const tight = useProtoOption(LOAN_TIGHT) === "on";
  const help = useProtoOption(LOAN_HELP) === "on";
  const [unfolded, setUnfolded] = useState(false);
  const folded = fold && !unfolded;
  const byLast = either && fields.leftBy === "last";
  const counted = numbersOf(fields).left;
  // Short fields share a row from tablet width. Otherwise the wrapper steps aside and they stack.
  const pair = tight ? "grid gap-x-4 gap-y-6 sm:grid-cols-2" : "contents";
  return (
    <>
      <div className="flex flex-col gap-2">
        <AmountField
          id={fieldId(id, "owed")}
          label="What you owe today"
          digits={fields.owed}
          onDigits={(owed) => {
            set({ owed });
          }}
          hint={
            tight
              ? "What it would take to close it now."
              : "What it would take to close it now. Your bank's app has it."
          }
          error={error("owed")}
        />
        {help && <WhereToFind />}
      </div>
      {cards ? (
        <AnswerCards
          id={fieldId(id, "fixed")}
          value={fields.fixed}
          onValue={(fixed) => {
            set({ fixed });
          }}
          error={error("fixed")}
        />
      ) : (
        <YesNoField
          id={fieldId(id, "fixed")}
          label="Do you pay a fixed instalment?"
          value={fields.fixed}
          onValue={(fixed) => {
            set({ fixed });
          }}
          error={error("fixed")}
        />
      )}
      {fields.fixed === "yes" && (
        <>
          {folded ? (
            <FoldedSchedule
              fields={fields}
              accounts={accounts}
              onChange={() => {
                setUnfolded(true);
              }}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">How often</span>
              <EveryField
                value={fields.every}
                onValue={(every) => {
                  set({ every });
                }}
              />
            </div>
          )}
          <div className={pair}>
            <AmountField
              id={fieldId(id, "instalment")}
              label="Each instalment"
              digits={fields.instalment}
              onDigits={(instalment) => {
                set({ instalment });
              }}
              hint={tight ? "" : "As on your repayment schedule."}
              error={error("instalment")}
            />
            <div className="flex flex-col gap-3">
              {either && <LeftBySwitch fields={fields} set={set} />}
              {byLast ? (
                <MonthField
                  id={fieldId(id, "last")}
                  label="Last instalment in"
                  parts={fields.last}
                  onChange={(last) => {
                    set({ last });
                  }}
                  firstYear={THIS_YEAR}
                  lastYear={LAST_PLAN_YEAR}
                  hint={
                    counted !== null && counted > 0
                      ? `That's ${String(counted)} ${counted === 1 ? "instalment" : "instalments"}, counting the next one.`
                      : tight
                        ? null
                        : "The month of the final payment, as on your schedule."
                  }
                  error={error("last")}
                />
              ) : (
                <CountField
                  id={fieldId(id, "left")}
                  label="Instalments left"
                  value={fields.left}
                  onValue={(left) => {
                    set({ left });
                  }}
                  hint="Count the next one too."
                  error={error("left")}
                />
              )}
            </div>
          </div>
          {live && <LiveSum sums={sumsOf(fields)} />}
          <div className={pair}>
            <DayField
              id={fieldId(id, "day")}
              label="Paid on day"
              value={fields.day}
              onValue={(day) => {
                set({ day });
              }}
              hint={tight ? null : "The day of the month it comes out."}
              error={error("day")}
            />
            {fields.every === "quarter" && (
              <MonthField
                id={fieldId(id, "next")}
                label="Next one due"
                parts={fields.next}
                onChange={(next) => {
                  set({ next });
                }}
                firstYear={THIS_YEAR}
                lastYear={THIS_YEAR + 1}
                hint={null}
                error={error("next")}
              />
            )}
            {!folded && (
              <PaidFromField
                id={fieldId(id, "paidFrom")}
                accounts={accounts}
                value={fields.paidFrom}
                onValue={(paidFrom) => {
                  set({ paidFrom });
                }}
              />
            )}
          </div>
        </>
      )}
      {fields.fixed === "no" && (
        <MonthField
          id={fieldId(id, "repayBy")}
          label="Repay by (optional)"
          parts={fields.repayBy}
          onChange={(repayBy) => {
            set({ repayBy });
          }}
          firstYear={THIS_YEAR}
          lastYear={LAST_PLAN_YEAR}
          hint="If you've agreed a date. You'll log each payment as you make it."
          error={error("repayBy")}
        />
      )}
    </>
  );
}

/** A card: what's owed on it today, the bill's due day and the limit. */
export function CardFields({ id, fields, set, error }: GroupProps) {
  return (
    <>
      <AmountField
        id={fieldId(id, "owed")}
        label="What you owe on it today"
        digits={fields.owed}
        onDigits={(owed) => {
          set({ owed });
        }}
        hint="The whole balance in your bank's app, not just the last bill."
        error={error("owed")}
      />
      <DayField
        id={fieldId(id, "dueDay")}
        label="Bill due on day"
        value={fields.dueDay}
        onValue={(dueDay) => {
          set({ dueDay });
        }}
        hint="The payment due date on your statement."
        error={error("dueDay")}
      />
      <AmountField
        id={fieldId(id, "limit")}
        label="Credit limit"
        digits={fields.limit}
        onDigits={(limit) => {
          set({ limit });
        }}
        hint="On your statement or in your bank's app."
        error={error("limit")}
      />
    </>
  );
}

/**
 * A committee's plan: the monthly amount, the people in it, when it started, the turns paid, and
 * whether the user has had their turn. The turn number is optional: turns are often drawn.
 */
export function CommitteeFields({ id, fields, set, error }: GroupProps) {
  return (
    <>
      <AmountField
        id={fieldId(id, "monthly")}
        label="You pay each month"
        digits={fields.monthly}
        onDigits={(monthly) => {
          set({ monthly });
        }}
        hint="Your share, not the whole pot."
        error={error("monthly")}
      />
      <CountField
        id={fieldId(id, "members")}
        label="People in it"
        value={fields.members}
        onValue={(members) => {
          set({ members });
        }}
        hint="Each gets one turn, so it runs that many months."
        error={error("members")}
        max={2}
      />
      <MonthField
        id={fieldId(id, "start")}
        label="Started in"
        parts={fields.start}
        onChange={(start) => {
          set({ start });
        }}
        firstYear={THIS_YEAR - 5}
        lastYear={THIS_YEAR + 1}
        hint="The month of the first payment."
        error={error("start")}
      />
      <CountField
        id={fieldId(id, "paid")}
        label="Turns you've paid"
        value={fields.paid}
        onValue={(paid) => {
          set({ paid });
        }}
        hint={
          fields.paidTyped
            ? null
            : "Counted from the start month. Change it if it's different."
        }
        error={error("paid")}
        max={2}
      />
      <YesNoField
        id={fieldId(id, "hadTurn")}
        label="Have you had your turn?"
        value={fields.hadTurn}
        onValue={(hadTurn) => {
          set({ hadTurn });
        }}
        labels={{ yes: "Yes", no: "Not yet" }}
        hint="Your turn is the month you get the pot."
        error={error("hadTurn")}
      />
      <CountField
        id={fieldId(id, "turn")}
        label="Your turn number (optional)"
        value={fields.turn}
        onValue={(turn) => {
          set({ turn });
        }}
        hint="Leave it empty if turns are drawn and yours isn't known yet."
        error={error("turn")}
        max={2}
      />
    </>
  );
}

interface LentGroupProps {
  id: string;
  fields: LentFields;
  set: (patch: Partial<LentFields>) => void;
  error: (field: "to" | "amount" | "backBy") => string | null;
}

/** Money lent: who to, how much is still to come back, and when, if there's a date. */
export function LentFieldRows({ id, fields, set, error }: LentGroupProps) {
  return (
    <>
      <TextField
        id={fieldId(id, "to")}
        label="Who did you lend it to?"
        value={fields.to}
        onValue={(to) => {
          set({ to });
        }}
        hint="A name you'll know, like “Ali bhai”."
        error={error("to")}
      />
      <AmountField
        id={fieldId(id, "amount")}
        label="Still to come back"
        digits={fields.amount}
        onDigits={(amount) => {
          set({ amount });
        }}
        hint="If some is back already, enter what's left."
        error={error("amount")}
      />
      <MonthField
        id={fieldId(id, "backBy")}
        label="Back by (optional)"
        parts={fields.backBy}
        onChange={(backBy) => {
          set({ backBy });
        }}
        firstYear={THIS_YEAR}
        lastYear={LAST_PLAN_YEAR}
        hint="If you agreed a date. We'll remind you then."
        error={error("backBy")}
      />
    </>
  );
}
