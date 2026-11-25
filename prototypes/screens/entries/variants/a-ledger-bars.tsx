"use client";

import { Bookmark, CalendarRange, ChevronDown } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { INK } from "@proto/components/blocks";
import {
  AccountMenu,
  BulkActions,
  CategoryMenu,
  ExportButton,
  FilterChips,
  FiltersButton,
  FiltersSheet,
  KindMenu,
  PeriodMenu,
  PickedLine,
  ResultLine,
  SavedViewsMenu,
  SearchField,
  ShortcutsButton,
  SortControl,
  TagMenu,
} from "../controls";
import { KIND_FILTER_WORD, monthName, periodLabel } from "../model";
import type { EntriesScreen } from "../use-entries-screen";

// Ledger's two bars: the toolbar over the table, and the footer pinned under it, which turns into
// the bulk bar while rows are picked.

const QUIET = cn(
  buttonVariants({ variant: "ghost", size: "lg" }),
  "h-11 gap-1.5 px-2.5",
);

/** A filter menu's trigger label: the current pick, then the menu's arrow. */
function Chip({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="max-w-40 truncate">{children}</span>
      <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
    </>
  );
}

/** A filter menu's trigger, as a chip. Filled while it filters. */
const chip = (on: boolean) =>
  cn(
    "inline-flex h-11 max-w-full items-center gap-1 rounded-full border px-3.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    on
      ? "border-transparent bg-accent text-accent-foreground"
      : "border-border bg-background hover:bg-muted aria-expanded:bg-muted",
  );

/** Scrolls to a month, then puts focus on its first row once the menu closes, so J goes on from it. */
function JumpMenu({ screen }: { screen: EntriesScreen }) {
  const target = useRef<HTMLElement | null>(null);
  if (screen.order.by !== "date" || screen.allMonths.length < 2) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={QUIET}>
        <CalendarRange aria-hidden="true" />
        Jump to month
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        finalFocus={() => target.current ?? true}
        className="max-h-[min(28rem,70svh)] w-auto min-w-56"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Jump to month</DropdownMenuLabel>
          {screen.allMonths.map((month) => (
            <DropdownMenuItem
              key={month.key}
              className="min-h-11 justify-between gap-6 text-base"
              onClick={() => {
                const section = document.getElementById(`month-${month.key}`);
                target.current =
                  section?.querySelector<HTMLElement>("[data-entry-row]") ??
                  null;
                section?.scrollIntoView({ block: "start" });
              }}
            >
              <span>{monthName(month.key, screen.today)}</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {month.totals.count}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Search, then the tools: sort, jump to month, saved views, export and the keys. From 40rem the
 * filters sit under them as chips; narrower, Filters opens a sheet and Select starts picking.
 */
export function LedgerToolbar({ screen }: { screen: EntriesScreen }) {
  const [sheet, setSheet] = useState(false);
  const { filters, selection, today } = screen;
  const view = screen.views.views.find((one) => one.id === screen.params.view);
  const kinds = filters.kinds.map((kind) => KIND_FILTER_WORD[kind]).join(", ");
  return (
    <div className="flex flex-col gap-3 border-b border-border p-3 @min-[40rem]/ledger:px-4 @min-[40rem]/ledger:pt-4">
      <div className="flex flex-wrap items-end gap-x-2 gap-y-3">
        <SearchField
          screen={screen}
          className="min-w-0 flex-1 basis-full @min-[40rem]/ledger:basis-64"
        />
        <div className="-ml-1 flex flex-wrap items-center gap-1">
          <FiltersButton
            screen={screen}
            onClick={() => {
              setSheet(true);
            }}
            className="@min-[40rem]/ledger:hidden"
          />
          <Button
            variant="outline"
            size="lg"
            className="h-11 @min-[40rem]/ledger:hidden"
            onClick={() => {
              selection.setSelecting(!selection.selecting);
            }}
          >
            {selection.selecting ? "Done" : "Select"}
          </Button>
          <SortControl screen={screen} />
          <JumpMenu screen={screen} />
          <SavedViewsMenu screen={screen} className={QUIET}>
            <Bookmark aria-hidden="true" />
            <span className="max-w-40 truncate @max-[40rem]/ledger:hidden">
              {view?.name ?? "Views"}
            </span>
          </SavedViewsMenu>
          <ExportButton screen={screen} className="px-2.5" />
          <ShortcutsButton className="size-11" />
        </div>
      </div>
      <div className="hidden flex-wrap items-center gap-2 @min-[40rem]/ledger:flex">
        <PeriodMenu
          screen={screen}
          className={chip(filters.period.kind !== "all")}
        >
          <Chip>{periodLabel(filters.period, today)}</Chip>
        </PeriodMenu>
        <KindMenu screen={screen} className={chip(kinds !== "")}>
          <Chip>{kinds === "" ? "Every kind" : kinds}</Chip>
        </KindMenu>
        <CategoryMenu
          screen={screen}
          className={chip(filters.category !== undefined)}
        >
          <Chip>{filters.category ?? "Category"}</Chip>
        </CategoryMenu>
        <AccountMenu
          screen={screen}
          className={chip(filters.account !== undefined)}
        >
          <Chip>{filters.account ?? "Account"}</Chip>
        </AccountMenu>
        {screen.tags.length > 0 && (
          <TagMenu screen={screen} className={chip(filters.tag !== undefined)}>
            <Chip>{filters.tag === undefined ? "Tag" : `#${filters.tag}`}</Chip>
          </TagMenu>
        )}
      </div>
      <FilterChips screen={screen} />
      <FiltersSheet screen={screen} open={sheet} onOpenChange={setSheet} />
    </div>
  );
}

// Buttons on the ink bulk bar: white text and a faint white edge, in both themes.
const ON_INK =
  "border-(--ink-foreground)/30 bg-transparent text-(--ink-foreground) hover:bg-(--ink-foreground)/10 hover:text-(--ink-foreground) aria-expanded:bg-(--ink-foreground)/10 aria-expanded:text-(--ink-foreground) dark:border-(--ink-foreground)/30 dark:bg-transparent dark:hover:bg-(--ink-foreground)/10";

/**
 * Pinned to the bottom of the window while the list scrolls, clear of the phone tab bar and the
 * ProtoBar: what's shown and its totals. While rows are picked it turns ink and holds the bulk
 * actions, Pick all and Clear.
 */
export function LedgerFoot({ screen }: { screen: EntriesScreen }) {
  const { selection } = screen;
  const shownIds = screen.shown.map((entry) => entry.id);
  const allPicked =
    shownIds.length > 0 && shownIds.every((id) => selection.has(id));
  const picking = screen.picked.length > 0;
  return (
    <div
      className={cn(
        "sticky bottom-18 z-30 rounded-2xl border px-3 py-2 shadow-md md:bottom-20 @min-[40rem]/ledger:px-4 @min-[40rem]/ledger:py-2.5",
        picking ? cn(INK, "border-transparent") : "bg-card",
      )}
    >
      {picking ? (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3">
            <PickedLine screen={screen} />
            <div className="-mr-2 flex items-center">
              {!allPicked && (
                <Button
                  variant="ghost"
                  size="lg"
                  className={cn("h-11 px-2.5", ON_INK, "border-transparent")}
                  onClick={() => {
                    selection.setAll(shownIds);
                  }}
                >
                  Pick all {shownIds.length} shown
                </Button>
              )}
              <Button
                variant="ghost"
                size="lg"
                className={cn("h-11 px-2.5", ON_INK, "border-transparent")}
                onClick={selection.clear}
              >
                Clear
              </Button>
            </div>
          </div>
          <BulkActions
            screen={screen}
            buttonClassName={ON_INK}
            className="-mx-4 flex-nowrap overflow-x-auto px-4 py-1"
          />
        </div>
      ) : (
        <ResultLine
          screen={screen}
          className="text-xs @min-[40rem]/ledger:text-sm"
        />
      )}
    </div>
  );
}
