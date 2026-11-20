"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { BLOCK, PAD } from "@proto/components/blocks";
import type { MonthInfo } from "@proto/screens/spending/math";

// The parts of the month-by-month chart and of a picked month, shared by the Categories pages.

/** A flat block on the page. */
export const SURFACE = cn("bg-card py-5 text-card-foreground", BLOCK, PAD);

/** The rest of the categories, together: grey stripes, as on Spending's donut. */
export const STRIPES =
  "repeating-linear-gradient(135deg, var(--muted) 0 3px, var(--muted-foreground) 3px 4.5px)";

/** The plot's height: tall, and taller beside the panel. */
export const PLOT =
  "relative h-56 @min-[30rem]/chart:h-64 @min-[40rem]/chart:h-72";

/** The plot when it fills its column: the same heights as a floor, and taller when there's room. */
export const PLOT_FILL =
  "relative min-h-56 flex-1 @min-[30rem]/chart:min-h-64 @min-[40rem]/chart:min-h-72";

/** A column's width: shares the row, but one or a few columns don't stretch across the chart. */
export const COLUMN = "min-w-0 flex-1 max-w-20";

/**
 * The amount at the plot's top. One month over 2.5 times the next biggest, such as a renovation,
 * is cut short with a break mark, so the other months stay readable, as Spending's daily bars do.
 */
export function scaleOf(
  values: readonly number[],
  average: number | null,
): { largest: number; cut: boolean } {
  const [first = 0, second = 0] = values
    .filter((value) => value > 0)
    .toSorted((one, two) => two - one);
  if (second > 0 && first > second * 2.5) {
    return { largest: Math.max(second, average ?? 0) * 1.25, cut: true };
  }
  return { largest: Math.max(1, first, average ?? 0) * 1.08, cut: false };
}

/** A bar's height in the plot, never past its top. */
export function heightOf(value: number, largest: number): string {
  return `${String(Math.min(value / largest, 1) * 100)}%`;
}

/** Across the top of a bar cut short: a slanted gap in the card's colour. */
export function BreakMark() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-0 top-3 z-10 h-1.5 -skew-y-12 bg-card"
    />
  );
}

/** "Dec 2025 to Nov 2026", or "November 2026" for one month. */
export function spanOf(months: readonly MonthInfo[]): string {
  const first = months[0];
  const last = months.at(-1);
  if (first === undefined || last === undefined) return "";
  if (first.key === last.key) return `${first.name} ${String(first.year)}`;
  return `${first.short} ${String(first.year)} to ${last.short} ${String(last.year)}`;
}

/** "March 2026" or "November so far", for headings and labels. */
export function monthHeading(month: MonthInfo): string {
  return month.current
    ? `${month.name} so far`
    : `${month.name} ${String(month.year)}`;
}

/**
 * The dashed line at the average, with its amount on a label at its left. Nothing without an
 * average (no finished month yet).
 */
export function AverageLine({
  average,
  largest,
  labelled = true,
}: {
  average: number | null;
  largest: number;
  /** False when the key carries the amount, so labels over the bars have the room. */
  labelled?: boolean;
}) {
  if (average === null || average <= 0) return null;
  const bottom = `${String((average / largest) * 100)}%`;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-foreground/70"
      style={{ bottom }}
    >
      {labelled && (
        <span className="absolute bottom-1 left-0 rounded-md bg-card/90 px-1 text-xs font-semibold">
          Average <Money value={average} />
        </span>
      )}
    </div>
  );
}

/**
 * Month names under the columns. With many columns on a narrow chart every other one shows,
 * always this month's.
 */
export function MonthLabels({
  months,
  picked,
  marked,
}: {
  months: readonly MonthInfo[];
  picked: string | undefined;
  /** Months with a dot after their name, such as months with a note. */
  marked?: ReadonlySet<string> | undefined;
}) {
  const crowded = months.length > 7;
  return (
    <div
      aria-hidden="true"
      className="mt-2 flex justify-center gap-0.5 @min-[24rem]/chart:gap-1"
    >
      {months.map((month, index) => (
        <span
          key={month.key}
          className={cn(
            COLUMN,
            "text-center text-xs text-muted-foreground",
            month.key === picked && "font-bold text-foreground",
            crowded &&
              (months.length - 1 - index) % 2 === 1 &&
              "@max-[30rem]/chart:invisible",
          )}
        >
          {month.short}
          {marked?.has(month.key) === true && <NoteDot />}
        </span>
      ))}
    </div>
  );
}

/** The dot after a month's name that says it has a note. */
export function NoteDot() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block size-1.5 rounded-full bg-primary align-middle dark:bg-chart-1"
    />
  );
}

/** Under the chart: what the dashed outline and the dashed line mean. */
export function ChartKey({
  current,
  average,
  cut,
  amount = null,
  extra,
  className = "mt-3",
}: {
  current: MonthInfo | undefined;
  average: boolean;
  /** The average's amount, when the line itself carries no label. */
  amount?: number | null;
  /** The month cut short and its amount, which the bar can't show. */
  cut?: { month: MonthInfo; value: number } | null;
  /** More marks to explain, such as a band or a dot, after the others. */
  extra?: ReactNode;
  /** Its place: under the chart by default. */
  className?: string;
}) {
  if (current === undefined && !average && !cut && extra === undefined) {
    return null;
  }
  return (
    <p
      aria-hidden="true"
      className={cn(
        "flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground",
        className,
      )}
    >
      {current !== undefined && (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border-2 border-dashed border-foreground/60" />
          {current.short} so far
        </span>
      )}
      {average && (
        <span className="inline-flex items-center gap-1.5">
          <span className="w-5 border-t-2 border-dashed border-foreground/70" />
          Average a month
          {amount !== null && (
            <>
              :{" "}
              <Money value={amount} className="font-semibold text-foreground" />
            </>
          )}
        </span>
      )}
      {cut && (
        <span className="inline-flex items-center gap-1.5">
          <span className="relative size-3 overflow-hidden rounded-sm bg-(--chart-1)">
            <span className="absolute inset-x-0 top-1 h-1 -skew-y-12 bg-card" />
          </span>
          {cut.month.short} cut short: <Money value={cut.value} />
        </span>
      )}
      {extra}
    </p>
  );
}

/**
 * A month against an average, in words and an arrow, never red: "Rs 4,200 over average", "Rs 3,000
 * under its average", or "About average" within 2%.
 */
export function AgainstAverage({
  spent,
  average,
  its = false,
  className,
}: {
  spent: number;
  average: number | null;
  /** "its average", for one category. */
  its?: boolean;
  className?: string;
}) {
  if (average === null || average <= 0) return null;
  const change = spent - average;
  const what = its ? "its average" : "average";
  if (Math.abs(change) <= average * 0.02) {
    return <p className={className}>About {what}</p>;
  }
  const Icon = change > 0 ? ArrowUp : ArrowDown;
  return (
    <p className={cn("inline-flex items-center gap-1", className)}>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span>
        <Money value={Math.abs(change)} /> {change > 0 ? "over" : "under"}{" "}
        {what}
      </span>
    </p>
  );
}

/** A pick, shown as a chip that clears it. */
export function ClearChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="lg"
      aria-label={`Clear ${label}`}
      onClick={onClear}
      className="h-11 max-w-full gap-1.5 rounded-full bg-card pr-3 pl-4 text-sm font-semibold text-card-foreground"
    >
      <span className="min-w-0 truncate">{label}</span>
      <X aria-hidden="true" className="size-4" />
    </Button>
  );
}

/** The month in the panel, with arrows to the month before and after, inside the range. */
export function MonthStepper({
  months,
  month,
  onPick,
}: {
  months: readonly MonthInfo[];
  month: MonthInfo;
  onPick: (key: string) => void;
}) {
  const index = months.findIndex((one) => one.key === month.key);
  const earlier = months[index - 1];
  const later = months[index + 1];
  return (
    <div className="-mx-2 flex items-center justify-between gap-2">
      <Button
        variant="ghost"
        size="icon-lg"
        className="size-11 rounded-full"
        aria-label="Month before"
        disabled={earlier === undefined}
        onClick={() => {
          if (earlier !== undefined) onPick(earlier.key);
        }}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <h2
        aria-live="polite"
        className="min-w-0 text-center text-lg font-semibold tracking-tight"
      >
        {monthHeading(month)}
      </h2>
      <Button
        variant="ghost"
        size="icon-lg"
        className="size-11 rounded-full"
        aria-label="Month after"
        disabled={later === undefined}
        onClick={() => {
          if (later !== undefined) onPick(later.key);
        }}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
