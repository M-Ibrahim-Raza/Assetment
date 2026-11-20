// Category detail: one category over the months (J3 step 4). Its decisions and open questions are
// in Categories' scenarios.ts: the two pages are designed together, and d (Mix) is the pick on both.
//
// Scenarios come from the slug in the path, so a row on Categories opens its own category. A slug
// the fixture doesn't know opens as a category just added, with nothing spent: in the prototype,
// a category added on Categories opens that way.

import {
  CATEGORY_NAMES,
  categoryHistory,
  manyCategoryHistory,
  newUserCategoryHistory,
} from "@proto/fixtures/category-history";
import type { Scenarios } from "@proto/kit/scenarios";
import { notesFor } from "@proto/fixtures/category-notes";
import { slugOf } from "@proto/screens/categories/math";
import type { DetailLayout } from "./layout";
import {
  bookOf,
  type CategoryBook,
  ERROR_MESSAGE,
} from "@proto/screens/categories/scenarios";

/** The View's props: the book, and the category this page is about, by name. */
export type CategoryDetailViewProps =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      book: CategoryBook;
      category: string;
      /** The person's notes on this category's months, by month ("2026-03"). */
      notes: Readonly<Record<string, string>>;
      /** The page as set up in Customize, saved to the account. Missing is the default. */
      layout?: DetailLayout;
    };

/** "pets" → "Pets", "home-office" → "Home office". */
function nameFromSlug(slug: string): string {
  const words = slug.replaceAll("-", " ").trim();
  return words === ""
    ? "New category"
    : `${words[0]?.toUpperCase() ?? ""}${words.slice(1)}`;
}

/** The book with a category the person just added, if it isn't there yet. */
function withCategory(book: CategoryBook, name: string): CategoryBook {
  return book.categories.includes(name)
    ? book
    : { ...book, categories: [...book.categories, name] };
}

/** The scenarios for the category in the path, such as "groceries". */
export function scenariosFor(slug: string) {
  const book = bookOf(categoryHistory());
  const known = CATEGORY_NAMES.find((name) => slugOf(name) === slug);
  const category = known ?? nameFromSlug(slug);
  return {
    default: {
      status: "ready",
      book: withCategory(book, category),
      category,
      notes: notesFor(category),
    },
    // Spent in 2 of the 12 months: April and August.
    rare: {
      status: "ready",
      book,
      category: "Travel",
      notes: notesFor("Travel"),
    },
    // First spent this month.
    new: { status: "ready", book, category: "Health", notes: {} },
    // Added, with nothing spent yet.
    empty: { status: "ready", book, category: "Personal care", notes: {} },
    // The long name, to test wrapping.
    "long-name": {
      status: "ready",
      book,
      category: "Children's school fees and tuition",
      notes: {},
    },
    // Twenty-four months of a big household renovating this month: crore totals.
    many: {
      status: "ready",
      book: bookOf(manyCategoryHistory()),
      category: "Home repairs",
      notes: {},
    },
    // Joined on 3 November: one month, so there's no trend yet.
    "new-user": {
      status: "ready",
      book: bookOf(newUserCategoryHistory()),
      category: known ?? "Groceries",
      notes: {},
    },
    // An old link to a category that was merged away.
    "not-found": {
      status: "ready",
      book,
      category: "Groceries and household",
      notes: {},
    },
    // Set up in Customize: Entries first, Comes back every month and By year hidden, no place tags,
    // compact entries, and no likely end on the chart.
    customized: {
      status: "ready",
      book: withCategory(book, category),
      category,
      notes: notesFor(category),
      layout: {
        order: [
          "entries",
          "why",
          "places",
          "repeats",
          "unusual",
          "paid",
          "years",
        ],
        hidden: ["repeats", "years"],
        settings: {
          months: { forecast: false },
          places: { tags: false },
          entries: { compact: true },
        },
      },
    },
    // Every section shown, every extra on.
    "every-option": {
      status: "ready",
      book: withCategory(book, category),
      category,
      notes: notesFor(category),
      layout: {
        order: [
          "why",
          "places",
          "repeats",
          "unusual",
          "paid",
          "years",
          "entries",
        ],
        hidden: [],
        settings: {
          months: { lastYear: true, notes: true },
          places: { allPlaces: true },
        },
      },
    },
    // Only Month by month and Entries, and the chart without its extras.
    minimal: {
      status: "ready",
      book: withCategory(book, category),
      category,
      notes: notesFor(category),
      layout: {
        order: [
          "why",
          "places",
          "repeats",
          "unusual",
          "paid",
          "years",
          "entries",
        ],
        hidden: ["why", "places", "repeats", "unusual", "paid", "years"],
        settings: {
          months: {
            usualRange: false,
            trend: false,
            totals: false,
            biggest: false,
            forecast: false,
          },
        },
      },
    },
    // Rows picked in Customize: the cards two to a row, then the entries on a row of their own.
    rows: {
      status: "ready",
      book: withCategory(book, category),
      category,
      notes: notesFor(category),
      layout: {
        order: [
          "why",
          "places",
          "repeats",
          "unusual",
          "paid",
          "years",
          "entries",
        ],
        hidden: ["paid", "years"],
        arrangement: "rows",
      },
    },
    loading: { status: "loading" },
    error: { status: "error", message: ERROR_MESSAGE },
  } satisfies Scenarios<CategoryDetailViewProps>;
}

/** Groceries, the page Spending's "Open Groceries" opens. */
export const scenarios = scenariosFor("groceries");
