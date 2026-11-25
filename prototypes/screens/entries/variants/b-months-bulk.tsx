"use client";

import { Bookmark } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INK } from "@proto/components/blocks";
import {
  BulkActions,
  ExportButton,
  FilterChips,
  FiltersButton,
  PickedLine,
  ResultLine,
  SavedViewsMenu,
  SearchField,
  ShortcutsButton,
  SortControl,
} from "../controls";
import type { EntriesScreen } from "../use-entries-screen";

// Months' quiet controls: saved views and the keys in the header, search, filters and order over
// the diary, and the bar for what's picked, floating at the bottom.

/** The header's buttons: saved views, and the keys on computers. */
export function HeaderActions({ screen }: { screen: EntriesScreen }) {
  return (
    <>
      <SavedViewsMenu
        screen={screen}
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "h-11 gap-1.5 px-2.5",
        )}
      >
        <Bookmark aria-hidden="true" />
        <span className="max-sm:sr-only">Views</span>
      </SavedViewsMenu>
      <ShortcutsButton />
    </>
  );
}

/** Search, then Filters and the order (and Select on phones), the filters that are on, and what's shown. */
export function Toolbar({
  screen,
  onFilters,
}: {
  screen: EntriesScreen;
  onFilters: () => void;
}) {
  const { selection } = screen;
  return (
    <div className="flex flex-col gap-3 pb-2">
      <SearchField screen={screen} />
      <div className="flex flex-wrap items-center gap-2">
        <FiltersButton screen={screen} onClick={onFilters} />
        <SortControl screen={screen} />
        <Button
          variant="ghost"
          size="lg"
          className="ml-auto h-11 md:hidden"
          aria-pressed={selection.selecting}
          onClick={() => {
            selection.setSelecting(!selection.selecting);
          }}
        >
          {selection.selecting ? "Done" : "Select"}
        </Button>
      </div>
      <FilterChips screen={screen} />
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <ResultLine screen={screen} />
        <ExportButton screen={screen} className="-mr-2.5" />
      </div>
    </div>
  );
}

/**
 * What's picked and what can be done to it, floating at the bottom of the list. It stays clear of
 * the phone tab bar and of the prototype's own bar.
 */
export function BulkBar({ screen }: { screen: EntriesScreen }) {
  const { selection } = screen;
  if (screen.picked.length === 0) return null;
  const ids = screen.shown.map((entry) => entry.id);
  const all = ids.every((id) => selection.has(id));
  return (
    <div
      role="region"
      aria-label="Picked entries"
      className={cn(
        "sticky bottom-20 z-30 mt-6 flex flex-col gap-3 rounded-2xl p-4 shadow-lg sm:bottom-24",
        INK,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <PickedLine screen={screen} />
        <div className="-mr-2 flex items-center gap-1">
          {!all && (
            <Button
              variant="ghost"
              size="lg"
              className="h-11"
              onClick={() => {
                selection.setAll(ids);
              }}
            >
              Pick all {ids.length} shown
            </Button>
          )}
          <Button
            variant="ghost"
            size="lg"
            className="h-11"
            onClick={selection.clear}
          >
            Clear
          </Button>
        </div>
      </div>
      <BulkActions screen={screen} className="text-foreground" />
    </div>
  );
}
