"use client";

import { useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AppShell } from "@proto/components/app-shell";
import { useStickyTop } from "@proto/screens/spending/use-sticky-top";
import {
  Behind,
  EntriesError,
  EntriesFirstUse,
  EntryFormPanel,
  FiltersSheet,
  NoResults,
} from "../controls";
import type { EntriesData, EntriesStart, EntriesViewProps } from "../scenarios";
import { useEntriesScreen, type EntriesScreen } from "../use-entries-screen";
import { BulkBar, HeaderActions, Toolbar } from "./b-months-bulk";
import { DetailPane } from "./b-months-detail";
import { DatedRows, LoggedGroups, MonthSections } from "./b-months-list";
import { MonthRail, MonthStrip, useMonthInView } from "./b-months-rail";

/**
 * Months: a diary with a month spine. The month you're in is the biggest thing on the page. A rail
 * of months on wide screens (a strip below that) jumps and follows the scroll; days sit in a
 * gutter as big numbers; the open entry reads beside the list as a page of its day.
 */
export function MonthsView(props: EntriesViewProps) {
  if (props.status === "ready") {
    return <Ready data={props.data} start={props.start} />;
  }
  return (
    <AppShell current="spending" title="Entries" wide>
      {props.status === "loading" ? (
        <MonthsSkeleton />
      ) : (
        <EntriesError message={props.message} />
      )}
    </AppShell>
  );
}

/** Three panes from `xl` (rail, list, entry), two from `lg`, one below. */
function columns(dated: boolean): string {
  return dated
    ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] xl:grid-cols-[12.5rem_minmax(0,1fr)_minmax(0,24rem)] 2xl:grid-cols-[14rem_minmax(0,1fr)_minmax(0,0.8fr)]"
    : "lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]";
}

function Ready({
  data,
  start,
}: {
  data: EntriesData;
  start: EntriesStart | undefined;
}) {
  const screen = useEntriesScreen(data, start);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLDivElement>(null);
  const railTop = useStickyTop(rail);
  const detailTop = useStickyTop(detail);
  const dated = screen.order.by === "date" && screen.shown.length > 0;
  const inView = useMonthInView(
    dated ? screen.allMonths.map((month) => month.key) : [],
  );
  const first = screen.entries.length === 0;
  const open = screen.openEntry !== null;

  return (
    <AppShell
      current="spending"
      title="Entries"
      wide
      actions={first ? undefined : <HeaderActions screen={screen} />}
    >
      <EntryFormPanel screen={screen} />
      <Behind screen={screen}>
        {first ? (
          <EntriesFirstUse />
        ) : (
          <div
            className={cn(
              "grid items-start gap-x-6 2xl:gap-x-10",
              columns(dated),
            )}
          >
            {dated && (
              <div
                ref={rail}
                style={{ top: railTop }}
                className="sticky hidden xl:block"
              >
                <MonthRail
                  months={screen.allMonths}
                  today={screen.today}
                  current={inView}
                />
              </div>
            )}
            <div className={cn("min-w-0", open && "max-lg:hidden")}>
              <Toolbar
                screen={screen}
                onFilters={() => {
                  setFiltersOpen(true);
                }}
              />
              {dated && (
                <MonthStrip
                  months={screen.allMonths}
                  today={screen.today}
                  current={inView}
                  className="sticky top-0 z-20 bg-background xl:hidden"
                />
              )}
              <ListBody screen={screen} />
              <BulkBar screen={screen} />
            </div>
            <div
              ref={detail}
              style={{ top: detailTop }}
              className={cn("min-w-0 lg:sticky", !open && "max-lg:hidden")}
            >
              <DetailPane screen={screen} />
            </div>
          </div>
        )}
      </Behind>
      {!first && (
        <FiltersSheet
          screen={screen}
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
        />
      )}
    </AppShell>
  );
}

/** By date: months and days. By when logged: the days typed. Otherwise one list. */
function ListBody({ screen }: { screen: EntriesScreen }) {
  if (screen.shown.length === 0)
    return <NoResults screen={screen} className="mt-4" />;
  const shownIds = screen.shown.map((entry) => entry.id);
  switch (screen.order.by) {
    case "date":
      return <MonthSections screen={screen} shownIds={shownIds} />;
    case "logged":
      return <LoggedGroups screen={screen} shownIds={shownIds} />;
    case "amount":
    case "name":
    case "category":
    case "account":
      return (
        <DatedRows screen={screen} entries={screen.shown} shownIds={shownIds} />
      );
  }
}

/** Shaped like the diary: the rail, the search and controls, a big month and days in the gutter. */
function MonthsSkeleton() {
  return (
    <div
      aria-busy="true"
      className={cn(
        "grid items-start gap-x-6 **:data-[slot=skeleton]:bg-foreground/10",
        columns(true),
      )}
    >
      <span className="sr-only">Loading your entries</span>
      <div className="hidden flex-col gap-3 xl:flex">
        {[0, 1, 2, 3, 4, 5].map((month) => (
          <div key={month} className="flex flex-col gap-2 p-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-11 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-20" />
        </div>
        <Skeleton className="h-5 w-64 max-w-full" />
        <Skeleton className="mt-6 h-12 w-56 max-w-full" />
        <Skeleton className="h-5 w-72 max-w-full" />
        {[0, 1, 2, 3].map((day) => (
          <div
            key={day}
            className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3 border-b border-foreground/10 py-3 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-x-5"
          >
            <Skeleton className="mx-auto size-12" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-80 w-full max-lg:hidden" />
    </div>
  );
}
