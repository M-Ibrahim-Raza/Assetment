"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { EYEBROW } from "@proto/components/blocks";
import { DISPLAY } from "@proto/components/display";
import type { HistoryEntry } from "@proto/fixtures/entry-history";
import {
  BackToList,
  DetailActions,
  EntryAmount,
  NotFoundDetail,
} from "../controls";
import {
  dayNumber,
  KIND_WORD,
  loggedLabel,
  longDate,
  monthName,
  weekdayShort,
} from "../model";
import type { EntriesScreen } from "../use-entries-screen";
import { SamePlace, ThatDay, WhatItChanged } from "./b-months-detail-more";

// An entry as a diary page for its day: the day, the amount big, what it was, then the rest of
// that day, what it changed and the same place over the months.

function Field({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 border-b border-foreground/10 py-2.5 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="min-w-0 wrap-break-word">{children}</dd>
    </div>
  );
}

/** Where the money was: paid from, into, from and to, or the debt a correction lowers. */
function AccountField({ entry }: { entry: HistoryEntry }) {
  switch (entry.kind) {
    case "expense":
      return <Field term="Paid from">{entry.account}</Field>;
    case "income":
      return <Field term="Into">{entry.account}</Field>;
    case "transfer":
      return (
        <Field term="From → To">
          {entry.account} → {entry.toAccount ?? ""}
        </Field>
      );
    case "correction":
      return <Field term="Debt">{entry.account}</Field>;
  }
}

function EntryFields({
  screen,
  entry,
}: {
  screen: EntriesScreen;
  entry: HistoryEntry;
}) {
  const { today } = screen;
  return (
    <dl className="flex flex-col">
      {entry.parts === undefined ? (
        entry.category !== "" && <Field term="Category">{entry.category}</Field>
      ) : (
        <Field term="Split">
          <ul className="flex flex-col gap-1">
            {entry.parts.map((part) => (
              <li key={part.category} className="flex justify-between gap-3">
                <span className="min-w-0">{part.category}</span>
                <Money value={part.amount} className="shrink-0 font-semibold" />
              </li>
            ))}
          </ul>
        </Field>
      )}
      <AccountField entry={entry} />
      <Field term="Date">{longDate(entry.date)}</Field>
      {entry.note !== undefined && <Field term="Note">{entry.note}</Field>}
      {entry.tags !== undefined && entry.tags.length > 0 && (
        <Field term="Tags">
          <span className="-my-1 flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <Button
                key={tag}
                variant="outline"
                className="h-11 max-w-full rounded-full"
                aria-label={`Show entries tagged ${tag}`}
                onClick={() => {
                  screen.opened.close();
                  screen.params.setTag(tag);
                }}
              >
                <span className="min-w-0 truncate">#{tag}</span>
              </Button>
            ))}
          </span>
        </Field>
      )}
      <Field term="Logged">
        {loggedLabel(entry.loggedAt, today)}
        {entry.editedAt !== undefined && (
          <span className="block text-sm text-muted-foreground">
            Edited {loggedLabel(entry.editedAt, today)}
          </span>
        )}
      </Field>
      {entry.source !== undefined && (
        <Field term="Added by">
          The app, from {entry.source.name}
          {entry.source.markup > 0 && (
            <span className="block text-sm">
              <Money value={entry.source.markup} /> markup counts as spent under
              Loan markup
            </span>
          )}
        </Field>
      )}
    </dl>
  );
}

/** The open entry's page. */
function EntryPage({
  screen,
  entry,
}: {
  screen: EntriesScreen;
  entry: HistoryEntry;
}) {
  return (
    <article aria-labelledby="entry-title" className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <p className="flex items-end gap-3">
          <span
            aria-hidden="true"
            className={cn(
              DISPLAY,
              "text-6xl leading-none font-extrabold tabular-nums",
            )}
          >
            {dayNumber(entry.date)}
          </span>
          <span
            aria-hidden="true"
            className="flex flex-col pb-1 leading-tight font-semibold"
          >
            <span>{weekdayShort(entry.date)}</span>
            <span>{monthName(entry.date.slice(0, 7), screen.today)}</span>
          </span>
          <span className="sr-only">{longDate(entry.date)}</span>
        </p>
        <div className="flex flex-col gap-1">
          <p className={cn(EYEBROW, "text-muted-foreground")}>
            {KIND_WORD[entry.kind]}
          </p>
          <h2 id="entry-title" className="text-2xl font-bold wrap-break-word">
            {entry.title}
          </h2>
          <EntryAmount
            entry={entry}
            className={cn(
              DISPLAY,
              "text-5xl/tight font-extrabold tracking-tight",
              // A headline isn't helper text, so moved money and corrections aren't grey here.
              (entry.kind === "transfer" || entry.kind === "correction") &&
                "text-foreground",
            )}
          />
        </div>
      </header>
      <EntryFields screen={screen} entry={entry} />
      <DetailActions screen={screen} entry={entry} />
      <ThatDay screen={screen} entry={entry} />
      <WhatItChanged screen={screen} />
      <SamePlace screen={screen} />
    </article>
  );
}

/** Beside the list from `lg`, its own page below. Nothing open: a note on what opens here. */
export function DetailPane({ screen }: { screen: EntriesScreen }) {
  const entry = screen.openEntry;
  if (entry === null) {
    return (
      <div className="flex flex-col gap-2 rounded-(--block-radius) border border-dashed border-foreground/20 p-6 max-lg:hidden">
        <p className={cn(DISPLAY, "text-2xl/tight font-extrabold")}>
          Open an entry
        </p>
        <p className="text-sm">
          It reads here as a page of its day: what it changed, the rest of that
          day, and the same place over the months.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <BackToList screen={screen} className="lg:hidden" />
        <Button
          variant="ghost"
          size="icon-lg"
          className="ml-auto size-11 max-lg:hidden"
          aria-label="Close entry"
          onClick={screen.opened.close}
        >
          <X />
        </Button>
      </div>
      {entry === undefined ? (
        <NotFoundDetail screen={screen} />
      ) : (
        <EntryPage screen={screen} entry={entry} />
      )}
    </div>
  );
}
