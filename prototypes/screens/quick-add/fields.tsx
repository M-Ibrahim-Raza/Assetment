"use client";

import { Camera, TriangleAlert } from "lucide-react";
import { type ReactNode, useId } from "react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { INK } from "@proto/components/blocks";
import { ScreenLink } from "@proto/components/screen-link";
import type { EntryKind } from "@proto/fixtures/entries";
import { BIG, CHIP, TALL_FIELD } from "@proto/screens/setup/look";
import { TODAY, YESTERDAY } from "./days";
import type { Place } from "./places";
import type { EntryForm } from "./use-entry-form";

/** What the form and its parts get: the entry being typed. */
export interface BodyProps {
  form: EntryForm;
}

const KINDS: readonly EntryKind[] = ["expense", "income", "transfer"];

const KIND_LABEL = {
  expense: "Spent",
  income: "Received",
  transfer: "Moved",
} as const satisfies Record<EntryKind, string>;

/**
 * A block in the kind's colour: ink for money out, bottle green for money in, sage for money
 * moved. Home's month block uses ink for spent and green for kept. Focus rings inside it take its
 * text colour, so they show on it.
 */
export const KIND_FIELD = {
  expense: cn(INK, "[--ring:var(--ink-foreground)]"),
  income:
    "bg-primary text-primary-foreground [--ring:var(--primary-foreground)]",
  transfer: "bg-secondary text-secondary-foreground",
} as const satisfies Record<EntryKind, string>;

/** What the account field is called for each kind. */
const ACCOUNT_LABEL = {
  expense: "Paid from",
  income: "Into",
  transfer: "From",
} as const satisfies Record<EntryKind, string>;

/** Side padding of a block inside the panel. Narrower than a page block's, as the panel is. */
export const PANEL_PAD = "px-4 sm:px-6";

/**
 * For the block that holds the big amount field. Below 280 px, which is a 320 px phone at 200%
 * zoom, the amount steps down so a six-figure amount still shows whole. It reaches into the
 * amount field from screens/setup/, which has one display size. Once that field moves to
 * components/, this size belongs in it.
 */
export const NARROW_AMOUNT =
  "max-[279px]:[&_[data-slot=input-group-addon]]:text-base max-[279px]:[&_input]:text-lg";

interface KindSwitchProps {
  kind: EntryKind;
  onKind: (kind: EntryKind) => void;
}

/** Spent, Received or Moved, shown openly, with Spent first because most entries are. */
export function KindSwitch({ kind, onKind }: KindSwitchProps) {
  return (
    <FieldSet className="min-w-0">
      <FieldLegend className="sr-only">What happened</FieldLegend>
      {/* One is always picked: pressing the picked one again leaves it on. The three share the row, and wrap at 200% zoom. */}
      <ToggleGroup
        variant="outline"
        value={[kind]}
        onValueChange={(value) => {
          const next = KINDS.find((candidate) => candidate === value[0]);
          if (next !== undefined) onKind(next);
        }}
        className="w-full flex-wrap"
      >
        {KINDS.map((option) => (
          <ToggleGroupItem
            key={option}
            value={option}
            className={cn(CHIP, "grow")}
          >
            {KIND_LABEL[option]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </FieldSet>
  );
}

interface Option {
  value: string;
  label: string;
  /** The heading it sits under in the More list, such as "Debts". */
  group?: string;
}

/** The options under each heading, in the order the headings first appear. */
function byGroup(options: readonly Option[]): [string, Option[]][] {
  const groups = new Map<string, Option[]>();
  for (const option of options) {
    const group = option.group ?? "";
    groups.set(group, [...(groups.get(group) ?? []), option]);
  }
  return [...groups];
}

interface ChipChoiceProps {
  legend: string;
  /** Most used first. */
  options: readonly Option[];
  value: string;
  onValue: (value: string) => void;
  /** How many show as chips. The rest sit under More. */
  shown: number;
  /** A line under the chips, such as the account's balance. */
  children?: ReactNode;
}

/**
 * One choice from a list: the most used few as chips, so the common pick is one tap, and the rest
 * in a native list under More. A pick from More takes the last chip's place.
 */
function ChipChoice({
  legend,
  options,
  value,
  onValue,
  shown,
  children,
}: ChipChoiceProps) {
  const head = options.slice(0, shown);
  const picked = options.find((option) => option.value === value);
  const chips =
    picked === undefined || head.includes(picked)
      ? head
      : [...head.slice(0, shown - 1), picked];
  const rest = options.filter((option) => !chips.includes(option));

  return (
    // min-w-0: a fieldset is as wide as its longest chip by default, which pushes a long name off the screen.
    <FieldSet className="min-w-0 gap-2">
      <FieldLegend variant="label">{legend}</FieldLegend>
      <ToggleGroup
        variant="outline"
        value={[value]}
        onValueChange={(next) => {
          const option = options.find(
            (candidate) => candidate.value === next[0],
          );
          if (option !== undefined) onValue(option.value);
        }}
        className="w-full flex-wrap"
      >
        {chips.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={cn(CHIP, "max-w-full")}
          >
            <span className="min-w-0 truncate">{option.label}</span>
          </ToggleGroupItem>
        ))}
        {/* In the same row as the chips, so it reads as one more of them. */}
        {rest.length > 0 && (
          <NativeSelect
            aria-label={`More: ${legend}`}
            value=""
            onChange={(event) => {
              if (event.target.value !== "") onValue(event.target.value);
            }}
            // As tall as a chip, and no wider than its name. 16 px text, or iOS zooms the page when the list opens.
            className="w-28 [&>select]:h-10 [&>select]:text-base"
          >
            <NativeSelectOption value="">More</NativeSelectOption>
            {/* Under headings when there is more than one kind, such as Accounts and Debts. */}
            {byGroup(rest).map(([group, options]) =>
              group === "" ? (
                options.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))
              ) : (
                <NativeSelectOptGroup key={group} label={group}>
                  {options.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelectOptGroup>
              ),
            )}
          </NativeSelect>
        )}
      </ToggleGroup>
      {children}
    </FieldSet>
  );
}

interface DayChoiceProps {
  /** An ISO date. */
  day: string;
  onDay: (day: string) => void;
}

/** Today or Yesterday in one tap. Any earlier day through the device's own date picker. */
function DayChoice({ day, onDay }: DayChoiceProps) {
  return (
    <FieldSet className="min-w-0 gap-2">
      <FieldLegend variant="label">Date</FieldLegend>
      <ToggleGroup
        variant="outline"
        value={[day]}
        onValueChange={(next) => {
          if (next[0] === TODAY || next[0] === YESTERDAY) onDay(next[0]);
        }}
        className="w-full flex-wrap"
      >
        <ToggleGroupItem value={TODAY} className={CHIP}>
          Today
        </ToggleGroupItem>
        <ToggleGroupItem value={YESTERDAY} className={CHIP}>
          Yesterday
        </ToggleGroupItem>
        <Input
          type="date"
          aria-label="Another day"
          value={day}
          max={TODAY}
          onChange={(event) => {
            if (event.target.value !== "") onDay(event.target.value);
          }}
          className="h-10 w-auto max-w-full text-base md:text-base"
        />
      </ToggleGroup>
    </FieldSet>
  );
}

interface BalanceLineProps {
  place: Place;
  /** What it will hold once this entry is saved. Null while no amount is typed. */
  after: number | null;
}

/**
 * What an account holds, or what is owed on a debt, and what it will be after this entry. It ties
 * the entry to the user's money, and warns, without blocking, when an account doesn't hold that
 * much or a payment is more than is owed.
 */
function BalanceLine({ place, after }: BalanceLineProps) {
  const owed = place.debt !== null;
  const label = owed ? "Owed" : "Balance";
  if (after === null || after === place.amount) {
    return (
      <FieldDescription>
        {label} <Money value={place.amount} />
      </FieldDescription>
    );
  }
  return (
    <FieldDescription className="flex flex-wrap items-center gap-x-1.5">
      <span>
        {label} <Money value={place.amount} />
      </span>
      <span aria-hidden="true">→</span>
      <span className="sr-only">becomes</span>
      <Money
        value={after}
        signed={after < 0}
        className="font-semibold text-foreground"
      />
      {after < 0 && (
        <span className="flex items-center gap-1 font-medium text-foreground">
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
          {owed ? "More than you owe." : "More than this account holds."}
        </span>
      )}
    </FieldDescription>
  );
}

interface NoteFieldProps {
  note: string;
  onNote: (note: string) => void;
}

function NoteField({ note, onNote }: NoteFieldProps) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>Note</FieldLabel>
      <Input
        id={id}
        value={note}
        onChange={(event) => {
          onNote(event.target.value);
        }}
        autoComplete="off"
        autoCapitalize="sentences"
        maxLength={80}
        aria-describedby={`${id}-hint`}
        className={TALL_FIELD}
      />
      <FieldDescription id={`${id}-hint`}>
        Optional. It becomes the entry&apos;s name, such as Imtiaz Super Market.
      </FieldDescription>
    </Field>
  );
}

/** Accounts and debts as options, under the headings the More list shows. */
const toOptions = (places: readonly Place[], debts: string): Option[] =>
  places.map((place) => ({
    value: place.id,
    label: place.name,
    group: place.debt === null ? "Accounts" : debts,
  }));

/** Everything but the amount: category, where the money came from and went, the day and a note. */
export function DetailFields({ form }: BodyProps) {
  const { draft } = form;

  return (
    <FieldGroup>
      {draft.kind !== "transfer" && (
        <ChipChoice
          legend="Category"
          options={form.categories.map((category) => ({
            value: category,
            label: category,
          }))}
          value={draft.category}
          onValue={form.setCategory}
          shown={5}
        />
      )}
      <ChipChoice
        legend={ACCOUNT_LABEL[draft.kind]}
        options={toOptions(form.fromChoices, "Credit cards")}
        value={draft.account}
        onValue={form.setAccount}
        shown={3}
      >
        {form.from !== null && (
          <BalanceLine place={form.from} after={form.fromAfter} />
        )}
      </ChipChoice>
      {draft.kind === "transfer" && (
        <ChipChoice
          legend="To"
          options={toOptions(form.toChoices, "Debts")}
          value={draft.toAccount}
          onValue={form.setToAccount}
          shown={3}
        >
          {form.to !== null && (
            <BalanceLine place={form.to} after={form.toAfter} />
          )}
        </ChipChoice>
      )}
      <DayChoice day={draft.day} onDay={form.setDay} />
      <NoteField note={draft.note} onNote={form.setNote} />
    </FieldGroup>
  );
}

/** Shown when the form opens with what the user typed before they closed it. */
export function RestoredNote({ form }: BodyProps) {
  if (!form.restored) return null;
  return (
    <Alert>
      <AlertTitle>Picked up where you left off</AlertTitle>
      <AlertDescription>
        What you typed last time is still here.
      </AlertDescription>
      <AlertAction>
        <Button type="button" variant="outline" size="sm" onClick={form.clear}>
          Clear
        </Button>
      </AlertAction>
    </Alert>
  );
}

/**
 * Save, the form's one primary button. A failed save says so here and keeps what was typed. In
 * the desktop box it stays in view while the fields scroll. On phones it is in the flow, where
 * the keyboard can't cover it.
 */
export function SaveBar({ form }: BodyProps) {
  return (
    // The shadow is the panel's colour, drawn over the panel's bottom padding, so nothing shows under the bar.
    <div className="flex flex-col gap-3 md:sticky md:bottom-0 md:bg-background md:pt-3 md:shadow-[0_--spacing(3)_0_var(--background)]">
      {form.failed && (
        <Alert variant="destructive">
          <AlertTitle>{"We couldn't save this entry"}</AlertTitle>
          <AlertDescription>
            What you typed is still here. Check your connection and try again.
          </AlertDescription>
        </Alert>
      )}
      <Button
        type="submit"
        disabled={form.pending}
        className={cn(BIG, "w-full")}
      >
        {form.pending ? "Saving…" : form.failed ? "Try again" : "Save"}
      </Button>
    </div>
  );
}

/** The other way to fill the form. A stand-in until Receipt review is in the prototype. */
export function ScanReceiptLink({ className }: { className?: string }) {
  return (
    <ScreenLink
      screen="Receipt review"
      className={cn(
        buttonVariants({ variant: "ghost", size: "lg" }),
        className,
      )}
    >
      <Camera data-icon="inline-start" aria-hidden="true" />
      Scan a receipt
    </ScreenLink>
  );
}
