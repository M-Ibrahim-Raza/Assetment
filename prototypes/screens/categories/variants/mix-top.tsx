"use client";

import { ChevronDown } from "lucide-react";
import { type ReactNode, useId } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import {
  Headline,
  sharePercent,
  totalSize,
} from "@proto/screens/spending/parts";
import { EntriesLink, entriesWord } from "../manage";
import { type BookSummary, type CategoryLine, spentInLabel } from "../math";
import { RangeChoice } from "../parts";
import type { TopSettings } from "../layout";
import { forecastOf, typicalOf } from "@proto/screens/category-detail/insights";
import { SectionCustomizeButton } from "@proto/components/customize-sheet";
import type { CategoryBook } from "../scenarios";
import type { CategoriesParams } from "../use-categories-params";
import {
  ByMonthChart,
  type Colours,
  fillOf,
  LINK_BUTTON,
  monthRanking,
  OpenLink,
  Swatch,
} from "../month-chart";
import {
  AgainstAverage,
  ClearChip,
  MonthStepper,
  SURFACE,
  spanOf,
  STRIPES,
} from "../chart-parts";
import { Answer } from "../list";
import {
  monthsWord,
  rangeTitle,
  CARD_HEADING,
  BIG_NUMBER,
  useSpoken,
} from "../look";

/** Side by side from 46rem of block: the numbers on the left, the chart on the right. */
export const SPLIT =
  "grid gap-6 @min-[46rem]/top:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]";

/** The numbers' place: the left column, side by side. */
export const LEFT = "@min-[46rem]/top:col-start-1 @min-[46rem]/top:row-start-1";

/** The chart's place: the right column, side by side. */
export const RIGHT =
  "@min-[46rem]/top:col-start-2 @min-[46rem]/top:row-start-1";

/**
 * A category under the chart, drawn like a plain key: a swatch and its name. Its tap area runs
 * 4 px past the text, to 28 px tall, without touching the next row.
 */
const CHIP =
  "relative inline-flex max-w-full items-center gap-1.5 rounded-sm text-sm underline-offset-4 outline-none after:absolute after:-inset-x-1.5 after:-inset-y-1 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";

/** A picked category: bold and underlined. With one picked, the others go grey. */
function chipState(on: boolean, anyOn: boolean): string {
  if (on) return "font-semibold underline decoration-2";
  return anyOn ? "text-muted-foreground" : "";
}

/**
 * Spending by month (d's top block): the answer, the figures and the chart in one card. Nothing
 * picked, the numbers tell the range: the average a month, a sentence, the total and this month
 * so far. The chart has each month's total on top and labels the biggest month. A month picked on
 * the chart, or a category from the key under it, swaps the numbers for that pick. On phones the
 * range numbers stay on top and the pick shows under the chart, where it was tapped.
 */
export function SpendingByMonth({
  book,
  summary,
  colours,
  params,
  settings,
  onCustomize,
}: {
  book: CategoryBook;
  summary: BookSummary;
  colours: Colours;
  params: CategoriesParams;
  /** Its extras, switched in Customize. */
  settings: TopSettings;
  onCustomize: () => void;
}) {
  const headingId = useId();
  const typical = settings.usualRange ? typicalOf(summary.cells) : null;
  const forecast =
    settings.likelyEnd && summary.cells.some((cell) => cell.month.current)
      ? forecastOf(book, undefined)
      : null;
  const picked = params.month !== undefined || params.category !== undefined;
  const title = rangeTitle(summary.months, params.range, book.today);

  return (
    <section
      aria-labelledby={headingId}
      className={cn(SURFACE, "@container/top flex flex-col gap-5")}
    >
      {/* The heading, then the range, then Customize at the right; on phones the range takes a row. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-3 @min-[28rem]/top:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={headingId} className={CARD_HEADING}>
            Spending by month
          </h2>
          <p className="text-sm text-muted-foreground">
            {summary.months.length > 1
              ? `${title} · ${spanOf(summary.months)}`
              : title}
          </p>
        </div>
        <RangeChoice
          params={params}
          className="col-span-2 row-start-2 w-full *:flex-1 *:px-2 @min-[28rem]/top:col-span-1 @min-[28rem]/top:row-start-1 @min-[28rem]/top:w-auto @min-[28rem]/top:*:flex-none @min-[28rem]/top:*:px-3"
        />
        <SectionCustomizeButton
          name="Spending by month"
          onClick={onCustomize}
          className="-mr-2"
        />
      </div>

      <div className={SPLIT}>
        <Overview
          summary={summary}
          settings={settings}
          className={cn(LEFT, picked && "@min-[46rem]/top:hidden")}
        />
        <div className={cn("@container/chart flex min-w-0 flex-col", RIGHT)}>
          <ByMonthChart
            summary={summary}
            colours={colours}
            params={params}
            legend={
              <CategoryChips
                summary={summary}
                colours={colours}
                params={params}
              />
            }
            amounts={settings.totals}
            biggest={settings.biggest}
            keyOnTop
            fill
            band={typical}
            forecast={
              forecast === null
                ? null
                : { likely: forecast.likely, month: forecast.month }
            }
          />
        </div>
        {picked && (
          <Picked
            book={book}
            summary={summary}
            colours={colours}
            params={params}
            shares={settings.shares}
            className={LEFT}
          />
        )}
      </div>
    </section>
  );
}

/** The big number in the display face, with how people say it: "4 lakh a month on average". */
export function BigNumber({
  value,
  label,
  children,
}: {
  value: number;
  label: string;
  /** Lines that belong to the number, such as how it compares, kept close under its note. */
  children?: ReactNode;
}) {
  const spoken = useSpoken();
  const note = spoken(value);
  return (
    <div className="flex flex-col gap-1.5">
      <p className={cn(BIG_NUMBER, totalSize(value))}>
        <Money value={value} />
      </p>
      <p className="font-semibold @md:text-lg">
        {note === null
          ? label.charAt(0).toUpperCase() + label.slice(1)
          : `${note} ${label}`}
      </p>
      {children}
    </div>
  );
}

/** One figure in the row: a grey term over its value. */
export function Stat({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="text-lg font-semibold wrap-break-word">{children}</dd>
    </div>
  );
}

/**
 * The range, nothing picked: the average a month (or this month so far, before a full month), one
 * sentence on where it goes, then the total and this month so far. The biggest month is labelled
 * on the chart.
 */
function Overview({
  summary,
  settings,
  className,
}: {
  summary: BookSummary;
  settings: TopSettings;
  className: string;
}) {
  const { average, total, now, cells } = summary;
  const current = cells.find((cell) => cell.month.current);

  return (
    <div className={cn("@container flex min-w-0 flex-col gap-4", className)}>
      <BigNumber
        value={average ?? now.total}
        label={average === null ? "so far this month" : "a month on average"}
      />
      {settings.summary && (
        <p className="text-base text-balance @md:text-lg">
          <Answer summary={summary} />
        </p>
      )}
      {/* With one month, the big number already says it all. */}
      {settings.figures && cells.length > 1 && (
        <dl className="flex flex-wrap gap-x-6 gap-y-3 border-t border-foreground/10 pt-4 tabular-nums">
          <Stat term={`In ${monthsWord(cells.length)}`}>
            <Money value={total} />
          </Stat>
          {current !== undefined && average !== null && (
            <Stat term={`${current.month.name} so far`}>
              <Money value={current.spent} />
            </Stat>
          )}
        </dl>
      )}
      <p className="text-sm text-muted-foreground">
        Pick a month on the chart, or a category under it, for a closer look.
      </p>
    </div>
  );
}

/**
 * The key under the chart, one item per top 5 category in its colour, then "Rest", a menu of the
 * other categories. An item picks its category: the chart fades the others and the numbers show
 * it. A category picked from the menu, or from a month, gets its own item, in ink, until cleared.
 */
function CategoryChips({
  summary,
  colours,
  params,
}: {
  summary: BookSummary;
  colours: Colours;
  params: CategoriesParams;
}) {
  const { category } = params;
  const onPick = params.setCategory;
  const others = summary.lines
    .filter((line) => !colours.has(line.name) && line.total > 0)
    .toSorted((one, two) => two.total - one.total);
  const fromRest =
    category !== undefined && !colours.has(category) ? category : undefined;
  const anyOn = category !== undefined;

  return (
    <div
      role="group"
      aria-label="Categories. Pick one to see it on its own."
      className="mt-3 flex flex-wrap gap-x-4 gap-y-2"
    >
      {[...colours.keys(), ...(fromRest === undefined ? [] : [fromRest])].map(
        (name) => {
          const on = category === name;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              onClick={() => {
                onPick(on ? undefined : name);
              }}
              className={cn(CHIP, chipState(on, anyOn))}
            >
              <Swatch fill={fillOf(colours, name, true)} />
              <span className="min-w-0 truncate">{name}</span>
            </button>
          );
        },
      )}
      {others.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(CHIP, chipState(false, anyOn))}>
            <Swatch fill={STRIPES} />
            Rest · {others.length}
            <ChevronDown aria-hidden="true" className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-80 w-auto min-w-60 overflow-y-auto"
          >
            {others.map((line) => (
              <DropdownMenuItem
                key={line.name}
                className="min-h-11 justify-between gap-4 text-base"
                onClick={() => {
                  onPick(line.name);
                }}
              >
                <span className="min-w-0 wrap-break-word">{line.name}</span>
                <Money
                  value={line.total}
                  className="shrink-0 text-sm text-muted-foreground"
                />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/**
 * What's picked, with a chip to clear each pick. A month: its total against the average and its
 * categories with their share. A category: its average a month, total and how often, and a way to
 * its page. Both: that category in that month.
 */
function Picked({
  book,
  summary,
  colours,
  params,
  shares,
  className,
}: {
  book: CategoryBook;
  summary: BookSummary;
  colours: Colours;
  params: CategoriesParams;
  /** Each category's share of a picked month, after its amount. */
  shares: boolean;
  className: string;
}) {
  const index = summary.months.findIndex((one) => one.key === params.month);
  const month = summary.months[index];
  const line = summary.lines.find((one) => one.name === params.category);

  return (
    <div className={cn("@container flex min-w-0 flex-col gap-4", className)}>
      <div className="flex flex-wrap gap-2">
        {month !== undefined && (
          <ClearChip
            label={`${month.name} ${String(month.year)}`}
            onClear={() => {
              params.setMonth(undefined);
            }}
          />
        )}
        {line !== undefined && (
          <ClearChip
            label={line.name}
            onClear={() => {
              params.setCategory(undefined);
            }}
          />
        )}
      </div>
      {month !== undefined && (
        <MonthStepper
          months={summary.months}
          month={month}
          onPick={params.setMonth}
        />
      )}
      {line !== undefined && (
        <div className="flex items-center gap-2">
          <Swatch fill={fillOf(colours, line.name, true)} />
          <h3 className="min-w-0 text-xl font-semibold wrap-break-word">
            {line.name}
          </h3>
        </div>
      )}
      {month !== undefined && line !== undefined ? (
        <CategoryInMonth line={line} index={index} params={params} />
      ) : month !== undefined ? (
        <MonthPicked
          key={month.key}
          summary={summary}
          index={index}
          colours={colours}
          shares={shares}
          onPickCategory={params.setCategory}
        />
      ) : line !== undefined ? (
        <CategoryPicked line={line} summary={summary} params={params} />
      ) : null}
      {line !== undefined && book.hidden.includes(line.name) && (
        <p className="text-sm text-muted-foreground">
          Hidden: it doesn&apos;t show when you add an entry.
        </p>
      )}
    </div>
  );
}

/**
 * A month: its total, against the average, and its top 6 categories, each with its share of the
 * month as a % after the amount. "And 5 more" opens a menu of the rest; picking one picks it.
 */
function MonthPicked({
  summary,
  index,
  colours,
  shares,
  onPickCategory,
}: {
  summary: BookSummary;
  index: number;
  colours: Colours;
  shares: boolean;
  onPickCategory: (name: string) => void;
}) {
  const cell = summary.cells[index];
  if (cell === undefined) return null;
  const { month, spent } = cell;
  const ranked = monthRanking(summary, index);
  const more = ranked.slice(6);
  const shown = ranked.slice(0, 6);
  const moreSpent = more.reduce((all, one) => all + one.spent, 0);
  const share = (part: number) => sharePercent(part / Math.max(spent, 1));
  const ROW =
    "flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <>
      <BigNumber value={spent} label={month.current ? "spent so far" : "spent"}>
        {month.current ? (
          <p>
            <Headline summary={summary.now} />
          </p>
        ) : (
          <AgainstAverage spent={spent} average={summary.average} />
        )}
      </BigNumber>
      {ranked.length === 0 ? (
        <p className="font-medium">Nothing spent in {month.name}.</p>
      ) : (
        <div className="flex flex-col gap-1">
          <h3 className="flex justify-between text-sm font-semibold">
            By category
            {shares && <span className="text-muted-foreground">Share</span>}
          </h3>
          <ul className="-mx-2 flex flex-col">
            {shown.map(({ line, spent: amount }) => (
              <li key={line.name}>
                <button
                  type="button"
                  onClick={() => {
                    onPickCategory(line.name);
                  }}
                  className={ROW}
                >
                  <Swatch fill={fillOf(colours, line.name, false)} />
                  <span className="min-w-0 flex-1 wrap-break-word">
                    {line.name}
                  </span>
                  <Money value={amount} className="shrink-0 font-semibold" />
                  {shares && (
                    <span className="w-10 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
                      {share(amount)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {more.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(ROW, "group -mx-2 w-auto text-muted-foreground")}
              >
                <Swatch fill={STRIPES} />
                <span className="flex min-w-0 flex-1 items-center gap-1">
                  And {more.length} more
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 transition-transform group-data-popup-open:rotate-180"
                  />
                </span>
                <Money value={moreSpent} className="shrink-0 font-semibold" />
                {shares && (
                  <span className="w-10 shrink-0 text-right text-sm tabular-nums">
                    {share(moreSpent)}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-80 overflow-y-auto">
                {more.map(({ line, spent: amount }) => (
                  <DropdownMenuItem
                    key={line.name}
                    className="min-h-11 gap-2 text-base"
                    onClick={() => {
                      onPickCategory(line.name);
                    }}
                  >
                    <Swatch fill={STRIPES} />
                    <span className="min-w-0 flex-1 wrap-break-word">
                      {line.name}
                    </span>
                    <Money value={amount} className="shrink-0 font-semibold" />
                    {shares && (
                      <span className="w-10 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
                        {share(amount)}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </>
  );
}

/** A category: its average a month, its total and how often, against usual this month, and its page. */
function CategoryPicked({
  line,
  summary,
  params,
}: {
  line: CategoryLine;
  summary: BookSummary;
  params: CategoriesParams;
}) {
  const perMonth = line.average !== null && !line.isNew;
  return (
    <>
      <BigNumber
        value={perMonth ? (line.average ?? 0) : line.now.total}
        label={perMonth ? "a month on average" : "so far this month"}
      />
      <dl className="flex flex-wrap gap-x-6 gap-y-3 tabular-nums">
        <Stat term={`In ${monthsWord(summary.months.length)}`}>
          <Money value={line.total} />
        </Stat>
        <Stat term="How often">
          {line.isNew ? "New this month" : spentInLabel(line)}
        </Stat>
      </dl>
      <p>
        {line.isNew ? (
          "New this month: nothing before it to compare with."
        ) : (
          <Headline summary={line.now} />
        )}
      </p>
      <OpenLink name={line.name} params={params} />
    </>
  );
}

/** A category in a month: what it came to, against its own average, and its entries that month. */
function CategoryInMonth({
  line,
  index,
  params,
}: {
  line: CategoryLine;
  index: number;
  params: CategoriesParams;
}) {
  const cell = line.cells[index];
  if (cell === undefined) return null;
  return (
    <>
      <BigNumber
        value={cell.spent}
        label={`spent · ${entriesWord(cell.entries)}`}
      >
        {cell.month.current ? (
          <p>
            <Headline summary={line.now} />
          </p>
        ) : (
          <AgainstAverage spent={cell.spent} average={line.average} its />
        )}
      </BigNumber>
      <div className="flex flex-wrap gap-2">
        <OpenLink name={line.name} params={params} />
        {cell.entries > 0 && (
          <EntriesLink
            category={line.name}
            month={cell.month.key}
            className={LINK_BUTTON}
          >
            See its entries in {cell.month.name}
          </EntriesLink>
        )}
      </div>
    </>
  );
}

/** The block while loading: the heading and range, the numbers, and bars. */
export function SpendingByMonthSkeleton() {
  return (
    <div className={cn(SURFACE, "@container/top flex flex-col gap-5")}>
      <div className="flex flex-wrap justify-between gap-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-11 w-64 max-w-full" />
      </div>
      <div className={SPLIT}>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-56 max-w-full" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex h-56 items-end gap-1">
          {/* Placeholder heights, each different, so each is its own key. */}
          {[52, 64, 58, 70, 61, 75, 68, 80, 66, 72, 77, 40].map((height) => (
            <Skeleton
              key={height}
              className="flex-1 rounded-b-none"
              style={{ height: `${String(height)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
