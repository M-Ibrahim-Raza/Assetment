"use client";

import { use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AmountsContext } from "@proto/components/amounts";
import { BLOCK, PAD } from "@proto/components/blocks";
import { DISPLAY } from "@proto/components/display";
import { formatLakhCrore } from "@proto/kit/format";
import type { MonthInfo } from "@proto/screens/spending/math";
import { type MonthCell, monthName, RANGES, type RangeKey } from "./math";
import type { CategoryBook } from "./scenarios";

// The look the Categories pages share: white cards, headings and big numbers in the display face,
// the range's name, and amounts as people say them.

/** A white block under the ink one. */
export const CARD = cn(
  "@container flex flex-col gap-4 bg-card py-6 text-card-foreground",
  BLOCK,
  PAD,
);

/** The heading of a white block. */
export const CARD_HEADING = cn(
  DISPLAY,
  "text-2xl/tight font-extrabold tracking-tight",
);

/** The big number on the ink block. */
export const BIG_NUMBER = cn(
  DISPLAY,
  "leading-none font-extrabold tracking-tight",
);

/**
 * What the range covers, for the eyebrow: "Last 12 months", "2026 so far", "Since July", or
 * "November so far" when there's one month.
 */
export function rangeTitle(
  months: readonly MonthInfo[],
  range: RangeKey,
  today: CategoryBook["today"],
): string {
  const [first] = months;
  if (first === undefined) return RANGES[range].label;
  if (months.length === 1) return `${monthName(first, today)} so far`;
  const back = RANGES[range].back;
  // The person started after the range would begin.
  const wanted = back === null ? Number(today.month.slice(5)) : back + 1;
  if (months.length < wanted) return `Since ${monthName(first, today)}`;
  if (back === null) return `${today.month.slice(0, 4)} so far`;
  return `Last ${String(months.length)} months`;
}

/** "12 months" or "1 month": how many months the range has, for sentences. */
export function monthsWord(count: number): string {
  return `${String(count)} ${count === 1 ? "month" : "months"}`;
}

/** How people say an amount, "4 lakh", or null under a lakh or while amounts are hidden. */
export function useSpoken(): (value: number) => string | null {
  const { hidden } = use(AmountsContext);
  return (value) => (hidden ? null : formatLakhCrore(value));
}

/**
 * One small bar a month, each against the row's own busiest month, so a small category's pattern
 * shows too. The current month is outlined: it isn't over. A month with nothing has a stub. The
 * words beside it carry the numbers, so screen readers skip it.
 */
export function MiniBars({
  cells,
  className,
}: {
  cells: readonly MonthCell[];
  className?: string;
}) {
  const largest = Math.max(1, ...cells.map((cell) => cell.spent));
  return (
    <span
      aria-hidden="true"
      className={cn("flex h-8 items-end gap-0.5", className)}
    >
      {cells.map((cell) => (
        <span
          key={cell.month.key}
          className="flex h-full min-w-0 flex-1 items-end"
        >
          {cell.spent === 0 ? (
            <span className="h-0.5 w-full rounded-full bg-muted-foreground/30" />
          ) : (
            <span
              className={cn(
                "w-full rounded-t-[3px]",
                cell.month.current
                  ? "border-[1.5px] border-dashed border-primary bg-primary/15 dark:border-chart-1"
                  : "bg-primary dark:bg-chart-1",
              )}
              style={{
                height: `${String(Math.max(8, (cell.spent / largest) * 100))}%`,
              }}
            />
          )}
        </span>
      ))}
    </span>
  );
}

/** Rows while loading: a name and amount, a strip of bars, a line of words. */
export function RowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={CARD}>
      <Skeleton className="h-7 w-44" />
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex flex-col gap-2 py-1">
          <div className="flex justify-between gap-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
  );
}
