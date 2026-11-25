"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { DISPLAY } from "@proto/components/display";
import { formatLakhCrore, formatPkr } from "@proto/kit/format";
import { useProtoOption } from "@proto/kit/use-proto-option";
import { HAIRLINE } from "@proto/screens/setup/look";
import {
  CardFields,
  CommitteeFields,
  LentFieldRows,
  LoanFields,
  NameRow,
} from "./field-groups";
import type { DebtFormProps, DebtKind, LentFormProps } from "./forms";
import { DebtTotals, PanelButtons, SaveFailed, Spoken, Warning } from "./parts";
import {
  formatMonth,
  isOwned,
  lentLine,
  lentName,
  ordinal,
  rateText,
} from "./plan";
import { FormShell, type PanelArgs } from "./shell";
import { rowLine, signedAmount, type Sums, totalsOf } from "./sums";
import {
  type DebtFields,
  defaultPaidFrom,
  fieldsOfLent,
  fieldsOfPlan,
  fieldsOfRow,
  freshFields,
  freshLent,
  type LentFields,
  monthOf,
} from "./use-debt";
import { BankChips, LoanKindField, SplitBar } from "./loan-ideas";
import { LOAN_BANKS, LOAN_SPLIT, LOAN_START } from "./options";
import { useDebtPanel, useLentPanel } from "./use-panel";

// Variant a, "Add a debt": the gold form's pattern. One panel holds everything about a debt, top to
// bottom, and ends on its sum: what's left to pay and when it ends, what's left on a card, or where
// a committee stands. Saved debts are rows above it, with a total, and a row opens in place.

const ADD_LABEL: Readonly<Record<DebtKind, string>> = {
  loan: "Add a loan",
  card: "Add a card",
  committee: "Add a committee",
};

const TOTAL_LABEL: Readonly<Record<DebtKind, string>> = {
  loan: "You owe on loans",
  card: "You owe on cards",
  committee: "You owe on committees",
};

/** The panel's frame: on phones a rule above it, from tablet width a box, as gold's. */
const PANEL = "border-t border-current/15 pt-5 sm:rounded-2xl sm:border sm:p-6";
const PANEL_TITLE = cn(
  DISPLAY,
  "text-xl font-extrabold tracking-tight outline-none",
);

export function AddDebtForm(props: DebtFormProps) {
  const { kind, rows, accounts, draft } = props;
  const paidFrom = defaultPaidFrom(accounts, rows);
  const { owed, owned } = totalsOf(rows);
  return (
    <FormShell<DebtFormProps["rows"][number], DebtFields>
      title={props.title}
      help={props.help}
      heading={props.heading}
      done={props.done}
      skip={props.skip}
      rows={rows}
      listLabel={props.title}
      addLabel={ADD_LABEL[kind]}
      fresh={() => freshFields(kind, paidFrom)}
      fieldsOfRow={(row) =>
        row.fromProperty ? null : fieldsOfRow(row, kind, paidFrom)
      }
      onElsewhere={props.onOpenProperty}
      onRemove={props.onRemove}
      draft={
        draft === null
          ? null
          : { fields: fieldsOfPlan(draft.plan, paidFrom), status: draft.status }
      }
      renderRow={(row, { id, onOpen }) => (
        <Row
          id={id}
          name={row.name}
          line={rowLine(row)}
          note={
            row.plan !== null && isOwned(row.plan)
              ? "Counts in what you own"
              : null
          }
          value={signedAmount(row)}
          onOpen={onOpen}
        />
      )}
      renderPanel={(args) => (
        <DebtPanel args={args} accounts={accounts} onSave={props.onSave} />
      )}
      totals={
        <DebtTotals owed={owed} owned={owned} label={TOTAL_LABEL[kind]} />
      }
    />
  );
}

interface RowProps {
  id: string;
  name: string;
  line: string;
  /** A second, stronger line, such as "Counts in what you own". */
  note: string | null;
  /** Signed: owed is a minus, owned a plus. */
  value: number;
  onOpen: () => void;
}

/** A saved debt: its name and where it stands, and its amount. The whole row opens it, in place. */
function Row({ id, name, line, note, value, onOpen }: RowProps) {
  return (
    <li className={HAIRLINE}>
      <button
        id={id}
        type="button"
        onClick={onOpen}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-3 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {/* On phones the amount drops under the name, so a long name has the full width. */}
        <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold wrap-break-word">{name}</span>
            <span className="text-sm text-muted-foreground">{line}</span>
            {note !== null && (
              <span className="text-sm font-medium">{note}</span>
            )}
          </span>
          <Money
            value={value}
            signed
            className="shrink-0 font-bold sm:text-right"
          />
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
      </button>
    </li>
  );
}

interface DebtPanelProps {
  args: PanelArgs<DebtFields>;
  accounts: DebtFormProps["accounts"];
  onSave: DebtFormProps["onSave"];
}

/** Everything about one debt, in the order the user thinks of it, ending on its sum. */
function DebtPanel({ args, accounts, onSave }: DebtPanelProps) {
  const panel = useDebtPanel(args, onSave);
  const loan = panel.fields.kind === "loan";
  const byKind = useProtoOption(LOAN_START) === "kind";
  const banks = useProtoOption(LOAN_BANKS) === "on";
  const group = {
    id: args.id,
    fields: panel.fields,
    set: panel.set,
    error: panel.error,
  };
  return (
    <section aria-labelledby={args.titleId} className={PANEL}>
      <form noValidate onSubmit={panel.submit} className="flex flex-col gap-6">
        <h3 id={args.titleId} tabIndex={-1} className={PANEL_TITLE}>
          {panel.title}
        </h3>
        {panel.save.failed && <SaveFailed name={panel.name} />}
        {loan && byKind && (
          <LoanKindField fields={panel.fields} set={panel.set} />
        )}
        <div className="flex flex-col gap-4">
          <NameRow {...group} />
          {loan && banks && <BankChips fields={panel.fields} set={panel.set} />}
        </div>
        {loan && <LoanFields {...group} accounts={accounts} />}
        {panel.fields.kind === "card" && <CardFields {...group} />}
        {panel.fields.kind === "committee" && <CommitteeFields {...group} />}
        <Warning text={panel.warning} />
        <Summary sums={panel.sums} />
        <PanelButtons
          save={panel.save}
          submitLabel={panel.submitLabel}
          onCancel={args.onCancel}
          onRemove={args.onRemove}
        />
      </form>
    </section>
  );
}

/** One line of the sum: a label with a quieter line under it, and an amount. */
function Line({
  label,
  under = null,
  children,
}: {
  label: string;
  under?: string | null;
  children: ReactNode;
}) {
  return (
    <>
      <dt className="flex flex-col">
        <span>{label}</span>
        {under !== null && (
          <span className="text-sm text-muted-foreground">{under}</span>
        )}
      </dt>
      <dd className="text-right font-semibold tabular-nums">{children}</dd>
    </>
  );
}

/** The sum's last line: the answer, large, with a note under it. */
function Answer({
  label,
  value,
  signed = false,
  note,
}: {
  label: string;
  value: number;
  signed?: boolean;
  note: string | null;
}) {
  const spoken = formatLakhCrore(value);
  const under = [spoken, note].filter((part) => part !== null).join(" · ");
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t pt-3">
      <span className="font-semibold">{label}</span>
      <span className="ml-auto text-right">
        <Money
          value={value}
          signed={signed}
          className={cn(
            DISPLAY,
            "block text-2xl leading-none font-extrabold tracking-tight",
          )}
        />
        {under !== "" && (
          <span className="block pt-1 text-sm text-muted-foreground">
            {under}
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * The sum, not just the answer. A loan: what's owed today and the markup, then what's left to pay
 * and when it ends. A card: what's left before the limit. A committee: the pot, what's paid in and
 * what's still to pay, then where it counts.
 */
function Summary({ sums }: { sums: Sums | null }) {
  const split = useProtoOption(LOAN_SPLIT) === "on";
  if (sums === null) {
    return (
      <p className="border-t pt-4 text-sm text-muted-foreground">
        The sum shows here once the amounts are in.
      </p>
    );
  }
  switch (sums.kind) {
    case "loan-fixed":
      return (
        <div className="flex flex-col gap-3 border-t pt-4">
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3">
            <Line label="What you owe today">
              <Money value={sums.owed} />
            </Line>
            <Line
              label="Markup"
              under={sums.rate === null ? null : rateText(sums.rate)}
            >
              <Money value={sums.markup} />
            </Line>
          </dl>
          <Answer
            label="Left to pay"
            value={sums.leftToPay}
            note={
              sums.last === null
                ? `${String(sums.left)} × ${formatPkr(sums.instalment)}`
                : `ends ${formatMonth(sums.last)}`
            }
          />
          {split && sums.markup > 0 && (
            <SplitBar owed={sums.owed} markup={sums.markup} />
          )}
        </div>
      );
    case "loan-open":
      return (
        <div className="flex flex-col gap-3 border-t pt-4">
          <Answer
            label="You owe"
            value={sums.owed}
            note={
              sums.repayBy === null
                ? null
                : `repay by ${formatMonth(sums.repayBy)}`
            }
          />
          <p className="text-sm text-muted-foreground">
            Log each payment in Quick add as you make it.
          </p>
        </div>
      );
    case "card":
      return (
        <div className="flex flex-col gap-3 border-t pt-4">
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3">
            <Line label="Credit limit">
              <Money value={sums.limit} />
            </Line>
            <Line label="You owe">
              <Money value={sums.owed} />
            </Line>
          </dl>
          <Answer
            label={sums.left < 0 ? "Over the limit by" : "Left on the card"}
            value={Math.abs(sums.left)}
            note={
              sums.dueDay === null
                ? null
                : `bill due on the ${ordinal(sums.dueDay)}`
            }
          />
        </div>
      );
    case "committee":
      return <CommitteeSummary sums={sums} />;
  }
}

function CommitteeSummary({
  sums,
}: {
  sums: Extract<Sums, { kind: "committee" }>;
}) {
  const turnNote =
    sums.turnAt === null
      ? "your turn: not drawn yet"
      : `your turn: ${formatMonth(sums.turnAt)}`;
  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3">
        <Line
          label="The pot"
          under={`${String(sums.members)} × ${formatPkr(sums.monthly)}`}
        >
          <Money value={sums.pot} />
        </Line>
        <Line
          label="Paid in"
          under={`${String(sums.paid)} ${sums.paid === 1 ? "turn" : "turns"}`}
        >
          <Money value={sums.paidIn} />
        </Line>
        <Line label="Still to pay" under={`until ${formatMonth(sums.end)}`}>
          <Money value={sums.stillToPay} />
        </Line>
      </dl>
      {sums.hadTurn === null ? (
        <p className="border-t pt-3 text-sm text-muted-foreground">
          Say whether you&apos;ve had your turn to see where it counts.
        </p>
      ) : sums.hadTurn ? (
        <Answer
          label="Counts in what you owe"
          value={-sums.stillToPay}
          signed
          note={`ends ${formatMonth(sums.end)}`}
        />
      ) : (
        <Answer
          label="Counts in what you own"
          value={sums.paidIn}
          signed
          note={turnNote}
        />
      )}
    </div>
  );
}

// Money lent.

export function AddLentForm(props: LentFormProps) {
  const total = props.rows.reduce((sum, row) => sum + row.amount, 0);
  return (
    <FormShell<LentFormProps["rows"][number], LentFields>
      title={props.title}
      help={props.help}
      heading={props.heading}
      done={props.done}
      skip={props.skip}
      rows={props.rows}
      listLabel={props.title}
      addLabel="Add money lent"
      fresh={freshLent}
      fieldsOfRow={fieldsOfLent}
      onRemove={props.onRemove}
      draft={null}
      renderRow={(row, { id, onOpen }) => (
        <Row
          id={id}
          name={lentName(row.to)}
          line={lentLine(row)}
          note={null}
          value={row.amount}
          onOpen={onOpen}
        />
      )}
      renderPanel={(args) => <LentPanel args={args} onSave={props.onSave} />}
      totals={<LentTotal total={total} />}
    />
  );
}

/** Under the rows: what's owed to the user, which counts in what they own. */
function LentTotal({ total }: { total: number }) {
  return (
    <div className="flex flex-col gap-2 border-t-2 border-current/25 pt-3">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-semibold">Owed to you</span>
        <span className="ml-auto text-right">
          <Money value={total} signed className="text-lg font-bold" />
          <Spoken value={total} />
        </span>
      </p>
    </div>
  );
}

function LentPanel({
  args,
  onSave,
}: {
  args: PanelArgs<LentFields>;
  onSave: LentFormProps["onSave"];
}) {
  const panel = useLentPanel(args, onSave);
  const back = monthOf(panel.fields.backBy);
  const backBy = back === null ? null : `back by ${formatMonth(back)}`;
  return (
    <section aria-labelledby={args.titleId} className={PANEL}>
      <form noValidate onSubmit={panel.submit} className="flex flex-col gap-6">
        <h3 id={args.titleId} tabIndex={-1} className={PANEL_TITLE}>
          {panel.title}
        </h3>
        {panel.save.failed && <SaveFailed name={panel.name} />}
        <LentFieldRows
          id={args.id}
          fields={panel.fields}
          set={panel.set}
          error={panel.error}
        />
        {panel.amount === null || panel.amount === 0 ? (
          <p className="border-t pt-4 text-sm text-muted-foreground">
            The sum shows here once the amount is in.
          </p>
        ) : (
          <Answer
            label="Owed to you"
            value={panel.amount}
            signed
            note={backBy}
          />
        )}
        <PanelButtons
          save={panel.save}
          submitLabel={panel.submitLabel}
          onCancel={args.onCancel}
          onRemove={args.onRemove}
        />
      </form>
    </section>
  );
}
