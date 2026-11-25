"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { DISPLAY } from "@proto/components/display";
import type { HistoryEntry } from "@proto/fixtures/entry-history";
import { countsSentence, EntryAmount, whereText } from "../controls";
import { shortDate, shortMonth } from "../model";
import type { EntriesScreen } from "../use-entries-screen";

// The lower half of an entry's page: the rest of that day, what it changed, and the same place
// over the months.

/** A section of the page: a heading in the display face, then its content. */
export const SECTION_HEADING = cn(
  DISPLAY,
  "text-xl leading-none font-extrabold tracking-tight",
);

/** The other entries on the same date, each opening its own page. */
export function ThatDay({
  screen,
  entry,
}: {
  screen: EntriesScreen;
  entry: HistoryEntry;
}) {
  const others = screen.entries.filter(
    (other) => other.date === entry.date && other.id !== entry.id,
  );
  return (
    <section className="flex flex-col gap-2">
      <h3 className={SECTION_HEADING}>That day</h3>
      {others.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing else that day.</p>
      ) : (
        <ul className="flex flex-col">
          {others.map((other) => (
            <li key={other.id}>
              <a
                href={`/entries/${encodeURIComponent(other.id)}`}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                  event.preventDefault();
                  screen.opened.open(other.id);
                }}
                className="-mx-2 flex min-h-11 items-start justify-between gap-3 rounded-lg p-2 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium wrap-break-word">
                    {other.title}
                  </span>
                  <span className="text-sm wrap-break-word text-muted-foreground">
                    {whereText(other)}
                  </span>
                </span>
                <EntryAmount entry={other} className="shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Each account or debt before and after, where it counts, and how far net worth moved. */
export function WhatItChanged({ screen }: { screen: EntriesScreen }) {
  const { impact } = screen;
  if (impact === null) return null;
  return (
    <section className="flex flex-col gap-3">
      <h3 className={SECTION_HEADING}>What it changed</h3>
      <ul className="flex flex-col gap-2">
        {impact.places.map((place) => (
          <li
            key={place.name}
            className="flex flex-wrap items-baseline justify-between gap-x-3"
          >
            <span className="min-w-0 font-medium wrap-break-word">
              {place.name}
              {place.debt && (
                <span className="text-sm text-muted-foreground"> owed</span>
              )}
            </span>
            <span className="text-right whitespace-nowrap">
              <Money value={place.before} className="text-muted-foreground" />
              <span aria-hidden="true"> → </span>
              <span className="sr-only"> to </span>
              <Money value={place.after} className="font-semibold" />
            </span>
          </li>
        ))}
      </ul>
      <p className="text-sm">{countsSentence(screen)}</p>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-foreground/10 pt-3">
        <span className="font-medium">Net worth</span>
        {impact.netWorth === 0 ? (
          <span className="text-sm">Stays the same</span>
        ) : (
          <Money
            value={impact.netWorth}
            signed
            className={cn(
              "font-semibold",
              impact.netWorth > 0 ? "text-gain" : "text-loss",
            )}
          />
        )}
      </p>
    </section>
  );
}

/** How often this name comes up, what it usually costs, and a bar per month. */
export function SamePlace({ screen }: { screen: EntriesScreen }) {
  const same = screen.samePlace;
  if (same === null) return null;
  const largest = Math.max(1, ...same.months.map((month) => month.total));
  return (
    <section className="flex flex-col gap-3">
      <h3 className={SECTION_HEADING}>Same place</h3>
      <p className="text-sm">
        {same.count} times since {shortDate(same.first)},{" "}
        <Money value={same.total} /> in all. Usually{" "}
        <Money value={same.usual} className="font-semibold" />.
      </p>
      <ol className="flex h-24 items-end gap-2">
        {same.months.map((month) => (
          <li
            key={month.key}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="sr-only">
              {shortMonth(month.key)}: <Money value={month.total} />
            </span>
            <span
              aria-hidden="true"
              className="block w-full max-w-8 rounded-t-md bg-primary"
              style={{
                height: `${String(Math.max(6, (month.total / largest) * 75))}%`,
              }}
            />
            <span aria-hidden="true" className="text-xs font-medium">
              {shortMonth(month.key)}
            </span>
          </li>
        ))}
      </ol>
      <Button
        variant="outline"
        size="lg"
        className="h-11 self-start"
        onClick={() => {
          screen.opened.close();
          screen.params.setQuery(same.title);
        }}
      >
        See all {same.count}
      </Button>
    </section>
  );
}
