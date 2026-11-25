"use client";

import { CircleAlert, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { EVERY_LABEL } from "@proto/components/property/value";
import type { Account } from "@proto/fixtures/accounts";
import type { InstalmentEvery } from "@proto/fixtures/property";
import { formatLakhCrore } from "@proto/kit/format";
import { saveLabel } from "@proto/components/metals/parts";
import { BIG, CHIP, TALL_FIELD } from "@proto/screens/setup/look";
import { digitsIn, type MonthParts, type YesNo } from "./use-debt";

// The fields the debts and money lent forms share. Each variant lays them out its own way.

/** The line under a field: its hint, or its error once the user tried to save. */
export function Note({
  id,
  hint,
  error,
}: {
  id: string;
  hint: ReactNode;
  error: string | null;
}) {
  if (error !== null) {
    return (
      <FieldError id={id} className="flex items-center gap-1.5">
        <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
        {error}
      </FieldError>
    );
  }
  return hint === null ? null : (
    <FieldDescription id={id}>{hint}</FieldDescription>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onValue: (value: string) => void;
  hint: string | null;
  error: string | null;
}

/** A name, typed: "Meezan car loan", "Ali bhai". */
export function TextField({
  id,
  label,
  value,
  onValue,
  hint,
  error,
}: TextFieldProps) {
  return (
    <Field data-invalid={error !== null}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(event) => {
          onValue(event.target.value);
        }}
        autoComplete="off"
        autoCapitalize="sentences"
        maxLength={80}
        aria-invalid={error !== null}
        aria-describedby={`${id}-note`}
        className={TALL_FIELD}
      />
      <Note id={`${id}-note`} hint={hint} error={error} />
    </Field>
  );
}

interface CountFieldProps {
  id: string;
  label: string;
  value: string;
  onValue: (value: string) => void;
  hint: string | null;
  error: string | null;
  /** How many digits it takes. */
  max?: number;
}

/** A small whole number, such as the instalments left or the people in a committee. */
export function CountField({
  id,
  label,
  value,
  onValue,
  hint,
  error,
  max = 3,
}: CountFieldProps) {
  return (
    <Field data-invalid={error !== null}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onValue(digitsIn(event.target.value, max));
        }}
        aria-invalid={error !== null}
        aria-describedby={`${id}-note`}
        className={cn(TALL_FIELD, "max-w-32 tabular-nums")}
      />
      <Note id={`${id}-note`} hint={hint} error={error} />
    </Field>
  );
}

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

// A little less room for the chevron than the default, as in the date bought field.
export const SELECT =
  "w-full [&_select]:h-12 [&_select]:pr-7 [&_select]:text-base";

interface DayFieldProps {
  id: string;
  label: string;
  value: string;
  onValue: (value: string) => void;
  hint: string | null;
  error: string | null;
}

/** A day of the month, 1 to 31. A 31 in a short month falls on its last day. */
export function DayField({
  id,
  label,
  value,
  onValue,
  hint,
  error,
}: DayFieldProps) {
  return (
    <Field data-invalid={error !== null}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect
        id={id}
        value={value}
        onChange={(event) => {
          onValue(event.target.value);
        }}
        aria-invalid={error !== null}
        aria-describedby={`${id}-note`}
        className={cn(SELECT, "max-w-32")}
      >
        <NativeSelectOption value="">Day</NativeSelectOption>
        {DAYS.map((day) => (
          <NativeSelectOption key={day} value={String(day)}>
            {day}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Note id={`${id}-note`} hint={hint} error={error} />
    </Field>
  );
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

interface MonthFieldProps {
  /** The month menu's id, so a form can move focus to the field. */
  id: string;
  label: string;
  parts: MonthParts;
  onChange: (parts: MonthParts) => void;
  /** The years offered, earliest first. */
  firstYear: number;
  lastYear: number;
  hint: string | null;
  error: string | null;
}

/** A month and a year, side by side: a committee's start, a loan's "repay by". */
export function MonthField({
  id,
  label,
  parts,
  onChange,
  firstYear,
  lastYear,
  hint,
  error,
}: MonthFieldProps) {
  const labelId = `${id}-label`;
  const noteId = `${id}-note`;
  const invalid = error !== null;
  const years = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, index) => firstYear + index,
  );
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex flex-col gap-2"
      data-invalid={invalid}
    >
      <span id={labelId} className="text-sm font-medium">
        {label}
      </span>
      <div className="grid max-w-72 grid-cols-[minmax(0,1fr)_6rem] gap-1.5">
        <NativeSelect
          id={id}
          aria-label="Month"
          value={parts.month}
          onChange={(event) => {
            onChange({ ...parts, month: event.target.value });
          }}
          aria-invalid={invalid}
          aria-describedby={noteId}
          className={SELECT}
        >
          <NativeSelectOption value="">Month</NativeSelectOption>
          {MONTH_SHORT.map((month, index) => (
            <NativeSelectOption key={month} value={String(index + 1)}>
              {month}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Year"
          value={parts.year}
          onChange={(event) => {
            onChange({ ...parts, year: event.target.value });
          }}
          aria-invalid={invalid}
          aria-describedby={noteId}
          className={SELECT}
        >
          <NativeSelectOption value="">Year</NativeSelectOption>
          {years.map((year) => (
            <NativeSelectOption key={year} value={String(year)}>
              {year}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <Note id={noteId} hint={hint} error={error} />
    </div>
  );
}

interface YesNoFieldProps {
  id: string;
  label: string;
  value: YesNo;
  onValue: (value: "yes" | "no") => void;
  labels?: { yes: string; no: string };
  hint?: string | null;
  error: string | null;
}

/** A question with two answers, as chips. Neither is picked at first: the answer changes the form. */
export function YesNoField({
  id,
  label,
  value,
  onValue,
  labels = { yes: "Yes", no: "No" },
  hint = null,
  error,
}: YesNoFieldProps) {
  const labelId = `${id}-label`;
  return (
    <div className="flex flex-col gap-2" data-invalid={error !== null}>
      <span id={labelId} className="font-semibold">
        {label}
      </span>
      <ToggleGroup
        variant="outline"
        aria-labelledby={labelId}
        aria-describedby={`${id}-note`}
        value={value === "" ? [] : [value]}
        onValueChange={(next) => {
          if (next[0] === "yes" || next[0] === "no") onValue(next[0]);
        }}
      >
        <ToggleGroupItem id={id} value="yes" className={CHIP}>
          {labels.yes}
        </ToggleGroupItem>
        <ToggleGroupItem value="no" className={CHIP}>
          {labels.no}
        </ToggleGroupItem>
      </ToggleGroup>
      <Note id={`${id}-note`} hint={hint} error={error} />
    </div>
  );
}

/** How often a fixed instalment is due, as the property form asks it. Every month is the usual. */
export function EveryField({
  value,
  onValue,
}: {
  value: InstalmentEvery;
  onValue: (value: InstalmentEvery) => void;
}) {
  return (
    <ToggleGroup
      variant="outline"
      aria-label="How often"
      spacing={0}
      value={[value]}
      onValueChange={(next) => {
        if (next[0] === "month" || next[0] === "quarter") onValue(next[0]);
      }}
    >
      <ToggleGroupItem value="month" className={CHIP}>
        {EVERY_LABEL.month}
      </ToggleGroupItem>
      <ToggleGroupItem value="quarter" className={CHIP}>
        {EVERY_LABEL.quarter}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

interface PaidFromFieldProps {
  id: string;
  accounts: readonly Account[];
  value: string;
  onValue: (value: string) => void;
}

/** The account a fixed instalment comes out of. With none added yet, it can be picked later. */
export function PaidFromField({
  id,
  accounts,
  value,
  onValue,
}: PaidFromFieldProps) {
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Paid from</span>
        <p className="text-sm text-muted-foreground">
          {"You haven't added an account yet. You can pick one later."}
        </p>
      </div>
    );
  }
  return (
    <Field>
      <FieldLabel htmlFor={id}>Paid from</FieldLabel>
      <NativeSelect
        id={id}
        value={value}
        onChange={(event) => {
          onValue(event.target.value);
        }}
        className={cn(SELECT, "max-w-md")}
      >
        {accounts.map((account) => (
          <NativeSelectOption key={account.id} value={account.id}>
            {account.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

/** A save that failed. What was typed is still in the form. */
export function SaveFailed({ name }: { name: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{`We couldn't save ${name}`}</AlertTitle>
      <AlertDescription>
        What you typed is still here. Check your connection and try again.
      </AlertDescription>
    </Alert>
  );
}

/** A warning that never blocks saving. It's announced as it appears. */
export function Warning({ text }: { text: string | null }) {
  return (
    <div role="status">
      {text !== null && (
        <p className="flex items-start gap-2 rounded-lg border border-current/25 p-3 text-sm font-medium">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          {text}
        </p>
      )}
    </div>
  );
}

/** A lakh or crore note under an amount, when it's that large. */
export function Spoken({ value }: { value: number }) {
  const spoken = formatLakhCrore(value);
  return spoken === null ? null : (
    <span className="block text-sm text-muted-foreground">{spoken}</span>
  );
}

interface TotalsProps {
  /** What's owed across the rows, in whole rupees. */
  owed: number;
  /** What's paid into committees before the user's turn, which is owned. */
  owned: number;
  /** "You owe on loans". */
  label: string;
}

/**
 * Under the rows: what's owed, as a minus with its lakh note. Committees before the turn are owned,
 * so they're apart from the total, on a line of their own.
 */
export function DebtTotals({ owed, owned, label }: TotalsProps) {
  return (
    <div className="flex flex-col gap-2 border-t-2 border-current/25 pt-3">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-semibold">{label}</span>
        <span className="ml-auto text-right">
          <Money value={-owed} signed className="text-lg font-bold" />
          <Spoken value={owed} />
        </span>
      </p>
      {owned > 0 && (
        <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
          <span>Paid in before your turn. It counts in what you own.</span>
          <Money value={owned} signed className="ml-auto font-semibold" />
        </p>
      )}
    </div>
  );
}

interface PanelButtonsProps {
  save: { pending: boolean; failed: boolean };
  /** "Add loan", or "Save" for one already added. */
  submitLabel: string;
  onCancel: (() => void) | null;
  onRemove: (() => void) | null;
}

/** The panel's save, its way back, and Remove on the far side. Remove is at once, with Undo. */
export function PanelButtons({
  save,
  submitLabel,
  onCancel,
  onRemove,
}: PanelButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={save.pending} className={BIG}>
        {saveLabel(save, submitLabel)}
      </Button>
      {onCancel !== null && (
        <Button
          type="button"
          variant="ghost"
          className={BIG}
          onClick={onCancel}
        >
          Cancel
        </Button>
      )}
      {onRemove !== null && (
        <Button
          type="button"
          variant="ghost"
          className={cn(BIG, "sm:ml-auto")}
          onClick={onRemove}
        >
          Remove
        </Button>
      )}
    </div>
  );
}
