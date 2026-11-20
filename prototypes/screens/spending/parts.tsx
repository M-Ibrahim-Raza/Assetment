"use client";

import { ArrowDown, ArrowUp, Minus, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  type RefObject,
  use,
  useEffect,
  useId,
  useRef,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AmountsContext, Money } from "@proto/components/amounts";
import { ScreenLink } from "@proto/components/screen-link";
import type { SpendEntry } from "@proto/fixtures/spending";
import { formatLakhCrore, formatPkr } from "@proto/kit/format";
import type { EntriesSettings } from "./layout";
import {
  type BreakdownRow,
  dayLabel,
  daysLabel,
  type Comparison,
  type DayRange,
  type EntryOrder,
  type MonthInfo,
  type MonthSummary,
  search,
  sortEntries,
} from "./math";
import { type SortField, SortMenu } from "./sort-menu";
import type { SpendingParams } from "./use-spending-params";

/** "Groceries", "Groceries and Bills". */
export function joinAnd(names: readonly string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`;
}

/** "3–9 Oct", "3–9 Mar 2026" for a picked month, or "Usual for 3–9": the days compared. */
export function comparedDaysLabel(
  comparison: Comparison,
  days: DayRange,
): string {
  const [first] = comparison.months;
  if (comparison.kind === "usual" || first === undefined) {
    return `Usual for ${String(days.from)}–${String(days.to)}`;
  }
  const label = daysLabel(first, days);
  return comparison.kind === "month" ? `${label} ${String(first.year)}` : label;
}

/** "3rd", "12th", "21st". */
function ordinal(day: number): string {
  const tens = day % 100;
  const ones = day % 10;
  if (tens < 11 || tens > 13) {
    if (ones === 1) return `${String(day)}st`;
    if (ones === 2) return `${String(day)}nd`;
    if (ones === 3) return `${String(day)}rd`;
  }
  return `${String(day)}th`;
}

/**
 * What the numbers are compared with, to end "more than …". In the headline, the current month
 * says the point too: "this time last month", "usual by now", "March 2026 by the same day". A
 * row (`row`) leaves it to the key: "last month", "usual", "March 2026". A past month names the
 * month, and picked days the same dates: "3–9 Oct", "usual for 3–9".
 */
function comparedWith(summary: MonthSummary, row = false): string {
  const { month, days, comparison, comparedDays } = summary;
  if (comparison === null) return "the month before";
  if (days && comparedDays) {
    const label = comparedDaysLabel(comparison, comparedDays);
    return comparison.kind === "usual" ? label.toLowerCase() : label;
  }
  const name = comparison.kind === "usual" ? "usual" : comparison.name;
  if (!month.current) return name;
  if (comparison.kind === "last") {
    return row ? "last month" : "this time last month";
  }
  if (row) return name;
  return comparison.kind === "usual"
    ? "usual by now"
    : `${name} by the same day`;
}

/** When the days shown are, to end a sentence: "today", "on Sun 8 Nov", "on 3–9 Nov", "in October". */
function when({ month, days }: MonthSummary): string {
  if (days === null) return `in ${month.name}`;
  const label = daysLabel(month, days);
  return label === "Today" || label === "Yesterday"
    ? label.toLowerCase()
    : `on ${label}`;
}

/**
 * "Nothing spent today yet.", "Nothing spent from JazzCash on Mon 5 Oct." or "Nothing spent in
 * Groceries in October.": the picks, then when.
 */
export function nothingSpent(summary: MonthSummary): string {
  const { month, days, category, account } = summary;
  // "Yet" only while the days shown run up to today.
  const yet =
    month.current && (days === null || days.to === month.through) ? " yet" : "";
  const picks = [
    category === undefined ? null : `in ${category}`,
    account === undefined ? null : `from ${account}`,
    when(summary),
  ].filter((part) => part !== null);
  return `Nothing spent ${picks.join(" ")}${yet}.`;
}

/**
 * A type size that keeps a headline total on one line, from a 320 px phone up. The block it sits in
 * must be a size container. Longer amounts start a step smaller, and the size comes from the real
 * amount, so hiding amounts doesn't change the layout.
 */
export function totalSize(value: number): string {
  const characters = formatPkr(value).length;
  if (characters <= 10) {
    return "text-4xl @min-[17rem]:text-5xl @min-[28rem]:text-6xl";
  }
  if (characters <= 13) {
    return "text-3xl @min-[20rem]:text-4xl @min-[28rem]:text-5xl @min-[36rem]:text-6xl";
  }
  return "text-2xl @min-[20rem]:text-3xl @min-[28rem]:text-4xl @min-[36rem]:text-5xl";
}

/**
 * The answer, as a sentence: "Rs 9,300 more than this time last month, mostly Eating out and
 * Bills". With a category or an account picked, the same for those alone.
 */
export function Headline({ summary }: { summary: MonthSummary }) {
  const { total, before, days, drivers } = summary;
  // One day isn't compared. Its entries say more.
  if (days !== null && days.from === days.to) {
    const count = summary.entries.length;
    if (count === 0) return nothingSpent(summary);
    return `${String(count)} ${count === 1 ? "entry" : "entries"} ${when(summary)}.`;
  }
  if (before === null) {
    return summary.month.current
      ? "Nothing from last month to compare with yet."
      : "Nothing from the month before to compare with.";
  }
  if (total === before) return <>The same as {comparedWith(summary)}</>;
  return (
    <>
      <Money value={Math.abs(total - before)} />{" "}
      {total > before ? "more" : "less"} than {comparedWith(summary)}
      {drivers.length > 0 && <>, mostly {joinAnd(drivers)}</>}
    </>
  );
}

/** Up, down or flat. With the words or the sign, it says which way: spending more isn't an error. */
export function ChangeIcon({
  change,
  className = "size-3.5",
}: {
  change: number;
  className?: string;
}) {
  const Icon = change > 0 ? ArrowUp : change < 0 ? ArrowDown : Minus;
  return <Icon aria-hidden="true" className={cn("shrink-0", className)} />;
}

/**
 * One category or account against the month before: "Rs 3,100 more than last month", or with `signed`, just
 * "+Rs 3,100". Nothing when there is nothing to compare with.
 */
export function Against({
  row,
  summary,
  signed = false,
  className,
}: {
  row: BreakdownRow;
  summary: MonthSummary;
  signed?: boolean;
  className?: string;
}) {
  if (row.before === null) return null;
  const change = row.spent - row.before;
  const than = comparedWith(summary, true);

  let words;
  if (row.before === 0) {
    words = noneBefore(summary, than, row.spent === 0);
  } else if (change === 0) {
    words = signed ? "Same" : `Same as ${than}`;
  } else if (signed) {
    words = <Money value={change} signed />;
  } else {
    words = (
      <span>
        <Money value={Math.abs(change)} /> {change > 0 ? "more" : "less"} than{" "}
        {than}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <ChangeIcon change={change} />
      {words}
    </span>
  );
}

/**
 * A row with nothing in the comparison: "New this month", "Usually none", "None in March 2026".
 * A picked row kept at Rs 0 (`nowToo`) adds "either".
 */
function noneBefore(
  summary: MonthSummary,
  than: string,
  nowToo: boolean,
): string {
  const either = nowToo ? " either" : "";
  const kind = summary.comparison?.kind;
  if (kind === "usual") return `Usually none${either}`;
  if (summary.days) return `None on ${than}${either}`;
  if (summary.month.current && kind === "last") {
    return nowToo ? `None ${than} either` : "New this month";
  }
  return `None in ${than}${either}`;
}

/** How people say a headline total, e.g. "2.1 lakh". Hidden with the amounts, and under one lakh. */
export function LakhNote({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const { hidden } = use(AmountsContext);
  const spoken = formatLakhCrore(value);
  if (hidden || spoken === null) return null;
  return <p className={className}>{spoken}</p>;
}

/** An amount for an aria-label, which can't hold the `Money` element. Says "amount hidden" while amounts are hidden. */
export function useAmountText(): (value: number) => string {
  const { hidden } = use(AmountsContext);
  return (value) => (hidden ? "amount hidden" : formatPkr(value));
}

/**
 * What the bar and the mark on it stand for, e.g. "This month" and "By 12 Oct" or "Usual by the
 * 12th", or "3–9 Nov" and "3–9 Oct" for picked days. One picked day has a bar alone.
 */
export function BreakdownLegend({ summary }: { summary: MonthSummary }) {
  const { month, days, comparison, comparedDays } = summary;
  let before: string | null = null;
  if (summary.before !== null && comparison !== null) {
    const usual = comparison.kind === "usual";
    if (days && comparedDays) {
      before = comparedDaysLabel(comparison, comparedDays);
    } else if (!month.current) {
      before = usual ? "Usual" : comparison.name;
    } else {
      before = usual
        ? `Usual by the ${ordinal(month.through)}`
        : `By ${String(month.through)} ${comparison.short}`;
    }
  }
  if (before === null && days === null) return null;
  const now = days
    ? daysLabel(month, days)
    : month.current
      ? "This month"
      : month.name;
  return (
    <p
      aria-hidden="true"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground"
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-5 rounded-full bg-primary" />
        {now}
      </span>
      {before !== null && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-0.5 rounded-full bg-foreground" />
          {before}
        </span>
      )}
    </p>
  );
}

/** This month as a solid bar, and the month before as a mark across it. The words carry the numbers. */
function PairBar({ row, largest }: { row: BreakdownRow; largest: number }) {
  return (
    <span aria-hidden="true" className="relative block h-2.5">
      <span className="absolute inset-0 rounded-full bg-muted" />
      <span
        className="absolute inset-y-0 left-0 rounded-full bg-primary"
        style={{ width: `${String((row.spent / largest) * 100)}%` }}
      />
      {row.before !== null && row.before > 0 && (
        <span
          className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
          style={{ left: `${String((row.before / largest) * 100)}%` }}
        />
      )}
    </span>
  );
}

/** A share as people say it: "31%", or "<1%" for a sliver. */
export function sharePercent(part: number): string {
  const percent = part * 100;
  if (percent > 0 && percent < 1) return "<1%";
  return `${String(Math.round(percent))}%`;
}

/**
 * Categories or accounts in one column: name and amount on a line, a bar with the comparison's
 * mark, and the change in words, with the row's share of spending when asked. Each row is one big
 * tap target. Picking one is a toggle.
 */
export function BreakdownRows({
  summary,
  rows,
  shown = rows,
  selected,
  onSelect,
  actions,
  share = false,
  counts = false,
  tags = {},
}: {
  summary: MonthSummary;
  /** Every row, in order. The bars and shares are measured against all of them. */
  rows: readonly BreakdownRow[];
  /** The rows in view, when the list is shortened. */
  shown?: readonly BreakdownRow[];
  selected: string | undefined;
  onSelect: (name: string | undefined) => void;
  /** Shown under the picked row. */
  actions?: (row: BreakdownRow) => ReactNode;
  /** Show each row's share of the list's total, e.g. "31%". */
  share?: boolean;
  /** Show how many entries each row has, e.g. "9 entries", when sorted by them. */
  counts?: boolean;
  /** A small tag after some rows' names, by name, such as "Biggest rise". */
  tags?: Readonly<Record<string, string>>;
}) {
  if (rows.length === 0) {
    return <p className="text-sm font-medium">{nothingSpent(summary)}</p>;
  }
  const largest = Math.max(
    1,
    ...rows.map((row) => Math.max(row.spent, row.before ?? 0)),
  );
  const listTotal = rows.reduce((all, row) => all + row.spent, 0);
  return (
    <ul className="-mx-3 flex flex-col gap-1">
      {shown.map((row) => {
        const picked = row.name === selected;
        const tag = tags[row.name];
        const percent = sharePercent(row.spent / Math.max(listTotal, 1));
        // With a comparison, the share sits at the right, after the count.
        const shareRight = share && row.before !== null;
        return (
          <li
            key={row.name}
            className={cn("rounded-2xl", picked && "bg-accent")}
          >
            <button
              type="button"
              aria-pressed={picked}
              onClick={() => {
                onSelect(picked ? undefined : row.name);
              }}
              className={cn(
                "flex w-full flex-col gap-2 rounded-2xl p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                picked ? "text-accent-foreground" : "hover:bg-muted",
              )}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 font-semibold wrap-break-word">
                  {row.name}
                  {tag !== undefined && (
                    <>
                      <span className="sr-only">,</span>{" "}
                      <Badge variant="outline" className="ml-1 align-text-top">
                        {tag}
                      </Badge>
                    </>
                  )}
                </span>
                <Money value={row.spent} className="shrink-0 font-bold" />
              </span>
              <PairBar row={row} largest={largest} />
              <span className="flex items-center justify-between gap-3">
                <Against
                  row={row}
                  summary={summary}
                  className="min-w-0 text-sm text-muted-foreground"
                />
                {/* With nothing to compare, the share takes the change's place, in words. */}
                {share && row.before === null && (
                  <span className="text-sm text-muted-foreground">
                    {percent === "<1%" ? "Under 1%" : percent} of spending
                  </span>
                )}
                {(shareRight || counts) && (
                  <span className="ml-auto shrink-0 text-sm tabular-nums">
                    {counts && (
                      <span className="text-muted-foreground">
                        <span className="sr-only">, </span>
                        {row.entries} {row.entries === 1 ? "entry" : "entries"}
                      </span>
                    )}
                    {counts && shareRight && (
                      <span
                        aria-hidden="true"
                        className="text-muted-foreground"
                      >
                        {" · "}
                      </span>
                    )}
                    {shareRight && (
                      <span className="font-semibold">
                        <span aria-hidden="true">{percent}</span>
                        <span className="sr-only">
                          , {percent === "<1%" ? "under 1%" : percent} of
                          spending
                        </span>
                      </span>
                    )}
                  </span>
                )}
              </span>
            </button>
            {picked && actions?.(row)}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Under a picked category or account: a way to its entries, and its own page when it has one.
 * `onSeeEntries` brings the entries into view.
 */
export function RowActions({
  row,
  count,
  detail,
  onSeeEntries,
}: {
  row: BreakdownRow;
  /** Its entries in the list. */
  count: number;
  /** Its own page, such as /spending/categories/groceries. */
  detail?: string;
  onSeeEntries: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-3 pb-3">
      {count > 0 && (
        <Button
          variant="outline"
          size="lg"
          className="h-11"
          onClick={onSeeEntries}
        >
          See its {count} {count === 1 ? "entry" : "entries"}
        </Button>
      )}
      {detail !== undefined && (
        <Link
          href={{ pathname: detail }}
          className={cn(
            buttonVariants({ variant: "ghost", size: "lg" }),
            "h-11 underline underline-offset-4",
          )}
        >
          Open {row.name}
        </Link>
      )}
    </div>
  );
}

interface EntriesListProps {
  /** The month, or what is picked in it. The list shows its entries. */
  summary: MonthSummary;
  params: SpendingParams;
  /** The list's own settings, switched in Customize. */
  options: EntriesSettings;
  /** The section's heading and what goes with it, first in the head. */
  head?: ReactNode;
  /**
   * Beside a side column, on a screen with two columns, the head (the heading, search, sort and
   * count) stays at the top while the entries scroll under it, and the day headings stop under it.
   */
  pinned?: boolean;
  className?: string;
}

// Where a pinned head stops: the gap between blocks below the window's top, as the side column.
const PIN_GAP = 12;

/**
 * A pinned head: from two columns, it sticks a gap below the window's top. It starts at the
 * card's top edge, so the card's padding goes with it, and a strip of page above it hides the
 * rows that scroll past in the gap.
 */
const PINNED_HEAD =
  "@min-[44rem]:sticky @min-[44rem]:top-3 @min-[44rem]:z-20 @min-[44rem]:-mt-6 @min-[44rem]:bg-card @min-[44rem]:pt-6 @min-[44rem]:before:absolute @min-[44rem]:before:-inset-x-10 @min-[44rem]:before:bottom-full @min-[44rem]:before:h-3 @min-[44rem]:before:bg-background";

/**
 * While `on`, keeps `--entries-head` on the list at where its day headings stop: under the pinned
 * head, which changes height as filters come and go.
 */
function usePinnedHead(
  list: RefObject<HTMLElement | null>,
  head: RefObject<HTMLElement | null>,
  on: boolean,
) {
  useEffect(() => {
    const root = list.current;
    const top = head.current;
    if (!on || root === null || top === null) return;
    const observer = new ResizeObserver(() => {
      root.style.setProperty(
        "--entries-head",
        `${String(PIN_GAP + top.offsetHeight)}px`,
      );
    });
    observer.observe(top);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--entries-head");
    };
  }, [list, head, on]);
}

// Each way to sort the entries: its name, what its usual and reversed ways are called, and
// whether it sorts words.
const ENTRY_SORTS = {
  date: { name: "Date", ways: ["Newest first", "Oldest first"] },
  amount: { name: "Amount", ways: ["High to low", "Low to high"] },
  name: { name: "Name", ways: ["A to Z", "Z to A"], words: true },
  category: { name: "Category", ways: ["A to Z", "Z to A"], words: true },
  account: { name: "Account", ways: ["A to Z", "Z to A"], words: true },
} as const satisfies Record<EntryOrder["by"], SortField>;
const ENTRY_SORT_KEYS = [
  "date",
  "amount",
  "name",
  "category",
  "account",
] as const;

/** Entries under one heading: a day, a category or an account. */
interface EntryGroup {
  key: string;
  label: string;
  entries: SpendEntry[];
  /** In date order: what the list adds up to by the end of this day. */
  running?: number;
}

/**
 * The entries in groups under headings, in their order: by day when sorted by date, by category
 * or account when sorted by those. Sorted by amount or name, they aren't grouped.
 */
function groupsOf(
  entries: readonly SpendEntry[],
  { by }: EntryOrder,
  month: MonthInfo,
): EntryGroup[] | null {
  if (by === "amount" || by === "name") return null;
  const keyOf = (entry: SpendEntry) =>
    by === "date" ? String(entry.day) : entry[by];
  return [...new Set(entries.map(keyOf))].map((key) => {
    const ofGroup = entries.filter((entry) => keyOf(entry) === key);
    if (by !== "date") return { key, label: key, entries: ofGroup };
    const day = Number(key);
    return {
      key,
      label: dayLabel(month, day),
      entries: ofGroup,
      running: entries
        .filter((entry) => entry.day <= day)
        .reduce((total, entry) => total + entry.amount, 0),
    };
  });
}

/**
 * The entries picked on the screen, narrowed further by the list's own search. By
 * default newest first, grouped by day with each day's total. Its settings: the sort menu (date,
 * amount, name, category or account, either way; by category or account, grouped by them), the
 * day totals, a running total in date order, and compact rows. A result line counts what it shows. Each row opens Entry detail. One picked day needs no search or
 * order.
 */
export function EntriesList({
  summary,
  params,
  options,
  head,
  pinned = false,
  className,
}: EntriesListProps) {
  const searchId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  usePinnedHead(listRef, headRef, pinned);
  const { category, account, q } = params;
  const { days, month } = summary;
  const oneDay = days !== null && days.from === days.to;
  const matched = search(summary.entries, q);
  // One picked day needs no order. Without the sort menu, the list keeps the usual one.
  const canSort = options.sorting && !oneDay;
  const order: EntryOrder = canSort
    ? params.sort
    : { by: "date", reversed: false };
  const shown = sortEntries(matched, order);
  const groups = oneDay ? null : groupsOf(shown, order, month);
  const filtered = category !== undefined || account !== undefined || q !== "";

  return (
    <div ref={listRef} className={cn("flex flex-col gap-4", className)}>
      <div
        ref={headRef}
        className={cn("flex flex-col gap-4", pinned && PINNED_HEAD)}
      >
        {head}
        {(!oneDay || q !== "") && (
          <div className="flex flex-col gap-2">
            <label htmlFor={searchId} className="text-sm font-medium">
              Search entries
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id={searchId}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={q}
                onChange={(event) => {
                  params.setQuery(event.target.value);
                }}
                className="h-11 bg-background pl-9 text-base"
              />
            </div>
          </div>
        )}

        {canSort && (
          <SortMenu
            fields={ENTRY_SORTS}
            keys={ENTRY_SORT_KEYS}
            order={order}
            onOrder={params.setSort}
            label="Sort entries"
            className="-mr-2 self-end"
          />
        )}

        {filtered && (
          <div className="flex flex-wrap items-center gap-2">
            {category !== undefined && (
              <FilterChip
                label={category}
                onRemove={() => {
                  params.setCategory(undefined);
                }}
              />
            )}
            {account !== undefined && (
              <FilterChip
                label={account}
                onRemove={() => {
                  params.setAccount(undefined);
                }}
              />
            )}
            {q !== "" && (
              <FilterChip
                label={`“${q}”`}
                onRemove={() => {
                  params.setQuery("");
                }}
              />
            )}
            {/* At night the theme colour is too dark for text, so links use its pale accent. */}
            <Button
              variant="link"
              className="h-11 px-1 dark:text-accent-foreground"
              onClick={params.clearFilters}
            >
              Clear filters
            </Button>
          </div>
        )}

        {shown.length > 0 && (
          <p aria-live="polite" className="text-sm font-semibold">
            {shown.length} {shown.length === 1 ? "entry" : "entries"} ·{" "}
            <Money
              value={shown.reduce((total, entry) => total + entry.amount, 0)}
            />
          </p>
        )}
      </div>

      {shown.length === 0 ? (
        <NoEntries summary={summary} params={params} filtered={filtered} />
      ) : groups === null ? (
        <EntryRows
          entries={shown}
          {...(oneDay ? {} : { month })}
          compact={options.compact}
        />
      ) : order.by === "date" ? (
        <EntryGroups
          groups={groups}
          totals={options.dayTotals}
          running={options.runningTotal ? month : undefined}
          compact={options.compact}
        />
      ) : (
        <EntryGroups
          groups={groups}
          totals
          month={month}
          compact={options.compact}
          hide={order.by === "account" ? "account" : "category"}
        />
      )}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-accent py-1 pr-1 pl-3 text-sm font-medium text-accent-foreground">
      <span className="min-w-0 truncate">{label}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Remove filter: ${label}`}
        onClick={onRemove}
        className="rounded-full"
      >
        <X />
      </Button>
    </span>
  );
}

/** No entries: nothing spent in what is picked, or nothing matches the filters, which it names. */
function NoEntries({
  summary,
  params,
  filtered,
}: {
  summary: MonthSummary;
  params: SpendingParams;
  filtered: boolean;
}) {
  if (!filtered) {
    return <p className="text-sm font-medium">{nothingSpent(summary)}</p>;
  }
  const { q, category, account } = params;
  const what = [
    q === "" ? null : `“${q}”`,
    category === undefined ? null : `in ${category}`,
    account === undefined ? null : `from ${account}`,
    summary.days === null
      ? null
      : `on ${daysLabel(summary.month, summary.days)}`,
  ]
    .filter((part) => part !== null)
    .join(" ");
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed p-5">
      <p className="font-semibold">No entries match {what}</p>
      <p className="text-sm text-muted-foreground">
        Try other words, or clear the filters to see all of {summary.month.name}
        .
      </p>
      <Button variant="outline" size="lg" onClick={params.clearFilters}>
        Clear filters
      </Button>
    </div>
  );
}

/**
 * Entries under a heading for each day, category or account, with its total. Each heading stays at
 * the top of the screen while its entries scroll under it, so a long group keeps its name in view.
 */
function EntryGroups({
  groups,
  totals,
  running,
  month,
  compact,
  hide,
}: {
  groups: readonly EntryGroup[];
  /** Each heading's total. */
  totals: boolean;
  /** In date order, the month: each heading also says what was spent by its day. */
  running?: MonthInfo | undefined;
  /** For groups not by day, the month: each row then says its day. */
  month?: MonthInfo;
  compact: boolean;
  /** What the groups are, so the rows leave it out. */
  hide?: "category" | "account";
}) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-1">
          <h3 className="sticky top-0 z-10 flex items-baseline justify-between gap-3 border-b border-foreground/15 bg-card pt-3 pb-2 text-sm font-semibold text-muted-foreground @min-[44rem]:top-(--entries-head,0px)">
            <span className="min-w-0 wrap-break-word">{group.label}</span>
            {(totals || (running && group.running !== undefined)) && (
              <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                {totals && (
                  <Money
                    value={group.entries.reduce(
                      (total, entry) => total + entry.amount,
                      0,
                    )}
                  />
                )}
                {running && group.running !== undefined && (
                  <span className="text-xs font-medium">
                    <Money value={group.running} />{" "}
                    {running.current && group.key === String(running.through)
                      ? "so far"
                      : "by then"}
                  </span>
                )}
              </span>
            )}
          </h3>
          <EntryRows
            entries={group.entries}
            {...(month === undefined ? {} : { month })}
            compact={compact}
            {...(hide === undefined ? {} : { hide })}
          />
        </section>
      ))}
    </div>
  );
}

/** Entries in a plain list. With `month`, each row also says its day, for lists not grouped by day. */
function EntryRows({
  entries,
  month,
  compact,
  hide,
}: {
  entries: readonly SpendEntry[];
  month?: MonthInfo;
  compact: boolean;
  hide?: "category" | "account";
}) {
  return (
    <ul className="flex flex-col">
      {entries.map((entry) => (
        <li key={entry.id}>
          <EntryRow
            entry={entry}
            day={month === undefined ? undefined : dayLabel(month, entry.day)}
            compact={compact}
            hide={hide}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * One spent entry. It opens Entry detail, a later screen. Under its title, its category, account
 * and day, less what its group already says; compact rows keep that line for screen readers only.
 */
function EntryRow({
  entry,
  day,
  compact,
  hide,
}: {
  entry: SpendEntry;
  /** Its day, such as "Sun 8 Nov". */
  day: string | undefined;
  compact: boolean;
  hide: "category" | "account" | undefined;
}) {
  const about = [
    hide === "category" ? undefined : entry.category,
    hide === "account" ? undefined : entry.account,
    day,
  ]
    .filter((part) => part !== undefined)
    .join(" · ");
  return (
    <ScreenLink
      screen="Entry detail"
      className={cn(
        "flex items-center justify-between gap-4",
        compact ? "min-h-11 py-2" : "min-h-14 py-3",
      )}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-semibold wrap-break-word">{entry.title}</span>
        <span className={compact ? "sr-only" : "text-sm text-muted-foreground"}>
          {compact ? `, ${about}` : about}
        </span>
      </span>
      <Money value={-entry.amount} signed className="shrink-0 font-bold" />
    </ScreenLink>
  );
}

/** What Spending is for, before anything is logged. */
export const FIRST_USE = {
  title: "See where your money goes",
  body: "Each month's spending by category, next to the same point last month. Log what you spend, and it adds up here.",
} as const;

/** The way in from the first-use state: Quick add, as a secondary button, since Add is the one primary. */
export function FirstExpenseLink({ className }: { className?: string }) {
  return (
    <ScreenLink
      screen="Quick add"
      className={cn(
        buttonVariants({ variant: "secondary", size: "lg" }),
        "h-11",
        className,
      )}
    >
      Log your first expense
    </ScreenLink>
  );
}

/** Try again reloads the screen's data. */
export function RetryButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      size="lg"
      className={cn("h-11", className)}
      onClick={() => {
        router.refresh();
      }}
    >
      Try again
    </Button>
  );
}

export const ERROR_TITLE = "We couldn't load your spending";
