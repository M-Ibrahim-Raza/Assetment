"use client";

import { useSearchParams } from "next/navigation";
import {
  LINE_SORT_KEYS,
  type LineOrder,
  RANGE_KEYS,
  type RangeKey,
  rangeMonths,
} from "./math";
import type { CategoryBook } from "./scenarios";

type ParamName = "range" | "sort" | "month" | "category";

/** A sort from the URL: "average", or "average-reversed" for the other way. Unknown is the default. */
function parseOrder(text: string | null): LineOrder {
  const [field, way] = (text ?? "").split("-");
  const by = LINE_SORT_KEYS.find((key) => key === field);
  return by === undefined
    ? { by: "total", reversed: false }
    : { by, reversed: way === "reversed" };
}

/** A sort for the URL. Total, high to low, is the default and is left out. */
function writeOrder({ by, reversed }: LineOrder): string | null {
  if (by === "total" && !reversed) return null;
  return reversed ? `${by}-reversed` : by;
}

/**
 * What the Categories pages show, kept in the URL so Back and reload keep the view: the range
 * (`range`: 6m or this-year; 12 months by default), the list's sort (`sort`), a picked month
 * (`month`, such as 2026-03) and a picked category (`category`, by name, as on Spending).
 */
export function useCategoriesParams(book: CategoryBook) {
  const params = useSearchParams();
  const range: RangeKey =
    RANGE_KEYS.find((key) => key === params.get("range")) ?? "12m";
  const months = rangeMonths(book, range);
  const wantedMonth = params.get("month");
  // A picked month counts only inside the range.
  const month = months.some((one) => one.key === wantedMonth)
    ? (wantedMonth ?? undefined)
    : undefined;
  const wantedCategory = params.get("category");
  const category = book.categories.some((name) => name === wantedCategory)
    ? (wantedCategory ?? undefined)
    : undefined;
  const sort = parseOrder(params.get("sort"));
  const rangeQuery: Readonly<Record<string, string>> =
    range === "12m" ? {} : { range };

  /** Writes the changes to the URL, with a Back step. */
  const write = (
    changes: Readonly<Partial<Record<ParamName, string | null>>>,
  ) => {
    const next = new URLSearchParams(params.toString());
    for (const [name, value] of Object.entries(changes)) {
      if (value === null) next.delete(name);
      else next.set(name, value);
    }
    const query = next.toString();
    // Next.js keeps useSearchParams in step with the History API, so there is no server round trip.
    window.history.pushState(null, "", query === "" ? "?" : `?${query}`);
  };

  return {
    range,
    /** The range's months, oldest first, ending with this month. */
    months,
    sort,
    /** The picked month's key, if any. */
    month,
    /** The picked category's name, if any. */
    category,
    /** A month outside the new range is dropped. */
    setRange: (key: RangeKey) => {
      const keep = rangeMonths(book, key).some((one) => one.key === month);
      write({
        range: key === "12m" ? null : key,
        ...(keep ? {} : { month: null }),
      });
    },
    setSort: (order: LineOrder) => {
      write({ sort: writeOrder(order) });
    },
    setMonth: (key: string | undefined) => {
      write({ month: key ?? null });
    },
    setCategory: (name: string | undefined) => {
      write({ category: name ?? null });
    },
    /** The query that carries the range to another page: { range: "6m" }, or nothing for the default. */
    rangeQuery,
  };
}

export type CategoriesParams = ReturnType<typeof useCategoriesParams>;
