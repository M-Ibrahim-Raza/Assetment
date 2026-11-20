import { Columns2, Rows3 } from "lucide-react";
import type {
  CustomizeModel,
  CustomizeOption,
  CustomizeSection,
  ScreenKind,
} from "@proto/components/customize-sheet";
import {
  type PageWidth,
  WIDTH_ICONS,
  widthChoice,
} from "@proto/components/page-width";

// A category's page, as the person sets it up in Customize: which sections show, in what order,
// and each section's extras. One layout for every category, saved to the account, with a phone
// layout of its own once "Same layout on phone and computer" is off, as on Spending. Month by
// month always leads; its extras are switched like any section's. Its width on computers is a
// choice for the whole page, Balanced by default, as on Categories. Where the entries sit on a
// computer, Side column or Rows, is the entries' first option, as on Spending.

/** A part of the page that can be shown, hidden and moved. Month by month isn't one: it leads. */
export type DetailSectionKey =
  "why" | "places" | "repeats" | "unusual" | "entries" | "paid" | "years";

/** Month by month's extras. */
export interface MonthsSettings {
  usualRange: boolean;
  trend: boolean;
  totals: boolean;
  biggest: boolean;
  forecast: boolean;
  lastYear: boolean;
  notes: boolean;
}

export interface WhySettings {
  figures: boolean;
}

export interface PlacesSettings {
  shareBars: boolean;
  eachTime: boolean;
  tags: boolean;
  allPlaces: boolean;
}

export interface RepeatsSettings {
  due: boolean;
}

export interface EntriesSettings {
  monthTotals: boolean;
  sorting: boolean;
  compact: boolean;
}

/** Each part's extras. A section with none isn't here. */
export interface DetailSettings {
  months: MonthsSettings;
  why: WhySettings;
  places: PlacesSettings;
  repeats: RepeatsSettings;
  entries: EntriesSettings;
}

type SetKey = keyof DetailSettings;

/** One kind of screen's layout. Missing settings, or a missing setting, mean the default. */
export interface DetailScreenLayout {
  order: readonly DetailSectionKey[];
  hidden: readonly DetailSectionKey[];
  settings?: { [Key in SetKey]?: Partial<DetailSettings[Key]> };
  /** Computers and tablets only: phones always use the whole screen. Missing means balanced. */
  width?: PageWidth;
  /** Computers and tablets only: phones stack the cards. Missing means a side column. */
  arrangement?: Arrangement;
}

/**
 * Where the entries sit on a screen wide enough for two columns. Side column: beside a column of
 * cards that stays in view. Rows: on a row of their own.
 */
export type Arrangement = "side-column" | "rows";

export const DEFAULT_ARRANGEMENT: Arrangement = "side-column";

/** The page's width on tablets and computers. Balanced: a column up to 1,280 px, in the middle. */
export const DEFAULT_WIDTH: PageWidth = "balanced";

/** The layout saved to the account, with the phone's own once it has one. */
export interface DetailLayout extends DetailScreenLayout {
  phone?: DetailScreenLayout;
}

/** The part always at the top. */
export const LEAD: CustomizeSection & { key: "months" } = {
  key: "months",
  name: "Month by month",
  about: "Always at the top: the average, the chart and a picked month.",
};

export const SECTIONS: Readonly<Record<DetailSectionKey, CustomizeSection>> = {
  why: {
    name: "Why it changed",
    about:
      "Recent months against earlier ones: paying more each time, or going more often.",
  },
  places: {
    name: "Where it went",
    about: "Each place's share, how often, and what each time costs.",
  },
  repeats: {
    name: "Comes back every month",
    about:
      "Bills, fees and deliveries that repeat, and whether this month's is in.",
  },
  unusual: {
    name: "Out of the ordinary",
    about: "Entries far bigger than usual. It shows only when there are some.",
  },
  entries: {
    name: "Entries",
    about: "Every entry of these months, by month, with search.",
  },
  paid: {
    name: "Paid with",
    about: "Which accounts paid for it, and their share.",
  },
  years: {
    name: "By year",
    about:
      "Each year's total and a month on average, and this month a year ago.",
  },
};

/**
 * What everyone starts with: what most people use on, the rest off. Same month last year and notes
 * pay off only after a year, or add something to keep up; every place at once and compact rows
 * are for the few who want them.
 */
export const DEFAULT_SETTINGS: DetailSettings = {
  months: {
    usualRange: true,
    trend: true,
    totals: true,
    biggest: true,
    forecast: true,
    lastYear: false,
    notes: false,
  },
  why: { figures: true },
  places: { shareBars: true, eachTime: true, tags: true, allPlaces: false },
  repeats: { due: true },
  entries: { monthTotals: true, sorting: true, compact: false },
};

/** A setting in Customize: its name and the line under it. */
interface SettingInfo<Key> {
  key: Key;
  name: string;
  about: string;
}

/** Each part's settings in Customize, in the order they show under its Options. */
const SETTINGS: {
  [Key in SetKey]: readonly SettingInfo<keyof DetailSettings[Key]>[];
} = {
  months: [
    {
      key: "usualRange",
      name: "Usual range",
      about:
        "A band on the chart and a line under the average: what a usual month costs.",
    },
    {
      key: "trend",
      name: "Trend",
      about: "Rising, falling or steady, and by about how much a month.",
    },
    {
      key: "totals",
      name: "Totals on the bars",
      about: "Each month's total over its bar.",
    },
    {
      key: "biggest",
      name: "Biggest month",
      about: "A label over the biggest month.",
    },
    {
      key: "forecast",
      name: "This month's likely end",
      about:
        "A dashed box on this month's bar, up to where it's likely to end.",
    },
    {
      key: "lastYear",
      name: "Same month last year",
      about: "In a picked month, what the same month cost a year before.",
    },
    {
      key: "notes",
      name: "Notes on months",
      about:
        "A dot on months with a note, and a note to add or edit in a picked month.",
    },
  ],
  why: [
    {
      key: "figures",
      name: "Each time and times a month",
      about:
        "Under the answer: what each time cost, and how often, against before.",
    },
  ],
  places: [
    {
      key: "shareBars",
      name: "Share bars",
      about: "A bar under each place, as long as its share.",
    },
    {
      key: "eachTime",
      name: "Cost each time",
      about: "What each visit costs, and how that moved.",
    },
    {
      key: "tags",
      name: "New and Not since",
      about: "Tags on places that are new, or no longer used.",
    },
    {
      key: "allPlaces",
      name: "Every place",
      about: "Every place at once, not the top 6 and Show more.",
    },
  ],
  repeats: [
    {
      key: "due",
      name: "When it's due",
      about: "Whether this month's is in, due, or late.",
    },
  ],
  entries: [
    {
      key: "monthTotals",
      name: "Month totals",
      about: "What each month came to, on its heading.",
    },
    {
      key: "sorting",
      name: "Sorting",
      about: "Sort by date, amount, name or account.",
    },
    {
      key: "compact",
      name: "Compact rows",
      about: "One line per entry, without its account and day.",
    },
  ],
};

const KEYS: readonly DetailSectionKey[] = [
  "why",
  "places",
  "repeats",
  "unusual",
  "paid",
  "years",
  "entries",
];

/** What everyone sees before customizing: all but Paid with and By year, with the defaults. */
export const DEFAULT_LAYOUT: DetailScreenLayout = {
  order: KEYS,
  hidden: ["paid", "years"],
  settings: DEFAULT_SETTINGS,
};

/** A part's settings, with the default for any not saved. */
export function sectionSettings<Key extends SetKey>(
  layout: DetailScreenLayout,
  section: Key,
): DetailSettings[Key] {
  return { ...DEFAULT_SETTINGS[section], ...layout.settings?.[section] };
}

function allSettings(layout: DetailScreenLayout): DetailSettings {
  return {
    months: sectionSettings(layout, "months"),
    why: sectionSettings(layout, "why"),
    places: sectionSettings(layout, "places"),
    repeats: sectionSettings(layout, "repeats"),
    entries: sectionSettings(layout, "entries"),
  };
}

function setSetting<Key extends SetKey>(
  layout: DetailScreenLayout,
  section: Key,
  key: keyof DetailSettings[Key],
  on: boolean,
): DetailScreenLayout {
  return {
    ...layout,
    settings: {
      ...allSettings(layout),
      [section]: { ...sectionSettings(layout, section), [key]: on },
    },
  };
}

/** A part's settings as rows under its Options in Customize. */
export function optionsOf(
  layout: DetailScreenLayout,
  section: DetailSectionKey | null,
): CustomizeOption<DetailScreenLayout>[] | undefined {
  const key: SetKey | null =
    section === null
      ? "months"
      : section === "why" ||
          section === "places" ||
          section === "repeats" ||
          section === "entries"
        ? section
        : null;
  if (key === null) return undefined;
  return rowsOf(layout, key, sectionSettings(layout, key));
}

function rowsOf<Key extends SetKey>(
  layout: DetailScreenLayout,
  section: Key,
  values: { readonly [Name in keyof DetailSettings[Key]]: boolean },
): CustomizeOption<DetailScreenLayout>[] {
  return SETTINGS[section].map(({ key, name, about }) => ({
    name,
    about,
    on: values[key],
    switched: (on: boolean) => setSetting(layout, section, key, on),
  }));
}

/**
 * Every section once, in a known order, and every setting set. A section added since the layout
 * was saved goes after the one before it in the default order, shown or hidden as by default.
 */
function normalizeScreen(layout: DetailScreenLayout): DetailScreenLayout {
  const order = [...new Set(layout.order.filter((key) => KEYS.includes(key)))];
  const added: DetailSectionKey[] = [];
  for (const [index, key] of KEYS.entries()) {
    if (order.includes(key)) continue;
    const after = KEYS[index - 1];
    order.splice(after === undefined ? 0 : order.indexOf(after) + 1, 0, key);
    if (DEFAULT_LAYOUT.hidden.includes(key)) added.push(key);
  }
  return {
    order,
    hidden: [...layout.hidden, ...added].filter((key) => KEYS.includes(key)),
    settings: allSettings(layout),
  };
}

/**
 * The layout, and the phone's own if it has one, each made whole. Only the computers' has a width
 * and an arrangement.
 */
export function normalize(layout: DetailLayout): DetailLayout {
  const main = {
    ...normalizeScreen(layout),
    width: layout.width ?? DEFAULT_WIDTH,
    arrangement: layout.arrangement ?? DEFAULT_ARRANGEMENT,
  };
  return layout.phone === undefined
    ? main
    : { ...main, phone: normalizeScreen(layout.phone) };
}

export function isSplit(layout: DetailLayout): boolean {
  return layout.phone !== undefined;
}

/** A layout's sections and settings, without the phone's or the computers' own choices. */
function sectionsOf(layout: DetailScreenLayout): DetailScreenLayout {
  return {
    order: layout.order,
    hidden: layout.hidden,
    ...(layout.settings === undefined ? {} : { settings: layout.settings }),
  };
}

/** The choices only computers and tablets have: the width and where the entries sit. */
function computersOf(
  layout: DetailScreenLayout,
): Pick<DetailScreenLayout, "width" | "arrangement"> {
  return {
    ...(layout.width === undefined ? {} : { width: layout.width }),
    ...(layout.arrangement === undefined
      ? {}
      : { arrangement: layout.arrangement }),
  };
}

/** The layout one kind of screen shows: the phone's own if it has one, else the shared one. */
export function screenLayout(
  layout: DetailLayout,
  screen: ScreenKind,
): DetailScreenLayout {
  const main: DetailScreenLayout = {
    ...sectionsOf(layout),
    ...computersOf(layout),
  };
  return screen === "phone" ? (layout.phone ?? main) : main;
}

/** The layout with one kind of screen's changed. While they're the same, both change. */
export function withScreen(
  layout: DetailLayout,
  screen: ScreenKind,
  next: DetailScreenLayout,
): DetailLayout {
  if (layout.phone === undefined) return screenLayout(next, "wide");
  return screen === "phone"
    ? { ...layout, phone: sectionsOf(next) }
    : { ...screenLayout(next, "wide"), phone: layout.phone };
}

/** Turns "Same layout on phone and computer" off, giving phones a copy, or on, keeping `keep`'s. */
export function setSame(
  layout: DetailLayout,
  same: boolean,
  keep: ScreenKind,
): DetailLayout {
  // Computers keep their width and arrangement, whichever tab's sections are kept. Phones have
  // neither.
  if (same) {
    return {
      ...sectionsOf(screenLayout(layout, keep)),
      ...computersOf(layout),
    };
  }
  return layout.phone === undefined
    ? { ...layout, phone: sectionsOf(layout) }
    : layout;
}

export function isShown(
  layout: DetailScreenLayout,
  key: DetailSectionKey,
): boolean {
  return !layout.hidden.includes(key);
}

export function toggle(
  layout: DetailScreenLayout,
  key: DetailSectionKey,
): DetailScreenLayout {
  return {
    ...layout,
    hidden: isShown(layout, key)
      ? [...layout.hidden, key]
      : layout.hidden.filter((hidden) => hidden !== key),
  };
}

/** Moves a section one place up (-1) or down (1). At either end it stays. */
export function move(
  layout: DetailScreenLayout,
  key: DetailSectionKey,
  by: -1 | 1,
): DetailScreenLayout {
  const from = layout.order.indexOf(key);
  const to = from + by;
  if (from === -1 || to < 0 || to >= layout.order.length) return layout;
  const order = [...layout.order];
  order.splice(from, 1);
  order.splice(to, 0, key);
  return { ...layout, order };
}

/** Whether a layout is the default: its order, what's hidden and every setting. */
export function isDefault(layout: DetailScreenLayout): boolean {
  const normal = normalizeScreen(layout);
  // Settings are rebuilt from the defaults, key by key, so the same values read the same.
  return (
    (layout.width ?? DEFAULT_WIDTH) === DEFAULT_WIDTH &&
    (layout.arrangement ?? DEFAULT_ARRANGEMENT) === DEFAULT_ARRANGEMENT &&
    normal.order.join() === KEYS.join() &&
    normal.hidden.toSorted().join() ===
      DEFAULT_LAYOUT.hidden.toSorted().join() &&
    JSON.stringify(allSettings(normal)) === JSON.stringify(DEFAULT_SETTINGS)
  );
}

/**
 * Where the entries sit on a computer: beside a side column, or on a row of their own. It's a
 * choice of the screen's, not the entries' own setting, so it's saved with the computers' layout.
 */
function arrangementOption(
  layout: DetailScreenLayout,
): CustomizeOption<DetailScreenLayout> {
  const rows = (layout.arrangement ?? DEFAULT_ARRANGEMENT) === "rows";
  return {
    name: "Layout on computers",
    about: rows
      ? "Entries take a row of their own, under the other sections."
      : "Entries sit beside a column of sections that stays in view.",
    ways: ["Side column", "Rows"],
    on: rows,
    switched: (on) => ({ ...layout, arrangement: on ? "rows" : "side-column" }),
    said: (on) => `${on ? "rows" : "side column"} layout`,
  };
}

/** What Customize needs to know about a category's page. */
export const CUSTOMIZE: CustomizeModel<
  DetailSectionKey,
  DetailScreenLayout,
  DetailLayout
> = {
  title: "Customize this page",
  lead: LEAD,
  section: (key) => SECTIONS[key],
  // The entries' start with the layout on computers, where there is one: phones stack the cards.
  options: (layout, key, computers) =>
    key === "entries" && computers
      ? [arrangementOption(layout), ...(optionsOf(layout, key) ?? [])]
      : optionsOf(layout, key),
  pageOptions: (layout, computers) =>
    computers ? [widthChoice(layout, DEFAULT_WIDTH)] : [],
  defaultLayout: DEFAULT_LAYOUT,
  isDefault,
  toggle,
  move,
  isSplit,
  screenLayout,
  withScreen,
  setSame,
  wayIcons: { ...WIDTH_ICONS, "Side column": Columns2, Rows: Rows3 },
};
