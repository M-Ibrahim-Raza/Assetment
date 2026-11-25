"use client";

import { useSearchParams } from "next/navigation";
import type { HistoryKind } from "@proto/fixtures/entry-history";
import {
  type EntryFilters,
  type EntryOrder,
  type EntrySort,
  KIND_PARAM,
  KINDS,
  type Period,
  PRESETS,
  SORT_KEYS,
} from "./model";

// The params this list owns. Anything else in the URL, such as the ProtoBar's, is left alone.
const NAMES = [
  "q",
  "kind",
  "category",
  "account",
  "tag",
  "month",
  "period",
  "from",
  "to",
  "sort",
  "view",
] as const;
type ParamName = (typeof NAMES)[number];

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

/** The kinds a URL names, "spent,received". Unknown words are dropped. */
function parseKinds(text: string | undefined): HistoryKind[] {
  const words = (text ?? "").split(",");
  return KINDS.filter((kind) => words.includes(KIND_PARAM[kind]));
}

/** The period: a month (as Categories links), else a range, else a preset, else All time. */
function parsePeriod(read: (name: ParamName) => string | undefined): Period {
  const month = read("month");
  if (month !== undefined && MONTH.test(month))
    return { kind: "month", key: month };
  const from = read("from");
  const to = read("to");
  if (
    from !== undefined &&
    to !== undefined &&
    ISO_DAY.test(from) &&
    ISO_DAY.test(to)
  ) {
    return from <= to
      ? { kind: "range", from, to }
      : { kind: "range", from: to, to: from };
  }
  const preset = PRESETS.find((one) => one === read("period"));
  return preset === undefined ? { kind: "all" } : { kind: "preset", preset };
}

/** A sort from the URL, "amount" or "date-reversed". Date, newest first, is the default. */
function parseOrder(text: string | undefined): EntryOrder {
  const [field, way] = (text ?? "").split("-");
  const by = SORT_KEYS.find((key) => key === field);
  return by === undefined
    ? { by: "date", reversed: false }
    : { by, reversed: way === "reversed" };
}

/** The period as URL params. All time writes none. */
function writePeriod(
  period: Period,
): Partial<Record<ParamName, string | null>> {
  const none = { month: null, from: null, to: null, period: null };
  switch (period.kind) {
    case "all":
      return none;
    case "month":
      return { ...none, month: period.key };
    case "range":
      return { ...none, from: period.from, to: period.to };
    case "preset":
      return { ...none, period: period.preset };
  }
}

/**
 * What the Entries list shows, kept in the URL so Back and reload keep the view: the words, the
 * filters, the period, the order and the saved view in use. A param missing from the URL is the
 * scenario's `start` one, as a link from Categories would set it. Clearing one that `start` sets
 * leaves it empty in the URL, so it stays cleared.
 */
export function useEntriesParams(start: Readonly<Record<string, string>> = {}) {
  const params = useSearchParams();

  const read = (name: ParamName): string | undefined => {
    if (!params.has(name)) return start[name];
    const value = params.get(name);
    return value === null || value === "" ? undefined : value;
  };

  const filters: EntryFilters = {
    q: read("q") ?? "",
    kinds: parseKinds(read("kind")),
    category: read("category"),
    account: read("account"),
    tag: read("tag"),
    period: parsePeriod(read),
  };
  const order = parseOrder(read("sort"));
  const view = read("view");

  /** Writes the changes to the URL. `push` adds a Back step; `replace` doesn't, for typing. */
  const write = (
    changes: Readonly<Partial<Record<ParamName, string | null>>>,
    mode: "push" | "replace" = "push",
  ) => {
    const next = new URLSearchParams(params.toString());
    // Any change by hand means the saved view no longer describes what's shown.
    const all = { view: null, ...changes };
    for (const [name, value] of Object.entries(all)) {
      if (value !== null) next.set(name, value);
      else if (name in start) next.set(name, "");
      else next.delete(name);
    }
    const query = next.toString();
    const url = `${window.location.pathname}${query === "" ? "" : `?${query}`}`;
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  };

  return {
    filters,
    order,
    /** The id of the saved view in use, if the view is still as it was saved. */
    view,
    setQuery: (words: string) => {
      write({ q: words === "" ? null : words }, "replace");
    },
    setKinds: (kinds: readonly HistoryKind[]) => {
      write({
        kind:
          kinds.length === 0
            ? null
            : kinds.map((kind) => KIND_PARAM[kind]).join(","),
      });
    },
    toggleKind: (kind: HistoryKind) => {
      const kinds = filters.kinds.includes(kind)
        ? filters.kinds.filter((one) => one !== kind)
        : KINDS.filter((one) => one === kind || filters.kinds.includes(one));
      write({
        kind:
          kinds.length === 0
            ? null
            : kinds.map((one) => KIND_PARAM[one]).join(","),
      });
    },
    setCategory: (name: string | undefined) => {
      write({ category: name ?? null });
    },
    setAccount: (name: string | undefined) => {
      write({ account: name ?? null });
    },
    setTag: (name: string | undefined) => {
      write({ tag: name ?? null });
    },
    setPeriod: (period: Period) => {
      write(writePeriod(period));
    },
    setSort: (next: EntryOrder) => {
      const by: EntrySort = next.by;
      write({
        sort:
          by === "date" && !next.reversed
            ? null
            : next.reversed
              ? `${by}-reversed`
              : by,
      });
    },
    /** Opens a saved view: its own filters and order, and nothing else. */
    applyView: (id: string, query: string) => {
      const saved = new URLSearchParams(query);
      const changes: Partial<Record<ParamName, string | null>> = {};
      for (const name of NAMES) changes[name] = saved.get(name);
      write({ ...changes, view: id });
    },
    /** The query that describes the current view, to save under a name. */
    currentQuery: (): string => {
      const out = new URLSearchParams();
      for (const name of NAMES) {
        const value = read(name);
        if (name !== "view" && value !== undefined) out.set(name, value);
      }
      return out.toString();
    },
    clearFilters: () => {
      write({
        q: null,
        kind: null,
        category: null,
        account: null,
        tag: null,
        ...writePeriod({ kind: "all" }),
      });
    },
  };
}

export type EntriesParams = ReturnType<typeof useEntriesParams>;
