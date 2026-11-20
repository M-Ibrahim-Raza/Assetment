"use client";

import { ChartPie, Columns2, List, Rows3 } from "lucide-react";
import {
  CustomizeButton as SharedCustomizeButton,
  type CustomizeModel,
  type CustomizeOption,
  CustomizeSheet as SharedCustomizeSheet,
} from "@proto/components/customize-sheet";
import {
  DEFAULT_ARRANGEMENT,
  DEFAULT_LAYOUT,
  isDefault,
  isSplit,
  move,
  type ScreenKind,
  type ScreenLayout,
  screenLayout,
  type SectionKey,
  SECTIONS,
  type SectionSettings,
  sectionSettings,
  setSame,
  type SetKey,
  setSetting,
  SETTINGS,
  type SpendingLayout,
  toggle,
  withScreen,
} from "./layout";

// Spending's Customize: the shared sheet, given Spending's sections, their settings and how its
// layout changes. The sheet's look and behaviour live in the shared component.

export {
  SectionCustomizeButton,
  SHEET,
  SHEET_TITLE,
} from "@proto/components/customize-sheet";

/** The header button that opens Customize. The word shows from tablet width; phones get the icon. */
export function CustomizeButton({ onClick }: { onClick: () => void }) {
  return <SharedCustomizeButton label="Customize Spending" onClick={onClick} />;
}

type Option = CustomizeOption<ScreenLayout>;

/**
 * A section's settings, given their values, as rows under its Options. One that only works with or
 * without another isn't shown otherwise: the list's while the donut chart is on, and the chart's
 * while it's off.
 */
function options<Key extends SetKey>(
  layout: ScreenLayout,
  section: Key,
  values: { readonly [Name in keyof SectionSettings[Key]]: boolean },
): Option[] {
  return SETTINGS[section]
    .filter(
      ({ hiddenBy, shownWith }) =>
        (hiddenBy === undefined || !values[hiddenBy]) &&
        (shownWith === undefined || values[shownWith]),
    )
    .map(({ key, name, about, ways }) => ({
      name,
      ...(about === undefined ? {} : { about }),
      ...(ways === undefined ? {} : { ways }),
      on: values[key],
      switched: (on) => setSetting(layout, section, key, on),
    }));
}

/**
 * Where the entries sit on a computer: beside a side column, or on a row of their own. It's a
 * choice of the screen's, not the entries' own setting, so it's saved with the computers' layout.
 */
function arrangementOption(layout: ScreenLayout): Option {
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

/**
 * The rows under a section's Options. The entries' start with the layout on computers, where
 * there is one: phones stack the sections.
 */
function optionsOf(
  layout: ScreenLayout,
  key: SectionKey,
  computers: boolean,
): Option[] {
  const own = options(layout, key, sectionSettings(layout, key));
  return key === "entries" && computers
    ? [arrangementOption(layout), ...own]
    : own;
}

const MODEL: CustomizeModel<SectionKey, ScreenLayout, SpendingLayout> = {
  title: "Customize Spending",
  lead: {
    key: "summary",
    name: "Total and answer",
    about: "Always at the top.",
  },
  section: (key) => SECTIONS[key],
  options: (layout, key, computers) =>
    key === null ? undefined : optionsOf(layout, key, computers),
  defaultLayout: DEFAULT_LAYOUT,
  isDefault,
  toggle,
  move,
  isSplit,
  screenLayout,
  withScreen,
  setSame,
  wayIcons: {
    List,
    "Donut chart": ChartPie,
    "Side column": Columns2,
    Rows: Rows3,
  },
};

/**
 * Which sections Spending shows, and in what order, with each section's Options: the shared
 * Customize sheet with Spending's model.
 */
export function CustomizeSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: SpendingLayout;
  onChange: (next: SpendingLayout) => void;
  saving: boolean;
  focus: SectionKey | null;
  screen: ScreenKind;
}) {
  return <SharedCustomizeSheet model={MODEL} {...props} />;
}
