// d's Category detail: what the months of one category say beyond its average. The usual range,
// the trend, why it moved (paying more each time, or more often), places over time, repeats,
// unusual entries, this month's likely end, years and accounts. Plain functions over the
// book, so the page only lays them out.

import type { SpendEntry } from "@proto/fixtures/spending";
import {
  type DatedEntry,
  type MonthCell,
  type Place,
  placesOf,
} from "@proto/screens/categories/math";
import type { CategoryBook } from "@proto/screens/categories/scenarios";
import { type MonthInfo, monthInfo } from "@proto/screens/spending/math";

/** Rounded to the nearest hundred: the usual range is a feel, not a statement. */
function hundreds(value: number): number {
  return Math.round(value / 100) * 100;
}

function sumOf(values: readonly number[]): number {
  return values.reduce((all, value) => all + value, 0);
}

/** A value at a point of a sorted list, between its neighbours: 0.5 is the median. */
function quantile(sorted: readonly number[], at: number): number {
  if (sorted.length === 0) return 0;
  const position = (sorted.length - 1) * at;
  const low = sorted[Math.floor(position)] ?? 0;
  const high = sorted[Math.ceil(position)] ?? low;
  return low + (high - low) * (position - Math.floor(position));
}

/** The months that are over: averages and patterns leave this month out. */
function finished(cells: readonly MonthCell[]): MonthCell[] {
  return cells.filter((cell) => !cell.month.current);
}

/** The usual month: the middle half of the finished months, and their median. */
export interface Typical {
  low: number;
  high: number;
  median: number;
}

/** Needs 3 finished months. A rare category's usual month is nothing: low and high are 0. */
export function typicalOf(cells: readonly MonthCell[]): Typical | null {
  const values = finished(cells)
    .map((cell) => cell.spent)
    .toSorted((one, two) => one - two);
  if (values.length < 3) return null;
  return {
    low: hundreds(quantile(values, 0.25)),
    high: hundreds(quantile(values, 0.75)),
    median: hundreds(quantile(values, 0.5)),
  };
}

/** Where a month sits against the usual range. */
export function sitsIn(
  typical: Typical,
  spent: number,
): "below" | "within" | "above" {
  if (spent < typical.low) return "below";
  return spent > typical.high ? "above" : "within";
}

export interface Trend {
  kind: "rising" | "falling" | "steady";
  /** How much it moves a month, rounded to hundreds. */
  perMonth: number;
}

/**
 * The straight line through the finished months. Steady when it moves less than 1.5% of the
 * average a month. Needs 4 finished months, 3 of them with spending.
 */
export function trendOf(cells: readonly MonthCell[]): Trend | null {
  const done = finished(cells);
  if (done.length < 4 || done.filter((cell) => cell.spent > 0).length < 3) {
    return null;
  }
  const count = done.length;
  const middle = (count - 1) / 2;
  const mean = sumOf(done.map((cell) => cell.spent)) / count;
  let across = 0;
  let spread = 0;
  for (const [index, cell] of done.entries()) {
    across += (index - middle) * (cell.spent - mean);
    spread += (index - middle) ** 2;
  }
  const slope = across / spread;
  const kind =
    Math.abs(slope) < mean * 0.015
      ? "steady"
      : slope > 0
        ? "rising"
        : "falling";
  return { kind, perMonth: hundreds(Math.abs(slope)) };
}

/** Half of the finished months: what a month cost, how many entries a month, and each on average. */
export interface Half {
  months: MonthInfo[];
  perMonth: number;
  times: number;
  each: number;
}

/**
 * The later finished months against the earlier ones, half and half; an odd month out is the
 * oldest. The change a month splits exactly into paying more each time and going more often.
 */
export interface Moved {
  earlier: Half;
  later: Half;
  change: number;
  fromEach: number;
  fromTimes: number;
}

function halfOf(run: readonly MonthCell[]): Half {
  const spent = sumOf(run.map((cell) => cell.spent));
  const entries = sumOf(run.map((cell) => cell.entries));
  return {
    months: run.map((cell) => cell.month),
    perMonth: spent / run.length,
    times: entries / run.length,
    each: entries === 0 ? 0 : spent / entries,
  };
}

/**
 * Needs 4 finished months, with spending in at least half the months of each half: a rare
 * category's two trips say nothing about each time or how often.
 */
export function movedOf(cells: readonly MonthCell[]): Moved | null {
  const done = finished(cells);
  if (done.length < 4) return null;
  const size = Math.floor(done.length / 2);
  const earlierRun = done.slice(done.length - size * 2, done.length - size);
  const laterRun = done.slice(done.length - size);
  const regular = (run: readonly MonthCell[]) =>
    run.filter((cell) => cell.spent > 0).length * 2 >= run.length;
  if (!regular(earlierRun) || !regular(laterRun)) return null;
  const earlier = halfOf(earlierRun);
  const later = halfOf(laterRun);
  return {
    earlier,
    later,
    change: later.perMonth - earlier.perMonth,
    fromEach: ((later.each - earlier.each) * (earlier.times + later.times)) / 2,
    fromTimes:
      ((later.times - earlier.times) * (earlier.each + later.each)) / 2,
  };
}

/** A place with how often it's used, what each visit costs and how that moved. */
interface PlaceStory extends Place {
  each: number;
  /** Each visit, later half against earlier half of the range, as a ratio. Null without both. */
  eachChange: number | null;
  /** First used in the last 3 months, with the category used before that. */
  since: MonthInfo | null;
  /** Not used in the last 3 months, when it was before. */
  lastUsed: MonthInfo | null;
}

/** The key a place is grouped by: "Imtiaz Super Market" and "imtiaz super market " are one. */
function placeKey(title: string): string {
  return title.trim().toLowerCase();
}

/** Every month in the book with this category's entries at a place, oldest first. */
function monthsAt(book: CategoryBook, category: string, key: string): string[] {
  return book.months
    .filter((month) =>
      month.entries.some(
        (entry) => entry.category === category && placeKey(entry.title) === key,
      ),
    )
    .map((month) => month.month);
}

/** The places in some months, biggest first, each with its own story. */
export function placeStories(
  book: CategoryBook,
  category: string,
  months: readonly MonthInfo[],
  range: readonly MonthCell[],
): PlaceStory[] {
  const keys = book.months.map((month) => month.month);
  const recent = new Set(keys.slice(-3));
  const firstKey = keys.find((key) =>
    book.months
      .find((month) => month.month === key)
      ?.entries.some((entry) => entry.category === category),
  );
  const done = finished(range).filter((cell) => cell.entries > 0);
  const size = Math.floor(done.length / 2);
  const earlier = done
    .slice(done.length - size * 2, done.length - size)
    .map((cell) => cell.month);
  const later = done.slice(done.length - size).map((cell) => cell.month);
  const eachIn = (name: string, run: readonly MonthInfo[]) => {
    const place = placesOf(book, category, run).find(
      (one) => placeKey(one.name) === placeKey(name),
    );
    return place === undefined || place.entries === 0
      ? null
      : place.spent / place.entries;
  };

  return placesOf(book, category, months).map((place) => {
    const used = monthsAt(book, category, placeKey(place.name));
    const first = used[0];
    const last = used.at(-1);
    const before = eachIn(place.name, earlier);
    const after = eachIn(place.name, later);
    return {
      ...place,
      each: place.spent / Math.max(place.entries, 1),
      eachChange:
        before === null || after === null || size < 2
          ? null
          : after / before - 1,
      since:
        first !== undefined && recent.has(first) && firstKey !== first
          ? monthInfo(first, book.today)
          : null,
      lastUsed:
        last !== undefined && !recent.has(last)
          ? monthInfo(last, book.today)
          : null,
    };
  });
}

/** Something that comes back most months at about the same amount: a bill, a fee, a delivery. */
interface Repeat {
  name: string;
  /** Its usual amount: the median. */
  amount: number;
  /** Its usual day: the median. */
  day: number;
  /** In how many of the recent finished months. */
  months: number;
  of: number;
  /** This month's, once it's in. */
  thisMonth: SpendEntry | null;
}

/**
 * Seen in at least 3 of the last 6 finished months, and in three quarters of them, once a month,
 * each within 35% of its usual amount and a week of its usual day.
 */
export function repeatsOf(book: CategoryBook, category: string): Repeat[] {
  const done = book.months.filter((month) => month.month !== book.today.month);
  const recent = done.slice(-6);
  const current = book.months.find((month) => month.month === book.today.month);
  const groups = new Map<string, { name: string; seen: SpendEntry[][] }>();
  for (const month of recent) {
    const here = new Map<string, SpendEntry[]>();
    for (const entry of month.entries) {
      if (entry.category !== category) continue;
      const key = placeKey(entry.title);
      here.set(key, [...(here.get(key) ?? []), entry]);
    }
    for (const [key, entries] of here) {
      const group = groups.get(key) ?? {
        name: entries[0]?.title.trim() ?? key,
        seen: [],
      };
      group.seen.push(entries);
      groups.set(key, group);
    }
  }

  const repeats: Repeat[] = [];
  for (const [key, { name, seen }] of groups) {
    const needed = Math.max(3, Math.ceil(recent.length * 0.75));
    if (seen.length < needed || seen.some((month) => month.length > 1)) {
      continue;
    }
    const entries = seen.flat();
    const amounts = entries
      .map((entry) => entry.amount)
      .toSorted((a, b) => a - b);
    const days = entries.map((entry) => entry.day).toSorted((a, b) => a - b);
    const amount = quantile(amounts, 0.5);
    const day = Math.round(quantile(days, 0.5));
    const steady =
      entries.every(
        (entry) => Math.abs(entry.amount - amount) <= amount * 0.35,
      ) && entries.every((entry) => Math.abs(entry.day - day) <= 7);
    if (!steady) continue;
    repeats.push({
      name,
      amount: hundreds(amount),
      day,
      months: seen.length,
      of: recent.length,
      thisMonth:
        current?.entries.find(
          (entry) =>
            entry.category === category && placeKey(entry.title) === key,
        ) ?? null,
    });
  }
  return repeats.toSorted((one, two) => two.amount - one.amount);
}

/** An entry far above the usual entry, and by how many times. */
export interface Unusual {
  item: DatedEntry;
  times: number;
}

/** The usual entry over some entries: the median amount. */
export function usualEntry(dated: readonly DatedEntry[]): number {
  return quantile(
    dated.map(({ entry }) => entry.amount).toSorted((one, two) => one - two),
    0.5,
  );
}

/** At least twice the usual entry and Rs 2,000 over it. The biggest first, up to 3. */
export function unusualOf(
  dated: readonly DatedEntry[],
  usual: number,
): Unusual[] {
  if (usual <= 0) return [];
  return dated
    .filter(
      ({ entry }) => entry.amount >= usual * 2 && entry.amount - usual >= 2000,
    )
    .map((item) => ({ item, times: item.entry.amount / usual }))
    .toSorted((one, two) => two.times - one.times)
    .slice(0, 3);
}

interface Forecast {
  soFar: number;
  /** So far, plus what the recent finished months spent after today's date, on average. */
  likely: number;
  /** Those months' average, to compare with. */
  usual: number;
  month: MonthInfo;
}

/** This month's likely end, from the last 6 finished months. Null without one. */
export function forecastOf(
  book: CategoryBook,
  /** One category, or everything. */
  category: string | undefined,
): Forecast | null {
  const month = monthInfo(book.today.month, book.today);
  const recent = book.months
    .filter((one) => one.month !== book.today.month)
    .slice(-6);
  if (recent.length === 0) return null;
  const mine = (entries: readonly SpendEntry[]) =>
    entries.filter(
      (entry) => category === undefined || entry.category === category,
    );
  const current = book.months.find((one) => one.month === book.today.month);
  const soFar = sumOf(
    mine(current?.entries ?? []).map((entry) => entry.amount),
  );
  const after = recent.map((one) =>
    sumOf(
      mine(one.entries)
        .filter((entry) => entry.day > book.today.day)
        .map((entry) => entry.amount),
    ),
  );
  const totals = recent.map((one) =>
    sumOf(mine(one.entries).map((entry) => entry.amount)),
  );
  return {
    soFar,
    likely: hundreds(soFar + sumOf(after) / recent.length),
    usual: hundreds(sumOf(totals) / recent.length),
    month,
  };
}

/** A calendar year of one category: what it came to, over how many months, and a month on average. */
interface YearRow {
  year: number;
  spent: number;
  /** Months of data in the year, this month too. */
  months: number;
  /** Over its finished months. Null with none. */
  perMonth: number | null;
  current: boolean;
}

/** Every year in the data, newest first. */
export function yearsOf(book: CategoryBook, category: string): YearRow[] {
  const years = new Map<
    number,
    { spent: number; months: number; done: number[] }
  >();
  for (const month of book.months) {
    const year = Number(month.month.slice(0, 4));
    const spent = sumOf(
      month.entries
        .filter((entry) => entry.category === category)
        .map((entry) => entry.amount),
    );
    const row = years.get(year) ?? { spent: 0, months: 0, done: [] };
    row.spent += spent;
    row.months += 1;
    if (month.month !== book.today.month) row.done.push(spent);
    years.set(year, row);
  }
  const thisYear = Number(book.today.month.slice(0, 4));
  return [...years]
    .map(([year, row]) => ({
      year,
      spent: row.spent,
      months: row.months,
      perMonth:
        row.done.length === 0
          ? null
          : Math.round(sumOf(row.done) / row.done.length),
      current: year === thisYear,
    }))
    .toSorted((one, two) => two.year - one.year);
}

/** The same month a year before, if the data goes back that far. */
export function yearBefore(
  book: CategoryBook,
  category: string,
  key: string,
): { month: MonthInfo; spent: number } | null {
  const before = `${String(Number(key.slice(0, 4)) - 1)}${key.slice(4)}`;
  const month = book.months.find((one) => one.month === before);
  if (month === undefined) return null;
  return {
    month: monthInfo(before, book.today),
    spent: sumOf(
      month.entries
        .filter((entry) => entry.category === category)
        .map((entry) => entry.amount),
    ),
  };
}

/** What paid for it: each account's amount and share, biggest first. */
export function paidWith(
  dated: readonly DatedEntry[],
): { account: string; spent: number; share: number }[] {
  const accounts = new Map<string, number>();
  for (const { entry } of dated) {
    accounts.set(
      entry.account,
      (accounts.get(entry.account) ?? 0) + entry.amount,
    );
  }
  const total = Math.max(sumOf([...accounts.values()]), 1);
  return [...accounts]
    .map(([account, spent]) => ({ account, spent, share: spent / total }))
    .toSorted((one, two) => two.spent - one.spent);
}
