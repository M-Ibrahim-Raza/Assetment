"use client";

import { Bookmark, CalendarDays, ChevronDown } from "lucide-react";
import { useRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { DISPLAY } from "@proto/components/display";
import type { HistoryKind } from "@proto/fixtures/entry-history";
import { joinAnd, LakhNote, totalSize } from "@proto/screens/spending/parts";
import {
  AccountMenu,
  BulkActions,
  CategoryMenu,
  ClearFilters,
  ExportButton,
  KindMenu,
  PeriodMenu,
  PickedLine,
  SavedViewsMenu,
  ShortcutsButton,
  SortControl,
  TagMenu,
  TotalsParts,
} from "../controls";
import {
  entriesWord,
  KIND_FILTER_WORD,
  monthName,
  type Period,
  periodLabel,
  PRESET_WORD,
  type Totals,
} from "../model";
import type { EntriesScreen } from "../use-entries-screen";

// Ask's top half: the question as a sentence, its answer, the saved questions and a quiet row of
// tools. The list and the open entry are in their own files.

const FOCUS = "outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/** One picked word in the sentence: dotted while it says "any", solid and marked once it's set. */
function tokenClass(set: boolean) {
  return cn(
    "inline-block min-h-11 max-w-full rounded-md px-0.5 text-left underline decoration-2 underline-offset-4 transition-colors md:min-h-12",
    FOCUS,
    set
      ? "bg-secondary decoration-primary decoration-3 dark:decoration-accent-foreground"
      : "decoration-foreground/40 decoration-dotted hover:decoration-foreground",
  );
}

/** "every kind", "spent", "spent and moved". */
function kindWords(kinds: readonly HistoryKind[]): string {
  if (kinds.length === 0) return "every kind";
  return joinAnd(kinds.map((kind) => KIND_FILTER_WORD[kind].toLowerCase()));
}

/** The period's word before the pick, and the pick: "from" "all time", "in" "October". */
function periodWords(
  period: Period,
  today: string,
): { lead: string; value: string } {
  switch (period.kind) {
    case "all":
      return { lead: "from", value: "all time" };
    case "preset":
      return { lead: "from", value: PRESET_WORD[period.preset].toLowerCase() };
    case "month":
      return { lead: "in", value: monthName(period.key, today) };
    case "range":
      return {
        lead: period.from === period.to ? "on" : "from",
        value: periodLabel(period, today),
      };
  }
}

/**
 * The question, as one sentence: "Show every kind in any category on any account with any tag
 * from all time matching …". Each underlined part opens its picker; the last is the search field.
 */
export function Question({
  screen,
  compact,
}: {
  screen: EntriesScreen;
  /** Beside an open entry, where the column is narrower. */
  compact: boolean;
}) {
  const { filters, today } = screen;
  const period = periodWords(filters.period, today);
  const showTag = screen.tags.length > 0 || filters.tag !== undefined;
  return (
    <form
      role="search"
      aria-label="Ask your entries"
      onSubmit={(event) => {
        event.preventDefault();
      }}
      className="flex flex-col items-start gap-1"
    >
      <p
        className={cn(
          DISPLAY,
          "text-2xl/11 font-semibold tracking-tight wrap-break-word",
          compact ? "2xl:text-3xl/12" : "md:text-3xl/12",
        )}
      >
        Show{" "}
        <KindMenu
          screen={screen}
          className={tokenClass(filters.kinds.length > 0)}
        >
          {kindWords(filters.kinds)}
        </KindMenu>{" "}
        in{" "}
        <CategoryMenu
          screen={screen}
          className={tokenClass(filters.category !== undefined)}
        >
          {filters.category ?? "any category"}
        </CategoryMenu>{" "}
        on{" "}
        <AccountMenu
          screen={screen}
          className={tokenClass(filters.account !== undefined)}
        >
          {filters.account ?? "any account"}
        </AccountMenu>{" "}
        {showTag && (
          <>
            {filters.tag === undefined ? "with" : "tagged"}{" "}
            <TagMenu
              screen={screen}
              className={tokenClass(filters.tag !== undefined)}
            >
              {filters.tag ?? "any tag"}
            </TagMenu>{" "}
          </>
        )}
        {period.lead}{" "}
        <PeriodMenu
          screen={screen}
          className={tokenClass(filters.period.kind !== "all")}
        >
          {period.value}
        </PeriodMenu>{" "}
        <label htmlFor={screen.searchId}>
          matching<span className="sr-only"> words or an amount</span>
        </label>{" "}
        <input
          id={screen.searchId}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-keyshortcuts="/"
          placeholder="anything"
          value={filters.q}
          onChange={(event) => {
            screen.params.setQuery(event.target.value);
          }}
          className={cn(
            "inline-block field-sizing-content h-11 max-w-full min-w-32 rounded-t-md border-b-2 border-dashed border-foreground/40 bg-transparent px-1 placeholder:text-muted-foreground focus:border-solid focus:border-foreground md:h-12",
            FOCUS,
            filters.q !== "" &&
              "border-solid border-primary dark:border-accent-foreground",
          )}
        />
      </p>
      {/* With nothing found, the answer offers Clear filters itself. */}
      {screen.filterCount > 0 && screen.shown.length > 0 && (
        <ClearFilters screen={screen} className="-ml-1 text-base" />
      )}
    </form>
  );
}

type Lead = "spent" | "received" | "moved" | "corrections";
const LEADS: readonly Lead[] = ["spent", "received", "moved", "corrections"];
const LEAD_OF = {
  expense: "spent",
  income: "received",
  transfer: "moved",
  correction: "corrections",
} as const satisfies Record<HistoryKind, Lead>;
const LEAD_VERB = {
  spent: "spent",
  received: "received",
  moved: "moved",
  corrections: "taken off what's owed",
} as const satisfies Record<Lead, string>;

/**
 * The figure the answer leads with: spent, unless only other kinds are asked for. With every kind,
 * the first that isn't zero, so a list of salaries leads with what was received.
 */
function leadOf(totals: Totals, kinds: readonly HistoryKind[]): Lead {
  const asked =
    kinds.length === 0
      ? LEADS
      : LEADS.filter((lead) => kinds.some((kind) => LEAD_OF[kind] === lead));
  return asked.find((lead) => totals[lead] > 0) ?? asked[0] ?? "spent";
}

/** The answer, large: "Rs 241,300 spent in 58 entries", its lakh note, then the other totals. */
export function Answer({ screen }: { screen: EntriesScreen }) {
  const { totals } = screen;
  const lead = leadOf(totals, screen.filters.kinds);
  const value = totals[lead];
  const rest: Totals = { ...totals, [lead]: 0 };
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="@container flex flex-col gap-1"
    >
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Money
          value={value}
          className={cn(
            DISPLAY,
            totalSize(value),
            "leading-none font-extrabold tracking-tight",
          )}
        />
        <span className={cn(DISPLAY, "text-xl font-semibold md:text-2xl")}>
          {LEAD_VERB[lead]} in {entriesWord(totals.count)}
        </span>
      </p>
      <LakhNote value={value} className="text-sm font-medium" />
      <TotalsParts totals={rest} className="mt-1 text-sm font-medium" />
    </div>
  );
}

/** With entries picked, the answer turns into what's picked and what can be done to them. */
export function PickedAnswer({ screen }: { screen: EntriesScreen }) {
  const shownIds = screen.shown.map((entry) => entry.id);
  const all = shownIds.every((id) => screen.selection.has(id));
  return (
    <div className="flex flex-col items-start gap-3">
      <PickedLine
        screen={screen}
        className={cn(DISPLAY, "text-3xl font-extrabold tracking-tight")}
      />
      <BulkActions screen={screen} />
      <div className="-ml-2 flex flex-wrap gap-1">
        {!all && (
          <Button
            variant="ghost"
            size="lg"
            className="h-11"
            onClick={() => {
              screen.selection.setAll(shownIds);
            }}
          >
            Pick all {shownIds.length} shown
          </Button>
        )}
        <Button
          variant="ghost"
          size="lg"
          className="h-11"
          onClick={screen.selection.clear}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

/** Saved views as saved questions: each chip asks its question again. Then save or manage them. */
export function SavedQuestions({ screen }: { screen: EntriesScreen }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {screen.views.views.map((view) => {
        const current = screen.params.view === view.id;
        return (
          <button
            key={view.id}
            type="button"
            aria-current={current ? "true" : undefined}
            onClick={() => {
              screen.params.applyView(view.id, view.query);
            }}
            className={cn(
              "inline-flex min-h-11 max-w-full items-center rounded-full border px-4 text-left text-sm font-medium",
              FOCUS,
              current
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/15 hover:bg-muted",
            )}
          >
            <span className="min-w-0 wrap-break-word">{view.name}</span>
          </button>
        );
      })}
      <SavedViewsMenu
        screen={screen}
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "h-11 gap-1.5",
        )}
      >
        <Bookmark aria-hidden="true" />
        Saved views
        <ChevronDown aria-hidden="true" />
      </SavedViewsMenu>
    </div>
  );
}

/** Goes to a month in the list, in date order. Focus lands on its heading. */
function JumpMenu({ screen }: { screen: EntriesScreen }) {
  const target = useRef<HTMLElement | null>(null);
  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) target.current = null;
      }}
    >
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "h-11 gap-1.5 px-2",
        )}
      >
        <CalendarDays aria-hidden="true" />
        Jump to month
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[min(28rem,70svh)] w-auto min-w-56"
        finalFocus={() => target.current ?? true}
      >
        {screen.allMonths.map((month) => (
          <DropdownMenuItem
            key={month.key}
            className="min-h-11 justify-between gap-6 text-base"
            onClick={() => {
              const section = document.getElementById(`month-${month.key}`);
              target.current =
                section?.querySelector<HTMLElement>("h2") ?? null;
              section?.scrollIntoView({ block: "start" });
            }}
          >
            {monthName(month.key, screen.today)}
            <span className="text-sm text-muted-foreground">
              {entriesWord(month.totals.count)}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The quiet row over the list: sort, jump, export, the keys, and Select on phones. */
export function Tools({ screen }: { screen: EntriesScreen }) {
  const { selection } = screen;
  return (
    <div className="flex flex-wrap items-center gap-1">
      <SortControl screen={screen} className="-ml-2" />
      {screen.order.by === "date" && screen.allMonths.length > 1 && (
        <JumpMenu screen={screen} />
      )}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
        <ExportButton screen={screen} />
        <ShortcutsButton />
        {selection.selecting && screen.picked.length === 0 && (
          <span className="text-sm font-medium md:hidden">
            Tap entries to pick them
          </span>
        )}
        <Button
          variant="outline"
          size="lg"
          className="h-11 md:hidden"
          aria-pressed={selection.selecting}
          onClick={() => {
            selection.setSelecting(!selection.selecting);
          }}
        >
          {selection.selecting ? "Done" : "Select"}
        </Button>
      </div>
    </div>
  );
}
