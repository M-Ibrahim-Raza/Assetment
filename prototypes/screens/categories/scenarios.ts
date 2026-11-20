// Categories: every spending category over the months (J3 step 3), with Category detail for one
// category (step 4). Both pages share this book of data. Three paired variants were tried, a
// (Ledger), b (Story) and c (Chart and panel); d (Mix), built from parts of them, was picked on
// 2026-11-20 for both pages, and a, b and c were deleted.
//
// Settled before building (2026-11-19), after research (Monarch, Copilot, Monzo, Revolut, YNAB,
// Lunch Money, Actual, Quicken, PocketSmith, Emma, Simplifi):
// - In v1: every category over the months, a range (6 months, 12 months, this year) and sorting
//   (total, average, change, name); on a category's page, monthly bars with an average line,
//   picking a month to narrow the page, key figures (total, average a month, this year, biggest
//   month, "Spent in 2 of 12 months"), this month against usual by now, its places (entries
//   grouped by name) and its latest few entries with "See all 42 entries".
// - Later, to ask again once a variant is picked: totals by year, a median line, the same month
//   last year, by account inside a category, a place's own page, moving every entry from a place,
//   export, an icon or colour per category, category groups. Never: reordering categories (most
//   used first is learned), leaving a category out of totals, budgets (a v1 non-goal).
// - J3: a new step 3, Categories, before Category detail, and a wider goal: "know where money goes,
//   this month and over the months, and how it compares."
// - URLs: /spending/categories and /spending/categories/<slug>, such as groceries or eating-out.
//   The range (`range`: 6m, this-year; 12 months is the default and stays out of the URL), the sort
//   (`sort`) and a picked month (`month`, such as 2026-03) live in the query. Opening a category
//   keeps the range.
// - Spent categories only, as on Spending. Money received has its own categories, for later.
// - Looking after categories lives on these pages: Add category on Categories; Rename, Hide, Merge
//   into… and Delete in a ⋯ menu on a category's page; hidden ones in a "Hidden · 2" row at the end
//   of the list. Rename, hide and deleting an unused category happen at once, with Undo. Merge
//   moves every entry into another category and is confirmed, naming both and the count. A category
//   with entries can't be deleted: its Delete leads to Merge.
// - The current month is unfinished: drawn outlined, said "so far", left out of the average.
// - Average a month: the finished months in the range since the first month with any data. A month
//   with nothing in a category counts as Rs 0, so a rare one also says "Spent in 2 of 12 months".
// - Change is this month so far against the usual month by now (the average of up to 3 months
//   before, over the same days), as on Spending. Never red: arrows, words and signs.
// - Customize on a category's page (2026-11-20): Spending's sheet, now shared, in the header and on
//   each card. One layout for every category, saved to the account, with Spending's "Same layout
//   on phone and computer". Month by month always leads, with its extras: usual range, trend,
//   totals, biggest month and the likely end on; same month last year and notes off. Cards show,
//   hide and move: Paid with and By year start hidden. Extras: Why it changed's figures, Where it
//   goes' share bars, cost each time and tags on, every place off; Comes back every month's due
//   status on; Entries' month totals and sorting on, compact rows off.
// - Customize on this page (2026-11-20): the same shared sheet, in the header and on each block.
//   Both blocks always show, Spending by month first, so it's their Options. Spending by month:
//   summary, figures, totals, biggest month and the share in a picked month on; usual range and
//   this month's likely end off. Every category: a bar a month, the Total column, how often,
//   sorting and the Nothing spent row on; share of spending, this month against usual and compact
//   rows off. Picking a category from the key, and the Hidden row, aren't optional.
//
// Open questions:
// - Where Spending links here: an "All categories" link by By category's heading, and "Open
//   Groceries" carrying the picked category's slug. Spending isn't edited in this work.
// - The Entries page's screen name and URL (another session). Until it exists, "See all" and a
//   place's link render as "not built".
// - In the prototype, a page opened by URL starts from the fixture: a category added on Categories
//   opens empty, and a rename or merge isn't carried to other pages. Production moves to the new
//   slug after a rename and to the target after a merge, and redirects the old slug.

import type { CategoriesLayout } from "./layout";
import {
  CATEGORY_NAMES,
  categoryHistory,
  emptyCategoryHistory,
  HIDDEN_SAMPLE,
  manyCategoryHistory,
  newUserCategoryHistory,
} from "@proto/fixtures/category-history";
import { SPENDING_TODAY, type SpendMonth } from "@proto/fixtures/spending";
import type { Scenarios } from "@proto/kit/scenarios";

/** What the Categories pages read: every spent entry, month by month, and the person's categories. */
export interface CategoryBook {
  /** Today. The current month counts up to this day. */
  today: { month: string; day: number };
  /** Every month with data, oldest first, ending with this month. */
  months: readonly SpendMonth[];
  /** The person's spending categories, most used first, including ones never spent on. */
  categories: readonly string[];
  /** Categories put away: kept with their history, left out of the pickers. */
  hidden: readonly string[];
}

/** The View's props. Loading and error are states the View shows, so they are props too. */
export type CategoriesViewProps =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      book: CategoryBook;
      /** The page as set up in Customize, saved to the account. Missing is the default. */
      layout?: CategoriesLayout;
    };

const today = { ...SPENDING_TODAY };

/** A book with the person's twenty categories, nothing hidden unless asked. */
export function bookOf(
  months: readonly SpendMonth[],
  hidden: readonly string[] = [],
): CategoryBook {
  return { today, months, categories: CATEGORY_NAMES, hidden };
}

export const ERROR_MESSAGE =
  "Your data is safe. Check your connection and try again in a moment.";

export const scenarios = {
  default: { status: "ready", book: bookOf(categoryHistory()) },
  // Nothing logged yet.
  empty: { status: "ready", book: bookOf(emptyCategoryHistory()) },
  // Joined on 3 November: one month, so there's no trend yet.
  "new-user": { status: "ready", book: bookOf(newUserCategoryHistory()) },
  // Twenty categories over twenty-four months, with crore totals.
  many: { status: "ready", book: bookOf(manyCategoryHistory()) },
  // Two categories put away, in the "Hidden · 2" row.
  hidden: {
    status: "ready",
    book: bookOf(categoryHistory(), HIDDEN_SAMPLE),
  },
  // Set up in Customize: no summary, compact rows with each one's share, and no sort.
  customized: {
    status: "ready",
    book: bookOf(categoryHistory()),
    layout: {
      order: ["list"],
      hidden: [],
      settings: {
        top: { summary: false },
        list: { compact: true, share: true, sorting: false },
      },
    },
  },
  // Every extra on, on both blocks.
  "every-option": {
    status: "ready",
    book: bookOf(categoryHistory()),
    layout: {
      order: ["list"],
      hidden: [],
      settings: {
        top: { usualRange: true, likelyEnd: true },
        list: { share: true, change: true },
      },
    },
  },
  // The fewest extras: the big number and the chart, and rows with their averages.
  minimal: {
    status: "ready",
    book: bookOf(categoryHistory()),
    layout: {
      order: ["list"],
      hidden: [],
      settings: {
        top: {
          summary: false,
          figures: false,
          totals: false,
          biggest: false,
          shares: false,
        },
        list: {
          bars: false,
          total: false,
          howOften: false,
          sorting: false,
          nothingSpent: false,
        },
      },
    },
  },
  loading: { status: "loading" },
  error: { status: "error", message: ERROR_MESSAGE },
} satisfies Scenarios<CategoriesViewProps>;
