import type { SpendEntry } from "@proto/fixtures/spending";
import {
  type MonthInfo,
  type MonthSummary,
  monthInfo,
  shiftMonth,
  summarize,
} from "@proto/screens/spending/math";
import type { CategoryBook } from "./scenarios";

/** How far back the pages look. Twelve months is the default. */
export type RangeKey = "12m" | "6m" | "this-year";

export const RANGE_KEYS = ["6m", "12m", "this-year"] as const;

export const RANGES = {
  "6m": { label: "6 months", back: 5 },
  "12m": { label: "12 months", back: 11 },
  "this-year": { label: "This year", back: null },
} as const satisfies Record<RangeKey, { label: string; back: number | null }>;

/** A name made safe for a URL: "Children's school fees and tuition" → childrens-school-fees-and-tuition. */
export function slugOf(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/['’]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

/** Its page: /spending/categories/groceries. */
export function categoryPath(name: string): string {
  return `/spending/categories/${slugOf(name)}`;
}

const sum = (entries: readonly SpendEntry[]) =>
  entries.reduce((total, entry) => total + entry.amount, 0);

/** The first month with anything logged, or null when nothing is. */
function firstDataMonth(book: CategoryBook): string | null {
  return book.months.find((month) => month.entries.length > 0)?.month ?? null;
}

/**
 * The range's months, oldest first, ending with this month. It starts no earlier than the first
 * month with any data: the months before the person started aren't Rs 0, they're unknown.
 */
export function rangeMonths(book: CategoryBook, range: RangeKey): MonthInfo[] {
  const end = book.today.month;
  const { back } = RANGES[range];
  const start =
    back === null ? `${end.slice(0, 4)}-01` : shiftMonth(end, -back);
  const first = firstDataMonth(book) ?? end;
  const from = first > start ? first : start;
  const keys: string[] = [];
  for (let key = from; key <= end; key = shiftMonth(key, 1)) keys.push(key);
  return keys.map((key) => monthInfo(key, book.today));
}

/** "Nov", or "Dec 2025" when it isn't this year. */
export function monthShort(
  month: MonthInfo,
  today: CategoryBook["today"],
): string {
  return month.year === Number(today.month.slice(0, 4))
    ? month.short
    : `${month.short} ${String(month.year)}`;
}

/** "November", or "December 2025" when it isn't this year. */
export function monthName(
  month: MonthInfo,
  today: CategoryBook["today"],
): string {
  return month.year === Number(today.month.slice(0, 4))
    ? month.name
    : `${month.name} ${String(month.year)}`;
}

/** The entries of one month in one category, or every category when `category` is undefined. */
function entriesIn(
  book: CategoryBook,
  key: string,
  category: string | undefined,
): SpendEntry[] {
  const data = book.months.find((month) => month.month === key);
  return (data?.entries ?? []).filter(
    (entry) => category === undefined || entry.category === category,
  );
}

/** One month of one category, or of everything. */
export interface MonthCell {
  month: MonthInfo;
  spent: number;
  entries: number;
}

/** What the figures say about a run of months: total, average, busiest month, how many had spending. */
interface RunFigures {
  cells: MonthCell[];
  /** Every month in the run, this month so far too. */
  total: number;
  /** The finished months' average, in whole rupees. Null with none finished. */
  average: number | null;
  /** How many finished months the average is over. */
  finished: number;
  /** Months with anything spent, this month too. */
  spentIn: number;
  /** The biggest month, finished or not. Null with nothing spent. */
  biggest: MonthCell | null;
}

/** Figures for the cells of a run of months. */
function figuresOf(cells: readonly MonthCell[]): RunFigures {
  const done = cells.filter((cell) => !cell.month.current);
  const biggest = cells.reduce<MonthCell | null>(
    (best, cell) =>
      cell.spent > 0 && (best === null || cell.spent > best.spent)
        ? cell
        : best,
    null,
  );
  return {
    cells: [...cells],
    total: cells.reduce((all, cell) => all + cell.spent, 0),
    average:
      done.length === 0
        ? null
        : Math.round(
            done.reduce((all, cell) => all + cell.spent, 0) / done.length,
          ),
    finished: done.length,
    spentIn: cells.filter((cell) => cell.spent > 0).length,
    biggest,
  };
}

/** The cells for a category, or for every category, over the range. */
function cellsOf(
  book: CategoryBook,
  months: readonly MonthInfo[],
  category: string | undefined,
): MonthCell[] {
  return months.map((month) => {
    const entries = entriesIn(book, month.key, category);
    return { month, spent: sum(entries), entries: entries.length };
  });
}

/** One category over the range, with what its page and its row need. */
export interface CategoryLine extends RunFigures {
  name: string;
  slug: string;
  hidden: boolean;
  /** This month so far, against the usual month by now (or last month, without two months before). */
  now: MonthSummary;
  /** This month so far less the comparison by now. Null with nothing to compare. */
  change: number | null;
  /** First spent on this month, with nothing before. */
  isNew: boolean;
  /** The last month anything was spent, in all the data. Null if never. */
  lastSpent: MonthInfo | null;
  /** Entries in the range. */
  entries: number;
}

/** This month so far in a category, against the usual month by now, as on Spending. */
function nowAgainstUsual(
  book: CategoryBook,
  category: string | undefined,
): MonthSummary {
  return summarize(book, book.today.month, { category }, { kind: "usual" });
}

/** The months with any spending in a category, in all the data, oldest first. */
function spentMonths(book: CategoryBook, category: string): string[] {
  return book.months
    .filter((month) =>
      month.entries.some((entry) => entry.category === category),
    )
    .map((month) => month.month);
}

/** One category's line over the range's months. */
export function lineOf(
  book: CategoryBook,
  months: readonly MonthInfo[],
  name: string,
): CategoryLine {
  const cells = cellsOf(book, months, name);
  const now = nowAgainstUsual(book, name);
  const spent = spentMonths(book, name);
  const last = spent.at(-1);
  return {
    ...figuresOf(cells),
    name,
    slug: slugOf(name),
    hidden: book.hidden.includes(name),
    now,
    change: now.before === null ? null : now.total - now.before,
    isNew: spent.length === 1 && last === book.today.month,
    lastSpent: last === undefined ? null : monthInfo(last, book.today),
    entries: cells.reduce((all, cell) => all + cell.entries, 0),
  };
}

/** Every category over the range, plus the whole: what the Categories page shows. */
export interface BookSummary extends RunFigures {
  months: MonthInfo[];
  /** Every category the person has, hidden ones too, in the book's order. */
  lines: CategoryLine[];
  /** Everything this month so far, against the usual month by now. */
  now: MonthSummary;
}

export function summarizeBook(
  book: CategoryBook,
  range: RangeKey,
): BookSummary {
  const months = rangeMonths(book, range);
  return {
    ...figuresOf(cellsOf(book, months, undefined)),
    months,
    lines: book.categories.map((name) => lineOf(book, months, name)),
    now: nowAgainstUsual(book, undefined),
  };
}

/** True when nothing at all has been logged yet. */
export function isEmptyBook(book: CategoryBook): boolean {
  return book.months.every((month) => month.entries.length === 0);
}

/** How the category list is sorted, and whether the other way round. */
export interface LineOrder {
  by: "total" | "average" | "change" | "name";
  /** The usual way is high to low, rises first, A to Z. */
  reversed: boolean;
}

export const LINE_SORT_KEYS = ["total", "average", "change", "name"] as const;

/** The fields for Spending's sort menu. */
export const LINE_SORTS = {
  total: { name: "Total", ways: ["High to low", "Low to high"] },
  average: { name: "Average", ways: ["High to low", "Low to high"] },
  change: { name: "Change", ways: ["Rises first", "Drops first"] },
  name: { name: "Name", ways: ["A to Z", "Z to A"], words: true },
} as const;

/** Lines sorted. A tie keeps the bigger total first; nothing to compare sorts as no change. */
export function sortLines(
  lines: readonly CategoryLine[],
  { by, reversed }: LineOrder,
): CategoryLine[] {
  const usual = (one: CategoryLine, two: CategoryLine): number => {
    if (by === "total") return two.total - one.total;
    if (by === "average") return (two.average ?? 0) - (one.average ?? 0);
    if (by === "change") return (two.change ?? 0) - (one.change ?? 0);
    return one.name.localeCompare(two.name, "en", { sensitivity: "base" });
  };
  return lines.toSorted(
    (one, two) =>
      (reversed ? -1 : 1) * usual(one, two) || two.total - one.total,
  );
}

/** A place: the entries of a category that share a name, such as "Imtiaz Super Market". */
export interface Place {
  name: string;
  spent: number;
  entries: number;
  /** Of the category's spending in the months asked. */
  share: number;
}

/** The entries in a category over some months, grouped by name, biggest first. */
export function placesOf(
  book: CategoryBook,
  category: string,
  months: readonly MonthInfo[],
): Place[] {
  const groups = new Map<
    string,
    { name: string; spent: number; entries: number }
  >();
  for (const month of months) {
    for (const entry of entriesIn(book, month.key, category)) {
      // "Imtiaz Super Market" and "imtiaz super market " are one place.
      const key = entry.title.trim().toLowerCase();
      const group = groups.get(key) ?? {
        name: entry.title.trim(),
        spent: 0,
        entries: 0,
      };
      group.spent += entry.amount;
      group.entries += 1;
      groups.set(key, group);
    }
  }
  const total = [...groups.values()].reduce(
    (all, group) => all + group.spent,
    0,
  );
  return [...groups.values()]
    .map((group) => ({ ...group, share: group.spent / Math.max(total, 1) }))
    .toSorted((one, two) => two.spent - one.spent || two.entries - one.entries);
}

/** An entry with the month it belongs to, so a list over many months can say its day. */
export interface DatedEntry {
  entry: SpendEntry;
  month: MonthInfo;
}

/** The entries in a category over some months, newest first; within a day the bigger first. */
export function entriesOf(
  book: CategoryBook,
  category: string,
  months: readonly MonthInfo[],
): DatedEntry[] {
  return months.toReversed().flatMap((month) =>
    entriesIn(book, month.key, category)
      .toSorted((one, two) => two.day - one.day || two.amount - one.amount)
      .map((entry) => ({ entry, month })),
  );
}

/** "Spent in 2 of 12 months", "Spent every month" or "Nothing spent in 12 months". */
export function spentInLabel(figures: RunFigures): string {
  const months = figures.cells.length;
  const of = `${String(months)} ${months === 1 ? "month" : "months"}`;
  if (figures.spentIn === 0) return `Nothing spent in ${of}`;
  if (figures.spentIn === months && months > 1) return "Spent every month";
  return `Spent in ${String(figures.spentIn)} of ${of}`;
}
