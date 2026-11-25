"use client";

import { use } from "react";
import { cn } from "@/lib/utils";
import { AmountsContext } from "@proto/components/amounts";
import { DISPLAY } from "@proto/components/display";
import type { HistoryEntry } from "@proto/fixtures/entry-history";
import { formatLakhCrore } from "@proto/kit/format";
import { TotalsParts } from "../controls";
import {
  dayLabel,
  dayNumber,
  type MonthGroup,
  monthName,
  shortDate,
  shortMonth,
  type Totals,
  weekdayShort,
} from "../model";
import type { EntriesScreen } from "../use-entries-screen";
import { monthId } from "./b-months-rail";
import { DayMark, DIARY_LINE, EntryRow } from "./b-months-row";

// The diary itself: months as big headings that stay at the top, days in the gutter, entries
// beside them. In other orders, one list, each line with its own date.

/** How people say the month's biggest figure, "3.1 lakh received". Hidden with the amounts. */
function BiggestNote({ totals }: { totals: Totals }) {
  const { hidden } = use(AmountsContext);
  const biggest = [
    { word: "spent", value: totals.spent },
    { word: "received", value: totals.received },
    { word: "moved", value: totals.moved },
  ].toSorted((one, two) => two.value - one.value)[0];
  const spoken = biggest === undefined ? null : formatLakhCrore(biggest.value);
  if (hidden || spoken === null || biggest === undefined) return null;
  return (
    <p className="text-sm text-muted-foreground">
      {spoken} {biggest.word}
    </p>
  );
}

/** "November", big, with its totals under it. It stays at the top while its days scroll. */
function MonthHeading({ month, today }: { month: MonthGroup; today: string }) {
  return (
    <div className="sticky top-15 z-10 flex flex-col gap-1.5 border-b border-foreground/15 bg-background pt-4 pb-3 xl:top-0">
      <h2
        id={`${monthId(month.key)}-title`}
        tabIndex={-1}
        data-month-heading
        className={cn(
          DISPLAY,
          "text-4xl leading-none font-extrabold tracking-tight outline-none sm:text-5xl 2xl:text-6xl",
        )}
      >
        {monthName(month.key, today)}
      </h2>
      <p className="text-sm font-semibold sm:text-base">
        <TotalsParts totals={month.totals} />
      </p>
      <BiggestNote totals={month.totals} />
    </div>
  );
}

/** Every month of what's shown, newest first, its days in the gutter. */
export function MonthSections({
  screen,
  shownIds,
}: {
  screen: EntriesScreen;
  shownIds: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-12">
      {screen.months.map((month) => (
        <section
          key={month.key}
          id={monthId(month.key)}
          aria-labelledby={`${monthId(month.key)}-title`}
          className="scroll-mt-15 xl:scroll-mt-0"
        >
          <MonthHeading month={month} today={screen.today} />
          <ol className="flex flex-col">
            {month.days.map((day) => (
              <li
                key={day.date}
                className={cn(
                  DIARY_LINE,
                  "border-b border-foreground/10 py-2 last:border-b-0",
                )}
              >
                <h3 className="self-start">
                  <DayMark
                    number={dayNumber(day.date)}
                    word={weekdayShort(day.date)}
                    label={dayLabel(day.date, screen.today)}
                  />
                </h3>
                <ul className="flex min-w-0 flex-col">
                  {day.entries.map((entry) => (
                    <li key={entry.id}>
                      <EntryRow
                        screen={screen}
                        entry={entry}
                        shownIds={shownIds}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** Entries in one list, each line with its own date in the gutter. */
export function DatedRows({
  screen,
  entries,
  shownIds,
}: {
  screen: EntriesScreen;
  entries: readonly HistoryEntry[];
  shownIds: readonly string[];
}) {
  return (
    <ul className="flex flex-col">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className={cn(
            DIARY_LINE,
            "border-b border-foreground/10 py-1 last:border-b-0",
          )}
        >
          <DayMark
            small
            number={dayNumber(entry.date)}
            word={shortMonth(entry.date.slice(0, 7))}
            label={shortDate(entry.date)}
            className="self-start"
          />
          <EntryRow screen={screen} entry={entry} shownIds={shownIds} dated />
        </li>
      ))}
    </ul>
  );
}

/** By when logged: under the day each was typed, "Logged Tue 10 Nov", each saying its own date. */
export function LoggedGroups({
  screen,
  shownIds,
}: {
  screen: EntriesScreen;
  shownIds: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-10">
      {screen.loggedDays.map((day) => {
        const label = dayLabel(day.date, screen.today);
        const when =
          label === "Today" || label === "Yesterday"
            ? label.toLowerCase()
            : label;
        return (
          <section key={day.date} aria-label={`Logged ${when}`}>
            <h2
              className={cn(
                DISPLAY,
                "sticky top-0 z-10 border-b border-foreground/15 bg-background pt-4 pb-3 text-2xl leading-none font-extrabold tracking-tight sm:text-3xl",
              )}
            >
              Logged {when}
            </h2>
            <DatedRows
              screen={screen}
              entries={day.entries}
              shownIds={shownIds}
            />
          </section>
        );
      })}
    </div>
  );
}
