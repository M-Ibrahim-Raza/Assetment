"use client";

import { ArrowDown, ArrowUp, StickyNote } from "lucide-react";
import type { MouseEvent } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import type { HistoryEntry } from "@proto/fixtures/entry-history";
import {
  EntryAmount,
  KindMark,
  SourceMark,
  TotalsParts,
  whereText,
} from "../controls";
import {
  categoriesOf,
  dayLabel,
  dayNumber,
  type EntrySort,
  entriesWord,
  monthName,
  shortDate,
  SORT_FIELDS,
  type Totals,
  weekdayShort,
} from "../model";
import type { EntriesScreen } from "../use-entries-screen";

// Ledger's list: one semantic table. From 40rem of the list's own width it is a real table, with
// sort buttons in its head and each month as a band. Narrower, the same rows become two-line
// rows under sticky month bands. The container is named `ledger` in a-ledger.tsx.

/** Rows under one band: a month, a day logged, or every row in other orders. */
interface Group {
  key: string;
  /** The section's id, so Jump to month can reach it. */
  id?: string;
  /** Null in orders that aren't grouped. */
  label: string | null;
  totals: Totals;
  rows: { entry: HistoryEntry; date: string | null; dayStart: boolean }[];
}

/** "Today", "Yesterday" or "Sun 8": the month band already names the month. */
function quietDay(date: string, today: string): string {
  const label = dayLabel(date, today);
  return label === "Today" || label === "Yesterday"
    ? label
    : `${weekdayShort(date)} ${dayNumber(date)}`;
}

function groupsOf(screen: EntriesScreen): Group[] {
  const { today } = screen;
  if (screen.order.by === "date") {
    return screen.months.map((month) => ({
      key: month.key,
      id: `month-${month.key}`,
      label: monthName(month.key, today),
      totals: month.totals,
      rows: month.days.flatMap((day, dayIndex) =>
        day.entries.map((entry, index) => ({
          entry,
          date: index === 0 ? quietDay(day.date, today) : null,
          dayStart: index === 0 && dayIndex > 0,
        })),
      ),
    }));
  }
  if (screen.order.by === "logged") {
    return screen.loggedDays.map((day) => ({
      key: day.date,
      label: `Logged ${dayLabel(day.date, today)}`,
      totals: day.totals,
      rows: day.entries.map((entry) => ({
        entry,
        date: shortDate(entry.date),
        dayStart: false,
      })),
    }));
  }
  return [
    {
      key: "all",
      label: null,
      totals: screen.totals,
      rows: screen.shown.map((entry) => ({
        entry,
        date: shortDate(entry.date),
        dayStart: false,
      })),
    },
  ];
}

/** The Category column: the category, or a split's parts. Moved money and corrections have none. */
function categoryText(entry: HistoryEntry): string | null {
  if (entry.kind === "transfer" || entry.kind === "correction") return null;
  return entry.parts === undefined
    ? entry.category
    : `Split: ${categoriesOf(entry).join(", ")}`;
}

/** The Account column: where it was paid from or landed, or "Meezan Bank → JazzCash". */
function accountText(entry: HistoryEntry): string {
  return entry.kind === "transfer"
    ? `${entry.account} → ${entry.toAccount ?? ""}`
    : entry.account;
}

// Words sort A to Z by default: the usual way is ascending. Dates and amounts start descending.
const WORDS: readonly EntrySort[] = ["name", "category", "account"];

const HEAD_CELL =
  "sticky top-0 z-30 h-11 border-b border-foreground/20 bg-card p-0 text-left align-middle";

/** A column head that sorts by its column; again turns the order round. */
function SortHead({
  screen,
  field,
  label,
  right = false,
  className,
}: {
  screen: EntriesScreen;
  field: EntrySort;
  label: string;
  right?: boolean;
  className?: string;
}) {
  const { order } = screen;
  const on = order.by === field;
  const descending = WORDS.includes(field) ? order.reversed : !order.reversed;
  return (
    <th
      scope="col"
      aria-sort={on ? (descending ? "descending" : "ascending") : undefined}
      className={cn(HEAD_CELL, className)}
    >
      <button
        type="button"
        onClick={() => {
          screen.params.setSort({
            by: field,
            reversed: on ? !order.reversed : false,
          });
        }}
        className={cn(
          "flex h-11 w-full items-center gap-1 px-2 text-xs font-semibold tracking-wider uppercase outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          right && "justify-end pr-3",
          on ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {on &&
          (descending ? (
            <ArrowDown aria-hidden="true" className="size-3.5" />
          ) : (
            <ArrowUp aria-hidden="true" className="size-3.5" />
          ))}
      </button>
    </th>
  );
}

interface RowContext {
  screen: EntriesScreen;
  /** Opens an entry, keeping the list's place. */
  onOpen: (id: string) => void;
  /** True while the list shows two-line rows, where Select mode applies. */
  isNarrow: () => boolean;
  shownIds: readonly string[];
}

/** One entry: a table row from 40rem, two lines below it. Its name is the link that opens it. */
function Row({
  entry,
  date,
  dayStart,
  context,
}: {
  entry: HistoryEntry;
  date: string | null;
  dayStart: boolean;
  context: RowContext;
}) {
  const { screen, onOpen, isNarrow, shownIds } = context;
  const { selection } = screen;
  const picked = selection.has(entry.id);
  const open = screen.opened.id === entry.id;
  const balance = screen.balances?.get(entry.id);
  const owed =
    screen.accountPlace !== undefined && screen.accountPlace.debt !== null;
  const category = categoryText(entry);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    if (event.shiftKey) {
      selection.pickRun(entry.id, shownIds);
      return;
    }
    if (selection.selecting && isNarrow()) {
      selection.toggle(entry.id);
      return;
    }
    onOpen(entry.id);
  };

  return (
    <tr
      className={cn(
        "relative grid items-start gap-x-3 border-b border-border px-3 py-2.5 hover:bg-muted/60 @min-[40rem]/ledger:table-row @min-[40rem]/ledger:p-0",
        selection.selecting
          ? "grid-cols-[auto_minmax(0,1fr)_auto]"
          : "grid-cols-[minmax(0,1fr)_auto]",
        dayStart &&
          "@min-[40rem]/ledger:*:border-t @min-[40rem]/ledger:*:border-foreground/20",
        picked && "bg-accent/50 hover:bg-accent/60",
        open && "bg-accent hover:bg-accent",
      )}
    >
      <td
        className={cn(
          "pt-0.5 @min-[40rem]/ledger:table-cell @min-[40rem]/ledger:py-3 @min-[40rem]/ledger:pr-0 @min-[40rem]/ledger:pl-3.5",
          selection.selecting ? "block" : "hidden",
        )}
      >
        <Checkbox
          checked={picked}
          onCheckedChange={() => {
            selection.toggle(entry.id);
          }}
          aria-label={`Pick ${entry.title}`}
          className="z-10 after:-inset-3.5"
        />
      </td>
      <td className="hidden px-2 py-3 align-top text-xs/5 whitespace-nowrap text-muted-foreground tabular-nums @min-[40rem]/ledger:table-cell">
        {date}
      </td>
      <td className="min-w-0 align-top text-sm @min-[40rem]/ledger:px-2 @min-[40rem]/ledger:py-3">
        <a
          href={`/entries/${entry.id}`}
          data-entry-row={entry.id}
          aria-current={open ? "true" : undefined}
          onClick={onClick}
          className="font-medium wrap-break-word outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
        >
          {entry.title}
        </a>
        {(entry.kind !== "expense" || entry.note !== undefined) && (
          <span className="ml-2 inline-flex items-center gap-1.5 align-middle">
            <KindMark kind={entry.kind} className="text-xs/4" />
            {entry.note !== undefined && (
              <>
                <StickyNote
                  aria-hidden="true"
                  className="size-3.5 text-muted-foreground"
                />
                <span className="sr-only">Has a note</span>
              </>
            )}
          </span>
        )}
        <span className="mt-0.5 block text-xs/5 wrap-break-word text-muted-foreground @min-[40rem]/ledger:hidden">
          {whereText(entry)} · {dayLabel(entry.date, screen.today)}
        </span>
        <SourceMark entry={entry} className="mt-0.5 flex max-w-full" />
      </td>
      <td className="hidden px-2 py-3 align-top text-sm wrap-break-word @min-[40rem]/ledger:table-cell">
        {category ?? (
          <span aria-hidden="true" className="text-muted-foreground">
            —
          </span>
        )}
      </td>
      <td className="hidden px-2 py-3 align-top text-sm wrap-break-word @min-[40rem]/ledger:table-cell">
        {accountText(entry)}
      </td>
      <td className="text-right align-top text-sm whitespace-nowrap @min-[40rem]/ledger:py-3 @min-[40rem]/ledger:pr-3 @min-[40rem]/ledger:pl-2">
        <EntryAmount entry={entry} className="font-semibold" />
        {balance !== undefined && (
          <span className="mt-0.5 block text-xs/5 text-muted-foreground @min-[40rem]/ledger:hidden">
            {owed ? "Owed" : "Balance"}
            <span className="sr-only"> after</span> <Money value={balance} />
          </span>
        )}
      </td>
      {screen.balances !== null && (
        <td className="hidden py-3 pr-3 pl-2 text-right align-top text-sm whitespace-nowrap text-muted-foreground @min-[40rem]/ledger:table-cell">
          {balance === undefined ? null : <Money value={balance} />}
        </td>
      )}
    </tr>
  );
}

/** A month, or a day logged, as a band across the table. It stays under the head while it scrolls. */
function Band({ group, columns }: { group: Group; columns: number }) {
  return (
    <tr className="sticky top-0 z-20 block @min-[40rem]/ledger:static @min-[40rem]/ledger:table-row">
      <th
        scope="rowgroup"
        colSpan={columns}
        className="block bg-secondary px-3 py-2 text-left font-normal text-secondary-foreground @min-[40rem]/ledger:sticky @min-[40rem]/ledger:top-11 @min-[40rem]/ledger:z-20 @min-[40rem]/ledger:table-cell @min-[40rem]/ledger:px-3.5"
      >
        <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <span className="text-xs font-bold tracking-widest uppercase">
            {group.label}
            <span className="ml-2 font-semibold tracking-normal normal-case">
              {entriesWord(group.totals.count)}
            </span>
          </span>
          <TotalsParts totals={group.totals} className="text-xs font-medium" />
        </span>
      </th>
    </tr>
  );
}

/** Every entry shown, as a ledger. */
export function LedgerTable({
  screen,
  onOpen,
  isNarrow,
}: {
  screen: EntriesScreen;
  onOpen: (id: string) => void;
  isNarrow: () => boolean;
}) {
  const { selection, order } = screen;
  const shownIds = screen.shown.map((entry) => entry.id);
  const allPicked =
    shownIds.length > 0 && shownIds.every((id) => selection.has(id));
  const somePicked = !allPicked && shownIds.some((id) => selection.has(id));
  const withBalance = screen.balances !== null;
  const columns = withBalance ? 7 : 6;
  const field = SORT_FIELDS[order.by];
  const context: RowContext = { screen, onOpen, isNarrow, shownIds };

  return (
    <table className="block w-full text-sm @min-[40rem]/ledger:table @min-[40rem]/ledger:table-fixed">
      <caption className="sr-only">
        Entries by {field.name.toLowerCase()},{" "}
        {(order.reversed ? field.ways[1] : field.ways[0]).toLowerCase()}
      </caption>
      <thead className="hidden @min-[40rem]/ledger:table-header-group">
        <tr>
          <th scope="col" className={cn(HEAD_CELL, "w-11 pl-3.5")}>
            <Checkbox
              checked={allPicked}
              indeterminate={somePicked}
              onCheckedChange={() => {
                if (allPicked) selection.clear();
                else selection.setAll(shownIds);
              }}
              aria-label={`Pick all ${String(shownIds.length)} shown`}
              // Some picked: a dash, not the shared check, which would read as all picked.
              className="after:-inset-3.5 data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:before:h-0.5 data-indeterminate:before:w-2 data-indeterminate:before:rounded-full data-indeterminate:before:bg-primary-foreground data-indeterminate:[&_svg]:hidden"
            />
          </th>
          <SortHead
            screen={screen}
            field="date"
            label="Date"
            className="w-20"
          />
          <SortHead screen={screen} field="name" label="Name" />
          <SortHead
            screen={screen}
            field="category"
            label="Category"
            className={withBalance ? "w-1/7" : "w-1/6"}
          />
          <SortHead
            screen={screen}
            field="account"
            label="Account"
            className={withBalance ? "w-1/6" : "w-1/5"}
          />
          <SortHead
            screen={screen}
            field="amount"
            label="Amount"
            right
            className="w-28"
          />
          {withBalance && (
            <th
              scope="col"
              className={cn(
                HEAD_CELL,
                "w-28 pr-3 text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase",
              )}
            >
              {screen.accountPlace?.debt == null
                ? "Balance after"
                : "Owed after"}
            </th>
          )}
        </tr>
      </thead>
      {groupsOf(screen).map((group) => (
        <tbody
          key={group.key}
          id={group.id}
          className="block @min-[40rem]/ledger:table-row-group @min-[40rem]/ledger:scroll-mt-11"
        >
          {group.label !== null && <Band group={group} columns={columns} />}
          {group.rows.map((row) => (
            <Row
              key={row.entry.id}
              entry={row.entry}
              date={row.date}
              dayStart={row.dayStart}
              context={context}
            />
          ))}
        </tbody>
      ))}
    </table>
  );
}
