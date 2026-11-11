"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { BLOCK, EYEBROW } from "@proto/components/blocks";
import { ScreenLink } from "@proto/components/screen-link";
import type { Usual } from "@proto/fixtures/usuals";
import { AmountField } from "@proto/screens/setup/amount-field";
import { PILL_TEXT } from "@proto/screens/setup/look";
import { dayLabel, TODAY } from "./days";
import {
  type BodyProps,
  DetailFields,
  KIND_FIELD,
  KindSwitch,
  NARROW_AMOUNT,
  PANEL_PAD,
  RestoredNote,
  SaveBar,
  ScanReceiptLink,
} from "./fields";
import { QuickAddFrame } from "./quick-add-frame";
import type { QuickAddViewProps } from "./scenarios";
import { currentUsual, type EntryForm } from "./use-entry-form";

/**
 * Quick add: the amount is the one big thing, on a block in the kind's colour, with the keypad
 * open from the start. Above it, a row of the user's usuals: one tap fills the category and the
 * account. Everything else is already filled in under it, so most entries are: tap, type, Save.
 * A quiet line under Save leads to the rarer forms, so a gold or share buy isn't logged as spending.
 */
export function QuickAddView(props: QuickAddViewProps) {
  return (
    <QuickAddFrame view={props} Body={QuickAddBody} Loading={QuickAddLoading} />
  );
}

const LINK = "font-semibold underline underline-offset-4";

/** The form, then the way to the trade and asset forms. Those are stand-ins until they are built. */
function QuickAddBody({ form }: BodyProps) {
  return (
    <>
      <QuickAddForm form={form} />
      <p className="px-1 pt-1 pb-2 text-sm">
        Bought gold, shares or property?{" "}
        <ScreenLink screen="Add trade" className={LINK}>
          Add a trade
        </ScreenLink>{" "}
        ·{" "}
        <ScreenLink screen="Add asset" className={LINK}>
          Add gold or property
        </ScreenLink>
      </p>
    </>
  );
}

// The most used few. Phones swipe through them, wider screens wrap them.
const ROW_SIZE = 8;

function QuickAddForm({ form }: BodyProps) {
  const { draft } = form;
  const usuals = form.usuals.slice(0, ROW_SIZE);
  const current = currentUsual(draft, usuals);
  // The usual the user tapped. Its last amount is offered only then, not when the form just opened on it.
  const [tappedId, setTappedId] = useState<string | null>(null);
  const offer =
    current?.id === tappedId && draft.digits === "" && current.lastAmount > 0
      ? current.lastAmount
      : null;

  const pick = (usual: Usual) => {
    form.applyUsual(usual);
    setTappedId(usual.id);
    // The keypad stays up: the amount is what is left to type.
    document.getElementById(form.amountId)?.focus();
  };

  return (
    // noValidate: the prototype shows its own messages next to the fields, not the browser's bubbles.
    <form noValidate onSubmit={form.submit} className="flex flex-col gap-3">
      <RestoredNote form={form} />
      <KindSwitch kind={draft.kind} onKind={form.setKind} />
      <UsualsRow usuals={usuals} current={current} form={form} onPick={pick} />
      <section
        className={cn(
          "relative pt-5 pb-6 transition-colors duration-200 motion-reduce:transition-none",
          NARROW_AMOUNT,
          KIND_FIELD[draft.kind],
          BLOCK,
          PANEL_PAD,
        )}
      >
        {/* In the corner, level with the Amount label: the other way to fill this form. At 200% zoom the two don't fit on one line, so it sits above. */}
        <ScanReceiptLink className="max-[279px]:-ml-2 min-[280px]:absolute min-[280px]:top-2.5 min-[280px]:right-2" />
        <AmountField
          id={form.amountId}
          label="Amount"
          digits={draft.digits}
          onDigits={form.setDigits}
          hint={caption(form)}
          error={form.amountError}
          size="display"
          onField
        />
        {offer !== null && (
          <Button
            type="button"
            variant="outline"
            className={cn(PILL_TEXT, "mt-3 h-10 px-4")}
            onClick={(event) => {
              form.setDigits(String(offer));
              // The amount is done, so focus moves on to Save. On a phone the keypad closes and Save comes into view.
              event.currentTarget.form
                ?.querySelector<HTMLElement>('button[type="submit"]')
                ?.focus();
            }}
          >
            <Money value={offer} /> again
          </Button>
        )}
      </section>
      <section className={cn("bg-card py-6", BLOCK, PANEL_PAD)}>
        <DetailFields form={form} />
      </section>
      <SaveBar form={form} />
    </form>
  );
}

/**
 * What is being saved, in a few words, under the amount. While the keypad covers the fields, it
 * is how the user checks the category, account and day.
 */
function caption(form: EntryForm): string {
  const { draft, from, to } = form;
  const note = draft.note.trim();
  const fromName = from?.name ?? "";
  const what =
    draft.kind === "transfer"
      ? [note, `${fromName} to ${to?.name ?? ""}`]
      : [note === "" ? draft.category : note, fromName];
  const day = draft.day === TODAY ? [] : [dayLabel(draft.day)];
  return [...what, ...day].filter((part) => part !== "").join(" · ");
}

/** A card in the row: as wide as two and a bit fit on a 320 px phone, so the cut-off one hints at more. */
/**
 * A card in the row. On phones each is 40% of the row, so two show whole and the third peeks in
 * from the screen's edge: the cue that the row swipes.
 */
const CARD = cn(
  "h-auto w-2/5 max-w-44 min-w-32 shrink-0 snap-start flex-col items-start justify-start gap-0.5 rounded-xl bg-card px-3 py-2 text-left",
  "aria-pressed:bg-foreground aria-pressed:text-background",
  "md:w-auto md:max-w-none md:min-w-0",
);

/**
 * The row on phones: it runs to both edges of the screen, past the panel's padding, so cards
 * slide in and out at the edge instead of being cut off inside it. It snaps card by card, and has
 * no scrollbar. The padding lines the first card up with the rest of the form.
 * From tablet width up, a grid of three, so an odd last card keeps its size.
 */
const ROW = cn(
  "-mx-3 w-auto snap-x snap-mandatory scroll-px-3 scrollbar-none flex-nowrap self-stretch overflow-x-auto overscroll-x-contain px-3 py-1 [&::-webkit-scrollbar]:hidden",
  "md:-mx-1 md:grid md:grid-cols-3 md:overflow-visible md:p-1",
);

interface UsualsRowProps {
  /** The usuals of the current kind, most used first. */
  usuals: readonly Usual[];
  /** The usual the form is set to, shown pressed. */
  current: Usual | undefined;
  form: EntryForm;
  onPick: (usual: Usual) => void;
}

/**
 * What the user logs most, above the amount, so it stays in view while the keypad is up. Before
 * there is any history, it isn't shown: the category chips below do the job.
 */
function UsualsRow({ usuals, current, form, onPick }: UsualsRowProps) {
  const labelId = useId();
  if (usuals.length === 0) return null;
  const nameOf = (id: string) =>
    form.places.find((place) => place.id === id)?.name ?? "";

  return (
    <section aria-labelledby={labelId} className="flex min-w-0 flex-col gap-2">
      <h3 id={labelId} className={cn(EYEBROW, "px-1")}>
        Your usuals
      </h3>
      <ToggleGroup
        aria-labelledby={labelId}
        variant="outline"
        value={current === undefined ? [] : [current.id]}
        onValueChange={(value) => {
          // Tapping the pressed one again picks it again, so its last amount is offered.
          const usual =
            usuals.find((candidate) => candidate.id === value[0]) ?? current;
          if (usual !== undefined) onPick(usual);
        }}
        className={ROW}
      >
        {usuals.map((usual) => (
          <ToggleGroupItem
            key={usual.id}
            value={usual.id}
            className={CARD}
            // Focus stays in the amount field, so the keypad doesn't drop and come back on each tap.
            onMouseDown={(event) => {
              event.preventDefault();
            }}
          >
            <span className="w-full truncate font-semibold">{usual.title}</span>
            <span className="w-full truncate text-xs opacity-80">
              {usual.kind === "transfer"
                ? `To ${nameOf(usual.toAccount)}`
                : nameOf(usual.account)}
            </span>
            {/* Its own line, so it is never cut off: it is what "again" will offer. */}
            <Money
              value={usual.lastAmount}
              className="w-full truncate text-xs font-medium"
            />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </section>
  );
}

/** Shaped like the form: the switch, the row of usuals, the amount block, the fields and Save. */
function QuickAddLoading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">Loading the form</span>
      {/* Darker than the default: the default is the panel's own colour. The cards are white, as they will be. */}
      <Skeleton className="h-10 w-full bg-foreground/10" />
      <Skeleton className="h-3 w-28 bg-foreground/10" />
      {/* Runs to the screen's edge like the row, with the third card peeking in. */}
      <div className="-mx-3 flex gap-2 overflow-hidden px-3 md:mx-0 md:grid md:grid-cols-3 md:px-0">
        {[1, 2, 3].map((card) => (
          <Skeleton
            key={card}
            className="h-16 w-2/5 max-w-44 min-w-32 shrink-0 bg-card md:w-auto md:max-w-none md:min-w-0"
          />
        ))}
      </div>
      <div
        className={cn("flex flex-col gap-3 bg-(--ink) py-8", BLOCK, PANEL_PAD)}
      >
        <Skeleton className="h-3 w-20 bg-(--ink-foreground)/20" />
        <Skeleton className="h-12 w-48 max-w-full bg-(--ink-foreground)/20" />
      </div>
      <div className={cn("flex flex-col gap-5 bg-card py-6", BLOCK, PANEL_PAD)}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-10 w-48 max-w-full" />
      </div>
      <Skeleton className="h-12 w-full bg-foreground/10" />
    </div>
  );
}
