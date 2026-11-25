"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { HistoryEntry } from "@proto/fixtures/entry-history";
import type { Draft } from "@proto/screens/quick-add/scenarios";
import type { Place } from "@proto/screens/quick-add/places";
import { entriesWord, shortDate, sortEntries, toCsv } from "./model";
import type { SavedView } from "./scenarios";

// The Entries pages' state that isn't in the URL: the entries as changed in this visit, what is
// picked, the open entry, the edit form, and saved views. Every change can be undone.

// A toast with an action stays at least 10 s (docs/ui-ux-rules.md).
const UNDO_MS = 10_000;

const byDate = (entries: readonly HistoryEntry[]) =>
  sortEntries(entries, { by: "date", reversed: false });

function undoable(message: string, undo: () => void) {
  toast(message, {
    duration: UNDO_MS,
    action: { label: "Undo", onClick: undo },
  });
}

/** The entries, kept in memory, with saving, adding, changing and deleting, each with Undo. */
export function useEntriesBook(initial: readonly HistoryEntry[]) {
  const [entries, setEntries] = useState<readonly HistoryEntry[]>(initial);

  /** Puts these entries back as they were, wherever they are now, or back in if deleted. */
  const restore = (before: readonly HistoryEntry[]) => {
    const ids = new Set(before.map((entry) => entry.id));
    setEntries((now) =>
      byDate([...now.filter((entry) => !ids.has(entry.id)), ...before]),
    );
  };

  return {
    entries,
    /** Saves an edited entry. */
    save: (entry: HistoryEntry) => {
      const before = entries.filter((one) => one.id === entry.id);
      setEntries((now) =>
        byDate(now.map((one) => (one.id === entry.id ? entry : one))),
      );
      undoable(`Saved ${entry.title}`, () => {
        restore(before);
      });
    },
    /** Adds a new entry, as Log again does. */
    add: (entry: HistoryEntry) => {
      setEntries((now) => byDate([entry, ...now]));
      undoable(`Added ${entry.title} on ${shortDate(entry.date)}`, () => {
        setEntries((now) => now.filter((one) => one.id !== entry.id));
      });
    },
    /** Deletes entries. Undo puts them back. */
    remove: (ids: readonly string[]) => {
      const gone = entries.filter((entry) => ids.includes(entry.id));
      setEntries((now) => now.filter((entry) => !ids.includes(entry.id)));
      const first = gone[0];
      undoable(
        gone.length === 1 && first !== undefined
          ? `Deleted ${first.title}`
          : `Deleted ${entriesWord(gone.length)}`,
        () => {
          restore(gone);
        },
      );
    },
    /** Changes several entries the same way, then says so. Undo puts each back. */
    change: (
      ids: readonly string[],
      update: (entry: HistoryEntry) => HistoryEntry,
      message: string,
    ) => {
      const before = entries.filter((entry) => ids.includes(entry.id));
      setEntries((now) =>
        byDate(
          now.map((entry) => (ids.includes(entry.id) ? update(entry) : entry)),
        ),
      );
      undoable(message, () => {
        restore(before);
      });
    },
    /** Says an entry was just deleted, as when Entry detail's Delete brings the user back here. */
    announceDeleted: (entry: HistoryEntry) => {
      undoable(`Deleted ${entry.title}`, () => {
        restore([entry]);
      });
    },
  };
}

export type EntriesBook = ReturnType<typeof useEntriesBook>;

/**
 * The entries picked for a bulk change. Shift-click picks a run from the last one picked. On
 * phones, picking is a mode the Select button turns on.
 */
export function useSelection(start: readonly string[] = []) {
  const [picked, setPicked] = useState<ReadonlySet<string>>(
    () => new Set(start),
  );
  const [anchor, setAnchor] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(start.length > 0);

  return {
    picked,
    /** On phones: rows show checkboxes, and a tap picks instead of opening. */
    selecting,
    setSelecting: (on: boolean) => {
      setSelecting(on);
      if (!on) setPicked(new Set());
    },
    has: (id: string) => picked.has(id),
    toggle: (id: string) => {
      setAnchor(id);
      setPicked((now) => {
        const next = new Set(now);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    /** Picks every entry from the last one picked to this one, in the list's order. */
    pickRun: (id: string, order: readonly string[]) => {
      const from = anchor === null ? -1 : order.indexOf(anchor);
      const to = order.indexOf(id);
      if (from === -1 || to === -1) {
        setAnchor(id);
        setPicked((now) => new Set([...now, id]));
        return;
      }
      const run = order.slice(Math.min(from, to), Math.max(from, to) + 1);
      setPicked((now) => new Set([...now, ...run]));
    },
    setAll: (ids: readonly string[]) => {
      setPicked(new Set(ids));
    },
    clear: () => {
      setPicked(new Set());
      setSelecting(false);
    },
  };
}

export type Selection = ReturnType<typeof useSelection>;

const ENTRY_PATH = /^\/entries\/([^/?#]+)$/;

/**
 * The entry open in Entry detail. Its id is in the path, /entries/<id>, so Back closes it and a
 * reload keeps it. Opening one adds a Back step without leaving the page, so the list keeps its
 * place. A scenario's entry is written into the path when the screen starts.
 */
export function useOpenEntry(startOpen?: string) {
  const pathname = usePathname();
  const match = ENTRY_PATH.exec(pathname);
  const fromPath =
    match?.[1] === undefined ? null : decodeURIComponent(match[1]);
  const [override, setOverride] = useState<string | null>(startOpen ?? null);

  useEffect(() => {
    if (startOpen === undefined) return;
    window.history.replaceState(
      null,
      "",
      `/entries/${encodeURIComponent(startOpen)}${window.location.search}`,
    );
  }, [startOpen]);

  const go = (path: string) => {
    setOverride(null);
    window.history.pushState(null, "", `${path}${window.location.search}`);
  };

  return {
    /** The open entry's id, or null on the list alone. */
    id: override ?? fromPath,
    open: (id: string) => {
      go(`/entries/${encodeURIComponent(id)}`);
    },
    close: () => {
      go("/entries");
    },
  };
}

/** The form over the screen: editing an entry, or Log again, which adds a copy dated today. */
export interface Editing {
  mode: "edit" | "copy";
  /** The entry it starts from. */
  id: string;
  /** Shows the waiting state, for a scenario. */
  saving: boolean;
  /** Opens after a failed save, for a scenario. */
  failed: boolean;
}

export function useEditor(start: Editing | null) {
  const [editing, setEditing] = useState<Editing | null>(start);
  return {
    editing,
    /** True while the form is open: phones then show the form alone. */
    open: editing !== null,
    edit: (id: string) => {
      setEditing({ mode: "edit", id, saving: false, failed: false });
    },
    copy: (id: string) => {
      setEditing({ mode: "copy", id, saving: false, failed: false });
    },
    close: () => {
      setEditing(null);
    },
  };
}

export type Editor = ReturnType<typeof useEditor>;

/** The form's draft for an entry. A copy for Log again keeps what it was, dated today. */
export function toDraft(
  entry: HistoryEntry,
  places: readonly Place[],
  mode: Editing["mode"],
  today: string,
): Draft {
  const idOf = (name: string | undefined) =>
    places.find((place) => place.name === name)?.id ?? "";
  const kind = entry.kind === "correction" ? "transfer" : entry.kind;
  return {
    kind,
    digits: String(entry.amount),
    category: kind === "transfer" ? "" : entry.category,
    account: idOf(entry.account),
    toAccount: idOf(entry.toAccount),
    day: mode === "copy" ? today : entry.date,
    name: entry.title,
    note: mode === "copy" ? "" : (entry.note ?? ""),
    tags: mode === "copy" ? [] : [...(entry.tags ?? [])],
    parts: (entry.parts ?? []).map((part) => ({
      category: part.category,
      digits: String(part.amount),
    })),
  };
}

/** The entry a saved draft makes: the edited one, or a new copy. */
export function fromDraft(
  draft: Draft,
  base: HistoryEntry,
  places: readonly Place[],
  mode: Editing["mode"],
  now: string,
): HistoryEntry {
  const nameOf = (id: string, fallback: string) =>
    places.find((place) => place.id === id)?.name ?? fallback;
  const toAccount =
    draft.kind === "transfer"
      ? nameOf(draft.toAccount, base.toAccount ?? "")
      : null;
  const parts =
    draft.kind === "expense" && draft.parts.length > 0
      ? draft.parts.map((part) => ({
          category: part.category,
          amount: Number(part.digits),
        }))
      : null;
  const biggest = parts?.toSorted((one, two) => two.amount - one.amount)[0];
  const title = draft.name.trim();
  const note = draft.note.trim();
  const entry: HistoryEntry = {
    id: mode === "copy" ? `e-new-${now.replaceAll(/\D/g, "")}` : base.id,
    kind: draft.kind,
    title:
      title !== ""
        ? title
        : draft.kind === "transfer"
          ? `To ${toAccount ?? "another account"}`
          : draft.category,
    amount: Number(draft.digits),
    category:
      draft.kind === "transfer" ? "" : (biggest?.category ?? draft.category),
    account: nameOf(draft.account, base.account),
    date: draft.day,
    loggedAt: mode === "copy" ? now : base.loggedAt,
    ...(mode === "edit" ? { editedAt: now } : {}),
    ...(parts === null ? {} : { parts }),
    ...(toAccount === null ? {} : { toAccount }),
    ...(note === "" ? {} : { note }),
    ...(draft.tags.length === 0 ? {} : { tags: [...draft.tags] }),
    ...(mode === "edit" && base.source !== undefined
      ? { source: base.source }
      : {}),
  };
  return entry;
}

/** Named views, kept in memory. Production saves them to the account. */
export function useSavedViews(initial: readonly SavedView[]) {
  const [views, setViews] = useState<readonly SavedView[]>(initial);
  return {
    views,
    /** Saves the current view under a name and returns its id. */
    add: (name: string, query: string): string => {
      const id = `view-${String(Date.now())}`;
      setViews((now) => [...now, { id, name, query }]);
      toast(`Saved the view “${name}”`);
      return id;
    },
    remove: (id: string) => {
      const index = views.findIndex((view) => view.id === id);
      const gone = views[index];
      if (gone === undefined) return;
      setViews((now) => now.filter((view) => view.id !== id));
      undoable(`Deleted the view “${gone.name}”`, () => {
        setViews((now) => now.toSpliced(index, 0, gone));
      });
    },
  };
}

export type SavedViews = ReturnType<typeof useSavedViews>;

/** Downloads entries as a CSV file named for today, and says how many went. */
export function downloadCsv(entries: readonly HistoryEntry[], today: string) {
  const blob = new Blob([toCsv(entries)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `entries-${today}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast(`Exported ${entriesWord(entries.length)} to entries-${today}.csv`);
}

interface ListKeys {
  /** Off while a form or menu is open. */
  enabled: boolean;
  onToggle: (id: string) => void;
  onEdit: () => void;
  onEscape: () => void;
  /** The search field's id, for "/". */
  searchId: string;
}

/**
 * Keys on computers, as in YNAB and Lunch Money: J or ↓ to the next entry, K or ↑ to the one
 * before, X picks it, E edits the open one, / goes to search, Esc clears. Enter opens the focused
 * row, as any link. Rows carry `data-entry-row` with their id. Keys typed in a field are left
 * alone.
 */
export function useListKeys(keys: ListKeys) {
  const latest = useRef(keys);
  useEffect(() => {
    latest.current = keys;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const now = latest.current;
      if (!now.enabled || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) {
        if (event.key === "Escape" && target.id === now.searchId) target.blur();
        return;
      }
      if (target?.closest("[role=dialog], [role=menu]")) return;
      const rows = [
        ...document.querySelectorAll<HTMLElement>("[data-entry-row]"),
      ];
      const current =
        document.activeElement?.closest<HTMLElement>("[data-entry-row]");
      const index =
        current === null || current === undefined ? -1 : rows.indexOf(current);
      const focus = (row: HTMLElement | undefined) => {
        if (row === undefined) return;
        event.preventDefault();
        row.focus();
        row.scrollIntoView({ block: "nearest" });
      };
      switch (event.key) {
        case "j":
          focus(rows[index + 1] ?? rows[0]);
          break;
        case "ArrowDown":
          if (index !== -1) focus(rows[index + 1]);
          break;
        case "k":
          focus(rows[Math.max(index - 1, 0)]);
          break;
        case "ArrowUp":
          if (index > 0) focus(rows[index - 1]);
          break;
        case "x": {
          const id = current?.dataset.entryRow;
          if (id !== undefined) {
            event.preventDefault();
            now.onToggle(id);
          }
          break;
        }
        case "e":
          event.preventDefault();
          now.onEdit();
          break;
        case "/":
          event.preventDefault();
          document.getElementById(now.searchId)?.focus();
          break;
        case "Escape":
          now.onEscape();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
