"use client";

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import {
  BLOCK,
  DISPLAY,
  EYEBROW,
  INK,
  PAD,
} from "@proto/screens/dashboard/parts";
import { CompareSheet } from "./compare-sheet";
import {
  comparePace,
  type Comparison,
  daysLabel,
  longDaysLabel,
  type MonthSummary,
  pickableMonths,
  resolveComparison,
} from "./math";
import { comparedDaysLabel, Headline, LakhNote, totalSize } from "./parts";
import type { Spending } from "./scenarios";
import type { SpendingParams } from "./use-spending-params";

// The arrows on ink: white, with a faint white fill on hover.
export const INK_ICON =
  "size-11 rounded-full text-(--ink-foreground) hover:bg-(--ink-foreground)/10 hover:text-(--ink-foreground) focus-visible:ring-(--ink-foreground)/50 disabled:opacity-30";

// A chip on ink: a white outline, filled white when picked. On a phone it's 36 px tall, so three
// don't crowd the block, and an unseen margin above and below keeps its tap area 44 px. The margin
// is measured from inside the 1 px border, so it's 5 px. On wider blocks it's 44 px itself.
const INK_CHIP =
  "relative h-9 rounded-full border border-(--ink-foreground)/40 px-3.5 text-sm font-semibold outline-none after:absolute after:inset-x-0 after:-inset-y-1.25 focus-visible:ring-3 focus-visible:ring-(--ink-foreground)/50 aria-pressed:border-transparent aria-pressed:bg-(--ink-foreground) aria-pressed:text-(--ink) @md:h-11 @md:px-4";

/**
 * The top of Spending, always shown: the month with its arrows, the total, the answer line, and
 * what the whole screen is compared with: last month, the usual month or a month picked in a
 * sheet. Each pick (a category, an account, days) shows as a chip that clears it.
 */
export function SummaryBlock({
  spending,
  summary,
  params,
}: {
  spending: Spending;
  /** The month, narrowed to what is picked. */
  summary: MonthSummary;
  params: SpendingParams;
}) {
  const { month, days, comparison, comparedDays, total, before } = summary;
  const { category, account } = params;
  const compareId = useId();
  const [picking, setPicking] = useState(false);
  // The comparison's whole month: next to "by now" in the current month, alone for a past one.
  const inAll =
    days === null && comparison && before !== null
      ? (comparePace(
          spending,
          month.key,
          { category, account },
          comparison,
        )?.running.at(-1) ?? null)
      : null;
  const figureName = comparison ? figureTerm(comparison) : "";
  // The chips show only what has data. Usual needs two months before this one.
  const others = pickableMonths(spending, month.key);
  const hasLast =
    resolveComparison(spending, month.key, { kind: "last" }) !== null;
  const hasUsual =
    resolveComparison(spending, month.key, { kind: "usual" })?.kind === "usual";
  const kind = comparison?.kind;

  const keys = spending.months.map((data) => data.month);
  const index = keys.indexOf(month.key);
  const earlier = keys[index - 1];
  const later = keys[index + 1];

  return (
    <section
      aria-labelledby="summary-heading"
      className={cn(
        "@container flex flex-col gap-4 pt-3 pb-6",
        INK,
        BLOCK,
        PAD,
      )}
    >
      <div className="-mx-2 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon-lg"
          className={INK_ICON}
          aria-label="Previous month"
          disabled={earlier === undefined}
          onClick={() => {
            if (earlier !== undefined) params.setMonth(earlier);
          }}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <h2
          id="summary-heading"
          aria-live="polite"
          className={cn(EYEBROW, "text-center")}
        >
          {month.name} {month.year}
          {month.current ? " so far" : ""}
        </h2>
        <Button
          variant="ghost"
          size="icon-lg"
          className={INK_ICON}
          aria-label="Next month"
          disabled={later === undefined}
          onClick={() => {
            if (later !== undefined) params.setMonth(later);
          }}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        {(category !== undefined || account !== undefined || days !== null) && (
          <div className="mb-1 flex flex-wrap gap-2">
            {category !== undefined && (
              <InkChip
                label={category}
                clear={`Show all categories, not only ${category}`}
                onClear={() => {
                  params.setCategory(undefined);
                }}
              />
            )}
            {account !== undefined && (
              <InkChip
                label={account}
                clear={`Show all accounts, not only ${account}`}
                onClear={() => {
                  params.setAccount(undefined);
                }}
              />
            )}
            {days && (
              <InkChip
                label={daysLabel(month, days)}
                clear={`Show all of ${month.name}, not only ${longDaysLabel(month, days)}`}
                onClear={() => {
                  params.setDays(undefined);
                }}
              />
            )}
          </div>
        )}
        <p
          className={cn(
            DISPLAY,
            "leading-none font-extrabold tracking-tight",
            totalSize(total),
          )}
        >
          <Money value={total} />
        </p>
        <LakhNote value={total} className="font-semibold" />
        <p className="pt-1 text-base text-balance @md:text-lg">
          <Headline summary={summary} />
        </p>
      </div>

      {others.length > 0 && (
        <div className="flex flex-col gap-4 border-t border-(--ink-foreground)/20 pt-4">
          <div className="flex flex-col gap-2">
            <p id={compareId} className="text-sm font-medium">
              Compare with
            </p>
            <div
              role="group"
              aria-labelledby={compareId}
              className="flex flex-wrap gap-2"
            >
              {hasLast && (
                <button
                  type="button"
                  aria-pressed={kind === "last"}
                  className={INK_CHIP}
                  onClick={() => {
                    params.setCompare({ kind: "last" });
                  }}
                >
                  Last month
                </button>
              )}
              {hasUsual && (
                <button
                  type="button"
                  aria-pressed={kind === "usual"}
                  className={INK_CHIP}
                  onClick={() => {
                    params.setCompare({ kind: "usual" });
                  }}
                >
                  Usual
                </button>
              )}
              <button
                type="button"
                aria-pressed={kind === "month"}
                aria-haspopup="dialog"
                className={cn(
                  INK_CHIP,
                  "inline-flex items-center gap-1.5 pl-3",
                )}
                onClick={() => {
                  setPicking(true);
                }}
              >
                <CalendarDays aria-hidden="true" className="size-4" />
                {kind === "month" ? comparison?.short : "Pick a month"}
              </button>
            </div>
          </div>
          <CompareSheet
            open={picking}
            onOpenChange={setPicking}
            shown={month}
            months={others}
            picked={kind === "month" ? comparison?.months[0]?.key : undefined}
            onPick={(key) => {
              params.setCompare({ kind: "month", key });
            }}
          />

          {comparison && before !== null && (
            <dl className="flex flex-col gap-1.5 @md:flex-row @md:gap-8">
              {comparedDays && days ? (
                <Figure
                  term={comparedDaysLabel(comparison, comparedDays)}
                  value={before}
                />
              ) : (
                <>
                  {month.current && (
                    <Figure term={`${figureName} by now`} value={before} />
                  )}
                  {inAll !== null && (
                    <Figure term={`${figureName} in all`} value={inAll} />
                  )}
                </>
              )}
            </dl>
          )}
        </div>
      )}
    </section>
  );
}

/** A pick on the ink block, white on ink. Tapping it clears the pick. */
function InkChip({
  label,
  clear,
  onClear,
}: {
  label: string;
  /** What tapping it does, for screen readers. */
  clear: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={clear}
      onClick={onClear}
      className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-full bg-(--ink-foreground) pr-2.5 pl-3.5 text-sm font-semibold text-(--ink) outline-none focus-visible:ring-3 focus-visible:ring-(--ink-foreground)/50"
    >
      <span className="min-w-0 truncate">{label}</span>
      <X aria-hidden="true" className="size-4 shrink-0" />
    </button>
  );
}

/** "October", "Usual" or "Mar 2026": a comparison's name at the start of a figure's term. */
export function figureTerm(comparison: Comparison): string {
  if (comparison.kind === "usual") return "Usual";
  return comparison.kind === "month" ? comparison.short : comparison.name;
}

/** A term and its amount. `children` stands in for the amount where it is a guess. */
type FigureProps = { term: string } & (
  { value: number } | { children: ReactNode }
);

/**
 * A term and its amount, in an ink block's figures: side by side on phones, the amount under its
 * term in a row of columns on wider blocks.
 */
export function Figure(props: FigureProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 @md:flex-col @md:items-start @md:gap-0.5">
      <dt className="text-sm font-medium">{props.term}</dt>
      <dd className="shrink-0 font-bold whitespace-nowrap">
        {"value" in props ? <Money value={props.value} /> : props.children}
      </dd>
    </div>
  );
}
