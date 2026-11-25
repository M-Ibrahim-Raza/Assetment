"use client";

import type { MouseEvent } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { DISPLAY } from "@proto/components/display";
import type { HistoryEntry } from "@proto/fixtures/entry-history";
import { EntryAmount, KindMark, SourceMark, whereText } from "../controls";
import { shortDate } from "../model";
import type { EntriesScreen } from "../use-entries-screen";

// One line of the diary: a day's big number in the gutter, and an entry beside it.

/** Computers show checkboxes and take Shift-click; phones pick in Select mode. */
const isComputer = () => window.matchMedia("(min-width: 48rem)").matches;

/** The gutter and the entries beside it, the same on every line of the page. */
export const DIARY_LINE =
  "grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-x-5";

/**
 * A day in the gutter: its number, big, over a short word ("Sun", or "Nov" in lists not by date).
 * Screen readers hear `label` instead.
 */
export function DayMark({
  number,
  word,
  label,
  small = false,
  className,
}: {
  number: string;
  word: string;
  label: string;
  small?: boolean;
  className?: string | undefined;
}) {
  return (
    <span className={cn("flex flex-col items-center pt-2", className)}>
      <span
        aria-hidden="true"
        className={cn(
          DISPLAY,
          "leading-none font-extrabold tracking-tight tabular-nums",
          small ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl",
        )}
      >
        {number}
      </span>
      <span aria-hidden="true" className="text-sm font-semibold">
        {word}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * One entry: its name, where the money went, and the amount at the right. A real link: a click
 * opens it beside the list (its own page on phones), Shift-click picks a run on computers, and in
 * phones' Select mode a tap picks it.
 */
export function EntryRow({
  screen,
  entry,
  shownIds,
  dated = false,
}: {
  screen: EntriesScreen;
  entry: HistoryEntry;
  /** What the list shows, in its order, for Shift-click runs. */
  shownIds: readonly string[];
  /** Screen readers hear its date, for lists not under days. */
  dated?: boolean;
}) {
  const { selection } = screen;
  const picked = selection.has(entry.id);
  const open = screen.opened.id === entry.id;
  const balance = screen.balances?.get(entry.id);
  const owed =
    screen.accountPlace !== undefined && screen.accountPlace.debt !== null;

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const computer = isComputer();
    event.preventDefault();
    if (event.shiftKey && computer) {
      selection.pickRun(entry.id, shownIds);
    } else if (selection.selecting && !computer) {
      selection.toggle(entry.id);
    } else {
      screen.opened.open(entry.id);
    }
  };

  return (
    <div
      className={cn(
        "-mx-2 flex items-start gap-1 rounded-xl px-2",
        open && "bg-card shadow-sm",
        picked && "bg-accent",
      )}
    >
      <span
        className={cn(
          "flex h-14 w-7 shrink-0 items-center",
          !selection.selecting && "max-md:hidden",
        )}
      >
        <Checkbox
          checked={picked}
          onCheckedChange={() => {
            selection.toggle(entry.id);
          }}
          aria-label={`Pick ${entry.title}`}
        />
      </span>
      <a
        href={`/entries/${encodeURIComponent(entry.id)}`}
        data-entry-row={entry.id}
        aria-current={open ? "true" : undefined}
        onClick={onClick}
        className="flex min-h-14 min-w-0 flex-1 items-start justify-between gap-3 rounded-lg py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="leading-snug font-semibold wrap-break-word">
            {entry.title}
            {dated && (
              <span className="sr-only">, {shortDate(entry.date)}</span>
            )}
          </span>
          <span className="text-sm wrap-break-word text-muted-foreground">
            {whereText(entry)}
          </span>
          {(entry.kind !== "expense" || entry.source !== undefined) && (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <KindMark kind={entry.kind} />
              <SourceMark entry={entry} />
            </span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <EntryAmount entry={entry} />
          {balance !== undefined && (
            <span className="flex flex-col items-end text-xs text-muted-foreground">
              <span>{owed ? "Owed after" : "Balance after"}</span>
              <Money value={balance} className="font-semibold" />
            </span>
          )}
        </span>
      </a>
    </div>
  );
}
