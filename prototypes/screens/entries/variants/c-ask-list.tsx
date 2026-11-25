"use client";

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
import { dayLabel, monthName, shortDate, type Totals } from "../model";
import type { EntriesScreen } from "../use-entries-screen";

// Ask's list: light, one line per entry, under thin month rules. No boxes around rows.

/** From tablet width up, rows show checkboxes and a tap always opens. */
const wide = () => window.matchMedia("(min-width: 48rem)").matches;

/** What the sentence already says, so a row can leave it out. A split keeps its parts. */
function hideOf(
  screen: EntriesScreen,
  entry: HistoryEntry,
): "category" | "account" | undefined {
  if (screen.filters.account !== undefined) return "account";
  if (screen.filters.category !== undefined && entry.parts === undefined)
    return "category";
  return undefined;
}

/** A hairline with the month in small tracked caps on the left and its totals on the right. */
function Rule({
  id,
  label,
  totals,
}: {
  id: string;
  label: string;
  totals: Totals;
}) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-0.5 bg-background pt-4 pb-2">
      <h2
        id={id}
        tabIndex={-1}
        className="text-xs font-semibold tracking-widest uppercase outline-none"
      >
        {label}
      </h2>
      <span
        aria-hidden="true"
        className="h-px min-w-6 flex-1 bg-foreground/20"
      />
      <TotalsParts
        totals={totals}
        className="justify-end text-xs font-medium text-muted-foreground"
      />
    </div>
  );
}

interface RowProps {
  screen: EntriesScreen;
  entry: HistoryEntry;
  /** The list's ids in order, for Shift-click runs. */
  order: readonly string[];
  /** Opens the entry, keeping the list's place. */
  onOpen: (id: string) => void;
  /** False for a day's later rows: the date is said to screen readers only. */
  showDate?: boolean;
  /** A thin line over the first row of a new day. */
  newDay?: boolean;
}

/** One entry: its date, name and where, and the amount on the right. */
function Row({
  screen,
  entry,
  order,
  onOpen,
  showDate = true,
  newDay = false,
}: RowProps) {
  const { selection } = screen;
  const picked = selection.has(entry.id);
  const open = screen.opened.id === entry.id;
  const balance = screen.balances?.get(entry.id);
  const owed =
    screen.accountPlace !== undefined && screen.accountPlace.debt !== null;
  const date = shortDate(entry.date);
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.button !== 0)
      return;
    event.preventDefault();
    if (event.shiftKey) selection.pickRun(entry.id, order);
    else if (selection.selecting && !wide()) selection.toggle(entry.id);
    else onOpen(entry.id);
  };
  return (
    <li
      className={cn(
        "flex items-stretch",
        newDay && "border-t border-foreground/10",
      )}
    >
      <span
        className={cn(
          "flex w-11 shrink-0 items-center justify-center",
          !selection.selecting && "max-md:hidden",
        )}
      >
        <Checkbox
          checked={picked}
          onCheckedChange={() => {
            selection.toggle(entry.id);
          }}
          aria-label={`Pick ${entry.title}`}
          className="border-muted-foreground after:-inset-3.5"
        />
      </span>
      <a
        href={`/entries/${encodeURIComponent(entry.id)}`}
        data-entry-row={entry.id}
        aria-current={open ? "true" : undefined}
        onClick={onClick}
        className={cn(
          "flex min-h-14 min-w-0 flex-1 items-baseline gap-3 rounded-lg px-2 py-3 outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50",
          picked && "bg-accent/60",
          open && "bg-accent hover:bg-accent",
        )}
      >
        {/* In Select mode on phones, the checkbox takes the date's place. */}
        <span
          className={cn(
            "w-11 shrink-0 text-xs font-medium text-muted-foreground tabular-nums",
            selection.selecting && "max-md:sr-only",
          )}
        >
          {showDate ? date : <span className="sr-only">{date}</span>}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="min-w-0 font-semibold wrap-break-word">
              {entry.title}
            </span>
            <KindMark kind={entry.kind} />
          </span>
          <span className="text-sm wrap-break-word text-muted-foreground">
            {whereText(entry, hideOf(screen, entry))}
          </span>
          <SourceMark entry={entry} />
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <EntryAmount entry={entry} />
          {balance !== undefined && (
            <span className="flex flex-col items-end text-xs text-muted-foreground md:flex-row md:gap-1">
              <span>{owed ? "Owed after" : "Balance after"}</span>
              <Money value={balance} />
            </span>
          )}
        </span>
      </a>
    </li>
  );
}

/**
 * The entries in the list's order: by date under month rules, each day's date said once; by when
 * logged under the day each was typed; otherwise one flat list, each row with its date.
 */
export function AskList({
  screen,
  onOpen,
}: {
  screen: EntriesScreen;
  onOpen: (id: string) => void;
}) {
  const order = screen.shown.map((entry) => entry.id);
  const row = { screen, order, onOpen };
  if (screen.order.by === "date") {
    return (
      <div className="flex flex-col gap-4">
        {screen.months.map((month) => (
          <section
            key={month.key}
            id={`month-${month.key}`}
            aria-labelledby={`ask-month-${month.key}`}
          >
            <Rule
              id={`ask-month-${month.key}`}
              label={monthName(month.key, screen.today)}
              totals={month.totals}
            />
            <ul className="flex flex-col">
              {month.days.flatMap((day, dayIndex) =>
                day.entries.map((entry, index) => (
                  <Row
                    key={entry.id}
                    {...row}
                    entry={entry}
                    showDate={index === 0}
                    newDay={index === 0 && dayIndex > 0}
                  />
                )),
              )}
            </ul>
          </section>
        ))}
      </div>
    );
  }
  if (screen.order.by === "logged") {
    return (
      <div className="flex flex-col gap-4">
        {screen.loggedDays.map((day) => (
          <section key={day.date} aria-labelledby={`ask-logged-${day.date}`}>
            <Rule
              id={`ask-logged-${day.date}`}
              label={`Logged ${dayLabel(day.date, screen.today)}`}
              totals={day.totals}
            />
            <ul className="flex flex-col">
              {day.entries.map((entry) => (
                <Row key={entry.id} {...row} entry={entry} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }
  return (
    <ul className="flex flex-col border-t border-foreground/20">
      {screen.shown.map((entry) => (
        <Row key={entry.id} {...row} entry={entry} />
      ))}
    </ul>
  );
}
