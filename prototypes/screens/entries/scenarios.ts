// Entries: every entry across the months, of every kind, easy to find, check and fix (J3 step 5).
// Entry detail (J3 step 6) is the same screen with one entry open: beside the list on computers,
// its own page on phones. Its scenarios are in screens/entry-detail/scenarios.ts.
//
// Settled before building (2026-11-21):
// - Every kind: spent, received, moved, corrections and what the app adds by itself (loan
//   instalments, approved committee payments). Home's "See all entries" lands here. Spending's
//   own list stays spent only.
// - URLs: /entries and /entries/<id>. The nav marks Spending as current, with a third Spending
//   tab: Overview · Categories · Entries.
// - One scroll, newest first. Months are headings that stay at the top, with their totals, and
//   days sit inside them. Jump to any month.
// - Filters stack: words, kind, category, account, tag and the period (presets and All time, the
//   default). They live in the URL: `q`, `kind` (spent,received,moved,corrections), `category`,
//   `account`, `tag`, `month` (2026-03, as Categories links), `period`, `from`/`to`, `sort`.
// - Totals follow what's shown: spent, received and moved. The markup in a loan instalment
//   counts as spent, as in docs/money-model.md.
// - With one account picked, each entry shows the account's balance after it, as on a statement.
// - Sort by date, when logged, amount, name, category or account.
// - Select many: change category, account, date or tags, or delete. Each applies at once with
//   Undo. Category is offered only when every picked entry is spent, or every one received.
// - Saved views keep a name with the filters, search and sort. Export downloads what's shown as
//   a CSV file.
// - Computers: J/K or the arrow keys move, Enter opens, X picks, E edits, / searches, Esc clears.
// - Edit reuses Quick add's form, titled "Edit entry", in the form panel. Quick add's "Note" is
//   now "Name", and Note, Tags and Split sit under "More details" in both.
//
// Open questions (resolve in /prototype-finalize):
// - Editing or deleting an app-added instalment: what happens to the loan's markup split?
// - A bulk account change on moved entries: does it change the From side or the To side? For now
//   it changes the From side.
// - Split: spent only for now. Received too?
// - Quick add's today (11 Nov) differs from Spending's (12 Nov). These pages use 11 Nov, so the
//   edit form's Today and Yesterday line up.
// - Corrections: a fourth kind in the filter, shown only when there are any. Is that the right
//   word for a "Balance correction"?

import { categories, type CategoryKind } from "@proto/fixtures/categories";
import {
  entryHistory,
  HISTORY_TODAY,
  type HistoryEntry,
  historyPlaces,
  manyEntryHistory,
  type OpeningPlace,
  SAMPLE_MOVED_ID,
  SAMPLE_SPENT_ID,
} from "@proto/fixtures/entry-history";
import type { Scenarios } from "@proto/kit/scenarios";

/** A named set of filters, search and sort, kept as the URL's query. */
export interface SavedView {
  id: string;
  name: string;
  /** The query it opens, e.g. "q=Daraz&period=this-year". */
  query: string;
}

export interface EntriesData {
  /** Every entry, newest first. */
  entries: readonly HistoryEntry[];
  /** The accounts and debts, with what each held or owed on 1 June. Today's amounts follow. */
  places: readonly OpeningPlace[];
  /** Most used first, for the edit form and bulk changes. */
  categories: Readonly<Record<CategoryKind, readonly string[]>>;
  savedViews: readonly SavedView[];
  /** Today, as an ISO date. */
  today: string;
}

/** Where a scenario starts, before the user does anything. */
export interface EntriesStart {
  /** Filters as URL params, used while the URL sets none: a link from Categories, say. */
  filters?: Readonly<Record<string, string>>;
  /** Entries picked for a bulk change. */
  selected?: readonly string[];
  /** The entry open in Entry detail. Without it, the URL's /entries/<id> says. */
  open?: string;
  /** The edit form over Entry detail: open, saving, or after a failed save. */
  edit?: "open" | "saving" | "failed";
  /** The open entry was just deleted: the list shows without it, with Undo. */
  deleted?: boolean;
}

/** The View's props. Loading and error are states the View shows, so they are props too. */
export type EntriesViewProps =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: EntriesData; start?: EntriesStart };

const SAVED_VIEWS: readonly SavedView[] = [
  {
    id: "view-daraz",
    name: "Daraz orders this year",
    query: "q=Daraz&period=this-year",
  },
  { id: "view-bills", name: "Bills since June", query: "category=Bills" },
  {
    id: "view-card",
    name: "On the HBL card",
    query: "account=HBL+credit+card&kind=spent",
  },
];

/** A typical person's six months, as the screen gets them. */
export function typicalData(): EntriesData {
  return {
    entries: entryHistory(),
    places: historyPlaces(),
    categories: {
      expense: categories("expense", 20),
      income: categories("income", 8),
    },
    savedViews: SAVED_VIEWS,
    today: HISTORY_TODAY,
  };
}

const typical = typicalData();

const heavy: EntriesData = {
  ...typical,
  entries: manyEntryHistory(),
  places: historyPlaces(true),
};

const nothing: EntriesData = { ...typical, entries: [], savedViews: [] };

/** A few entries picked at once: three of the latest spent ones, and a moved one. */
const PICKED = [
  ...typical.entries
    .filter((entry) => entry.kind === "expense" && entry.id !== SAMPLE_SPENT_ID)
    .slice(0, 3)
    .map((entry) => entry.id),
  SAMPLE_MOVED_ID,
];

const ERROR_MESSAGE =
  "Nothing is lost. Check your connection and try again in a moment.";

export const scenarios = {
  default: { status: "ready", data: typical },
  empty: { status: "ready", data: nothing },
  loading: { status: "loading" },
  error: { status: "error", message: ERROR_MESSAGE },
  many: { status: "ready", data: heavy },
  "no-results": {
    status: "ready",
    data: typical,
    start: { filters: { q: "Daraz", category: "Groceries" } },
  },
  // As Categories links: one category, over every month.
  filtered: {
    status: "ready",
    data: typical,
    start: { filters: { category: "Groceries" } },
  },
  selected: { status: "ready", data: typical, start: { selected: PICKED } },
  // One account picked: each entry shows the balance after it.
  "one-account": {
    status: "ready",
    data: typical,
    start: { filters: { account: "JazzCash" } },
  },
} satisfies Scenarios<EntriesViewProps>;
