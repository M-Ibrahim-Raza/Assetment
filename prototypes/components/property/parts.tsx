"use client";

import { CircleAlert, ExternalLink } from "lucide-react";
import { useId } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { BoughtDate } from "@proto/components/bought-date";
import { DISPLAY } from "@proto/components/display";
import { saveLabel } from "@proto/components/metals/parts";
import type { InstalmentEvery, PropertyKind } from "@proto/fixtures/property";
import { formatLakhCrore } from "@proto/kit/format";
import { AmountField } from "@proto/screens/setup/amount-field";
import { BIG, CHIP } from "@proto/screens/setup/look";
import { type PropertyPanelState, percentInput } from "./use-property";
import { EVERY_LABEL, KIND_LABEL, KINDS, SHARES, type ShareKey } from "./value";

// The parts every property form shares, whatever its layout.

/** A small label above a group of chips or fields. */
export const GROUP_LABEL = "text-sm font-medium";

/** A panel's heading, as in the gold form. */
export const PANEL_TITLE = cn(
  DISPLAY,
  "text-xl font-extrabold tracking-tight outline-none",
);

/** On phones a box inside the step card costs width, so the panel is a rule above it there. */
export const PANEL_BOX =
  "border-t border-current/15 pt-5 sm:rounded-2xl sm:border sm:p-6";

const SHARE_KEYS: readonly ShareKey[] = [
  ...SHARES.map((each) => each.key),
  "other",
];

interface KindChipsProps {
  value: PropertyKind;
  onValue: (kind: PropertyKind) => void;
  /** The id of the heading above the chips, "What it is", which names them. */
  labelledBy: string;
}

/** What it is, as chips. One is always picked. */
export function KindChips({ value, onValue, labelledBy }: KindChipsProps) {
  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        variant="outline"
        aria-labelledby={labelledBy}
        value={[value]}
        onValueChange={(next) => {
          const kind = KINDS.find((candidate) => candidate === next[0]);
          if (kind !== undefined) onValue(kind);
        }}
        className="flex-wrap"
      >
        {KINDS.map((kind) => (
          <ToggleGroupItem key={kind} value={kind} className={CHIP}>
            {KIND_LABEL[kind]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {value === "file" && (
        <p className="text-sm text-muted-foreground">
          A society booking with no plot number yet. Its value is the file rate
          dealers quote today.
        </p>
      )}
    </div>
  );
}

/** A field's error, with its icon, in place of the line under it. */
export function ErrorLine({ id, children }: { id: string; children: string }) {
  return (
    <FieldError id={id} className="flex items-center gap-1.5">
      <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
      {children}
    </FieldError>
  );
}

/** For someone unsure of the value: Zameen's index has an area's average. The value stays theirs. */
export function ZameenLink() {
  return (
    <a
      href="https://www.zameen.com/index/"
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {"Zameen's price index"}
      <ExternalLink aria-hidden="true" className="size-3.5" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** The user's share: chips for what people say, or a % for anything else. Only it counts. */
export function ShareField({
  panel,
  showPart = true,
}: {
  panel: PropertyPanelState;
  /** False where the form shows the share's value itself, as a line of its own. */
  showPart?: boolean;
}) {
  const { fields, set, errors, ids, value, part, share } = panel;
  const labelId = useId();
  const noteId = useId();
  const spoken = formatLakhCrore(part);
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex flex-col gap-2"
      data-invalid={errors.share !== null}
    >
      <span id={labelId} className={GROUP_LABEL}>
        Your share
      </span>
      <ToggleGroup
        variant="outline"
        aria-labelledby={labelId}
        value={[fields.share]}
        onValueChange={(next) => {
          const key = SHARE_KEYS.find((candidate) => candidate === next[0]);
          if (key !== undefined) set({ share: key });
        }}
        className="flex-wrap"
      >
        {SHARES.map((each) => (
          <ToggleGroupItem key={each.key} value={each.key} className={CHIP}>
            {each.label}
          </ToggleGroupItem>
        ))}
        <ToggleGroupItem value="other" className={CHIP}>
          Other
        </ToggleGroupItem>
      </ToggleGroup>
      {fields.share === "other" && (
        <Field data-invalid={errors.share !== null} className="max-w-48">
          <FieldLabel htmlFor={ids.percent}>Your share in %</FieldLabel>
          <InputGroup className="h-12">
            <InputGroupInput
              id={ids.percent}
              inputMode="decimal"
              autoComplete="off"
              value={fields.percent}
              onChange={(event) => {
                set({ percent: percentInput(event.target.value) });
              }}
              aria-invalid={errors.share !== null}
              aria-describedby={noteId}
              className="text-base tabular-nums md:text-base"
            />
            <InputGroupAddon align="inline-end">%</InputGroupAddon>
          </InputGroup>
        </Field>
      )}
      {errors.share === null ? (
        <FieldDescription id={noteId}>
          {showPart && share < 1 && value > 0 ? (
            <>
              Your share: <Money value={part} className="font-semibold" />
              {spoken !== null && ` (${spoken})`}. Only this counts.
            </>
          ) : (
            "Own it with family? Pick your part. Only that counts."
          )}
        </FieldDescription>
      ) : (
        <ErrorLine id={noteId}>{errors.share}</ErrorLine>
      )}
    </div>
  );
}

/** The earliest year offered: property is often held for decades. */
const FIRST_YEAR = 1960;

/** When it was bought: an exact date, or just the month and year. The day is optional. */
export function BoughtField({
  panel,
  today,
}: {
  panel: PropertyPanelState;
  today: string;
}) {
  const { fields, set, errors, ids } = panel;
  const [latest = 2026] = today.split("-").map(Number);
  return (
    <BoughtDate
      id={ids.day}
      parts={fields}
      onChange={set}
      firstYear={FIRST_YEAR}
      lastYear={latest}
      error={errors.bought}
    />
  );
}

const EVERY: readonly InstalmentEvery[] = ["quarter", "month"];

/**
 * "Still paying instalments?": a plot or file on a payment plan. While on, it asks what's left to
 * pay, which goes to Debts, and the instalment and how often, which are optional.
 */
export function InstalmentsField({
  id,
  panel,
}: {
  id: string;
  panel: PropertyPanelState;
}) {
  const { fields, set, errors, ids } = panel;
  const titleId = `${id}-paying`;
  const aboutId = `${id}-paying-note`;
  const everyId = `${id}-every`;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span id={titleId} className="font-semibold">
            Still paying instalments?
          </span>
          <span id={aboutId} className="text-sm text-muted-foreground">
            A plot or file on a payment plan. What’s left to pay counts in
            Debts.
          </span>
        </span>
        <Switch
          checked={fields.paying}
          onCheckedChange={(checked) => {
            set({ paying: checked });
          }}
          aria-labelledby={titleId}
          aria-describedby={aboutId}
          className="mt-1 shrink-0"
        />
      </div>
      {fields.paying && (
        <div className="flex flex-col gap-5">
          <AmountField
            id={ids.left}
            label="Left to pay"
            digits={fields.left}
            onDigits={(digits) => {
              set({ left: digits });
            }}
            hint="All the instalments still to come. We add it to Debts."
            error={errors.left}
          />
          <AmountField
            id={`${id}-instalment`}
            label="Each instalment (optional)"
            digits={fields.instalment}
            onDigits={(digits) => {
              set({ instalment: digits });
            }}
            hint="So we can remind you when one is due."
            error={null}
          />
          <div className="flex flex-col gap-2">
            <span id={everyId} className={GROUP_LABEL}>
              How often
            </span>
            <ToggleGroup
              variant="outline"
              aria-labelledby={everyId}
              spacing={0}
              value={[fields.every]}
              onValueChange={(next) => {
                const every = EVERY.find((candidate) => candidate === next[0]);
                if (every !== undefined) set({ every });
              }}
            >
              {EVERY.map((every) => (
                <ToggleGroupItem key={every} value={every} className={CHIP}>
                  {EVERY_LABEL[every]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      )}
    </div>
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

interface PanelActionsProps {
  panel: PropertyPanelState;
  isNew: boolean;
  /** Null for the first property: there's nothing to go back to. */
  onCancel: (() => void) | null;
  /** Null for a new property, which has nothing to remove yet. */
  onRemove: (() => void) | null;
}

/** Save, then Cancel, with Remove apart at the end. */
export function PanelActions({
  panel,
  isNew,
  onCancel,
  onRemove,
}: PanelActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={panel.save.pending} className={BIG}>
        {saveLabel(panel.save, isNew ? "Add property" : "Save")}
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
