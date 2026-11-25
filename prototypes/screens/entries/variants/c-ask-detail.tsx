"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { DISPLAY } from "@proto/components/display";
import type { HistoryEntry } from "@proto/fixtures/entry-history";
import { joinAnd } from "@proto/screens/spending/parts";
import {
  BackToList,
  countsSentence,
  DetailActions,
  KindMark,
  SourceMark,
} from "../controls";
import { longDate, monthKeyOf, monthName } from "../model";
import type { EntriesScreen } from "../use-entries-screen";
import { Facts } from "./c-ask-facts";

// Ask's Entry detail, told as a short story: the name, one sentence in large type, then what it
// changed and how often it happens, in sentences, then the fields in a compact list.

export const EYEBROW_SMALL = "text-xs font-semibold tracking-widest uppercase";

/** "Sunday 8 November", with the year only when it isn't this year. */
function storyDate(date: string, today: string): string {
  const long = longDate(date);
  const year = today.slice(0, 4);
  return long.endsWith(` ${year}`) ? long.slice(0, -year.length - 1) : long;
}

/** "Rs 4,250 spent on Groceries from Meezan Bank – Salary on Sunday 8 November." */
function Sentence({ entry, today }: { entry: HistoryEntry; today: string }) {
  const amount = <Money value={entry.amount} className="font-extrabold" />;
  const when = storyDate(entry.date, today);
  switch (entry.kind) {
    case "expense": {
      const where =
        entry.parts === undefined
          ? entry.category
          : joinAnd(entry.parts.map((part) => part.category));
      return (
        <>
          {amount} spent{where === "" ? "" : ` on ${where}`} from{" "}
          {entry.account} on {when}.
        </>
      );
    }
    case "income":
      return (
        <>
          {amount} received
          {entry.category === "" ? "" : ` as ${entry.category}`} into{" "}
          {entry.account} on {when}.
        </>
      );
    case "transfer":
      return (
        <>
          {amount} moved from {entry.account} to {entry.toAccount} on {when}.
        </>
      );
    case "correction":
      return (
        <>
          {amount} lowered what&apos;s owed on {entry.account} on {when}.
        </>
      );
  }
}

/** Each account before and after, where it counts, and net worth, as sentences. */
function Changed({ screen }: { screen: EntriesScreen }) {
  const { impact, openEntry } = screen;
  if (impact === null || openEntry === null || openEntry === undefined)
    return null;
  const moved = openEntry.kind === "transfer";
  const { netWorth } = impact;
  return (
    <section aria-labelledby="ask-changed" className="flex flex-col gap-3">
      <h3 id="ask-changed" className={EYEBROW_SMALL}>
        What it changed
      </h3>
      <ul className="flex flex-col gap-2 text-base">
        {impact.places.map((place) => (
          <li key={place.name}>
            {place.debt ? `What's owed on ${place.name}` : place.name} went from{" "}
            <Money value={place.before} /> to{" "}
            <Money value={place.after} className="font-semibold" />.
          </li>
        ))}
        <li>{countsSentence(screen)}</li>
        {!(moved && netWorth === 0) && (
          <li>
            {netWorth === 0 ? (
              "Net worth stayed the same."
            ) : (
              <>
                Net worth went {netWorth > 0 ? "up" : "down"} by{" "}
                <Money value={Math.abs(netWorth)} />.
              </>
            )}
          </li>
        )}
      </ul>
    </section>
  );
}

/** "You've logged Imtiaz Super Market 9 times since June: Rs 38,200 in all, usually Rs 4,200." */
function SamePlace({ screen }: { screen: EntriesScreen }) {
  const same = screen.samePlace;
  if (same === null) return null;
  return (
    <section
      aria-labelledby="ask-same"
      className="flex flex-col items-start gap-3"
    >
      <h3 id="ask-same" className={EYEBROW_SMALL}>
        Same place
      </h3>
      <p className="text-base">
        You&apos;ve logged {same.title} {same.count} times since{" "}
        {monthName(monthKeyOf(same.first), screen.today)}:{" "}
        <Money value={same.total} className="font-semibold" /> in all, usually{" "}
        <Money value={same.usual} />.
      </p>
      <Button
        variant="outline"
        size="lg"
        className="h-11"
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

/** The open entry as a story. Below `lg` it's its own page, with the way back at the top. */
export function Story({
  screen,
  entry,
  headingId,
}: {
  screen: EntriesScreen;
  entry: HistoryEntry;
  headingId: string;
}) {
  return (
    <article aria-labelledby={headingId} className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-3">
        <BackToList screen={screen} className="lg:hidden" />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2
            id={headingId}
            tabIndex={-1}
            className="text-lg font-semibold wrap-break-word outline-none"
          >
            {entry.title}
          </h2>
          <KindMark kind={entry.kind} />
        </div>
        <p
          className={cn(
            DISPLAY,
            "text-2xl/snug font-semibold tracking-tight wrap-break-word md:text-3xl",
          )}
        >
          <Sentence entry={entry} today={screen.today} />
        </p>
        <SourceMark entry={entry} />
        <DetailActions screen={screen} entry={entry} className="mt-2" />
      </div>
      <Changed screen={screen} />
      <SamePlace screen={screen} />
      <Facts screen={screen} entry={entry} />
    </article>
  );
}
