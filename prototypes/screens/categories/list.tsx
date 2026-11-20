"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { Against, joinAnd, sharePercent } from "@proto/screens/spending/parts";
import { SortMenu } from "@proto/screens/spending/sort-menu";
import { entriesWord, hiddenLabel } from "./manage";
import {
  type BookSummary,
  type CategoryLine,
  categoryPath,
  LINE_SORT_KEYS,
  LINE_SORTS,
  type LineOrder,
  sortLines,
  spentInLabel,
} from "./math";
import type { ListSettings } from "./layout";
import { type CategoriesParams } from "./use-categories-params";
import { MiniBars, monthsWord } from "./look";

// Every category as rows: its average a month, a small bar a month, how often, and with a Total
// column, its total. The ones with nothing spent, and the hidden ones, wait in closed rows. Which
// of these show, and compact rows, the share and this month against usual, are the list's
// settings in Customize.

/**
 * The list's categories: the ones with spending in the range, sorted; the ones with none, which
 * wait in their own row so the list is about spending; and the hidden ones.
 */
export function groupLines(summary: BookSummary, order: LineOrder) {
  const visible = sortLines(
    summary.lines.filter((line) => !line.hidden),
    order,
  );
  return {
    shown: visible.filter((line) => line.total > 0),
    quiet: visible.filter((line) => line.total === 0),
    hidden: summary.lines.filter((line) => line.hidden),
  };
}

type LineGroups = ReturnType<typeof groupLines>;

/** "17 categories with spending, each bar against its own busiest month", without bars the first part. */
export function countNote(
  count: number,
  months: number,
  bars: boolean,
): string {
  const what = `${String(count)} ${count === 1 ? "category" : "categories"} with spending`;
  return months > 1 && bars
    ? `${what}, each bar against its own busiest month`
    : what;
}

/** The list's sort: total, average, change or name. */
export function CategorySort({
  params,
  className,
}: {
  params: CategoriesParams;
  className: string;
}) {
  return (
    <SortMenu
      fields={LINE_SORTS}
      keys={LINE_SORT_KEYS}
      order={params.sort}
      onOrder={params.setSort}
      label="Sort categories"
      className={className}
    />
  );
}

/** How the rows look, from the list's settings and the range. */
interface Look {
  /** A Total column after the average, from tablet width. */
  withTotal: boolean;
  bars: boolean;
  howOften: boolean;
  /** This month against usual by now, under the name. */
  change: boolean;
  compact: boolean;
  /** All spending in the range, for each row's share; null without the share. */
  shareOf: number | null;
}

/**
 * The ranked rows, each with its average, a small bar a month and how often it was spent on. Then
 * the closed "Nothing spent" and "Hidden" rows. The Total column shows from tablet width; on
 * phones the total stays in the line under the name. Compact rows keep the name and average.
 */
export function CategoryRows({
  groups,
  params,
  months,
  settings,
  spent,
  quietNote = `None in ${monthsWord(months)}. Still in the pickers: open one to rename, hide or merge it.`,
}: {
  groups: LineGroups;
  params: CategoriesParams;
  /** How many months the range has. */
  months: number;
  settings: ListSettings;
  /** All spending in the range. */
  spent: number;
  /** The line under "Nothing spent". */
  quietNote?: string;
}) {
  const { shown, quiet, hidden } = groups;
  const look: Look = {
    // With one month, the total is the "so far" amount already shown.
    withTotal: settings.total && months > 1,
    bars: settings.bars && !settings.compact,
    howOften: settings.howOften && !settings.compact,
    change: settings.change && !settings.compact,
    compact: settings.compact,
    shareOf: settings.share ? spent : null,
  };
  return (
    <>
      <Lines
        lines={shown}
        params={params}
        months={months}
        order={params.sort}
        look={look}
      />
      {settings.nothingSpent && quiet.length > 0 && (
        <MoreLines
          label={`Nothing spent · ${String(quiet.length)}`}
          about={quietNote}
          lines={quiet}
          params={params}
          months={months}
          order={params.sort}
          look={look}
        />
      )}
      {hidden.length > 0 && (
        <MoreLines
          label={hiddenLabel(hidden.length)}
          about="Left out of the pickers. Their spending still counts."
          lines={hidden}
          params={params}
          months={months}
          order={params.sort}
          look={look}
        />
      )}
    </>
  );
}

/**
 * "Groceries, Rent and Transport take 44%. This month, Other is Rs 5,920 more than usual by now."
 * Without a month before to compare with, the first sentence stands alone.
 */
export function Answer({ summary }: { summary: BookSummary }) {
  const spent = summary.lines
    .filter((line) => line.total > 0)
    .toSorted((one, two) => two.total - one.total);
  const top = spent.slice(0, 3);
  if (top.length === 0) return null;
  const share = sharePercent(
    top.reduce((all, line) => all + line.total, 0) / Math.max(summary.total, 1),
  );
  const names = joinAnd(top.map((line) => line.name));
  const lead =
    top.length === spent.length
      ? `All of it went on ${names}.`
      : `${names} take ${share}.`;

  const comparison = summary.now.comparison;
  if (comparison === null || summary.now.before === null) return lead;
  const by =
    comparison.kind === "usual"
      ? "usual by now"
      : `this time ${comparison.kind === "last" ? "last month" : comparison.name}`;
  const rising = summary.lines
    .filter((line) => line.change !== null && line.change > 0)
    .toSorted((one, two) => (two.change ?? 0) - (one.change ?? 0));
  const [first] = rising;
  if (first === undefined) {
    return `${lead} This month, every category is at or under ${by}.`;
  }
  if (first.now.before === 0) {
    return (
      <>
        {lead} This month, {first.name} is new:{" "}
        <Money value={first.now.total} /> so far.
      </>
    );
  }
  return (
    <>
      {lead} This month, {first.name} is <Money value={first.change ?? 0} />{" "}
      more than {by}.
    </>
  );
}

/** Every category, ranked: one big tap target each, to its own page. */
function Lines({
  lines,
  params,
  months,
  order,
  muted = false,
  look,
}: {
  lines: readonly CategoryLine[];
  params: CategoriesParams;
  /** How many months the range has. */
  months: number;
  order: LineOrder;
  muted?: boolean;
  look: Look;
}) {
  const { withTotal, bars } = look;
  return (
    <ol className="-mx-3 flex flex-col">
      {lines.map((line) => (
        <li key={line.name}>
          <Link
            href={{
              pathname: categoryPath(line.name),
              query: params.rangeQuery,
            }}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 rounded-2xl outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 @min-[40rem]:items-center",
              look.compact ? "min-h-11 items-center px-3 py-2" : "p-3",
              bars && withTotal
                ? "@min-[40rem]:grid-cols-[minmax(0,1fr)_12rem_8rem_8rem]"
                : bars
                  ? "@min-[40rem]:grid-cols-[minmax(0,1fr)_14rem_9rem]"
                  : withTotal
                    ? "@min-[40rem]:grid-cols-[minmax(0,1fr)_9rem_8rem]"
                    : "@min-[40rem]:grid-cols-[minmax(0,1fr)_9rem]",
              muted && "text-muted-foreground",
            )}
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-semibold wrap-break-word">{line.name}</span>
              <LineNote line={line} months={months} order={order} look={look} />
            </span>
            {/* One month has no pattern to show. */}
            {bars && line.cells.length > 1 && (
              <MiniBars
                cells={line.cells}
                className="col-span-2 row-start-2 @min-[40rem]:col-span-1 @min-[40rem]:col-start-2 @min-[40rem]:row-start-1"
              />
            )}
            <LineAmount line={line} look={look} />
            {withTotal && <LineTotal line={line} months={months} bars={bars} />}
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** The Total column, "Rs 874,100 in 12 months". Phones show it in the line under the name instead. */
function LineTotal({
  line,
  months,
  bars,
}: {
  line: CategoryLine;
  months: number;
  /** The bars take the second column, so the total moves along one. */
  bars: boolean;
}) {
  return (
    <span
      className={cn(
        "hidden text-right @min-[40rem]:row-start-1 @min-[40rem]:flex @min-[40rem]:flex-col @min-[40rem]:items-end",
        bars ? "@min-[40rem]:col-start-4" : "@min-[40rem]:col-start-3",
      )}
    >
      <Money
        value={line.total}
        className={cn("font-bold", line.total === 0 && "text-muted-foreground")}
      />
      <span className="text-sm text-muted-foreground">
        in {monthsWord(months)}
      </span>
    </span>
  );
}

/**
 * "Rs 75,045 a month", or for a category with no finished month yet, "Rs 9,300 so far". With the
 * share, "a month · 19%". Compact rows keep the words for screen readers only.
 */
function LineAmount({ line, look }: { line: CategoryLine; look: Look }) {
  const soFar = line.average === null || line.isNew;
  const value = soFar ? line.now.total : line.average;
  const share =
    look.shareOf === null || line.total === 0
      ? ""
      : ` · ${sharePercent(line.total / Math.max(look.shareOf, 1))}`;
  return (
    <span
      className={cn(
        "col-start-2 row-start-1 flex flex-col items-end text-right",
        look.bars ? "@min-[40rem]:col-start-3" : "@min-[40rem]:col-start-2",
      )}
    >
      <Money
        value={value ?? 0}
        className={cn("font-bold", line.total === 0 && "text-muted-foreground")}
      />
      <span
        className={look.compact ? "sr-only" : "text-sm text-muted-foreground"}
      >
        {soFar ? "so far" : "a month"}
        {share}
      </span>
    </span>
  );
}

/**
 * The line under a name: how often it was spent on and its total, "Spent every month · Rs 874,100
 * in all". New ones say so. Sorted by change, the change against usual by now, as words.
 */
function LineNote({
  line,
  months,
  order,
  look,
}: {
  line: CategoryLine;
  months: number;
  order: LineOrder;
  look: Look;
}) {
  if (!look.howOften && !look.change) return null;
  // This month against usual by now: "+Rs 3,100 by now". Nothing to say without a change.
  const change =
    look.change && line.change !== null && line.change !== 0 ? (
      <>
        {look.howOften ? " · " : ""}
        <Money value={line.change} signed /> by now
      </>
    ) : null;
  if (!look.howOften) {
    return change === null ? null : (
      <span className="text-sm text-muted-foreground">{change}</span>
    );
  }
  const row = line.now.categories.find((one) => one.name === line.name);
  // Nothing now and nothing before has no change to tell.
  const moved =
    row !== undefined &&
    row.before !== null &&
    (row.spent > 0 || row.before > 0);
  if (order.by === "change" && moved) {
    return (
      <Against
        row={row}
        summary={line.now}
        className="text-sm text-muted-foreground"
      />
    );
  }
  // With one month so far, how often says nothing: the entries say more.
  if (months === 1 && line.total > 0) {
    return (
      <span className="text-sm text-muted-foreground">
        {entriesWord(line.entries)} this month
      </span>
    );
  }
  if (line.isNew) {
    return (
      <span className="text-sm text-muted-foreground">
        New this month
        {change}
      </span>
    );
  }
  if (line.total === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        {spentInLabel(line)}
        {line.lastSpent !== null && <>. Last in {line.lastSpent.short}</>}
      </span>
    );
  }
  return (
    <span className="text-sm text-muted-foreground">
      {spentInLabel(line)}
      {/* The Total column shows the total from tablet width, so the line leaves it out there. */}
      <span className={cn(look.withTotal && "@min-[40rem]:hidden")}>
        {" "}
        · <Money value={line.total} /> in all
      </span>
      {change}
    </span>
  );
}

/**
 * A row that opens to more categories, closed until opened: "Hidden · 2", kept with their history,
 * or the ones with nothing spent in the range.
 */
function MoreLines({
  label,
  about,
  lines,
  params,
  months,
  order,
  look,
}: {
  label: string;
  /** One line under the label on what these are. */
  about: string;
  lines: readonly CategoryLine[];
  params: CategoriesParams;
  months: number;
  order: LineOrder;
  look: Look;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen(!open);
        }}
        className="-mx-3 flex min-h-11 items-center justify-between gap-3 rounded-2xl px-3 text-left font-semibold text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span>
          {label}
          <span className="block text-sm font-normal">{about}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-5 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <div id={id} hidden={!open}>
        <Lines
          lines={lines}
          params={params}
          months={months}
          order={order}
          muted
          look={look}
        />
      </div>
    </div>
  );
}
