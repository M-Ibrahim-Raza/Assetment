"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Money } from "@proto/components/amounts";
import type { HistoryEntry } from "@proto/fixtures/entry-history";
import { LakhNote } from "@proto/screens/spending/parts";
import {
  BackToList,
  countsSentence,
  DetailActions,
  EntryAmount,
} from "../controls";
import { KIND_WORD, loggedLabel, longDate, shortDate } from "../model";
import type { EntriesScreen } from "../use-entries-screen";

// Ledger's Entry detail: a narrow record sheet. Beside the table from lg, sticky; below lg, its own
// page with the way back at the top.

/** Where the detail sits beside the list rather than being its own page. */
export const BESIDE = "(min-width: 64rem)";

const LABEL =
  "text-xs font-semibold tracking-wider text-muted-foreground uppercase";

/** One label and value line of the record. */
function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="col-span-2 grid grid-cols-subgrid gap-x-4 border-b border-dashed border-border py-2">
      <dt className={`${LABEL} pt-0.5`}>{label}</dt>
      <dd className="min-w-0 wrap-break-word">{children}</dd>
    </div>
  );
}

/** Where the money was, by kind: "Paid from", "Into", From and To, or the debt corrected. */
function AccountLines({ entry }: { entry: HistoryEntry }) {
  switch (entry.kind) {
    case "expense":
      return <Line label="Paid from">{entry.account}</Line>;
    case "income":
      return <Line label="Into">{entry.account}</Line>;
    case "transfer":
      return (
        <>
          <Line label="From">{entry.account}</Line>
          <Line label="To">{entry.toAccount}</Line>
        </>
      );
    case "correction":
      return <Line label="Debt">{entry.account}</Line>;
  }
}

/** What it changed: each account before and after, where it counts, and net worth. */
function Changed({ screen }: { screen: EntriesScreen }) {
  const id = useId();
  const { impact } = screen;
  if (impact === null) return null;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1.5 text-sm">
      <h3 id={id} className={LABEL}>
        What it changed
      </h3>
      <ul className="flex flex-col">
        {impact.places.map((place) => (
          <li
            key={place.name}
            className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-dashed border-border py-1.5"
          >
            <span className="min-w-0 font-medium wrap-break-word">
              {place.name}
              {place.debt && (
                <span className="font-normal text-muted-foreground"> owed</span>
              )}
            </span>
            <span className="text-right whitespace-nowrap">
              <Money value={place.before} />
              <span aria-hidden="true"> → </span>
              <span className="sr-only"> to </span>
              <Money value={place.after} className="font-semibold" />
            </span>
          </li>
        ))}
        <li className="flex flex-wrap items-baseline justify-between gap-x-3 py-1.5">
          <span className="font-medium">Net worth</span>
          {impact.netWorth === 0 ? (
            <span>Stays the same</span>
          ) : (
            <Money value={impact.netWorth} signed className="font-semibold" />
          )}
        </li>
      </ul>
      <p className="text-muted-foreground">{countsSentence(screen)}</p>
    </section>
  );
}

/** Same place: how often, how much, what it usually costs, and the list of them all. */
function SamePlace({ screen }: { screen: EntriesScreen }) {
  const id = useId();
  const same = screen.samePlace;
  if (same === null) return null;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1.5 text-sm">
      <h3 id={id} className={LABEL}>
        Same place
      </h3>
      <p>
        {same.count} times since {shortDate(same.first)}. Usually{" "}
        <Money value={same.usual} className="font-semibold" />, and{" "}
        <Money value={same.total} className="font-semibold" /> in all.
      </p>
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

/** One entry as a record: amount at the top, then its lines, what it changed, and its actions. */
export function LedgerRecord({
  screen,
  entry,
}: {
  screen: EntriesScreen;
  entry: HistoryEntry;
}) {
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  // As its own page, the record takes focus, so a screen reader starts at its name.
  useEffect(() => {
    if (!window.matchMedia(BESIDE).matches) heading.current?.focus();
  }, [entry.id]);
  const { today } = screen;
  const markup = entry.source?.markup ?? 0;
  return (
    <article
      aria-labelledby={headingId}
      className="@container/record flex flex-col gap-5 rounded-2xl bg-card p-4 lg:p-5"
    >
      <BackToList screen={screen} className="self-start lg:hidden" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className={LABEL}>{KIND_WORD[entry.kind]}</p>
          <EntryAmount
            entry={entry}
            className="text-3xl/tight tracking-tight wrap-anywhere @min-[20rem]/record:text-4xl"
          />
          <LakhNote
            value={entry.amount}
            className="text-sm text-muted-foreground"
          />
        </div>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Close entry"
          className="-mt-1 -mr-2 size-11 max-lg:hidden"
          onClick={screen.opened.close}
        >
          <X />
        </Button>
      </div>
      <h2
        id={headingId}
        ref={heading}
        tabIndex={-1}
        className="-mt-2 text-lg/snug font-semibold wrap-break-word outline-none"
      >
        {entry.title}
      </h2>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] border-t border-border text-sm">
        {entry.parts === undefined ? (
          entry.category !== "" && (
            <Line label="Category">{entry.category}</Line>
          )
        ) : (
          <Line label="Split">
            <ul className="flex flex-col gap-0.5">
              {entry.parts.map((part) => (
                <li key={part.category} className="flex justify-between gap-3">
                  <span className="min-w-0">{part.category}</span>
                  <Money value={part.amount} />
                </li>
              ))}
            </ul>
          </Line>
        )}
        <AccountLines entry={entry} />
        <Line label="Date">{longDate(entry.date)}</Line>
        {entry.note !== undefined && <Line label="Note">{entry.note}</Line>}
        {entry.tags !== undefined && entry.tags.length > 0 && (
          <Line label="Tags">
            <span className="-my-1 flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  className="h-11 max-w-full rounded-full px-3"
                  aria-label={`Show entries tagged ${tag}`}
                  onClick={() => {
                    if (!window.matchMedia(BESIDE).matches)
                      screen.opened.close();
                    screen.params.setTag(tag);
                  }}
                >
                  <span className="min-w-0 truncate">#{tag}</span>
                </Button>
              ))}
            </span>
          </Line>
        )}
        <Line label="Logged">{loggedLabel(entry.loggedAt, today)}</Line>
        {entry.editedAt !== undefined && (
          <Line label="Edited">{loggedLabel(entry.editedAt, today)}</Line>
        )}
        {entry.source !== undefined && (
          <Line label="Source">
            Added by the app for {entry.source.name}
            {markup > 0 && (
              <span className="mt-0.5 block text-muted-foreground">
                <Money value={markup} /> markup counts as spent under Loan
                markup
              </span>
            )}
          </Line>
        )}
      </dl>
      <Changed screen={screen} />
      <SamePlace screen={screen} />
      <DetailActions
        screen={screen}
        entry={entry}
        className="border-t border-border pt-4"
      />
    </article>
  );
}
