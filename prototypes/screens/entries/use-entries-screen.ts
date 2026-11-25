"use client";

import { useEffect, useId, useRef } from "react";
import { historyTags, type HistoryEntry } from "@proto/fixtures/entry-history";
import {
  balancesAfter,
  entriesWord,
  filterCount,
  filterEntries,
  groupByLogged,
  groupByMonth,
  impactOf,
  monthsOf,
  placesToday,
  samePlaceOf,
  shortDate,
  sortEntries,
  totalsOf,
} from "./model";
import type { EntriesData, EntriesStart } from "./scenarios";
import {
  downloadCsv,
  useEditor,
  useEntriesBook,
  useListKeys,
  useOpenEntry,
  useSavedViews,
  useSelection,
} from "./state";
import { useEntriesParams } from "./use-entries-params";

/** When a change is made in the prototype: today, at a fixed time, so screenshots repeat. */
const nowOn = (today: string) => `${today}T21:30`;

/**
 * Everything an Entries variant needs, worked out once: the entries as changed in this visit,
 * the filters and order from the URL, what's shown and its totals, the groups, the open entry,
 * what is picked, the edit form, saved views, bulk changes and the keys. Variants only lay it out.
 */
export function useEntriesScreen(data: EntriesData, start: EntriesStart = {}) {
  const searchId = useId();
  const book = useEntriesBook(
    start.deleted === true && start.open !== undefined
      ? data.entries.filter((entry) => entry.id !== start.open)
      : data.entries,
  );
  const params = useEntriesParams(start.filters);
  const opened = useOpenEntry(start.deleted === true ? undefined : start.open);
  const selection = useSelection(start.selected);
  const editor = useEditor(
    start.edit === undefined || opened.id === null
      ? null
      : {
          mode: "edit",
          id: start.open ?? opened.id,
          saving: start.edit === "saving",
          failed: start.edit === "failed",
        },
  );
  const views = useSavedViews(data.savedViews);
  const { entries } = book;
  const { filters, order } = params;
  const { today } = data;

  const places = placesToday(data.places, entries);
  const shown = sortEntries(filterEntries(entries, filters, today), order);
  const accountPlace =
    filters.account === undefined
      ? undefined
      : places.find((place) => place.name === filters.account);
  const openEntry =
    opened.id === null
      ? null
      : (entries.find((entry) => entry.id === opened.id) ?? undefined);
  const picked = entries.filter((entry) => selection.has(entry.id));

  // The scenario where Entry detail's Delete just brought the user back: say so, with Undo.
  const announced = useRef(false);
  useEffect(() => {
    if (announced.current || start.deleted !== true) return;
    const gone = data.entries.find((entry) => entry.id === start.open);
    announced.current = true;
    if (gone === undefined) return;
    window.history.replaceState(null, "", `/entries${window.location.search}`);
    book.announceDeleted(gone);
  }, [book, data.entries, start.deleted, start.open]);

  const pickedIds = picked.map((entry) => entry.id);
  const pickedKinds = new Set(picked.map((entry) => entry.kind));
  const onlyKind = pickedKinds.size === 1 ? [...pickedKinds][0] : undefined;

  /** Changes every picked entry, then keeps them picked for another change. */
  const changePicked = (
    update: (entry: HistoryEntry) => HistoryEntry,
    message: string,
  ) => {
    book.change(
      pickedIds,
      (entry) => ({ ...update(entry), editedAt: nowOn(today) }),
      message,
    );
  };

  const bulk = {
    /** Category fits only when every picked entry is spent, or every one received. */
    canCategory: onlyKind === "expense" || onlyKind === "income",
    /** The categories offered: those of the one kind picked. */
    categories:
      onlyKind === "expense" || onlyKind === "income"
        ? data.categories[onlyKind]
        : [],
    setCategory: (category: string) => {
      changePicked(
        (entry) => {
          // One category for the whole entry, so any split goes.
          const next: HistoryEntry = { ...entry, category };
          delete next.parts;
          return next;
        },
        `${entriesWord(pickedIds.length)} now in ${category}`,
      );
    },
    /** For moved money, this is where it came from. */
    setAccount: (account: string) => {
      changePicked(
        (entry) => ({ ...entry, account }),
        `${entriesWord(pickedIds.length)} now on ${account}`,
      );
    },
    setDate: (date: string) => {
      changePicked(
        (entry) => ({ ...entry, date }),
        `${entriesWord(pickedIds.length)} moved to ${shortDate(date)}`,
      );
    },
    addTag: (tag: string) => {
      changePicked(
        (entry) => ({
          ...entry,
          tags: (entry.tags ?? []).includes(tag)
            ? (entry.tags ?? [])
            : [...(entry.tags ?? []), tag],
        }),
        `Tagged ${entriesWord(pickedIds.length)}: ${tag}`,
      );
    },
    remove: () => {
      book.remove(pickedIds);
      selection.clear();
    },
  };

  useListKeys({
    enabled: !editor.open,
    searchId,
    onToggle: selection.toggle,
    onEdit: () => {
      if (
        openEntry !== null &&
        openEntry !== undefined &&
        openEntry.kind !== "correction"
      ) {
        editor.edit(openEntry.id);
      }
    },
    onEscape: () => {
      if (picked.length > 0) selection.clear();
      else if (opened.id !== null) opened.close();
    },
  });

  return {
    data,
    today,
    book,
    entries,
    params,
    filters,
    order,
    /** How many filters are set. Zero shows every entry. */
    filterCount: filterCount(filters),
    places,
    /** What the list shows, in its order. */
    shown,
    totals: totalsOf(shown),
    /** By date: under months and days. Empty in other orders. */
    months: order.by === "date" ? groupByMonth(shown) : [],
    /** By when logged: under the day each was typed. Empty in other orders. */
    loggedDays: order.by === "logged" ? groupByLogged(shown) : [],
    /** Every month of what's shown, newest first, for jumping and the month rail. */
    allMonths: monthsOf(shown),
    /** Tags in use, most used first. */
    tags: historyTags(entries),
    /** With one account picked: it, and its balance after each of its entries. */
    accountPlace,
    balances:
      accountPlace === undefined ? null : balancesAfter(entries, accountPlace),
    opened,
    /** The open entry; undefined when the URL names one that isn't there; null when none is. */
    openEntry,
    impact:
      openEntry === null || openEntry === undefined
        ? null
        : impactOf(openEntry, entries, places),
    samePlace:
      openEntry === null || openEntry === undefined
        ? null
        : samePlaceOf(openEntry, entries),
    selection,
    picked,
    pickedTotal: totalsOf(picked),
    bulk,
    editor,
    views,
    searchId,
    /** Downloads what's shown. */
    exportShown: () => {
      downloadCsv(shown, today);
    },
    /** Deletes the open entry and goes back to the list, with Undo. */
    deleteOpen: () => {
      if (openEntry === null || openEntry === undefined) return;
      book.remove([openEntry.id]);
      opened.close();
    },
    /** When a change is made, for its "edited" time. */
    now: nowOn(today),
  };
}

export type EntriesScreen = ReturnType<typeof useEntriesScreen>;
