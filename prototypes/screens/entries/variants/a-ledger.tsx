"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AppShell } from "@proto/components/app-shell";
import {
  Behind,
  EntriesError,
  EntriesFirstUse,
  EntryFormPanel,
  NoResults,
  NotFoundDetail,
} from "../controls";
import type { EntriesData, EntriesStart, EntriesViewProps } from "../scenarios";
import { useEntriesScreen } from "../use-entries-screen";
import { LedgerFoot, LedgerToolbar } from "./a-ledger-bars";
import { BESIDE, LedgerRecord } from "./a-ledger-detail";
import { LedgerSkeleton } from "./a-ledger-skeleton";
import { LedgerTable } from "./a-ledger-table";

/** Below this list width (40rem, as in the table's container queries) rows are two lines. */
const TABLE_REM = 40;

/**
 * Ledger: the spreadsheet they came from, done right. The rows are the biggest thing on the page:
 * a real table from 40rem of the list's width, with sort buttons in its head and each month as a
 * band, a toolbar over it and a footer pinned under it. An open entry is a narrow record sheet
 * beside the table from lg, and its own page below that.
 */
export function LedgerView(props: EntriesViewProps) {
  if (props.status === "ready") {
    return <Ready data={props.data} start={props.start} />;
  }
  return (
    <AppShell current="spending" title="Entries" wide="medium">
      {props.status === "loading" ? (
        <LedgerSkeleton />
      ) : (
        <EntriesError message={props.message} />
      )}
    </AppShell>
  );
}

function Ready({
  data,
  start,
}: {
  data: EntriesData;
  start: EntriesStart | undefined;
}) {
  const screen = useEntriesScreen(data, start);
  const list = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);
  const openId = screen.opened.id;
  const open = openId !== null;

  // On phones the entry replaces the list: open it at the top, and come back to the same place.
  useEffect(() => {
    if (window.matchMedia(BESIDE).matches) return;
    window.scrollTo(0, openId === null ? listScroll.current : 0);
  }, [openId]);

  const isNarrow = () => {
    const root = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    return (list.current?.clientWidth ?? 0) < TABLE_REM * (root || 16);
  };
  const openEntry = (id: string) => {
    listScroll.current = window.scrollY;
    screen.opened.open(id);
  };

  return (
    <AppShell current="spending" title="Entries" wide="medium">
      <EntryFormPanel screen={screen} />
      <Behind screen={screen}>
        {screen.entries.length === 0 ? (
          <EntriesFirstUse />
        ) : (
          <div
            className={cn(
              open &&
                "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,30%)] lg:items-start lg:gap-4",
            )}
          >
            <div
              ref={list}
              className={cn(
                "@container/ledger flex min-w-0 flex-col gap-3",
                open && "max-lg:hidden",
              )}
            >
              <section
                aria-label="Entries list"
                className="rounded-2xl bg-card"
              >
                <LedgerToolbar screen={screen} />
                {screen.shown.length === 0 ? (
                  <NoResults screen={screen} className="m-3" />
                ) : (
                  <LedgerTable
                    screen={screen}
                    onOpen={openEntry}
                    isNarrow={isNarrow}
                  />
                )}
              </section>
              <LedgerFoot screen={screen} />
            </div>
            {open && (
              <aside
                aria-label="Entry detail"
                className="lg:sticky lg:top-3 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto lg:rounded-2xl"
              >
                {screen.openEntry === undefined ? (
                  <div className="rounded-2xl bg-card p-5">
                    <NotFoundDetail screen={screen} />
                  </div>
                ) : (
                  screen.openEntry !== null && (
                    <LedgerRecord screen={screen} entry={screen.openEntry} />
                  )
                )}
              </aside>
            )}
          </div>
        )}
      </Behind>
    </AppShell>
  );
}
