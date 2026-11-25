import type {
  EntryPart,
  HistoryEntry,
  HistoryKind,
  OpeningPlace,
} from "@proto/fixtures/entry-history";
import type { Place } from "@proto/screens/quick-add/places";

// What the Entries pages work out from the entries: filters, search, order, groups, totals,
// balances, and what one entry changed. No React here.

export const KINDS: readonly HistoryKind[] = [
  "expense",
  "income",
  "transfer",
  "correction",
];

/** What each kind is called on screen. */
export const KIND_WORD = {
  expense: "Spent",
  income: "Received",
  transfer: "Moved",
  correction: "Correction",
} as const satisfies Record<HistoryKind, string>;

/** The kind filter's choices, plural where it reads better. */
export const KIND_FILTER_WORD = {
  expense: "Spent",
  income: "Received",
  transfer: "Moved",
  correction: "Corrections",
} as const satisfies Record<HistoryKind, string>;

/** Each kind as the URL writes it, `?kind=spent,received`. */
export const KIND_PARAM = {
  expense: "spent",
  income: "received",
  transfer: "moved",
  correction: "corrections",
} as const satisfies Record<HistoryKind, string>;

// ─── Days and months ────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
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

function partsOf(date: string): { year: number; month: number; day: number } {
  const [year = 2026, month = 1, day = 1] = date
    .slice(0, 10)
    .split("-")
    .map(Number);
  return { year, month, day };
}

const utc = (date: string) => {
  const { year, month, day } = partsOf(date);
  return new Date(Date.UTC(year, month - 1, day));
};

/** The ISO day `count` days before `date`. */
export function daysBefore(date: string, count: number): string {
  const moved = utc(date);
  moved.setUTCDate(moved.getUTCDate() - count);
  return moved.toISOString().slice(0, 10);
}

/** "2026-11" for "2026-11-08". */
export const monthKeyOf = (date: string) => date.slice(0, 7);

/** The month `by` months after `key`. */
export function shiftMonth(key: string, by: number): string {
  const { year, month } = partsOf(`${key}-01`);
  const date = new Date(Date.UTC(year, month - 1 + by, 1));
  return `${String(date.getUTCFullYear())}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** The last ISO day of a month. */
function monthEnd(key: string): string {
  const { year, month } = partsOf(`${key}-01`);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${key}-${String(last).padStart(2, "0")}`;
}

/** "November", or "November 2025" when it isn't this year. */
export function monthName(key: string, today: string): string {
  const { year, month } = partsOf(`${key}-01`);
  const name = MONTH_NAMES[month - 1] ?? "";
  return year === partsOf(today).year ? name : `${name} ${String(year)}`;
}

/** "Nov". */
export function shortMonth(key: string): string {
  const { month } = partsOf(`${key}-01`);
  return (MONTH_NAMES[month - 1] ?? "").slice(0, 3);
}

/** "Today", "Yesterday" or "Sun 8 Nov". */
export function dayLabel(date: string, today: string): string {
  if (date === today) return "Today";
  if (date === daysBefore(today, 1)) return "Yesterday";
  const { day, month } = partsOf(date);
  const weekday = WEEKDAYS[utc(date).getUTCDay()] ?? "";
  return `${weekday.slice(0, 3)} ${String(day)} ${(MONTH_NAMES[month - 1] ?? "").slice(0, 3)}`;
}

/** "8 Nov", the short way a row says its day. */
export function shortDate(date: string): string {
  const { day, month } = partsOf(date);
  return `${String(day)} ${(MONTH_NAMES[month - 1] ?? "").slice(0, 3)}`;
}

/** "Sunday 8 November 2026". */
export function longDate(date: string): string {
  const { day, month, year } = partsOf(date);
  const weekday = WEEKDAYS[utc(date).getUTCDay()] ?? "";
  return `${weekday} ${String(day)} ${MONTH_NAMES[month - 1] ?? ""} ${String(year)}`;
}

/** The day of the month, "8". */
export const dayNumber = (date: string) => String(partsOf(date).day);

/** The weekday, short: "Sun". */
export const weekdayShort = (date: string) =>
  (WEEKDAYS[utc(date).getUTCDay()] ?? "").slice(0, 3);

/** "10 Nov at 10:14 pm", for when an entry was logged or changed. */
export function loggedLabel(at: string, today: string): string {
  const date = at.slice(0, 10);
  const [hourText = "0", minute = "00"] = at.slice(11, 16).split(":");
  const hour = Number(hourText);
  const clock = `${String(hour % 12 === 0 ? 12 : hour % 12)}:${minute} ${hour < 12 ? "am" : "pm"}`;
  const day =
    date === today
      ? "Today"
      : date === daysBefore(today, 1)
        ? "Yesterday"
        : shortDate(date);
  return `${day} at ${clock}`;
}

// ─── Periods ────────────────────────────────────────────────────────────────────────────────────

export type Preset =
  "this-month" | "last-month" | "last-3-months" | "last-6-months" | "this-year";

export const PRESETS: readonly Preset[] = [
  "this-month",
  "last-month",
  "last-3-months",
  "last-6-months",
  "this-year",
];

export const PRESET_WORD = {
  "this-month": "This month",
  "last-month": "Last month",
  "last-3-months": "Last 3 months",
  "last-6-months": "Last 6 months",
  "this-year": "This year",
} as const satisfies Record<Preset, string>;

/** The days the list covers. All time is the default. */
export type Period =
  | { kind: "all" }
  | { kind: "preset"; preset: Preset }
  | { kind: "month"; key: string }
  | { kind: "range"; from: string; to: string };

/** The first and last ISO day of a period. Open ends are undefined. */
export function periodRange(
  period: Period,
  today: string,
): { from?: string; to?: string } {
  const month = monthKeyOf(today);
  switch (period.kind) {
    case "all":
      return {};
    case "month":
      return { from: `${period.key}-01`, to: monthEnd(period.key) };
    case "range":
      return { from: period.from, to: period.to };
    case "preset":
      switch (period.preset) {
        case "this-month":
          return { from: `${month}-01`, to: today };
        case "last-month": {
          const last = shiftMonth(month, -1);
          return { from: `${last}-01`, to: monthEnd(last) };
        }
        case "last-3-months":
          return { from: `${shiftMonth(month, -2)}-01`, to: today };
        case "last-6-months":
          return { from: `${shiftMonth(month, -5)}-01`, to: today };
        case "this-year":
          return { from: `${today.slice(0, 4)}-01-01`, to: today };
      }
  }
}

/** "All time", "Last 3 months", "October" or "3 Oct – 9 Nov". */
export function periodLabel(period: Period, today: string): string {
  switch (period.kind) {
    case "all":
      return "All time";
    case "preset":
      return PRESET_WORD[period.preset];
    case "month":
      return monthName(period.key, today);
    case "range":
      return period.from === period.to
        ? shortDate(period.from)
        : `${shortDate(period.from)} – ${shortDate(period.to)}`;
  }
}

// ─── Filters, search and order ──────────────────────────────────────────────────────────────────

export interface EntryFilters {
  /** Words or an amount, "Daraz" or "4250". */
  q: string;
  /** Empty means every kind. */
  kinds: readonly HistoryKind[];
  category?: string | undefined;
  account?: string | undefined;
  tag?: string | undefined;
  period: Period;
}

/** The categories an entry counts in: its split's parts, else its own. */
export function categoriesOf(entry: HistoryEntry): string[] {
  if (entry.parts !== undefined)
    return entry.parts.map((part) => part.category);
  return entry.category === "" ? [] : [entry.category];
}

/** The accounts and debts it touches. */
export const accountsOf = (entry: HistoryEntry): string[] =>
  entry.toAccount === undefined
    ? [entry.account]
    : [entry.account, entry.toAccount];

/**
 * Entries that match some words, newest first as given. Words match the name, the note, the
 * categories, the accounts and the tags. "4250", "4,250" and "Rs 4,250" find the amount.
 */
export function search(
  entries: readonly HistoryEntry[],
  words: string,
): HistoryEntry[] {
  const query = words.trim().toLowerCase();
  if (query === "") return [...entries];
  const digits = query.replace(/^rs\.?\s*/, "").replaceAll(",", "");
  const amount = /^\d+$/.test(digits) ? digits : null;
  return entries.filter(
    (entry) =>
      [
        entry.title,
        entry.note ?? "",
        ...categoriesOf(entry),
        ...accountsOf(entry),
        ...(entry.tags ?? []),
      ].some((text) => text.toLowerCase().includes(query)) ||
      (amount !== null && String(entry.amount).includes(amount)),
  );
}

/** Whether an entry passes every filter but the words. */
export function passes(
  entry: HistoryEntry,
  filters: EntryFilters,
  today: string,
): boolean {
  const { from, to } = periodRange(filters.period, today);
  return (
    (filters.kinds.length === 0 || filters.kinds.includes(entry.kind)) &&
    (filters.category === undefined ||
      categoriesOf(entry).includes(filters.category)) &&
    (filters.account === undefined ||
      accountsOf(entry).includes(filters.account)) &&
    (filters.tag === undefined || (entry.tags ?? []).includes(filters.tag)) &&
    (from === undefined || entry.date >= from) &&
    (to === undefined || entry.date <= to)
  );
}

/** The entries that pass every filter and match the words. */
export function filterEntries(
  entries: readonly HistoryEntry[],
  filters: EntryFilters,
  today: string,
): HistoryEntry[] {
  return search(
    entries.filter((entry) => passes(entry, filters, today)),
    filters.q,
  );
}

/** How many filters are set, words included. All time doesn't count. */
export function filterCount(filters: EntryFilters): number {
  return [
    filters.q !== "",
    filters.kinds.length > 0,
    filters.category !== undefined,
    filters.account !== undefined,
    filters.tag !== undefined,
    filters.period.kind !== "all",
  ].filter(Boolean).length;
}

export type EntrySort =
  "date" | "logged" | "amount" | "name" | "category" | "account";

export const SORT_KEYS: readonly EntrySort[] = [
  "date",
  "logged",
  "amount",
  "name",
  "category",
  "account",
];

/** Each sort's name, its usual and reversed ways, and whether it sorts words. For `SortMenu`. */
export const SORT_FIELDS = {
  date: { name: "Date", ways: ["Newest first", "Oldest first"] },
  logged: { name: "When logged", ways: ["Latest first", "Earliest first"] },
  amount: { name: "Amount", ways: ["High to low", "Low to high"] },
  name: { name: "Name", ways: ["A to Z", "Z to A"], words: true },
  category: { name: "Category", ways: ["A to Z", "Z to A"], words: true },
  account: { name: "Account", ways: ["A to Z", "Z to A"], words: true },
} as const satisfies Record<
  EntrySort,
  { name: string; ways: readonly [string, string]; words?: boolean }
>;

export interface EntryOrder {
  by: EntrySort;
  /** Oldest first, earliest first, low to high, or Z to A. */
  reversed: boolean;
}

/** Entries in an order. Ties go newest first. */
export function sortEntries(
  entries: readonly HistoryEntry[],
  { by, reversed }: EntryOrder,
): HistoryEntry[] {
  const way = reversed ? -1 : 1;
  const newest = (one: HistoryEntry, two: HistoryEntry) =>
    two.date.localeCompare(one.date) ||
    two.loggedAt.localeCompare(one.loggedAt);
  return entries.toSorted((one, two) => {
    switch (by) {
      case "date":
        return newest(one, two) * way;
      case "logged":
        return (
          (two.loggedAt.localeCompare(one.loggedAt) || newest(one, two)) * way
        );
      case "amount":
        return (two.amount - one.amount) * way || newest(one, two);
      case "name":
        return one.title.localeCompare(two.title) * way || newest(one, two);
      case "category":
        return (
          (categoriesOf(one)[0] ?? "").localeCompare(
            categoriesOf(two)[0] ?? "",
          ) * way || newest(one, two)
        );
      case "account":
        return one.account.localeCompare(two.account) * way || newest(one, two);
    }
  });
}

// ─── Totals ─────────────────────────────────────────────────────────────────────────────────────

export interface Totals {
  count: number;
  /** Spent money, with the markup in loan instalments. */
  spent: number;
  received: number;
  /** Moved between the user's own things, less any markup. */
  moved: number;
  /** Debt corrections that lowered what is owed. */
  corrections: number;
}

/** How much of one entry counts as spent, received, moved or a correction. */
export function countsOf(entry: HistoryEntry): Omit<Totals, "count"> {
  const none = { spent: 0, received: 0, moved: 0, corrections: 0 };
  switch (entry.kind) {
    case "expense":
      return { ...none, spent: entry.amount };
    case "income":
      return { ...none, received: entry.amount };
    case "transfer": {
      const markup = entry.source?.markup ?? 0;
      return { ...none, spent: markup, moved: entry.amount - markup };
    }
    case "correction":
      return { ...none, corrections: entry.amount };
  }
}

export function totalsOf(entries: readonly HistoryEntry[]): Totals {
  return entries.reduce<Totals>(
    (all, entry) => {
      const counts = countsOf(entry);
      return {
        count: all.count + 1,
        spent: all.spent + counts.spent,
        received: all.received + counts.received,
        moved: all.moved + counts.moved,
        corrections: all.corrections + counts.corrections,
      };
    },
    { count: 0, spent: 0, received: 0, moved: 0, corrections: 0 },
  );
}

/** "1 entry" or "58 entries". */
export const entriesWord = (count: number) =>
  `${String(count)} ${count === 1 ? "entry" : "entries"}`;

// ─── Groups ─────────────────────────────────────────────────────────────────────────────────────

export interface DayGroup {
  /** ISO day, or for "When logged", the day it was logged. */
  date: string;
  entries: HistoryEntry[];
  totals: Totals;
}

export interface MonthGroup {
  /** "2026-11". */
  key: string;
  days: DayGroup[];
  totals: Totals;
}

function daysOf(
  entries: readonly HistoryEntry[],
  dayOf: (entry: HistoryEntry) => string,
): DayGroup[] {
  const days = new Map<string, HistoryEntry[]>();
  for (const entry of entries) {
    const day = dayOf(entry);
    days.set(day, [...(days.get(day) ?? []), entry]);
  }
  return [...days].map(([date, list]) => ({
    date,
    entries: list,
    totals: totalsOf(list),
  }));
}

/** Entries in date order, under their months and days, each with its totals. */
export function groupByMonth(entries: readonly HistoryEntry[]): MonthGroup[] {
  const months = new Map<string, HistoryEntry[]>();
  for (const entry of entries) {
    const key = monthKeyOf(entry.date);
    months.set(key, [...(months.get(key) ?? []), entry]);
  }
  return [...months].map(([key, list]) => ({
    key,
    days: daysOf(list, (entry) => entry.date),
    totals: totalsOf(list),
  }));
}

/** Entries in the order they were logged, under the day they were logged. */
export function groupByLogged(entries: readonly HistoryEntry[]): DayGroup[] {
  return daysOf(entries, (entry) => entry.loggedAt.slice(0, 10));
}

/**
 * Every month with entries, newest first, with its totals: the jump list and the month rail. It
 * counts everything that passes the filters, so it matches the list.
 */
export function monthsOf(entries: readonly HistoryEntry[]): MonthGroup[] {
  return groupByMonth(sortEntries(entries, { by: "date", reversed: false }));
}

// ─── Accounts, balances and what an entry changed ───────────────────────────────────────────────

/**
 * How an entry moves one account's balance, or what is owed on one debt. Money out of an account
 * lowers it. Spending on a card adds to what is owed; paying a debt lowers it, less any markup,
 * which is spent. A correction lowers what is owed.
 */
export function effectOn(
  entry: HistoryEntry,
  place: Pick<Place, "name" | "debt">,
): number {
  const here = entry.account === place.name;
  const there = entry.toAccount === place.name;
  if (place.debt === null) {
    switch (entry.kind) {
      case "expense":
        return here ? -entry.amount : 0;
      case "income":
        return here ? entry.amount : 0;
      case "transfer":
        return (there ? entry.amount : 0) - (here ? entry.amount : 0);
      case "correction":
        return 0;
    }
  }
  switch (entry.kind) {
    case "expense":
      return here ? entry.amount : 0;
    case "income":
      return 0;
    case "transfer":
      return (
        (here ? entry.amount : 0) -
        (there ? entry.amount - (entry.source?.markup ?? 0) : 0)
      );
    case "correction":
      return here ? -entry.amount : 0;
  }
}

/** Every account and debt as it stands today: what it held on 1 June, plus every entry since. */
export function placesToday(
  opening: readonly OpeningPlace[],
  entries: readonly HistoryEntry[],
): Place[] {
  return opening.map((place) => ({
    id: place.id,
    name: place.name,
    debt: place.debt,
    amount: entries.reduce(
      (amount, entry) => amount + effectOn(entry, place),
      place.opening,
    ),
  }));
}

/**
 * What one account held, or one debt owed, right after each of its entries, as on a bank
 * statement. It walks back from today, newest first.
 */
export function balancesAfter(
  entries: readonly HistoryEntry[],
  place: Place,
): Map<string, number> {
  const after = new Map<string, number>();
  let running = place.amount;
  for (const entry of sortEntries(entries, { by: "date", reversed: false })) {
    const change = effectOn(entry, place);
    if (change === 0 && !accountsOf(entry).includes(place.name)) continue;
    after.set(entry.id, running);
    running -= change;
  }
  return after;
}

/** One account or debt before and after an entry. */
export interface PlaceChange {
  name: string;
  /** True for a debt: the amounts are what was owed. */
  debt: boolean;
  before: number;
  after: number;
}

/** Where an entry counts, for "What it changed". */
export interface Impact {
  /** The accounts and debts it moved, before and after. */
  places: PlaceChange[];
  /** What counts as spent, by category, in its month. */
  spent: readonly EntryPart[];
  /** What counts as received, by category. */
  received: readonly EntryPart[];
  /** How far net worth moved: zero for money moved between the user's own things. */
  netWorth: number;
  /** "2026-11". */
  month: string;
}

/** What one entry did: to its accounts and debts, to the month's totals, and to net worth. */
export function impactOf(
  entry: HistoryEntry,
  entries: readonly HistoryEntry[],
  places: readonly Place[],
): Impact {
  const touched = places.filter((place) =>
    accountsOf(entry).includes(place.name),
  );
  const changes = touched.map((place) => {
    const after = balancesAfter(entries, place).get(entry.id) ?? place.amount;
    return {
      name: place.name,
      debt: place.debt !== null,
      before: after - effectOn(entry, place),
      after,
    };
  });
  const counts = countsOf(entry);
  const spent: EntryPart[] =
    entry.kind === "expense"
      ? (
          entry.parts ?? [{ category: entry.category, amount: entry.amount }]
        ).map((part) => ({ ...part }))
      : counts.spent > 0
        ? [{ category: "Loan markup", amount: counts.spent }]
        : [];
  const received: EntryPart[] =
    entry.kind === "income"
      ? [{ category: entry.category, amount: entry.amount }]
      : [];
  return {
    places: changes,
    spent,
    received,
    netWorth: counts.received + counts.corrections - counts.spent,
    month: monthKeyOf(entry.date),
  };
}

// ─── Same place ─────────────────────────────────────────────────────────────────────────────────

export interface SamePlace {
  /** The name they share. */
  title: string;
  count: number;
  total: number;
  /** The middle amount: what it usually costs. */
  usual: number;
  /** The first and the latest day. */
  first: string;
  last: string;
  /** The latest few others, newest first. */
  others: HistoryEntry[];
  /** Each month's total, oldest first, for months with any. */
  months: { key: string; total: number }[];
}

/** Entries with the same name and kind, as a summary. Null when this is the only one. */
export function samePlaceOf(
  entry: HistoryEntry,
  entries: readonly HistoryEntry[],
): SamePlace | null {
  const name = entry.title.trim().toLowerCase();
  const same = sortEntries(
    entries.filter(
      (other) =>
        other.kind === entry.kind && other.title.trim().toLowerCase() === name,
    ),
    { by: "date", reversed: false },
  );
  if (same.length < 2) return null;
  const amounts = same.map((other) => other.amount).toSorted((a, b) => a - b);
  const months = new Map<string, number>();
  for (const other of same.toReversed()) {
    const key = monthKeyOf(other.date);
    months.set(key, (months.get(key) ?? 0) + other.amount);
  }
  return {
    title: entry.title,
    count: same.length,
    total: amounts.reduce((sum, amount) => sum + amount, 0),
    usual: amounts[Math.floor(amounts.length / 2)] ?? entry.amount,
    first: same.at(-1)?.date ?? entry.date,
    last: same[0]?.date ?? entry.date,
    others: same.filter((other) => other.id !== entry.id).slice(0, 4),
    months: [...months].map(([key, total]) => ({ key, total })),
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────────────────────────

const cell = (value: string) =>
  /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

/**
 * The entries as a CSV file a spreadsheet opens: Date, Name, Kind, Category, Account, To, Amount,
 * Note, Tags. Spent amounts are negative and received ones positive; moved ones have no sign.
 */
export function toCsv(entries: readonly HistoryEntry[]): string {
  const head = [
    "Date",
    "Name",
    "Kind",
    "Category",
    "Account",
    "To",
    "Amount",
    "Note",
    "Tags",
  ];
  const rows = entries.map((entry) => {
    const category =
      entry.parts === undefined
        ? entry.category
        : entry.parts
            .map((part) => `${part.category} ${String(part.amount)}`)
            .join("; ");
    const amount = entry.kind === "expense" ? -entry.amount : entry.amount;
    return [
      entry.date,
      entry.title,
      KIND_WORD[entry.kind],
      category,
      entry.account,
      entry.toAccount ?? "",
      String(amount),
      entry.note ?? "",
      (entry.tags ?? []).join("; "),
    ]
      .map(cell)
      .join(",");
  });
  return [head.join(","), ...rows].join("\n");
}
