"use client";

import { CircleAlert } from "lucide-react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { DISPLAY } from "@proto/components/display";
import { formatDigits, formatLakhCrore } from "@proto/kit/format";
import { helpText } from "./look";

// Up to Rs 99,999,999,999: far more than anyone tracks here, and it still fits on one line.
const MAX_DIGITS = 11;

/** Only the digits of what was typed or pasted, so "Rs 245,300" and "245300" both work. */
function toDigits(text: string): string {
  return text
    .replaceAll(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, MAX_DIGITS);
}

interface AmountFieldProps {
  id: string;
  label: string;
  /** What was typed so far, as digits with no commas. Empty when nothing was typed. */
  digits: string;
  onDigits: (digits: string) => void;
  /** The line under the field while it has no error. */
  hint: string;
  error: string | null;
  /** `display` is the big field of a screen that asks one question. */
  size?: "default" | "display";
  /** For a screen whose heading already asks the question. Screen readers still get the label. */
  labelHidden?: boolean;
  /** True on a colour or ink field, where grey and red text would be too faint. */
  onField?: boolean;
}

/**
 * A rupee amount field: the number keypad, commas as you type, and the amount in lakh or crore
 * under it, which catches a wrong zero. Paste works, with or without "Rs" and commas.
 */
export function AmountField({
  id,
  label,
  digits,
  onDigits,
  hint,
  error,
  size = "default",
  labelHidden = false,
  onField = false,
}: AmountFieldProps) {
  const amount = digits === "" ? null : Number(digits);
  const spoken = amount === null ? null : formatLakhCrore(amount);
  const noteId = `${id}-note`;
  const big = size === "display";

  return (
    // On a colour field the label keeps the field's colour, and the message carries the error.
    <Field data-invalid={error !== null && !onField}>
      <FieldLabel htmlFor={id} className={cn(labelHidden && "sr-only")}>
        {label}
      </FieldLabel>
      {/*
        The big field is a ledger line, like the line on a cheque: no box and no ring. The line is
        faint at rest and turns solid while you type, which is the focus cue. With an error it stays
        the text colour, because red is too faint on a colour field, and the message carries the error.
        The shadow thickens the line without moving the layout.
      */}
      <InputGroup
        className={cn(
          big
            ? cn(
                "h-auto items-baseline rounded-none border-0 border-b border-current/50 dark:bg-transparent",
                "has-[[data-slot=input-group-control]:focus-visible]:border-current has-[[data-slot=input-group-control]:focus-visible]:shadow-[0_1px_0_0_currentColor] has-[[data-slot=input-group-control]:focus-visible]:ring-0",
                "has-[[data-slot][aria-invalid=true]]:border-current has-[[data-slot][aria-invalid=true]]:ring-0",
                "has-[>[data-align=inline-start]]:[&>input]:pl-1",
              )
            : "h-12",
        )}
      >
        <InputGroupAddon
          className={cn(
            onField && "text-current",
            // Quieter than the number, on its baseline, so the amount leads.
            big &&
              cn(DISPLAY, "px-0 text-xl font-semibold opacity-80 sm:text-2xl"),
          )}
        >
          Rs
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="0"
          value={amount === null ? "" : formatDigits(amount)}
          onChange={(event) => {
            onDigits(toDigits(event.target.value));
          }}
          aria-invalid={error !== null}
          aria-describedby={noteId}
          className={cn(
            "tabular-nums",
            onField && "placeholder:text-current/40",
            big
              ? cn(
                  DISPLAY,
                  "h-auto py-2 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-5xl",
                )
              : "text-base md:text-base",
          )}
        />
      </InputGroup>
      {error === null ? (
        <FieldDescription id={noteId} className={helpText(onField)}>
          {spoken !== null && <span className="font-semibold">{spoken}. </span>}
          {hint}
        </FieldDescription>
      ) : (
        <FieldError
          id={noteId}
          className={cn(
            "flex items-center gap-1.5",
            onField && "font-semibold text-current",
          )}
        >
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </FieldError>
      )}
    </Field>
  );
}
