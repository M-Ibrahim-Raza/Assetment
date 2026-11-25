"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { EVERY_LABEL } from "@proto/components/property/value";
import type { Account } from "@proto/fixtures/accounts";
import { formatPkr } from "@proto/kit/format";
import { CHIP } from "@proto/screens/setup/look";
import { Note } from "./parts";
import { formatMonth, rateText } from "./plan";
import type { Sums } from "./sums";
import type { DebtFields, LoanKind, YesNo } from "./use-debt";

// The loan form's ideas, each behind a ProtoBar option (components/debts/options.ts). Kept apart so
// a chosen one moves into the form and a dropped one goes with this file's part of it.

const KINDS: readonly { value: LoanKind; label: string; word: string }[] = [
  { value: "car", label: "Car loan", word: "car loan" },
  { value: "home", label: "Home finance", word: "home finance" },
  { value: "personal", label: "Personal loan", word: "personal loan" },
  { value: "family", label: "From family or a friend", word: "loan" },
  { value: "other", label: "Something else", word: "loan" },
];

const BANKS = [
  "Meezan",
  "HBL",
  "UBL",
  "Bank Alfalah",
  "MCB",
  "Bank Al Habib",
  "Standard Chartered",
] as const;

/** The name the kind and bank make: "Meezan car loan", "Car loan", or "Loan from family". */
function nameFor(kind: LoanKind | "", bank: string): string {
  if (kind === "family") return "Loan from family";
  const word = KINDS.find((each) => each.value === kind)?.word ?? "loan";
  if (bank !== "") return `${bank} ${word}`;
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

/**
 * A change to the kind or bank, with the name they make. A name the user typed is kept: only an
 * empty name, or the one the chips filled in last, is replaced.
 */
function withName(
  fields: DebtFields,
  patch: Pick<Partial<DebtFields>, "loanKind" | "bank" | "fixed">,
): Partial<DebtFields> {
  const kind = patch.loanKind ?? fields.loanKind;
  const bank = patch.bank ?? fields.bank;
  const named = fields.name === "" || fields.name === fields.autoName;
  const name = nameFor(kind, bank);
  return named ? { ...patch, name, autoName: name } : patch;
}

interface IdeaProps {
  fields: DebtFields;
  set: (patch: Partial<DebtFields>) => void;
}

/**
 * The kind of loan, asked first. A bank loan is paid in fixed instalments and a loan from family
 * usually isn't, so the kind answers that question too. The user can still change it.
 */
export function LoanKindField({ fields, set }: IdeaProps) {
  return (
    <div className="flex flex-col gap-2">
      <span id="loan-kind-label" className="font-semibold">
        What kind of loan?
      </span>
      <ToggleGroup
        variant="outline"
        aria-labelledby="loan-kind-label"
        value={fields.loanKind === "" ? [] : [fields.loanKind]}
        onValueChange={(next) => {
          const kind = KINDS.find((each) => each.value === next[0])?.value;
          if (kind === undefined) return;
          const fixed: YesNo =
            kind === "family" ? "no" : kind === "other" ? fields.fixed : "yes";
          set(
            withName(fields, {
              loanKind: kind,
              fixed,
              ...(kind === "family" ? { bank: "" } : {}),
            }),
          );
        }}
        className="flex-wrap"
      >
        {KINDS.map((kind) => (
          <ToggleGroupItem key={kind.value} value={kind.value} className={CHIP}>
            {kind.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

/** Bank chips under the name. A pick builds the name with the kind: "Meezan car loan". */
export function BankChips({ fields, set }: IdeaProps) {
  if (fields.loanKind === "family") return null;
  return (
    <div className="flex flex-col gap-2">
      <span id="loan-bank-label" className="text-sm font-medium">
        From a bank? Tap it to fill in the name.
      </span>
      <ToggleGroup
        variant="outline"
        aria-labelledby="loan-bank-label"
        value={fields.bank === "" ? [] : [fields.bank]}
        onValueChange={(next) => {
          set(withName(fields, { bank: next[0] ?? "" }));
        }}
        className="flex-wrap"
      >
        {BANKS.map((bank) => (
          <ToggleGroupItem key={bank} value={bank} className={CHIP}>
            {bank}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

const CARD =
  "h-auto flex-1 basis-56 flex-col items-start gap-1 rounded-xl p-4 text-left whitespace-normal aria-pressed:bg-foreground aria-pressed:text-background";

interface AnswerCardsProps {
  id: string;
  value: YesNo;
  onValue: (value: "yes" | "no") => void;
  error: string | null;
}

/** The fixed-instalment question as two cards, each saying what that answer does. */
export function AnswerCards({ id, value, onValue, error }: AnswerCardsProps) {
  return (
    <div className="flex flex-col gap-2" data-invalid={error !== null}>
      <span id={`${id}-label`} className="font-semibold">
        How do you pay it back?
      </span>
      <ToggleGroup
        variant="outline"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-note`}
        value={value === "" ? [] : [value]}
        onValueChange={(next) => {
          if (next[0] === "yes" || next[0] === "no") onValue(next[0]);
        }}
        className="flex-wrap items-stretch"
      >
        <ToggleGroupItem id={id} value="yes" className={CARD}>
          <span className="text-base font-semibold">Fixed instalments</span>
          <span className="text-sm font-normal opacity-80">
            Like most bank loans. We add each one on its day and work out the
            markup.
          </span>
        </ToggleGroupItem>
        <ToggleGroupItem value="no" className={CARD}>
          <span className="text-base font-semibold">When I can</span>
          <span className="text-sm font-normal opacity-80">
            Like a loan from family. You note each payment as you make it.
          </span>
        </ToggleGroupItem>
      </ToggleGroup>
      <Note id={`${id}-note`} hint={null} error={error} />
    </div>
  );
}

/** Whether instalments left are given as a count or as the month of the last one. */
export function LeftBySwitch({ fields, set }: IdeaProps) {
  return (
    <ToggleGroup
      variant="outline"
      aria-label="Give the instalments left as"
      spacing={0}
      value={[fields.leftBy]}
      onValueChange={(next) => {
        if (next[0] === "count" || next[0] === "last") set({ leftBy: next[0] });
      }}
      className="self-start"
    >
      <ToggleGroupItem value="count" className={cn(CHIP, "h-9 px-3")}>
        How many are left
      </ToggleGroupItem>
      <ToggleGroupItem value="last" className={cn(CHIP, "h-9 px-3")}>
        When the last one is
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/** The sum as it's typed, right under the instalment fields, where it stays in view. */
export function LiveSum({ sums }: { sums: Sums | null }) {
  return (
    <div role="status">
      {sums?.kind === "loan-fixed" && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="font-semibold tabular-nums">
            {sums.left} × {formatPkr(sums.instalment)} ={" "}
            {formatPkr(sums.leftToPay)}
          </span>{" "}
          to pay
          {sums.last !== null && <>, ending {formatMonth(sums.last)}</>}.{" "}
          {sums.markup > 0 ? (
            <>
              <span className="tabular-nums">{formatPkr(sums.markup)}</span> of
              it is markup
              {sums.rate !== null && `, ${rateText(sums.rate)}`}.
            </>
          ) : (
            "No markup."
          )}
        </p>
      )}
    </div>
  );
}

interface FoldedProps {
  fields: DebtFields;
  accounts: readonly Account[];
  onChange: () => void;
}

/** How often and where from, as one line while they're at their defaults, with Change. */
export function FoldedSchedule({ fields, accounts, onChange }: FoldedProps) {
  const account = accounts.find((each) => each.id === fields.paidFrom);
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg border px-3 py-2">
      <p className="text-sm">
        <span className="font-semibold">{EVERY_LABEL[fields.every]}</span>
        {account === undefined
          ? ". Pick the account later."
          : `, from ${account.name}`}
      </p>
      <Button
        type="button"
        variant="ghost"
        className="-mr-2 underline underline-offset-4"
        onClick={onChange}
      >
        Change
      </Button>
    </div>
  );
}

/** Where each number is. A rough figure is fine: Things to check asks again in 6 months. */
export function WhereToFind() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="-ml-4 self-start underline underline-offset-4"
        onClick={() => {
          setOpen(true);
        }}
      >
        Where do I find these numbers?
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Where to find your loan&apos;s numbers</DialogTitle>
            <DialogDescription>
              A close figure is fine. You can correct it any time.
            </DialogDescription>
          </DialogHeader>
          <dl className="flex flex-col gap-3">
            <div>
              <dt className="font-semibold">What you owe today</dt>
              <dd className="text-muted-foreground">
                In your bank&apos;s app, often called the outstanding balance or
                the amount to settle. Your statement has it too, or the bank can
                tell you.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">
                Each instalment, and how many are left
              </dt>
              <dd className="text-muted-foreground">
                On the repayment schedule you got when the loan started. Islamic
                car financing calls each one a rental.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Not sure?</dt>
              <dd className="text-muted-foreground">
                Every 6 months, Things to check asks you to check them, as banks
                change their rates.
              </dd>
            </div>
          </dl>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setOpen(false);
              }}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** A bar under the sum: what's owed today, solid, and the markup on top, lighter. */
export function SplitBar({ owed, markup }: { owed: number; markup: number }) {
  const total = owed + markup;
  const share = total === 0 ? 1 : owed / total;
  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="img"
        aria-label={`${formatPkr(owed)} owed today and ${formatPkr(markup)} of markup`}
        className="flex h-3 overflow-hidden rounded-full"
      >
        <span
          className="bg-primary"
          style={{ width: `${String(share * 100)}%` }}
        />
        <span className="flex-1 bg-primary/30" />
      </div>
      <div className="flex flex-wrap justify-between gap-x-3 text-xs text-muted-foreground">
        <span>
          Owed today · <Money value={owed} />
        </span>
        <span>
          Markup · <Money value={markup} />
        </span>
      </div>
    </div>
  );
}
