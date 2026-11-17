/** A part of Spending that the person can show, hide and move. The total and answer always lead. */
export type SectionKey =
  "pace" | "categories" | "accounts" | "calendar" | "entries";

/** The pace chart's own settings, switched in Customize under its Options. */
export interface PaceSettings {
  /** The current month's dashed line to its end, and "If the rest of November goes like…". */
  ahead: boolean;
  /** "A day so far", under the chart, against the comparison. */
  dailyAverage: boolean;
  /** A thin bar for each day, that day's spending, in a strip under the chart. */
  dailyBars: boolean;
  /** A band from the lowest to the highest of the 3 months before, day by day. */
  usualRange: boolean;
}

/** By category's and By account's own settings, switched in Customize under their Options. */
export interface BreakdownSettings {
  /** A donut chart of how the total splits, in place of the list. */
  chart: boolean;
  /** The list's: each row's share of spending, "31%". */
  share: boolean;
  /** The list's: the rows behind most of the change stay in view, tagged "Biggest rise". */
  movers: boolean;
  /** The list's: "Sort: Amount", with Amount, Change, Name and Entries, either way. */
  sorting: boolean;
  /** The chart's: split by how many entries each has, not how much was spent. */
  byEntries: boolean;
  /** The chart's: each label's amount beside its percent, "23% Rs 48,600". */
  amounts: boolean;
  /** The chart's: what each part rose or fell by against the comparison, "▲ Rs 6,200". */
  change: boolean;
  /** The chart's: the line above it that names the biggest. */
  summary: boolean;
}

/** The calendar's own settings, switched in Customize under its Options. */
export interface CalendarSettings {
  /** Each day's amount in its cell, from tablet width. Phones have only the shading. */
  amounts: boolean;
  /** A ring on days with nothing spent, and how many there were. */
  noSpend: boolean;
  /** Each week's total: beside its row from tablet width, in a list under it on phones. */
  weekTotals: boolean;
}

/** The entries list's own settings, switched in Customize under its Options. */
export interface EntriesSettings {
  /** Each day heading's total, "Yesterday · Rs 17,760". */
  dayTotals: boolean;
  /** In date order, what was spent by each day on its heading, "Rs 207,470 by then". */
  runningTotal: boolean;
  /** One line per entry, without its category and account. */
  compact: boolean;
  /** The sort menu: date, amount, name, category or account, either way. */
  sorting: boolean;
}

/** Each section's own settings. A section with none isn't here. */
export interface SectionSettings {
  pace: PaceSettings;
  categories: BreakdownSettings;
  accounts: BreakdownSettings;
  calendar: CalendarSettings;
  entries: EntriesSettings;
}

/** A section that has settings. */
export type SetKey = keyof SectionSettings;

/** Which sections show, in what order, and each section's own settings, on one kind of screen. */
export interface ScreenLayout {
  order: readonly SectionKey[];
  hidden: readonly SectionKey[];
  /** Missing, or missing a setting, means the default. */
  settings?: { [Key in SetKey]?: Partial<SectionSettings[Key]> };
}

/**
 * The layout saved to the account, the same on every device. Phones use it too, unless the person
 * turned off "Same layout on phone and computer": then `phone` holds the phone's own, and the
 * rest is for tablets and computers.
 */
export interface SpendingLayout extends ScreenLayout {
  phone?: ScreenLayout;
}

/**
 * A kind of screen with its own layout: a phone, under 48rem, where the app has its tab bar, or a
 * tablet or computer, where it has its sidebar.
 */
export type ScreenKind = "phone" | "wide";

/** "Phone", "Computer". Tablets get the computer layout, as they get its sidebar. */
export const SCREEN_NAMES: Readonly<Record<ScreenKind, string>> = {
  phone: "Phone",
  wide: "Computer",
};

interface Section {
  name: string;
  /** One line on what it shows, under its name in Customize. */
  about: string;
  /** Can't be hidden: Home's "See all entries" lands on it. */
  locked?: boolean;
}

export const SECTIONS: Readonly<Record<SectionKey, Section>> = {
  pace: {
    name: "Pace chart",
    about:
      "Your running total, day by day, against the month you compare with.",
  },
  categories: {
    name: "By category",
    about: "Where the money went, against the month you compare with.",
  },
  accounts: {
    name: "By account",
    about:
      "Which accounts it was paid from, against the month you compare with.",
  },
  calendar: {
    name: "Calendar",
    about:
      "Each day shaded by what you spent. Pick a day, or a few, to see only those.",
  },
  entries: {
    name: "Entries",
    about: "Every expense, with search. Always shown.",
    locked: true,
  },
};

/** The donut chart's settings: by amount, percents only, no change, and the line above it. */
const CHART_DEFAULTS = {
  byEntries: false,
  amounts: false,
  change: false,
  summary: true,
} as const;

/**
 * What everyone starts with: what most people want on, the rest off. By category's list settings
 * are all on, and both breakdowns start as the list: the donut chart is an extra. The pace chart
 * shows where the month may end; the average a day, the daily bars and the usual range are for
 * the few who want more. By account shows shares and sorting, but tags no movers: the headline
 * names categories, not accounts. The calendar shows each day's amount; no-spend days and week
 * totals are extras. Entries show day totals and sorting, in full rows.
 */
export const DEFAULT_SETTINGS: SectionSettings = {
  pace: {
    ahead: true,
    dailyAverage: false,
    dailyBars: false,
    usualRange: false,
  },
  categories: {
    chart: false,
    share: true,
    movers: true,
    sorting: true,
    ...CHART_DEFAULTS,
  },
  accounts: {
    chart: false,
    share: true,
    movers: false,
    sorting: true,
    ...CHART_DEFAULTS,
  },
  calendar: { amounts: true, noSpend: false, weekTotals: false },
  entries: {
    dayTotals: true,
    runningTotal: false,
    compact: false,
    sorting: true,
  },
};

/** A setting in Customize: its name and the line under it, or its two ways. */
interface SettingInfo<Key> {
  key: Key;
  name: string;
  /** The line under a switch. A choice has none: its two ways say it. */
  about?: string;
  /**
   * A choice between two equal ways, off then on, such as List and Donut chart, as two buttons
   * apart from the switches, rather than a switch among them.
   */
  ways?: readonly [string, string];
  /** Shown only while this other setting is off, as the list's are while the chart is on. */
  hiddenBy?: Key;
  /** Shown only while this other setting is on, as the chart's are. */
  shownWith?: Key;
}

/** Each section's settings in Customize, in the order they show under its Options. */
export const SETTINGS: {
  [Key in SetKey]: readonly SettingInfo<keyof SectionSettings[Key]>[];
} = {
  pace: [
    {
      key: "ahead",
      name: "Where the month may end",
      about: "A dashed line to the month's end, if the rest goes like before.",
    },
    {
      key: "dailyAverage",
      name: "Average a day",
      about: "What you spend a day, against the month you compare with.",
    },
    {
      key: "dailyBars",
      name: "Daily bars",
      about:
        "A thin bar for each day under the chart: what you spent that day.",
    },
    {
      key: "usualRange",
      name: "Usual range",
      about: "A band from your lowest to your highest of the 3 months before.",
    },
  ],
  categories: [
    {
      key: "chart",
      name: "Show as",
      ways: ["List", "Donut chart"],
    },
    {
      key: "share",
      name: "Share of spending",
      about: "Each category's part of the total, like 31%.",
      hiddenBy: "chart",
    },
    {
      key: "movers",
      name: "Keep the biggest changes in view",
      about:
        "The categories behind most of the change stay in the list, tagged.",
      hiddenBy: "chart",
    },
    {
      key: "sorting",
      name: "Sorting",
      about: "Sort by amount, change, name or entries.",
      hiddenBy: "chart",
    },
    {
      key: "byEntries",
      name: "Split by",
      ways: ["Amount", "Entries"],
      shownWith: "chart",
    },
    {
      key: "amounts",
      name: "Amounts on labels",
      about: "Each part's amount beside its percent: Rs 48,600, or 12 entries.",
      shownWith: "chart",
    },
    {
      key: "change",
      name: "Change",
      about:
        "What each part rose or fell by, against the month you compare with.",
      shownWith: "chart",
    },
    {
      key: "summary",
      name: "Summary line",
      about: "One line above the chart that names the biggest.",
      shownWith: "chart",
    },
  ],
  accounts: [
    {
      key: "chart",
      name: "Show as",
      ways: ["List", "Donut chart"],
    },
    {
      key: "share",
      name: "Share of spending",
      about: "Each account's part of the total, like 33%.",
      hiddenBy: "chart",
    },
    {
      key: "movers",
      name: "Keep the biggest changes in view",
      about: "The accounts behind most of the change stay in the list, tagged.",
      hiddenBy: "chart",
    },
    {
      key: "sorting",
      name: "Sorting",
      about: "Sort by amount, change, name or entries.",
      hiddenBy: "chart",
    },
    {
      key: "byEntries",
      name: "Split by",
      ways: ["Amount", "Entries"],
      shownWith: "chart",
    },
    {
      key: "amounts",
      name: "Amounts on labels",
      about: "Each part's amount beside its percent: Rs 48,600, or 12 entries.",
      shownWith: "chart",
    },
    {
      key: "change",
      name: "Change",
      about:
        "What each part rose or fell by, against the month you compare with.",
      shownWith: "chart",
    },
    {
      key: "summary",
      name: "Summary line",
      about: "One line above the chart that names the biggest.",
      shownWith: "chart",
    },
  ],
  calendar: [
    {
      key: "amounts",
      name: "Amounts on each day",
      about: "What you spent, inside each day, on wider screens.",
    },
    {
      key: "noSpend",
      name: "No-spend days",
      about: "A ring on days you spent nothing, and how many there were.",
    },
    {
      key: "weekTotals",
      name: "Week totals",
      about: "What you spent each week, beside it or under the calendar.",
    },
  ],
  entries: [
    {
      key: "dayTotals",
      name: "Day totals",
      about: "What you spent each day, on its heading.",
    },
    {
      key: "runningTotal",
      name: "Running total",
      about: "What you'd spent by each day, on its heading, in date order.",
    },
    {
      key: "compact",
      name: "Compact rows",
      about: "One line per entry, without its category and account.",
    },
    {
      key: "sorting",
      name: "Sorting",
      about: "Sort by date, amount, name, category or account.",
    },
  ],
};

/** A section's settings, with the default for any not saved. */
export function sectionSettings<Key extends SetKey>(
  layout: ScreenLayout,
  section: Key,
): SectionSettings[Key] {
  return { ...DEFAULT_SETTINGS[section], ...layout.settings?.[section] };
}

/** Every section's settings, with the defaults for any not saved. */
function allSettings(layout: ScreenLayout): SectionSettings {
  return {
    pace: sectionSettings(layout, "pace"),
    categories: sectionSettings(layout, "categories"),
    accounts: sectionSettings(layout, "accounts"),
    calendar: sectionSettings(layout, "calendar"),
    entries: sectionSettings(layout, "entries"),
  };
}

/** Turns one of a section's settings on or off. */
export function setSetting<Key extends SetKey>(
  layout: ScreenLayout,
  section: Key,
  key: keyof SectionSettings[Key],
  on: boolean,
): ScreenLayout {
  return {
    ...layout,
    settings: {
      ...allSettings(layout),
      [section]: { ...sectionSettings(layout, section), [key]: on },
    },
  };
}

const KEYS: readonly SectionKey[] = [
  "pace",
  "categories",
  "accounts",
  "calendar",
  "entries",
];

/** What everyone sees before customizing: all but the pace chart, with the default settings. */
export const DEFAULT_LAYOUT: ScreenLayout = {
  order: KEYS,
  hidden: ["pace"],
  settings: DEFAULT_SETTINGS,
};

/** Every section once, in a known order, the locked ones never hidden, and every setting set. */
function normalizeScreen(layout: ScreenLayout): ScreenLayout {
  const order = [...new Set(layout.order.filter((key) => KEYS.includes(key)))];
  // A section added since the layout was saved goes after the one before it in the default order.
  for (const [index, key] of KEYS.entries()) {
    if (order.includes(key)) continue;
    const after = KEYS[index - 1];
    order.splice(after === undefined ? 0 : order.indexOf(after) + 1, 0, key);
  }
  return {
    order,
    hidden: layout.hidden.filter(
      (key) => KEYS.includes(key) && SECTIONS[key].locked !== true,
    ),
    settings: allSettings(layout),
  };
}

/** The layout, and the phone's own if it has one, each made whole by `normalizeScreen`. */
export function normalize(layout: SpendingLayout): SpendingLayout {
  const main = normalizeScreen(layout);
  return layout.phone === undefined
    ? main
    : { ...main, phone: normalizeScreen(layout.phone) };
}

/** Whether phones have their own layout. */
export function isSplit(layout: SpendingLayout): boolean {
  return layout.phone !== undefined;
}

/** The layout one kind of screen shows: the phone's own if it has one, else the shared one. */
export function screenLayout(
  layout: SpendingLayout,
  screen: ScreenKind,
): ScreenLayout {
  const main: ScreenLayout = {
    order: layout.order,
    hidden: layout.hidden,
    ...(layout.settings === undefined ? {} : { settings: layout.settings }),
  };
  return screen === "phone" ? (layout.phone ?? main) : main;
}

/** The layout with one kind of screen's changed. While they're the same, both change. */
export function withScreen(
  layout: SpendingLayout,
  screen: ScreenKind,
  next: ScreenLayout,
): SpendingLayout {
  if (layout.phone === undefined) return screenLayout(next, "wide");
  return screen === "phone"
    ? { ...layout, phone: screenLayout(next, "wide") }
    : { ...screenLayout(next, "wide"), phone: layout.phone };
}

/**
 * Turns "Same layout on phone and computer" off, giving phones a copy of the shared layout to
 * change, or back on, keeping `keep`'s layout for both.
 */
export function setSame(
  layout: SpendingLayout,
  same: boolean,
  keep: ScreenKind,
): SpendingLayout {
  if (same) return screenLayout(layout, keep);
  return layout.phone === undefined
    ? { ...layout, phone: screenLayout(layout, "wide") }
    : layout;
}

export function isShown(layout: ScreenLayout, key: SectionKey): boolean {
  return !layout.hidden.includes(key);
}

/** Shows a hidden section, or hides a shown one. Locked sections stay shown. */
export function toggle(layout: ScreenLayout, key: SectionKey): ScreenLayout {
  if (SECTIONS[key].locked === true) return layout;
  return {
    ...layout,
    hidden: isShown(layout, key)
      ? [...layout.hidden, key]
      : layout.hidden.filter((hidden) => hidden !== key),
  };
}

/** Moves a section one place up (-1) or down (1). At either end it stays. */
export function move(
  layout: ScreenLayout,
  key: SectionKey,
  by: -1 | 1,
): ScreenLayout {
  const from = layout.order.indexOf(key);
  const to = from + by;
  if (from === -1 || to < 0 || to >= layout.order.length) return layout;
  const order = [...layout.order];
  order.splice(from, 1);
  order.splice(to, 0, key);
  return { ...layout, order };
}

/** Whether a section's settings are all the default. */
function sameAsDefault<Key extends SetKey>(
  section: Key,
  values: SectionSettings[Key],
): boolean {
  return SETTINGS[section].every(
    ({ key }) => values[key] === DEFAULT_SETTINGS[section][key],
  );
}

export function isDefault(layout: ScreenLayout): boolean {
  const normal = normalize(layout);
  const settings = allSettings(normal);
  return (
    normal.order.join() === DEFAULT_LAYOUT.order.join() &&
    normal.hidden.toSorted().join() ===
      DEFAULT_LAYOUT.hidden.toSorted().join() &&
    sameAsDefault("pace", settings.pace) &&
    sameAsDefault("categories", settings.categories) &&
    sameAsDefault("accounts", settings.accounts) &&
    sameAsDefault("calendar", settings.calendar) &&
    sameAsDefault("entries", settings.entries)
  );
}
