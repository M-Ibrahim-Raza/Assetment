"use client";

import Link from "next/link";
import { type ReactNode, use } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AmountsContext, Money } from "@proto/components/amounts";
import type { MonthInfo } from "@proto/screens/spending/math";
import { useAmountText } from "@proto/screens/spending/parts";
import { type BookSummary, categoryPath, summarizeBook } from "./math";
import type { CategoryBook } from "./scenarios";
import { type CategoriesParams } from "./use-categories-params";
import {
  AverageLine,
  BreakMark,
  ChartKey,
  COLUMN,
  heightOf,
  MonthLabels,
  monthHeading,
  NoteDot,
  PLOT,
  PLOT_FILL,
  scaleOf,
  STRIPES,
} from "./chart-parts";

// The month-by-month chart: each month a column, split by the top 5 categories (or one category
// alone), with its total on top, the average line, the usual range, notes and this month's likely
// end. A tap picks a month. Shared by the Categories pages.

/** How a category is drawn: its chart colour, the stripes of the rest, or ink when picked from the rest. */
export type Colours = ReadonlyMap<string, string>;

/**
 * The top 5 categories over 12 months, in the 5 chart colours, most first. They come from the
 * same 12 months whatever the range, so a category keeps its colour when the range changes.
 */
export function coloursOf(book: CategoryBook): Colours {
  const top = summarizeBook(book, "12m")
    .lines.filter((line) => line.total > 0)
    .toSorted((one, two) => two.total - one.total)
    .slice(0, 5);
  return new Map(
    top.map((line, index) => [line.name, `var(--chart-${String(index + 1)})`]),
  );
}

/** A category's fill in the list and the chart. A category from the rest, once picked, stands on its own in ink. */
export function fillOf(
  colours: Colours,
  name: string,
  picked: boolean,
): string {
  return colours.get(name) ?? (picked ? "var(--foreground)" : STRIPES);
}

export function Swatch({ fill }: { fill: string }) {
  return (
    <span
      aria-hidden="true"
      className="block size-3.5 shrink-0 rounded-sm border border-foreground/20"
      style={{ background: fill }}
    />
  );
}

/** One part of a month's column: a category, or the rest together. */
interface Segment {
  key: string;
  spent: number;
  fill: string;
  faded: boolean;
}

/** A month's column, bottom up: the top 5 most first, a picked category from the rest, then the rest. */
function segmentsOf(
  summary: BookSummary,
  colours: Colours,
  index: number,
  picked: string | undefined,
): Segment[] {
  const total = summary.cells[index]?.spent ?? 0;
  const spentBy = (name: string) =>
    summary.lines.find((line) => line.name === name)?.cells[index]?.spent ?? 0;
  const own = [...colours.keys()];
  if (picked !== undefined && !colours.has(picked)) own.push(picked);
  const segments = own.map((name) => ({
    key: name,
    spent: spentBy(name),
    fill: fillOf(colours, name, true),
    faded: picked !== undefined && name !== picked,
  }));
  const rest = total - segments.reduce((all, one) => all + one.spent, 0);
  return [
    ...segments,
    { key: "rest", spent: rest, fill: STRIPES, faded: picked !== undefined },
  ].filter((segment) => segment.spent > 0);
}

/** A bar's amount in a few characters: "95k", "3.98L", "1.15cr". */
function shortAmount(value: number): string {
  const trim = (number: number) => String(Number(number.toFixed(2)));
  if (value >= 10_000_000) return `${trim(value / 10_000_000)}cr`;
  if (value >= 100_000) return `${trim(value / 100_000)}L`;
  if (value >= 1_000) return `${String(Math.round(value / 1_000))}k`;
  return String(value);
}

/**
 * The plot: every month as a column of its categories, with the average line and the month names,
 * then `legend` and what the marks mean. A tap on a column picks that month. Sits inside a
 * `@container/chart`.
 */
export function ByMonthChart({
  summary,
  colours,
  params,
  legend,
  amounts = false,
  biggest = false,
  keyOnTop = false,
  fill = false,
  band = null,
  marked,
  forecast = null,
}: {
  summary: BookSummary;
  colours: Colours;
  /** Its picked category stands out; the others fade. */
  params: CategoriesParams;
  /** Under the month names, such as chips that pick a category. */
  legend?: ReactNode;
  /** Each month's total over its bar. Over 7 months, only from 30rem of chart. */
  amounts?: boolean;
  /** "Biggest · Rs 512,300" over the biggest month. */
  biggest?: boolean;
  /** What the marks mean, over the plot on the right, instead of at the end. */
  keyOnTop?: boolean;
  /**
   * The plot grows to fill its column's height, never shorter than usual, so it stays as tall as
   * what sits beside it. The column must be a flex column with a height to fill.
   */
  fill?: boolean;
  /** The usual range, low to high, shaded behind the bars. */
  band?: { low: number; high: number } | null;
  /** Months with a dot after their name, such as months with a note. */
  marked?: ReadonlySet<string> | undefined;
  /**
   * Where this month is likely to end: a dashed box on top of its bar, up to that amount, with
   * the amount over it, "≈83k".
   */
  forecast?: { likely: number; month: MonthInfo } | null;
}) {
  const amountText = useAmountText();
  const { hidden } = use(AmountsContext);
  const values = summary.cells.map((cell) => cell.spent);
  const { largest, cut } = scaleOf(values, summary.average);
  const tallest = cut
    ? summary.cells.find((cell) => cell.spent > largest)
    : undefined;
  const current = summary.months.find((month) => month.current);
  const labels = amounts || biggest;
  // With labels, the padding over the plot holds the tallest bar's label, so the tallest bar
  // reaches the top. A month cut short keeps its scale, so the others stay readable.
  // A month cut short has no room for a forecast on top.
  const nowSpent = summary.cells.find((cell) => cell.month.current)?.spent ?? 0;
  const likely =
    forecast !== null && !cut && forecast.likely > nowSpent ? forecast : null;
  const top =
    labels && !cut
      ? Math.max(1, ...values, summary.average ?? 0, likely?.likely ?? 0)
      : largest;
  const count = summary.cells.length;
  const biggestAt =
    biggest && count > 1
      ? summary.cells.reduce(
          (best, cell, index, all) =>
            cell.spent > (all[best]?.spent ?? 0) ? index : best,
          0,
        )
      : -1;
  const marks = (
    <ChartKey
      current={current}
      average={summary.average !== null}
      cut={
        tallest === undefined
          ? null
          : { month: tallest.month, value: tallest.spent }
      }
      amount={amounts ? summary.average : null}
      extra={
        <>
          {band !== null && band.high > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-foreground/10 ring-1 ring-foreground/20" />
              Usual range
            </span>
          )}
          {marked !== undefined && marked.size > 0 && (
            <span className="inline-flex items-center gap-1">
              <NoteDot />
              Has a note
            </span>
          )}
          {likely !== null && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-t-sm border-2 border-b-0 border-dashed border-foreground/50" />
              Likely by {likely.month.days} {likely.month.short}:{" "}
              <Money
                value={likely.likely}
                className="font-semibold text-foreground"
              />
            </span>
          )}
        </>
      }
      className={keyOnTop ? "mb-3 justify-end" : "mt-3"}
    />
  );

  return (
    <div className={cn("flex flex-col", fill && "flex-1")}>
      {keyOnTop && marks}
      <div
        role="group"
        aria-label="Months. Pick one to see it closer."
        className={cn(labels && "pt-5", fill && "flex flex-1 flex-col")}
      >
        <div className={fill ? PLOT_FILL : PLOT}>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 border-b border-foreground/30"
          />
          {band !== null && band.high > 0 && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 border-y border-foreground/15 bg-foreground/[0.07]"
              style={{
                bottom: heightOf(band.low, top),
                height: `calc(${heightOf(band.high, top)} - ${heightOf(band.low, top)})`,
              }}
            />
          )}
          <AverageLine
            average={summary.average}
            largest={top}
            labelled={!amounts}
          />
          <div className="absolute inset-0 flex items-end justify-center gap-0.5 @min-[24rem]/chart:gap-1">
            {summary.cells.map((cell, index) => {
              const picked = cell.month.key === params.month;
              const others = params.month !== undefined && !picked;
              const isBiggest = index === biggestAt;
              const ahead = cell.month.current ? likely : null;
              const short = hidden
                ? "•••"
                : ahead !== null
                  ? `≈${shortAmount(ahead.likely)}`
                  : shortAmount(cell.spent);
              const label = isBiggest
                ? `Biggest · ${amounts ? short : amountText(cell.spent)}`
                : amounts && (cell.spent > 0 || ahead !== null)
                  ? short
                  : null;
              return (
                <button
                  key={cell.month.key}
                  type="button"
                  aria-pressed={picked}
                  aria-label={`${monthHeading(cell.month)}, ${amountText(cell.spent)}`}
                  onClick={() => {
                    params.setMonth(picked ? undefined : cell.month.key);
                  }}
                  className={cn(
                    COLUMN,
                    "relative flex h-full flex-col justify-end rounded-t-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  )}
                >
                  {label !== null && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        // Over the average line, on the card colour, so the line passes behind it.
                        "relative z-20 mb-1 shrink-0 rounded-sm bg-card px-1 text-[11px] leading-tight font-semibold whitespace-nowrap tabular-nums",
                        isBiggest
                          ? "text-foreground"
                          : cn(
                              "text-muted-foreground",
                              // Over 7 months, a narrow chart has no room for them.
                              count > 7 && "hidden @min-[30rem]/chart:block",
                            ),
                        // The long "Biggest" label runs inwards near an edge, so it stays on the chart.
                        !isBiggest
                          ? "self-center"
                          : index < count / 3
                            ? "self-start"
                            : index >= (count * 2) / 3
                              ? "self-end"
                              : "self-center",
                      )}
                    >
                      {label}
                    </span>
                  )}
                  {ahead !== null && (
                    // The rest of the month, likely: a dashed box from this month's bar up.
                    <span
                      aria-hidden="true"
                      className={cn(
                        "w-full shrink-0 rounded-t-md border-2 border-b-0 border-dashed border-foreground/40 bg-foreground/4 transition-opacity",
                        others && "opacity-35",
                      )}
                      style={{
                        height: `calc(${heightOf(ahead.likely, top)} - ${heightOf(cell.spent, top)})`,
                      }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative flex w-full shrink-0 flex-col-reverse overflow-hidden rounded-t-md transition-opacity",
                      cell.month.current &&
                        "outline-2 outline-offset-2 outline-foreground/60 outline-dashed",
                      others && "opacity-35",
                    )}
                    style={{ height: heightOf(cell.spent, top) }}
                  >
                    {cell.spent > largest && <BreakMark />}
                    {segmentsOf(summary, colours, index, params.category).map(
                      (segment) => (
                        <span
                          key={segment.key}
                          className={cn(
                            "block w-full shrink-0 border-x border-t border-foreground/15",
                            cell.month.current && "opacity-60",
                            segment.faded && "opacity-20",
                          )}
                          style={{
                            height: `${String((segment.spent / Math.max(cell.spent, 1)) * 100)}%`,
                            background: segment.fill,
                          }}
                        />
                      ),
                    )}
                  </span>
                  {picked && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-1 top-full mt-0.5 h-1 rounded-full bg-foreground"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <MonthLabels
          months={summary.months}
          picked={params.month}
          marked={marked}
        />
      </div>
      {legend}
      {!keyOnTop && marks}
    </div>
  );
}

/** A month's categories with spending in it, most first. */
export function monthRanking(summary: BookSummary, index: number) {
  return summary.lines
    .map((line) => ({ line, spent: line.cells[index]?.spent ?? 0 }))
    .filter((one) => one.spent > 0)
    .toSorted((one, two) => two.spent - one.spent);
}

/** "Open Groceries": its page, keeping the range. */
export function OpenLink({
  name,
  params,
}: {
  name: string;
  params: CategoriesParams;
}) {
  return (
    <Link
      href={{ pathname: categoryPath(name), query: params.rangeQuery }}
      className={LINK_BUTTON}
    >
      Open {name}
    </Link>
  );
}

/**
 * "See August on Spending": that month on Spending, where it has its pace, calendar and entries.
 * With a category, Spending opens with it picked. This month is Spending's own, so it isn't named.
 */
export function MonthOnSpending({
  month,
  category,
}: {
  month: MonthInfo;
  category?: string;
}) {
  const query = {
    ...(month.current ? {} : { month: month.key }),
    ...(category === undefined ? {} : { category }),
  };
  return (
    <Link href={{ pathname: "/spending", query }} className={LINK_BUTTON}>
      See {month.name} on Spending
    </Link>
  );
}

/** A link drawn as an outline button, as "Open Groceries" is, so links side by side match. */
export const LINK_BUTTON = cn(
  buttonVariants({ variant: "outline", size: "lg" }),
  "h-auto min-h-11 self-start bg-card py-2 text-left whitespace-normal text-card-foreground",
);
