"use client";

import {
  ArrowDown,
  ArrowUp,
  ChartPie,
  ChevronDown,
  Columns2,
  List,
  Lock,
  type LucideIcon,
  Monitor,
  Rows3,
  SlidersHorizontal,
  Smartphone,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { DISPLAY } from "@proto/screens/dashboard/parts";
import {
  DEFAULT_ARRANGEMENT,
  DEFAULT_LAYOUT,
  isDefault,
  isShown,
  isSplit,
  move,
  SCREEN_NAMES,
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

/** A sheet from the bottom on phones, a box in the middle on wider screens. */
export const SHEET =
  "max-h-[90svh] gap-4 p-5 max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-w-none max-sm:translate-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-lg";

/** The sheet's title, in the display face. */
export const SHEET_TITLE = cn(
  DISPLAY,
  "text-2xl font-extrabold tracking-tight",
);

/** The header button that opens Customize. The word shows from tablet width; phones get the icon. */
export function CustomizeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="lg"
      aria-label="Customize Spending"
      aria-haspopup="dialog"
      onClick={onClick}
      className="h-11 min-w-11 px-2.5 sm:px-3"
    >
      <SlidersHorizontal className="size-5" />
      <span className="hidden sm:inline">Customize</span>
    </Button>
  );
}

/** One of a section's settings, as a row under its Options. */
interface Option {
  name: string;
  about?: string;
  /** A choice's two ways, off then on. Missing for a switch. */
  ways?: readonly [string, string];
  on: boolean;
  /** The screen's layout with this setting switched. */
  switched: (on: boolean) => ScreenLayout;
  /** What the change says after the section's name, if not the setting's name and way. */
  said?: (on: boolean) => string;
}

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

/**
 * A section's own way into Customize, at the right of its heading. It has the header button's
 * icon, so it reads as the same action, and opens the same sheet at this section.
 */
export function SectionCustomizeButton({
  name,
  onClick,
  className,
}: {
  /** The section's name, for "Customize By category". */
  name: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label={`Customize ${name}`}
      aria-haspopup="dialog"
      onClick={onClick}
      className={cn("size-11 shrink-0 text-muted-foreground", className)}
    >
      <SlidersHorizontal className="size-5" />
    </Button>
  );
}

/** The id of a section's Options button, where the sheet starts when opened from that section. */
function optionsButtonId(key: SectionKey): string {
  return `customize-${key}-options`;
}

interface CustomizeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: SpendingLayout;
  /** Applies a change at once, and saves it to the account. */
  onChange: (next: SpendingLayout) => void;
  /** True while the last change is being saved. */
  saving: boolean;
  /** The section it was opened from: it starts there, with its Options open. Null for the top. */
  focus: SectionKey | null;
  /** The kind of screen it's open on. With a layout for each, it starts on this one's. */
  screen: ScreenKind;
}

/**
 * Which sections Spending shows, and in what order: a switch and up and down buttons for each, no
 * dragging, so it works by touch and keyboard alike. Each section also has Options, its own
 * settings, closed until opened. Opened from a section's own button, it starts at that section
 * with its Options open. Each change shows at once behind the sheet. A sheet from the bottom on
 * phones, a box in the middle on wider screens.
 *
 * "Same layout on phone and computer" is on to start with. Turned off, phones get a copy of the
 * layout to change on its own, and tabs at the top pick which one is being changed: Phone, or
 * Computer, which tablets use too. It opens on the tab for the screen it's on. Turned back on,
 * the layout on the tab in view is kept for both, with Undo. Reset resets the tab in view.
 */
export function CustomizeSheet({
  open,
  onOpenChange,
  layout,
  onChange,
  saving,
  focus,
  screen,
}: CustomizeSheetProps) {
  // The tab picked while open. Each time it opens, it starts on this screen's.
  const [picked, setPicked] = useState<ScreenKind | null>(null);
  const split = isSplit(layout);
  const tab = split ? (picked ?? screen) : screen;
  // The layout being changed: the tab's, or the shared one.
  const current = screenLayout(layout, tab);
  // ", on phones" after each change while the two differ, so it's clear which one changed.
  const where = split
    ? tab === "phone"
      ? " on phones"
      : " on computers and tablets"
    : "";
  const openChange = (next: boolean) => {
    if (!next) setPicked(null);
    onOpenChange(next);
  };
  // What the last change did, for screen readers and as the line by Reset. Reset keeps the layout
  // before it, so Undo can bring it back.
  const [status, setStatus] = useState<{
    message: string;
    undo?: SpendingLayout;
  } | null>(null);

  const apply = (
    next: SpendingLayout,
    message: string,
    undo?: SpendingLayout,
  ) => {
    onChange(next);
    setStatus(undo === undefined ? { message } : { message, undo });
  };

  const moveSection = (key: SectionKey, by: -1 | 1) => {
    const next = move(current, key, by);
    const place = next.order.indexOf(key) + 1;
    apply(
      withScreen(layout, tab, next),
      `${SECTIONS[key].name} moved ${by === -1 ? "up" : "down"}${where}, now ${String(place)} of ${String(next.order.length)}.`,
    );
    // The row moves, so focus follows its button. At either end, it goes to the other one.
    requestAnimationFrame(() => {
      const button = document.getElementById(arrowId(key, by));
      const target =
        button instanceof HTMLButtonElement && button.disabled
          ? document.getElementById(arrowId(key, by === -1 ? 1 : -1))
          : button;
      target?.focus();
    });
  };

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogContent
        className={cn(SHEET, "grid-rows-[auto_minmax(0,1fr)_auto]")}
        // Opened from a section, focus starts on its open Options, which brings them into view.
        {...(focus === null
          ? {}
          : {
              initialFocus: () =>
                document.getElementById(optionsButtonId(focus)),
            })}
      >
        <div className="flex flex-col gap-3">
          <DialogHeader className="pr-10">
            <DialogTitle className={SHEET_TITLE}>
              Customize Spending
            </DialogTitle>
            <DialogDescription className="text-base">
              Choose what this page shows, and in what order. It&apos;s saved to
              your account, for every device you use.
            </DialogDescription>
          </DialogHeader>
          {split && (
            <ScreenTabs
              tab={tab}
              screen={screen}
              onTab={(next) => {
                setPicked(next);
              }}
            />
          )}
        </div>

        <div className="-mx-1 flex flex-col gap-2 overflow-y-auto p-1">
          <div className="rounded-2xl border px-4 py-1">
            <SettingRow
              name="Same layout on phone and computer"
              about={
                split
                  ? "Off: phones have a layout of their own. Tablets use the computer one."
                  : "Turn off to set up your phone on its own."
              }
              on={!split}
              onChange={(same) => {
                apply(
                  setSame(layout, same, tab),
                  same
                    ? `Phones, tablets and computers all use the ${SCREEN_NAMES[tab].toLowerCase()} layout now.`
                    : "Phones have a layout of their own now, a copy of this one.",
                  layout,
                );
              }}
            />
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="font-semibold">Total and answer</p>
              <p className="text-sm text-muted-foreground">
                Always at the top.
              </p>
            </div>
            <AlwaysShown />
          </div>
          <ol className="flex flex-col gap-2">
            {current.order.map((key, index) => (
              <SectionRow
                // A new tab is a new list: each row starts with its Options closed.
                key={`${tab}-${key}`}
                sectionKey={key}
                shown={isShown(current, key)}
                first={index === 0}
                last={index === current.order.length - 1}
                onToggle={() => {
                  const next = toggle(current, key);
                  apply(
                    withScreen(layout, tab, next),
                    `${SECTIONS[key].name} ${isShown(next, key) ? "shown" : "hidden"}${where}.`,
                  );
                }}
                onMove={(by) => {
                  moveSection(key, by);
                }}
                focused={key === focus}
                // The Phone tab has no layout on computers.
                options={optionsOf(current, key, !(split && tab === "phone"))}
                onOption={(option, on) => {
                  // "By category: Show as donut chart." for a choice, "By category: Sorting off."
                  const what =
                    option.said?.(on) ??
                    (option.ways === undefined
                      ? `${option.name} ${on ? "on" : "off"}`
                      : `${option.name} ${option.ways[on ? 1 : 0].toLowerCase()}`);
                  apply(
                    withScreen(layout, tab, option.switched(on)),
                    `${SECTIONS[key].name}: ${what}${where}.`,
                  );
                }}
              />
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <p
            aria-live="polite"
            className="flex min-h-6 flex-wrap items-center gap-x-2 text-sm text-muted-foreground"
          >
            <span>
              {saving
                ? "Saving…"
                : (status?.message ?? "Changes save as you make them.")}
            </span>
            {!saving && status?.undo !== undefined && (
              <Button
                variant="link"
                className="h-auto p-0 text-sm"
                onClick={() => {
                  if (status.undo !== undefined) {
                    apply(status.undo, "Your layout is back.");
                  }
                }}
              >
                Undo
              </Button>
            )}
          </p>
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant="outline"
              size="lg"
              className="h-11"
              disabled={isDefault(current)}
              onClick={() => {
                apply(
                  withScreen(layout, tab, DEFAULT_LAYOUT),
                  split
                    ? `The ${SCREEN_NAMES[tab].toLowerCase()} layout is back to the default.`
                    : "Back to the default layout.",
                  layout,
                );
              }}
            >
              Reset to default
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="h-11 px-6"
              onClick={() => {
                openChange(false);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Which layout is being changed, Phone or Computer, while phones have their own. Off
 * the screen it's open on, a line says where the changes will show.
 */
function ScreenTabs({
  tab,
  screen,
  onTab,
}: {
  tab: ScreenKind;
  screen: ScreenKind;
  onTab: (tab: ScreenKind) => void;
}) {
  const icons: Readonly<Record<ScreenKind, LucideIcon>> = {
    phone: Smartphone,
    wide: Monitor,
  };
  return (
    <div className="flex flex-col gap-2 pt-1">
      <ToggleGroup
        aria-label="Layout for"
        variant="outline"
        spacing={0}
        value={[tab]}
        onValueChange={(value: readonly unknown[]) => {
          const next = value.find(
            (one): one is ScreenKind => one === "phone" || one === "wide",
          );
          if (next !== undefined) onTab(next);
        }}
        className="grid w-full grid-cols-2"
      >
        {(["phone", "wide"] as const).map((kind) => {
          const Icon = icons[kind];
          return (
            <ToggleGroupItem
              key={kind}
              value={kind}
              className="h-11 w-full gap-2 px-2 text-sm aria-pressed:bg-accent aria-pressed:text-accent-foreground"
            >
              <Icon aria-hidden="true" className="size-4" />
              {SCREEN_NAMES[kind]}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      {tab !== screen && (
        <p className="text-sm text-muted-foreground">
          {tab === "phone"
            ? "You'll see these changes on your phone."
            : "You'll see these changes on a tablet or computer."}
        </p>
      )}
    </div>
  );
}

/** A lock where a switch would be: this part can't be hidden. */
function AlwaysShown() {
  return (
    <span className="flex shrink-0 items-center text-muted-foreground">
      <Lock aria-hidden="true" className="size-4" />
      <span className="sr-only">Always shown</span>
    </span>
  );
}

function arrowId(key: SectionKey, by: -1 | 1): string {
  return `customize-${key}-${by === -1 ? "up" : "down"}`;
}

function SectionRow({
  sectionKey,
  shown,
  first,
  last,
  onToggle,
  onMove,
  options,
  onOption,
  focused,
}: {
  sectionKey: SectionKey;
  shown: boolean;
  first: boolean;
  last: boolean;
  onToggle: () => void;
  onMove: (by: -1 | 1) => void;
  /** The section's own settings, if it has any. They show under Options while it's shown. */
  options?: readonly Option[] | undefined;
  onOption: (option: Option, on: boolean) => void;
  /** The sheet was opened from this section: its Options start open. */
  focused: boolean;
}) {
  const section = SECTIONS[sectionKey];
  const nameId = useId();
  const aboutId = useId();
  const optionsId = useId();
  const [open, setOpen] = useState(focused);
  // Opened from this section: it comes to the top of the list, so its Options are in view.
  const row = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!focused) return;
    const frame = requestAnimationFrame(() => {
      row.current?.scrollIntoView({ block: "start" });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [focused]);
  const hasOptions = options !== undefined && shown;

  return (
    <li ref={row} className="flex flex-col rounded-2xl border px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-1">
          <p
            id={nameId}
            className={cn("font-semibold", !shown && "text-muted-foreground")}
          >
            {section.name}
            {!shown && <span className="font-normal"> · hidden</span>}
          </p>
          <p id={aboutId} className="text-sm text-muted-foreground">
            {section.about}
          </p>
          {hasOptions && (
            <Button
              variant="ghost"
              size="lg"
              aria-expanded={open}
              id={optionsButtonId(sectionKey)}
              aria-controls={optionsId}
              className="-ml-2 h-11 gap-1 self-start px-2"
              onClick={() => {
                setOpen(!open);
              }}
            >
              Options
              <span className="sr-only"> for {section.name}</span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 transition-transform",
                  open && "rotate-180",
                )}
              />
            </Button>
          )}
        </div>
        {section.locked === true ? (
          <AlwaysShown />
        ) : (
          <Switch
            checked={shown}
            onCheckedChange={onToggle}
            aria-labelledby={nameId}
            aria-describedby={aboutId}
            className="shrink-0"
          />
        )}
        <div className="flex shrink-0 flex-col">
          <Button
            id={arrowId(sectionKey, -1)}
            variant="ghost"
            size="icon-lg"
            className="size-9"
            aria-label={`Move ${section.name} up`}
            disabled={first}
            onClick={() => {
              onMove(-1);
            }}
          >
            <ArrowUp />
          </Button>
          <Button
            id={arrowId(sectionKey, 1)}
            variant="ghost"
            size="icon-lg"
            className="size-9"
            aria-label={`Move ${section.name} down`}
            disabled={last}
            onClick={() => {
              onMove(1);
            }}
          >
            <ArrowDown />
          </Button>
        </div>
      </div>
      {hasOptions && open && (
        <div
          id={optionsId}
          role="group"
          aria-label={`${section.name} options`}
          className="my-1 ml-1 flex flex-col border-l-2 pl-3"
        >
          {options.map((option) =>
            option.ways === undefined ? (
              <SettingRow
                key={option.name}
                name={option.name}
                about={option.about ?? ""}
                on={option.on}
                onChange={(on) => {
                  onOption(option, on);
                }}
              />
            ) : (
              <WaysRow
                key={option.name}
                name={option.name}
                ways={option.ways}
                {...(option.about === undefined ? {} : { about: option.about })}
                on={option.on}
                onChange={(on) => {
                  onOption(option, on);
                }}
              />
            ),
          )}
        </div>
      )}
    </li>
  );
}

// Each way's icon, so the two formats show side by side.
const WAY_ICONS: Readonly<Record<string, LucideIcon>> = {
  List,
  "Donut chart": ChartPie,
  "Side column": Columns2,
  Rows: Rows3,
};

/**
 * A choice between two equal ways, such as List and Donut chart: its name, then two buttons of
 * the same size, each with its icon, and a line on the one picked, if it has one. It comes first
 * and a rule sets it apart from the switches under it, which belong to one of the ways. Pressing
 * the one already on leaves it on.
 */
function WaysRow({
  name,
  ways,
  about,
  on,
  onChange,
}: {
  name: string;
  ways: readonly [string, string];
  /** What the way picked does. */
  about?: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  const nameId = useId();
  const aboutId = useId();
  return (
    <div className="flex flex-col gap-2 py-2 not-last:mb-1 not-last:border-b not-last:pb-4">
      <p id={nameId} className="text-sm font-medium text-muted-foreground">
        {name}
      </p>
      <ToggleGroup
        aria-labelledby={nameId}
        {...(about === undefined ? {} : { "aria-describedby": aboutId })}
        variant="outline"
        spacing={0}
        value={[on ? "on" : "off"]}
        onValueChange={(value: readonly unknown[]) => {
          if (value.includes("on")) onChange(true);
          else if (value.includes("off")) onChange(false);
        }}
        className="grid w-full grid-cols-2"
      >
        {ways.map((way, index) => {
          const Icon = WAY_ICONS[way];
          return (
            <ToggleGroupItem
              key={way}
              value={index === 0 ? "off" : "on"}
              className="h-11 w-full gap-2 px-3 text-sm aria-pressed:bg-accent aria-pressed:text-accent-foreground"
            >
              {Icon !== undefined && (
                <Icon aria-hidden="true" className="size-4" />
              )}
              {way}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      {about !== undefined && (
        <p id={aboutId} className="text-sm text-muted-foreground">
          {about}
        </p>
      )}
    </div>
  );
}

/** One of a section's settings: its name, a line on what it does, and a switch. */
function SettingRow({
  name,
  about,
  on,
  onChange,
}: {
  name: string;
  about: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  const nameId = useId();
  const aboutId = useId();
  return (
    <div className="flex min-h-11 items-center gap-3 py-1.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p id={nameId} className="font-medium">
          {name}
        </p>
        <p id={aboutId} className="text-sm text-muted-foreground">
          {about}
        </p>
      </div>
      <Switch
        checked={on}
        onCheckedChange={onChange}
        aria-labelledby={nameId}
        aria-describedby={aboutId}
        className="shrink-0"
      />
    </div>
  );
}
