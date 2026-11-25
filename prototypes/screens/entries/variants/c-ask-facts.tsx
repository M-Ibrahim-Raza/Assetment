"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Money } from "@proto/components/amounts";
import type { HistoryEntry } from "@proto/fixtures/entry-history";
import { loggedLabel, longDate } from "../model";
import type { EntriesScreen } from "../use-entries-screen";

// The open entry's fields, as a compact list under its story.

const LARGE = "(min-width: 64rem)";

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="min-w-0 wrap-break-word">{children}</dd>
    </div>
  );
}

/** Where the money was: "Paid from", "Into", "From" and "To", or a correction's debt. */
function accountFacts(entry: HistoryEntry): [string, string][] {
  switch (entry.kind) {
    case "expense":
      return [["Paid from", entry.account]];
    case "income":
      return [["Into", entry.account]];
    case "transfer":
      return [
        ["From", entry.account],
        ["To", entry.toAccount ?? ""],
      ];
    case "correction":
      return [["Debt", entry.account]];
  }
}

export function Facts({
  screen,
  entry,
}: {
  screen: EntriesScreen;
  entry: HistoryEntry;
}) {
  const { today } = screen;
  const { source } = entry;
  /** Filters the list by a tag. On phones, the list is a page back, so it goes there. */
  const byTag = (tag: string) => {
    if (!window.matchMedia(LARGE).matches) screen.opened.close();
    screen.params.setTag(tag);
  };
  return (
    <section aria-labelledby="ask-facts" className="flex flex-col gap-3">
      <h3
        id="ask-facts"
        className="text-xs font-semibold tracking-widest uppercase"
      >
        Details
      </h3>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2.5">
        {entry.parts === undefined ? (
          entry.category !== "" && <Fact term="Category">{entry.category}</Fact>
        ) : (
          <Fact term="Split">
            <ul className="flex flex-col gap-1">
              {entry.parts.map((part) => (
                <li
                  key={part.category}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="min-w-0">{part.category}</span>
                  <Money value={part.amount} className="shrink-0" />
                </li>
              ))}
            </ul>
          </Fact>
        )}
        {accountFacts(entry).map(([term, name]) => (
          <Fact key={term} term={term}>
            {name}
          </Fact>
        ))}
        <Fact term="Date">{longDate(entry.date)}</Fact>
        {entry.note !== undefined && <Fact term="Note">{entry.note}</Fact>}
        {entry.tags !== undefined && entry.tags.length > 0 && (
          <Fact term="Tags">
            <span className="-my-1 flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  className="h-11 max-w-full rounded-full px-3"
                  onClick={() => {
                    byTag(tag);
                  }}
                >
                  <span className="min-w-0 truncate">{tag}</span>
                  <span className="sr-only">, show every entry with it</span>
                </Button>
              ))}
            </span>
          </Fact>
        )}
        <Fact term="Logged">{loggedLabel(entry.loggedAt, today)}</Fact>
        {entry.editedAt !== undefined && (
          <Fact term="Edited">{loggedLabel(entry.editedAt, today)}</Fact>
        )}
        {source !== undefined && (
          <Fact term="Added by">
            The app, for {source.name}.
            {source.markup > 0 && (
              <>
                {" "}
                <Money value={source.markup} /> markup counts as spent under
                Loan markup.
              </>
            )}
          </Fact>
        )}
      </dl>
    </section>
  );
}
