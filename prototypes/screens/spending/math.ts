import type { SpendEntry, SpendMonth } from "@proto/fixtures/spending";
import type { Spending } from "./scenarios";

const NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export interface MonthInfo {
  /** Year and month, e.g. "2026-11". */
  key: string;
  /** "November". */
  name: string;
  /** "Nov". */
  short: string;
  year: number;
  /** Days in the month. */
  days: number;
  /** True for the month that has today in it. */
  current: boolean;
  /** The last day counted: today in the current month, else the month's last day. */
  through: number;
  /** Weekday of the 1st, 0 for Sunday. */
  firstWeekday: number;
}

function parts(key: string): { year: number; month: number } {
  const [year = 2026, month = 1] = key.split("-").map(Number);
  return { year, month };
}

/** The month `by` months after `key`, e.g. shiftMonth("2026-01", -1) is "2025-12". */
export function shiftMonth(key: string, by: number): string {
  const { year, month } = parts(key);
  const date = new Date(Date.UTC(year, month - 1 + by, 1));
  return `${String(date.getUTCFullYear())}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthInfo(key: string, today: Spending["today"]): MonthInfo {
  const { year, month } = parts(key);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const name = NAMES[month - 1] ?? "";
  const current = key === today.month;
  return {
    key,
    name,
    short: name.slice(0, 3),
    year,
    days,
    current,
    through: current ? Math.min(today.day, days) : days,
    firstWeekday: new Date(Date.UTC(year, month - 1, 1)).getUTCDay(),
  };
}

/** "Today", "Yesterday" or "Sun 8 Nov". */
export function dayLabel(month: MonthInfo, day: number): string {
  if (month.current && day === month.through) return "Today";
  if (month.current && day === month.through - 1) return "Yesterday";
  const weekday = WEEKDAYS[(month.firstWeekday + day - 1) % 7] ?? "";
  return `${weekday.slice(0, 3)} ${String(day)} ${month.short}`;
}

/** "Sunday 8 November", for screen readers. */
export function longDayLabel(month: MonthInfo, day: number): string {
  const weekday = WEEKDAYS[(month.firstWeekday + day - 1) % 7] ?? "";
  return `${weekday} ${String(day)} ${month.name}`;
}

/** Days picked in one month, `from` to `to`. One day has both the same. */
export interface DayRange {
  from: number;
  to: number;
}

/** "Today", "Sun 8 Nov", or "3–9 Nov" for a run of days. */
export function daysLabel(month: MonthInfo, days: DayRange): string {
  if (days.from === days.to) return dayLabel(month, days.from);
  return `${String(days.from)}–${String(days.to)} ${month.short}`;
}

/** "Sunday 8 November", or "3 to 9 November", for screen readers. */
export function longDaysLabel(month: MonthInfo, days: DayRange): string {
  if (days.from === days.to) return longDayLabel(month, days.from);
  return `${String(days.from)} to ${String(days.to)} ${month.name}`;
}

const sum = (entries: readonly SpendEntry[]) =>
  entries.reduce((total, entry) => total + entry.amount, 0);

/** The mean, in whole rupees. */
const average = (values: readonly number[]) =>
  Math.round(
    values.reduce((all, value) => all + value, 0) / Math.max(values.length, 1),
  );

/** Entries from a day, up to a day, in one category and from one account, for each one given. */
export function narrow(
  entries: readonly SpendEntry[],
  {
    from,
    through,
    category,
    account,
  }: {
    from?: number | undefined;
    through?: number | undefined;
    category?: string | undefined;
    account?: string | undefined;
  },
): SpendEntry[] {
  return entries.filter(
    (entry) =>
      (from === undefined || entry.day >= from) &&
      (through === undefined || entry.day <= through) &&
      (category === undefined || entry.category === category) &&
      (account === undefined || entry.account === account),
  );
}

/** A category or an account: what was spent, against what was spent before. */
export interface BreakdownRow {
  name: string;
  spent: number;
  /**
   * The comparison's amount: at the same point in the current month, the whole month for a past
   * month, or the same dates for picked days. Null with nothing to compare.
   */
  before: number | null;
  /** How many entries make up `spent`. */
  entries: number;
  /** The comparison's entries, averaged like `before`. Null with nothing to compare. */
  entriesBefore: number | null;
}

/** What Spending is narrowed to. Each part is picked on the screen and kept in the URL. */
export interface Scope {
  /** Days picked in the month. */
  days?: DayRange | undefined;
  category?: string | undefined;
  account?: string | undefined;
}

export interface MonthSummary {
  month: MonthInfo;
  /** The days picked, or null for the whole month so far. */
  days: DayRange | null;
  /** The category picked, if any. */
  category: string | undefined;
  /** The account picked, if any. */
  account: string | undefined;
  /** What it is compared with. Null when there is no data for it. */
  comparison: Comparison | null;
  /** The days of the comparison's months that are compared. Null when nothing is compared. */
  comparedDays: DayRange | null;
  /** Spent in the days, category and account picked. */
  total: number;
  /** The comparison total. Null with nothing to compare. */
  before: number | null;
  /**
   * From the picked account, every category, so another can be picked. Biggest first. Categories
   * spent on before but not now come last, at Rs 0.
   */
  categories: BreakdownRow[];
  /** In the picked category, every account, so another can be picked. Biggest first. */
  accounts: BreakdownRow[];
  /** At most two categories that moved the total most, in the same direction as the total. */
  drivers: string[];
  /** The same for accounts: at most two that moved the total most, its way. */
  accountDrivers: string[];
  /** The entries picked, newest first. Within a day, the bigger one first. */
  entries: SpendEntry[];
}

function findMonth(spending: Spending, key: string): SpendMonth | undefined {
  return spending.months.find((month) => month.month === key);
}

/**
 * Totals by category or by account, each against the comparison, biggest first. `before` holds
 * the entries of each month compared with, and each row takes their average. The picked one is
 * always there, at Rs 0 if nothing was spent, so it stays in view.
 */
function breakdown(
  entries: readonly SpendEntry[],
  before: readonly (readonly SpendEntry[])[] | null,
  by: "category" | "account",
  picked: string | undefined,
): BreakdownRow[] {
  const totals = (list: readonly SpendEntry[]) => {
    const out = new Map<string, number>();
    for (const entry of list) {
      out.set(entry[by], (out.get(entry[by]) ?? 0) + entry.amount);
    }
    return out;
  };
  const countsOf = (list: readonly SpendEntry[]) => {
    const out = new Map<string, number>();
    for (const entry of list) out.set(entry[by], (out.get(entry[by]) ?? 0) + 1);
    return out;
  };
  const now = totals(entries);
  const counts = countsOf(entries);
  const then = before?.map(totals) ?? null;
  const thenCounts = before?.map(countsOf) ?? null;
  const names = new Set([
    ...now.keys(),
    ...(then?.flatMap((month) => [...month.keys()]) ?? []),
    ...(picked === undefined ? [] : [picked]),
  ]);
  return [...names]
    .map((name) => ({
      name,
      spent: now.get(name) ?? 0,
      before: then ? average(then.map((month) => month.get(name) ?? 0)) : null,
      entries: counts.get(name) ?? 0,
      entriesBefore: thenCounts
        ? average(thenCounts.map((month) => month.get(name) ?? 0))
        : null,
    }))
    .toSorted(
      (one, two) =>
        two.spent - one.spent || (two.before ?? 0) - (one.before ?? 0),
    );
}

/**
 * The categories or accounts spent on most in the usual months before the current one, at most 5,
 * most first. They keep their chart colours whichever month is shown. Empty without two months.
 */
export function usualLeaders(
  spending: Spending,
  by: "category" | "account",
): string[] {
  const usual = resolveComparison(spending, spending.today.month, {
    kind: "usual",
  });
  if (usual?.kind !== "usual") return [];
  const totals = new Map<string, number>();
  for (const { key } of usual.months) {
    for (const entry of findMonth(spending, key)?.entries ?? []) {
      totals.set(entry[by], (totals.get(entry[by]) ?? 0) + entry.amount);
    }
  }
  return [...totals]
    .toSorted((one, two) => two[1] - one[1])
    .slice(0, 5)
    .map(([name]) => name);
}

/** At most two rows that moved the total most, in the same direction as the total. */
function driversOf(
  rows: readonly BreakdownRow[],
  total: number,
  before: number | null,
): string[] {
  const direction = before === null ? 0 : Math.sign(total - before);
  if (direction === 0) return [];
  return rows
    .map((row) => ({ name: row.name, change: row.spent - (row.before ?? 0) }))
    .filter((row) => Math.sign(row.change) === direction)
    .toSorted((one, two) => Math.abs(two.change) - Math.abs(one.change))
    .slice(0, 2)
    .map((row) => row.name);
}

/** What the screen compares with: last month, the usual month, or a month picked by its key. */
export type Compare =
  { kind: "last" } | { kind: "usual" } | { kind: "month"; key: string };

/** A comparison that has data: what it is called, and the months it is made of. */
export interface Comparison {
  kind: Compare["kind"];
  /** In a sentence: "October", "your usual month" or "March 2026". */
  name: string;
  /** Short: "Oct", "Usual" or "Mar 2026". */
  short: string;
  /** One month, or 2 or 3 for the usual month, newest first. */
  months: MonthInfo[];
}

/**
 * The months a month can be compared with by picking one: any with data but itself. A past month
 * compares whole months, so the unfinished current month isn't one of them. Oldest first.
 */
export function pickableMonths(spending: Spending, key: string): MonthInfo[] {
  const shown = monthInfo(key, spending.today);
  return spending.months
    .map((data) => monthInfo(data.month, spending.today))
    .filter((month) => month.key !== key && (shown.current || !month.current));
}

/**
 * What a month is compared with, given the data there is. The usual month is the average of up to
 * 3 months before, and needs two. A comparison without data falls back to last month, and null
 * means that has none either.
 */
export function resolveComparison(
  spending: Spending,
  key: string,
  wanted: Compare,
): Comparison | null {
  const single = (other: string, kind: "last" | "month"): Comparison | null => {
    const month = pickableMonths(spending, key).find(
      (one) => one.key === other,
    );
    if (month === undefined) return null;
    // A picked month says its year, since it may be any month.
    const year = kind === "month" ? ` ${String(month.year)}` : "";
    return {
      kind,
      name: `${month.name}${year}`,
      short: `${month.short}${year}`,
      months: [month],
    };
  };
  const last = () => single(shiftMonth(key, -1), "last");
  if (wanted.kind === "last") return last();
  if (wanted.kind === "month") return single(wanted.key, "month") ?? last();
  const months = [1, 2, 3]
    .map((back) => shiftMonth(key, -back))
    .filter((other) => findMonth(spending, other) !== undefined)
    .map((other) => monthInfo(other, spending.today));
  if (months.length < 2) return last();
  return {
    kind: "usual",
    name:
      months.length === 3
        ? "your usual month"
        : `your usual month (last ${String(months.length)})`,
    short: "Usual",
    months,
  };
}

/**
 * The days of another month that a month, or its picked days, is compared with. The current
 * month: up to the same day. A past month: the whole month. Picked days: the same dates. One day
 * is never compared, since one day against another says little.
 */
function sameDays(
  month: MonthInfo,
  other: MonthInfo,
  days: DayRange | null,
): DayRange | null {
  if (days === null) {
    return {
      from: 1,
      to: month.current ? Math.min(month.through, other.days) : other.days,
    };
  }
  if (days.from === days.to || days.from > other.days) return null;
  return { from: days.from, to: Math.min(days.to, other.days) };
}

/** How By category and By account are sorted, and whether the other way round. */
export interface RowOrder {
  by: "amount" | "change" | "name" | "entries";
  /**
   * The usual way is high to low, rises first, A to Z, most entries first. Reversed is low to
   * high, drops first, Z to A, fewest entries first.
   */
  reversed: boolean;
}

/**
 * Rows sorted by amount, by change against the comparison, by name or by how many entries, the
 * usual way or reversed. A tie keeps the bigger amount first.
 */
export function sortRows(
  rows: readonly BreakdownRow[],
  { by, reversed }: RowOrder,
): BreakdownRow[] {
  const change = (row: BreakdownRow) => row.spent - (row.before ?? row.spent);
  const usual = (one: BreakdownRow, two: BreakdownRow): number => {
    if (by === "amount") return two.spent - one.spent;
    if (by === "change") return change(two) - change(one);
    if (by === "entries") return two.entries - one.entries;
    return one.name.localeCompare(two.name, "en", { sensitivity: "base" });
  };
  return rows.toSorted(
    (one, two) =>
      (reversed ? -1 : 1) * usual(one, two) || two.spent - one.spent,
  );
}

/**
 * One month, narrowed to what is picked: the total, the categories, the accounts and what changed
 * against the comparison. Picked days past the last day counted are dropped.
 */
export function summarize(
  spending: Spending,
  key: string,
  scope: Scope = {},
  compare: Compare = { kind: "last" },
): MonthSummary {
  const month = monthInfo(key, spending.today);
  const picked = scope.days;
  const days =
    picked && picked.from <= month.through
      ? { from: picked.from, to: Math.min(picked.to, month.through) }
      : null;
  const data = findMonth(spending, key);
  const inDays = narrow(data?.entries ?? [], {
    from: days?.from,
    through: days?.to ?? month.through,
  }).toSorted((one, two) => two.day - one.day || two.amount - one.amount);

  const comparison = resolveComparison(spending, key, compare);
  // Each month compared with, cut to the same days. A month the picked days don't reach is left
  // out.
  const compared = (comparison?.months ?? []).flatMap((other) => {
    const range = sameDays(month, other, days);
    const otherData = findMonth(spending, other.key);
    if (range === null || otherData === undefined) return [];
    return [
      {
        range,
        entries: narrow(otherData.entries, {
          from: range.from,
          through: range.to,
        }),
      },
    ];
  });
  const then =
    compared.length > 0 ? compared.map(({ entries }) => entries) : null;
  const narrowThen = (picks: Pick<Scope, "category" | "account">) =>
    then?.map((list) => narrow(list, picks)) ?? null;

  const { category, account } = scope;
  // Each breakdown keeps the other's pick but not its own, so any of its rows can still be picked.
  const categories = breakdown(
    narrow(inDays, { account }),
    narrowThen({ account }),
    "category",
    category,
  );
  const accounts = breakdown(
    narrow(inDays, { category }),
    narrowThen({ category }),
    "account",
    account,
  );
  const entries = narrow(inDays, { category, account });
  const total = sum(entries);
  const thenTotals = narrowThen({ category, account })?.map(sum) ?? null;
  const before = thenTotals ? average(thenTotals) : null;

  return {
    month,
    days,
    category,
    account,
    comparison,
    comparedDays: compared[0]?.range ?? null,
    total,
    before,
    categories,
    accounts,
    // With a category picked, the answer is about that category alone.
    drivers: category === undefined ? driversOf(categories, total, before) : [],
    // With an account picked, its row is the whole story.
    accountDrivers:
      account === undefined ? driversOf(accounts, total, before) : [],
    entries,
  };
}

/** True when nothing at all has been logged yet. */
export function isFirstUse(spending: Spending): boolean {
  return spending.months.every((month) => month.entries.length === 0);
}

/** Spend on each day, index 0 for the 1st, up to the last day counted. */
export function dailyTotals(
  entries: readonly SpendEntry[],
  days: number,
): number[] {
  const totals = Array.from({ length: days }, () => 0);
  for (const entry of narrow(entries, { through: days })) {
    totals[entry.day - 1] = (totals[entry.day - 1] ?? 0) + entry.amount;
  }
  return totals;
}

/** The running total at the end of each day, index 0 for the 1st. */
export function runningTotals(
  entries: readonly SpendEntry[],
  days: number,
): number[] {
  let running = 0;
  return dailyTotals(entries, days).map((amount) => {
    running += amount;
    return running;
  });
}

/**
 * A month's daily running total in the picked category and account, for the pace chart. Null when
 * there is no data for that month.
 */
export function monthPace(
  spending: Spending,
  key: string,
  scope: Pick<Scope, "category" | "account"> = {},
): { month: MonthInfo; running: number[] } | null {
  const data = findMonth(spending, key);
  if (!data) return null;
  const month = monthInfo(key, spending.today);
  return {
    month,
    running: runningTotals(narrow(data.entries, scope), month.through),
  };
}

/** A month's running total to compare with, day by day. */
export interface ComparePace {
  /** In a sentence: "October", "your usual month" or "March 2026". */
  name: string;
  /** On the chart: "Oct", "Usual" or "Mar 2026". */
  short: string;
  /** Index 0 for the 1st, to its last day. */
  running: number[];
  /** The days it spans, from the 1st to its month's end. */
  days: number;
}

/**
 * The comparison's line for month `key`, in the picked category and account. The usual month is
 * the day-by-day average of its months, a shorter month keeping its last total. Null when there
 * is no data for it.
 */
export function comparePace(
  spending: Spending,
  key: string,
  scope: Pick<Scope, "category" | "account">,
  comparison: Comparison,
): ComparePace | null {
  const paces = comparison.months
    .map((month) => monthPace(spending, month.key, scope))
    .filter((pace) => pace !== null);
  const [only] = paces;
  if (only === undefined) return null;
  const { name, short } = comparison;
  if (comparison.kind !== "usual") {
    return { name, short, running: only.running, days: only.month.days };
  }
  const { days } = monthInfo(key, spending.today);
  const running = Array.from({ length: days }, (_, index) =>
    average(
      paces.map(
        (pace) => pace.running[Math.min(index, pace.running.length - 1)] ?? 0,
      ),
    ),
  );
  return { name, short, running, days };
}

/** The lowest and the highest running total of the usual month's months, day by day. */
export interface UsualRange {
  /** The months it spans, newest first, as in the usual month. */
  months: MonthInfo[];
  /** Index 0 for the 1st, to the month's last day. */
  low: number[];
  high: number[];
}

/**
 * The usual range for month `key`, in the picked category and account: day by day, the lowest and
 * the highest running total of the months the usual month averages, a shorter month keeping its
 * last total. Null without two of them.
 */
export function usualRange(
  spending: Spending,
  key: string,
  scope: Pick<Scope, "category" | "account">,
): UsualRange | null {
  const usual = resolveComparison(spending, key, { kind: "usual" });
  if (usual?.kind !== "usual") return null;
  const paces = usual.months
    .map((month) => monthPace(spending, month.key, scope))
    .filter((pace) => pace !== null);
  if (paces.length < 2) return null;
  const { days } = monthInfo(key, spending.today);
  const on = (index: number) =>
    paces.map(
      (pace) => pace.running[Math.min(index, pace.running.length - 1)] ?? 0,
    );
  return {
    months: usual.months,
    low: Array.from({ length: days }, (_, index) => Math.min(...on(index))),
    high: Array.from({ length: days }, (_, index) => Math.max(...on(index))),
  };
}

/**
 * Where the month might end if the rest goes like the comparison: today's total plus the
 * comparison's rise from the same day to its end. Index 0 is today, the last is the month's end.
 */
export function projectLike(
  current: readonly number[],
  comparison: readonly number[],
  days: number,
): number[] {
  const today = current.length;
  const start = current.at(-1) ?? 0;
  const at = (day: number) =>
    comparison[Math.min(day, comparison.length) - 1] ?? 0;
  return Array.from(
    { length: Math.max(0, days - today + 1) },
    (_, offset) => start + at(today + offset) - at(today),
  );
}

/** Round amounts for a chart's gridlines up to `largest`: steps of 1, 2, 2.5 or 5 times a power of ten. */
export function niceSteps(largest: number): number[] {
  if (largest <= 0) return [];
  const rough = largest / 3;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10]
      .map((times) => times * power)
      .find((size) => size >= rough) ?? rough;
  return Array.from(
    { length: Math.floor(largest / step) },
    (_, index) => (index + 1) * step,
  );
}

/** Entries that match the search words, in the title, category or account, or the amount. */
export function search(
  entries: readonly SpendEntry[],
  words: string,
): SpendEntry[] {
  const query = words.trim().toLowerCase();
  if (query === "") return [...entries];
  // "4250", "4,250" and "Rs 4,250" all find the amount.
  const digits = query.replace(/^rs\.?\s*/, "").replaceAll(",", "");
  const amount = /^\d+$/.test(digits) ? digits : null;
  return entries.filter(
    (entry) =>
      [entry.title, entry.category, entry.account].some((text) =>
        text.toLowerCase().includes(query),
      ) ||
      (amount !== null && String(entry.amount).includes(amount)),
  );
}

/** How the entries list is sorted. */
export interface EntryOrder {
  by: "date" | "amount" | "name" | "category" | "account";
  /**
   * The usual way is newest first, high to low, or A to Z. Reversed is oldest first, low to high,
   * or Z to A.
   */
  reversed: boolean;
}

/**
 * Entries in an order. Ties go newest first, and within a day the bigger first, so the reversed
 * way flips only the field: oldest first still lists a day's biggest entry first.
 */
export function sortEntries(
  entries: readonly SpendEntry[],
  { by, reversed }: EntryOrder,
): SpendEntry[] {
  const way = reversed ? -1 : 1;
  const words = (one: string, two: string) => one.localeCompare(two) * way;
  return entries.toSorted((one, two) => {
    const field =
      by === "date"
        ? (two.day - one.day) * way
        : by === "amount"
          ? (two.amount - one.amount) * way
          : by === "name"
            ? words(one.title, two.title)
            : words(one[by], two[by]);
    return field || two.day - one.day || two.amount - one.amount;
  });
}
