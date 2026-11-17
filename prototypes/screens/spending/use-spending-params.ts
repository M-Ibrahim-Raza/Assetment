"use client";

import { useSearchParams } from "next/navigation";
import type { Compare, DayRange, EntryOrder, RowOrder } from "./math";
import type { Spending, SpendingFilters } from "./scenarios";

type FilterName = keyof SpendingFilters;

/** "8" is one day, "3-9" a run of days. Anything else is no pick. */
function parseDays(text: string | undefined): DayRange | undefined {
  const match = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(text ?? "");
  if (match === null) return undefined;
  const one = Number(match[1]);
  const two = Number(match[2] ?? match[1]);
  if (one < 1 || two < 1) return undefined;
  return { from: Math.min(one, two), to: Math.max(one, two) };
}

function writeDays(days: DayRange): string {
  return days.from === days.to
    ? String(days.from)
    : `${String(days.from)}-${String(days.to)}`;
}

const ROW_FIELDS = ["amount", "change", "name", "entries"] as const;
const ENTRY_FIELDS = ["date", "amount", "name", "category", "account"] as const;

/**
 * A sort from the URL: a field, such as "amount", then "-reversed" for the other way round. An
 * unknown field is the default one, its usual way.
 */
function parseOrder<Key extends string>(
  text: string | undefined,
  fields: readonly Key[],
  fallback: Key,
): { by: Key; reversed: boolean } {
  const [field, way] = (text ?? "").split("-");
  const by = fields.find((one) => one === field);
  return by === undefined
    ? { by: fallback, reversed: false }
    : { by, reversed: way === "reversed" };
}

/** A sort for the URL. The default field, its usual way, is left out. */
function writeOrder<Key extends string>(
  { by, reversed }: { by: Key; reversed: boolean },
  fallback: Key,
): string | null {
  if (by === fallback && !reversed) return null;
  return reversed ? `${by}-reversed` : by;
}

/**
 * What Spending shows, kept in the URL so Back and reload keep the view: the month, what it is
 * compared with (`compare`), the picks that narrow the whole screen (`category`, `account`,
 * `day`), the breakdowns' order (`category-order`, `account-order`), and the list's own search
 * and order (`q`, and `sort`, such as "amount" or "date-reversed"). A filter missing from the URL
 * is the scenario's `start` one. Clearing a filter that `start` sets leaves it empty in the URL,
 * so it stays cleared.
 */
export function useSpendingParams(
  spending: Spending,
  start: SpendingFilters = {},
) {
  const params = useSearchParams();

  const wantedMonth = params.get("month");
  const month = spending.months.some((data) => data.month === wantedMonth)
    ? (wantedMonth ?? spending.today.month)
    : spending.today.month;
  const read = (name: FilterName): string | undefined => {
    if (!params.has(name)) return start[name];
    // An empty value means the filter was cleared.
    const value = params.get(name);
    return value === null || value === "" ? undefined : value;
  };
  const category = read("category");
  const account = read("account");
  const days = parseDays(read("day"));
  const q = read("q") ?? "";
  // Date, newest first, is the entries' default; amount, high to low, the breakdowns'.
  const sort: EntryOrder = parseOrder(read("sort"), ENTRY_FIELDS, "date");
  const categoryOrder: RowOrder = parseOrder(
    read("category-order"),
    ROW_FIELDS,
    "amount",
  );
  const accountOrder: RowOrder = parseOrder(
    read("account-order"),
    ROW_FIELDS,
    "amount",
  );
  // `usual`, or a month's key such as `2026-03`: any month with data but the one shown.
  const wantedCompare = read("compare");
  let compare: Compare = { kind: "last" };
  if (wantedCompare === "usual") compare = { kind: "usual" };
  else if (
    wantedCompare !== undefined &&
    wantedCompare !== month &&
    spending.months.some((data) => data.month === wantedCompare)
  ) {
    compare = { kind: "month", key: wantedCompare };
  }

  /** Writes the changes to the URL. `push` adds a Back step; `replace` doesn't, for typing. */
  const write = (
    changes: Readonly<Partial<Record<FilterName | "month", string | null>>>,
    mode: "push" | "replace" = "push",
  ) => {
    const next = new URLSearchParams(params.toString());
    for (const [name, value] of Object.entries(changes)) {
      if (value !== null) next.set(name, value);
      else if (name in start) next.set(name, "");
      else next.delete(name);
    }
    // Next.js keeps useSearchParams in step with the History API, so there is no server round trip.
    if (mode === "push")
      window.history.pushState(null, "", `?${next.toString()}`);
    else window.history.replaceState(null, "", `?${next.toString()}`);
  };

  return {
    month,
    category,
    account,
    /** The days picked in the month. Missing means the whole month. */
    days,
    q,
    sort,
    categoryOrder,
    accountOrder,
    /** What the whole screen compares with, as asked. `summarize` falls back without data. */
    compare,
    /** Picked days belong to one month, so changing month drops them. The rest stays. */
    setMonth: (key: string) => {
      write({ month: key === spending.today.month ? null : key, day: null });
    },
    setCategory: (name: string | undefined) => {
      write({ category: name ?? null });
    },
    setAccount: (name: string | undefined) => {
      write({ account: name ?? null });
    },
    setDays: (picked: DayRange | undefined) => {
      write({ day: picked === undefined ? null : writeDays(picked) });
    },
    setQuery: (words: string) => {
      write({ q: words === "" ? null : words }, "replace");
    },
    setSort: (order: EntryOrder) => {
      write({ sort: writeOrder(order, "date") });
    },
    setCategoryOrder: (order: RowOrder) => {
      write({ "category-order": writeOrder(order, "amount") });
    },
    setAccountOrder: (order: RowOrder) => {
      write({ "account-order": writeOrder(order, "amount") });
    },
    setCompare: (against: Compare) => {
      write({
        compare:
          against.kind === "last"
            ? null
            : against.kind === "usual"
              ? "usual"
              : against.key,
      });
    },
    clearFilters: () => {
      write({
        category: null,
        account: null,
        day: null,
        q: null,
      });
    },
  };
}

export type SpendingParams = ReturnType<typeof useSpendingParams>;
