"use client";

import { ArrowRight, CircleAlert, Clock } from "lucide-react";
import { useId } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { HEADING } from "@proto/components/blocks";
import { DISPLAY } from "@proto/components/display";
import {
  KARATS,
  type Karat,
  type Metal,
  type MetalForm,
  type MetalRates,
  type WeightUnit,
} from "@proto/fixtures/metals";
import { formatDigits, formatLakhCrore } from "@proto/kit/format";
import { AmountField } from "@proto/screens/setup/amount-field";
import { BIG, CHIP, STEP_FOOTER, TALL_FIELD } from "@proto/screens/setup/look";
import type { MetalsFormProps } from "./form";
import {
  gramsInput,
  onlyDigits,
  type Piece,
  type PieceFields,
} from "./use-piece";
import { describe, formatRateDate, rateIn, rateOf, UNIT_WORD } from "./weight";

// The parts of the gold and silver form, kept apart so Quick add and Portfolio can reuse them.

/** A question's heading, with no outline when focus moves to it. */
export const TITLE = cn(HEADING, "outline-none");

/** A small label above a group of chips or fields. */
const GROUP_LABEL = "text-sm font-medium";

/** The id of the first weight field, so a form can move focus there. */
export const weightInputId = (base: string) => `${base}-weight`;

type WeightPart = "tola" | "masha" | "ratti" | "grams";

// Tola takes up to 4 digits (9,999 tola). Masha and ratti take 2, so "12 masha" can be caught.
const PARTS: Readonly<
  Record<WeightUnit, readonly { key: WeightPart; label: string; max: number }[]>
> = {
  tola: [
    { key: "tola", label: "Tola", max: 4 },
    { key: "masha", label: "Masha", max: 2 },
    { key: "ratti", label: "Ratti", max: 2 },
  ],
  grams: [{ key: "grams", label: "Grams", max: 10 }],
};

interface WeightFieldProps {
  /** Ids inside the field start with it. The first input is `weightInputId(id)`. */
  id: string;
  piece: Piece;
  /** Shown only after the user tried to go on. */
  error: string | null;
  /** `display` is the big field of a screen that asks one question. */
  size?: "default" | "display";
  className?: string;
}

/**
 * The weight, in the unit the user knows: tola, masha and ratti side by side, each optional, or
 * grams. The switch keeps what was typed, converted.
 */
export function WeightField({
  id,
  piece,
  error,
  size = "default",
  className,
}: WeightFieldProps) {
  const { fields, set, setUnit } = piece;
  const labelId = `${id}-label`;
  const noteId = `${id}-note`;
  const big = size === "display";
  const parts = PARTS[fields.unit];

  const onChange = (key: WeightPart, max: number, text: string) => {
    const patch: Partial<Record<WeightPart, string>> = {};
    patch[key] = key === "grams" ? gramsInput(text) : onlyDigits(text, max);
    set(patch);
  };

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span id={labelId} className={GROUP_LABEL}>
          Weight
        </span>
        <ToggleGroup
          variant="outline"
          aria-label="Weigh in"
          value={[fields.unit]}
          onValueChange={(next) => {
            if (next[0] === "tola" || next[0] === "grams") setUnit(next[0]);
          }}
          spacing={0}
        >
          <ToggleGroupItem value="tola" className={cn(CHIP, "h-9 px-3")}>
            Tola
          </ToggleGroupItem>
          <ToggleGroupItem value="grams" className={cn(CHIP, "h-9 px-3")}>
            Grams
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div
        className={cn(
          "grid gap-3",
          fields.unit === "grams" ? "max-w-60 grid-cols-1" : "grid-cols-3",
        )}
      >
        {parts.map(({ key, label, max }, index) => {
          const inputId = index === 0 ? weightInputId(id) : `${id}-${key}`;
          return (
            <Field key={key} data-invalid={error !== null} className="min-w-0">
              <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
              <Input
                id={inputId}
                inputMode={key === "grams" ? "decimal" : "numeric"}
                autoComplete="off"
                enterKeyHint="next"
                placeholder="0"
                value={fields[key]}
                onChange={(event) => {
                  onChange(key, max, event.target.value);
                }}
                aria-invalid={error !== null}
                aria-describedby={noteId}
                className={cn(
                  "tabular-nums",
                  big
                    ? cn(
                        DISPLAY,
                        "h-auto rounded-none border-0 border-b border-current/50 bg-transparent px-0 py-1 text-4xl font-extrabold tracking-tight shadow-none focus-visible:border-current focus-visible:shadow-[0_1px_0_0_currentColor] focus-visible:ring-0 md:text-5xl dark:bg-transparent",
                      )
                    : TALL_FIELD,
                )}
              />
            </Field>
          );
        })}
      </div>
      {error === null ? (
        <FieldDescription id={noteId}>
          {fields.unit === "grams"
            ? "As printed on the bar or the receipt."
            : "Fill in what you know. 12 masha make a tola, 8 ratti a masha."}
        </FieldDescription>
      ) : (
        <FieldError id={noteId} className="flex items-center gap-1.5">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </FieldError>
      )}
    </div>
  );
}

interface KaratChipsProps {
  value: Karat | null;
  onValue: (karat: Karat) => void;
  /** Turns the help line off where the screen already explains it. */
  hint?: boolean;
  className?: string;
}

/** The karat, as chips. One is always picked. */
export function KaratChips({
  value,
  onValue,
  hint = true,
  className,
}: KaratChipsProps) {
  const labelId = useId();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span id={labelId} className={GROUP_LABEL}>
        Karat
      </span>
      <ToggleGroup
        variant="outline"
        aria-labelledby={labelId}
        value={value === null ? [] : [value]}
        onValueChange={(next) => {
          const karat = KARATS.find((candidate) => candidate === next[0]);
          if (karat !== undefined) onValue(karat);
        }}
        className="flex-wrap"
      >
        {KARATS.map((karat) => (
          <ToggleGroupItem key={karat} value={karat} className={CHIP}>
            {karat}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {hint && (
        <p className="text-sm text-muted-foreground">
          Not sure? Jewellery here is mostly 21K. Bars and coins are 24K.
        </p>
      )}
    </div>
  );
}

interface KindChoiceProps {
  fields: Pick<PieceFields, "metal" | "form">;
  onKind: (metal: Metal, form: MetalForm) => void;
}

/** Gold or silver, and jewellery or a bar or coin: two small switches on one line. */
export function KindChoice({ fields, onKind }: KindChoiceProps) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      <ToggleGroup
        variant="outline"
        aria-label="Metal"
        spacing={0}
        value={[fields.metal]}
        onValueChange={(next) => {
          if (next[0] === "gold" || next[0] === "silver") {
            onKind(next[0], fields.form);
          }
        }}
      >
        <ToggleGroupItem value="gold" className={CHIP}>
          Gold
        </ToggleGroupItem>
        <ToggleGroupItem value="silver" className={CHIP}>
          Silver
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        variant="outline"
        aria-label="Kind"
        spacing={0}
        // A coin counts as "Bar or coin": both sell back at the full rate.
        value={[fields.form === "coin" ? "bar" : fields.form]}
        onValueChange={(next) => {
          if (next[0] === "jewellery" || next[0] === "bar") {
            onKind(fields.metal, next[0]);
          }
        }}
      >
        <ToggleGroupItem value="jewellery" className={CHIP}>
          Jewellery
        </ToggleGroupItem>
        <ToggleGroupItem value="bar" className={CHIP}>
          Bar or coin
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

interface NameFieldProps {
  id: string;
  value: string;
  onValue: (name: string) => void;
  className?: string;
}

/** What the user calls the piece. Optional: a blank name gets "Gold jewellery" or similar. */
export function NameField({ id, value, onValue, className }: NameFieldProps) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>Name (optional)</FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(event) => {
          onValue(event.target.value);
        }}
        autoComplete="off"
        autoCapitalize="sentences"
        maxLength={80}
        aria-describedby={`${id}-note`}
        className={TALL_FIELD}
      />
      <FieldDescription id={`${id}-note`}>
        Like “Bangles” or “Biscuit”.
      </FieldDescription>
    </Field>
  );
}

interface PaidFieldProps {
  id: string;
  digits: string;
  onDigits: (digits: string) => void;
  size?: "default" | "display";
  labelHidden?: boolean;
  /** The line under the field. */
  hint?: string;
}

/** What was paid, if known. Never pushed: gifts and inheritance have no price. */
export function PaidField({
  id,
  digits,
  onDigits,
  size = "default",
  labelHidden = false,
  hint = "Leave it empty for a gift or an inheritance. With it, we show your gain.",
}: PaidFieldProps) {
  return (
    <AmountField
      id={id}
      label="What you paid (if you know)"
      digits={digits}
      onDigits={onDigits}
      hint={hint}
      error={null}
      size={size}
      labelHidden={labelHidden}
    />
  );
}

/** The day of the rates. Old rates say so calmly: the value still shows. */
export function RateNote({
  rates,
  className,
}: {
  rates: MetalRates;
  className?: string;
}) {
  const date = formatRateDate(rates.date);
  if (!rates.stale) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        At the Sarafa rate of {date}.
      </p>
    );
  }
  return (
    <p className={cn("flex items-start gap-2 text-sm", className)}>
      <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="font-semibold">Rates from {date}.</span>{" "}
        {"Today's Sarafa rate isn't out yet. We'll update it when it is."}
      </span>
    </p>
  );
}

interface ValueLineProps {
  value: number;
  estimated: boolean;
  rates: MetalRates;
  /** What it is, and the unit it's weighed in, which the rate is quoted in. */
  fields: Pick<PieceFields, "metal" | "form" | "karat" | "unit">;
  size?: "default" | "display";
  className?: string;
}

/**
 * What the piece is worth at the day's rate, as it's typed, with the rate it's priced at in the
 * unit it's weighed in. ≈ in front of a guessed weight.
 */
export function ValueLine({
  value,
  estimated,
  rates,
  fields,
  size = "default",
  className,
}: ValueLineProps) {
  const spoken = formatLakhCrore(value);
  const rate = rateIn(rateOf(fields, rates), fields.unit);
  const big = size === "display";
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p
        className={cn(
          DISPLAY,
          "leading-none font-extrabold tracking-tight",
          big ? "text-4xl sm:text-5xl" : "text-2xl",
        )}
      >
        {estimated && (
          <>
            <span aria-hidden="true">≈ </span>
            <span className="sr-only">About </span>
          </>
        )}
        <Money value={value} />
      </p>
      <p className="text-sm">
        {spoken !== null && <span className="font-semibold">{spoken} · </span>}
        {describe(fields)} at Rs {formatDigits(rate)} a {UNIT_WORD[fields.unit]}{" "}
        {/* A no-break space keeps "(12 Nov)" on one line. */}(
        {formatRateDate(rates.date).replace(" ", "\u00a0")}
        {rates.stale && ", today's isn't out yet"})
      </p>
    </div>
  );
}

/** A save that failed. What was typed is still in the form. */
export function SaveFailed({ name }: { name: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{`We couldn't save ${name}`}</AlertTitle>
      <AlertDescription>
        Your weight is still here. Check your connection and try again.
      </AlertDescription>
    </Alert>
  );
}

/** A one-tap way past the form while nothing is added, such as "Skip for now". */
export function SkipButton({ skip }: { skip: MetalsFormProps["skip"] }) {
  if (skip === null) return null;
  return (
    <Button
      variant="ghost"
      className="-ml-4 self-start underline underline-offset-4"
      onClick={skip.onSkip}
    >
      {skip.label}
    </Button>
  );
}

/** The bottom of the form once something is added: a hairline, then the way on. */
export function DoneFooter({ done }: { done: MetalsFormProps["done"] }) {
  return (
    <div className={STEP_FOOTER}>
      <Button className={BIG} onClick={done.onDone}>
        {done.label}
        <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  );
}

/** The label of a form's save button, for its states. */
export function saveLabel(
  save: { pending: boolean; failed: boolean },
  idle: string,
): string {
  if (save.pending) return "Saving…";
  return save.failed ? "Try again" : idle;
}
