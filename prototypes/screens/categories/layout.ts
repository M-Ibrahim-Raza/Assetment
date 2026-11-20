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

// The Categories page, as the person sets it up in Customize: each block's extras. Both blocks
// always show, Spending by month first, so Customize is mostly their Options. Saved to the account,
// with a phone layout of its own once "Same layout on phone and computer" is off, as on Spending.

/** The one block that's listed under the top one. It can't be hidden or moved. */
export type CategoriesSectionKey = "list";

/** Spending by month's extras. */
export interface TopSettings {
  summary: boolean;
  figures: boolean;
  totals: boolean;
  biggest: boolean;
  shares: boolean;
  usualRange: boolean;
  likelyEnd: boolean;
}

/** Every category's extras. */
export interface ListSettings {
  bars: boolean;
  total: boolean;
  howOften: boolean;
  sorting: boolean;
  nothingSpent: boolean;
  share: boolean;
  change: boolean;
  compact: boolean;
}

export interface CategoriesSettings {
  top: TopSettings;
  list: ListSettings;
}

type SetKey = keyof CategoriesSettings;

/** The page's width on tablets and computers. Balanced: a column up to 1,280 px, in the middle. */
export const DEFAULT_WIDTH: PageWidth = "balanced";

/** One kind of screen's layout. Missing settings, or a missing setting, mean the default. */
export interface CategoriesScreenLayout {
  order: readonly CategoriesSectionKey[];
  hidden: readonly CategoriesSectionKey[];
  settings?: { [Key in SetKey]?: Partial<CategoriesSettings[Key]> };
  /** Computers and tablets only: phones always use the whole screen. Missing means full. */
  width?: PageWidth;
}

/** The layout saved to the account, with the phone's own once it has one. */
export interface CategoriesLayout extends CategoriesScreenLayout {
  phone?: CategoriesScreenLayout;
}

const LEAD: CustomizeSection & { key: "top" } = {
  key: "top",
  name: "Spending by month",
  about: "Always at the top: the average, the summary and the chart.",
};

const SECTIONS: Readonly<Record<CategoriesSectionKey, CustomizeSection>> = {
  list: {
    name: "Every category",
    about: "Each category's average, its months and how often. Always shown.",
    locked: true,
  },
};

/**
 * What everyone starts with: what most people use on, the rest off. The usual range and the
 * likely end belong to a category's page and Spending's pace chart; share, the change against usual
 * and compact rows are for the few who want them.
 */
export const DEFAULT_SETTINGS: CategoriesSettings = {
  top: {
    summary: true,
    figures: true,
    totals: true,
    biggest: true,
    shares: true,
    usualRange: false,
    likelyEnd: false,
  },
  list: {
    bars: true,
    total: true,
    howOften: true,
    sorting: true,
    nothingSpent: true,
    share: false,
    change: false,
    compact: false,
  },
};

/** A setting in Customize: its name and the line under it. */
interface SettingInfo<Key> {
  key: Key;
  name: string;
  about: string;
}

const SETTINGS: {
  [Key in SetKey]: readonly SettingInfo<keyof CategoriesSettings[Key]>[];
} = {
  top: [
    {
      key: "summary",
      name: "Summary",
      about:
        "One sentence: which categories take most, and what's up this month.",
    },
    {
      key: "figures",
      name: "Figures",
      about: "What the months came to, and this month so far.",
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
      key: "shares",
      name: "Share in a picked month",
      about: "Each category's part of a picked month, like 19%.",
    },
    {
      key: "usualRange",
      name: "Usual range",
      about: "A band on the chart: what a usual month comes to.",
    },
    {
      key: "likelyEnd",
      name: "This month's likely end",
      about:
        "A dashed box on this month's bar, up to where it's likely to end.",
    },
  ],
  list: [
    {
      key: "bars",
      name: "A bar for each month",
      about: "Small bars in each row, against its own busiest month.",
    },
    {
      key: "total",
      name: "Total column",
      about: "What each came to over the months, on tablets and computers.",
    },
    {
      key: "howOften",
      name: "How often",
      about: 'Under each name: "Spent every month", or in how many.',
    },
    {
      key: "sorting",
      name: "Sorting",
      about: "Sort by total, average, change or name.",
    },
    {
      key: "nothingSpent",
      name: "Nothing spent",
      about:
        "A closed row at the end for categories with nothing in these months.",
    },
    {
      key: "share",
      name: "Share of spending",
      about: "Each category's part of all spending, like 19%.",
    },
    {
      key: "change",
      name: "This month against usual",
      about: 'Under each name: "+Rs 3,100 by now", against a usual month.',
    },
    {
      key: "compact",
      name: "Compact rows",
      about: "One line per category: its name and average.",
    },
  ],
};

const KEYS: readonly CategoriesSectionKey[] = ["list"];

export const DEFAULT_LAYOUT: CategoriesScreenLayout = {
  order: KEYS,
  hidden: [],
  settings: DEFAULT_SETTINGS,
};

/** A block's settings, with the default for any not saved. */
export function sectionSettings<Key extends SetKey>(
  layout: CategoriesScreenLayout,
  section: Key,
): CategoriesSettings[Key] {
  return { ...DEFAULT_SETTINGS[section], ...layout.settings?.[section] };
}

function allSettings(layout: CategoriesScreenLayout): CategoriesSettings {
  return {
    top: sectionSettings(layout, "top"),
    list: sectionSettings(layout, "list"),
  };
}

function rowsOf<Key extends SetKey>(
  layout: CategoriesScreenLayout,
  section: Key,
  values: { readonly [Name in keyof CategoriesSettings[Key]]: boolean },
): CustomizeOption<CategoriesScreenLayout>[] {
  return SETTINGS[section].map(({ key, name, about }) => ({
    name,
    about,
    on: values[key],
    switched: (on: boolean) => ({
      ...layout,
      settings: {
        ...allSettings(layout),
        [section]: { ...sectionSettings(layout, section), [key]: on },
      },
    }),
  }));
}

/** Both blocks, in their only order, and every setting set. */
function normalizeScreen(
  layout: CategoriesScreenLayout,
): CategoriesScreenLayout {
  return { order: KEYS, hidden: [], settings: allSettings(layout) };
}

/** The layout, and the phone's own if it has one. Only the computers' has a width. */
export function normalize(layout: CategoriesLayout): CategoriesLayout {
  const main = {
    ...normalizeScreen(layout),
    width: layout.width ?? DEFAULT_WIDTH,
  };
  return layout.phone === undefined
    ? main
    : { ...main, phone: normalizeScreen(layout.phone) };
}

/** A layout's blocks and their settings, without the phone's or the computers' width. */
function sectionsOf(layout: CategoriesScreenLayout): CategoriesScreenLayout {
  return {
    order: layout.order,
    hidden: layout.hidden,
    ...(layout.settings === undefined ? {} : { settings: layout.settings }),
  };
}

/** The layout one kind of screen shows: the phone's own if it has one, else the shared one. */
export function screenLayout(
  layout: CategoriesLayout,
  screen: ScreenKind,
): CategoriesScreenLayout {
  const main: CategoriesScreenLayout = {
    ...sectionsOf(layout),
    ...(layout.width === undefined ? {} : { width: layout.width }),
  };
  return screen === "phone" ? (layout.phone ?? main) : main;
}

/** What Customize needs to know about the Categories page. */
export const CUSTOMIZE: CustomizeModel<
  CategoriesSectionKey,
  CategoriesScreenLayout,
  CategoriesLayout
> = {
  title: "Customize Categories",
  lead: LEAD,
  section: (key) => SECTIONS[key],
  options: (layout, key) =>
    key === null
      ? rowsOf(layout, "top", sectionSettings(layout, "top"))
      : rowsOf(layout, "list", sectionSettings(layout, "list")),
  pageOptions: (layout, computers) =>
    computers ? [widthChoice(layout, DEFAULT_WIDTH)] : [],
  defaultLayout: DEFAULT_LAYOUT,
  isDefault: (layout) =>
    (layout.width ?? DEFAULT_WIDTH) === DEFAULT_WIDTH &&
    JSON.stringify(allSettings(normalizeScreen(layout))) ===
      JSON.stringify(DEFAULT_SETTINGS),
  // Every category can't be hidden or moved: it's the page.
  toggle: (layout) => layout,
  move: (layout) => layout,
  isSplit: (layout) => layout.phone !== undefined,
  screenLayout,
  withScreen: (layout, screen, next) => {
    if (layout.phone === undefined) return screenLayout(next, "wide");
    return screen === "phone"
      ? { ...layout, phone: sectionsOf(next) }
      : { ...screenLayout(next, "wide"), phone: layout.phone };
  },
  setSame: (layout, same, keep) => {
    // Computers keep their width, whichever tab's blocks are kept. Phones have none.
    if (same) {
      const kept = sectionsOf(screenLayout(layout, keep));
      return layout.width === undefined
        ? kept
        : { ...kept, width: layout.width };
    }
    return layout.phone === undefined
      ? { ...layout, phone: sectionsOf(layout) }
      : layout;
  },
  wayIcons: WIDTH_ICONS,
};
