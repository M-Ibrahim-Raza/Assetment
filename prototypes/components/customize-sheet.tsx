"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Lock,
  type LucideIcon,
  Monitor,
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
import { DISPLAY } from "./display";

// Customize, shared by the pages that let people choose their sections: Spending and a category's
// page. Each page passes its own model (its sections, their options and how its layout changes),
// so the sheet looks and works the same everywhere.

/** A sheet from the bottom on phones, a box in the middle on wider screens. */
export const SHEET =
  "max-h-[90svh] gap-4 p-5 max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-w-none max-sm:translate-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-lg";

/** The sheet's title, in the display face. */
export const SHEET_TITLE = cn(
  DISPLAY,
  "text-2xl font-extrabold tracking-tight",
);

/** A kind of screen with its own layout: a phone, or a tablet or computer. */
export type ScreenKind = "phone" | "wide";

/** "Phone", "Computer". Tablets get the computer layout, as they get its sidebar. */
export const SCREEN_NAMES: Readonly<Record<ScreenKind, string>> = {
  phone: "Phone",
  wide: "Computer",
};

/** The header button that opens Customize. The word shows from tablet width; phones get the icon. */
export function CustomizeButton({
  label,
  onClick,
}: {
  /** What it customizes, for screen readers: "Customize Spending". */
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="lg"
      aria-label={label}
      aria-haspopup="dialog"
      onClick={onClick}
      className="h-11 min-w-11 px-2.5 sm:px-3"
    >
      <SlidersHorizontal className="size-5" />
      <span className="hidden sm:inline">Customize</span>
    </Button>
  );
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

/** The part of a layout the sheet changes: which sections show, in what order. */
export interface SectionsLayout<Key extends string> {
  order: readonly Key[];
  hidden: readonly Key[];
}

/** One of a section's settings, as a row under its Options. */
export interface CustomizeOption<Screen> {
  name: string;
  about?: string;
  /** A choice's two ways, off then on. Missing for a switch. */
  ways?: readonly [string, string];
  on: boolean;
  /** The screen's layout with this setting switched. */
  switched: (on: boolean) => Screen;
  /** What the change says after the section's name, if not the setting's name and way. */
  said?: (on: boolean) => string;
}

/** A choice of a few ways for the whole page, such as its width: a button for each. */
export interface CustomizeChoice<Screen> {
  name: string;
  /** What the way picked does. */
  about: string;
  ways: readonly string[];
  /** The way picked, by its place in `ways`. */
  picked: number;
  /** The screen's layout with that way picked. */
  chosen: (index: number) => Screen;
  /** Not shown: the pressed button and the line under it already say what changed. */
  said?: (index: number) => string;
}

/** A section as Customize lists it. */
export interface CustomizeSection {
  name: string;
  /** One line on what it shows, under its name. */
  about: string;
  /** Can't be hidden. */
  locked?: boolean;
}

/**
 * What a page tells the sheet: its title, the part always at the top (which may have options of
 * its own), its sections, their options, and how its layout changes. `Screen` is one kind of
 * screen's layout; `Full` holds the shared one and, when phones have their own, the phone's.
 */
export interface CustomizeModel<
  Key extends string,
  Screen extends SectionsLayout<Key>,
  Full,
> {
  title: string;
  /** Always first, never hidden or moved. Its `key` names its options, if it has any. */
  lead: CustomizeSection & { key: string };
  section: (key: Key) => CustomizeSection;
  /** A section's settings as rows, or the lead's (`null`). Undefined for none. */
  options: (
    layout: Screen,
    key: Key | null,
    computers: boolean,
  ) => readonly CustomizeOption<Screen>[] | undefined;
  /**
   * Settings for the whole page, under "Same layout on phone and computer", such as its width:
   * switches, or a choice of two or more ways. `computers` is false on the phone tab.
   */
  pageOptions?: (
    layout: Screen,
    computers: boolean,
  ) => readonly (
    (CustomizeOption<Screen> & { about: string }) | CustomizeChoice<Screen>
  )[];
  defaultLayout: Screen;
  isDefault: (layout: Screen) => boolean;
  toggle: (layout: Screen, key: Key) => Screen;
  move: (layout: Screen, key: Key, by: -1 | 1) => Screen;
  isSplit: (layout: Full) => boolean;
  screenLayout: (layout: Full, screen: ScreenKind) => Screen;
  withScreen: (layout: Full, screen: ScreenKind, next: Screen) => Full;
  setSame: (layout: Full, same: boolean, keep: ScreenKind) => Full;
  /** Icons for a choice's ways, by name, so two formats show side by side. */
  wayIcons?: Readonly<Record<string, LucideIcon>>;
}

/** The id of a section's Options button, where the sheet starts when opened from that section. */
function optionsButtonId(key: string): string {
  return `customize-${key}-options`;
}

function arrowId(key: string, by: -1 | 1): string {
  return `customize-${key}-${by === -1 ? "up" : "down"}`;
}

export interface CustomizeSheetProps<
  Key extends string,
  Screen extends SectionsLayout<Key>,
  Full,
> {
  model: CustomizeModel<Key, Screen, Full>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: Full;
  /** Applies a change at once, and saves it to the account. */
  onChange: (next: Full) => void;
  /** True while the last change is being saved. */
  saving: boolean;
  /** The section it was opened from, or the lead's key: it starts there, Options open. */
  focus: string | null;
  /** The kind of screen it's open on. With a layout for each, it starts on this one's. */
  screen: ScreenKind;
}

/**
 * Which sections a page shows, and in what order: a switch and up and down buttons for each, no
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
export function CustomizeSheet<
  Key extends string,
  Screen extends SectionsLayout<Key>,
  Full,
>({
  model,
  open,
  onOpenChange,
  layout,
  onChange,
  saving,
  focus,
  screen,
}: CustomizeSheetProps<Key, Screen, Full>) {
  // The tab picked while open. Each time it opens, it starts on this screen's.
  const [picked, setPicked] = useState<ScreenKind | null>(null);
  const split = model.isSplit(layout);
  const tab = split ? (picked ?? screen) : screen;
  // The layout being changed: the tab's, or the shared one.
  const current = model.screenLayout(layout, tab);
  // ", on phones" after each change while the two differ, so it's clear which one changed.
  const where = split
    ? tab === "phone"
      ? " on phones"
      : " on computers and tablets"
    : "";
  const computers = !(split && tab === "phone");
  const openChange = (next: boolean) => {
    if (!next) setPicked(null);
    onOpenChange(next);
  };
  // What the last change did, for screen readers and as the line by Reset. Reset keeps the layout
  // before it, so Undo can bring it back.
  const [status, setStatus] = useState<{ message: string; undo?: Full } | null>(
    null,
  );

  const apply = (next: Full, message: string, undo?: Full) => {
    onChange(next);
    setStatus(undo === undefined ? { message } : { message, undo });
  };

  const moveSection = (key: Key, by: -1 | 1) => {
    const next = model.move(current, key, by);
    const place = next.order.indexOf(key) + 1;
    apply(
      model.withScreen(layout, tab, next),
      `${model.section(key).name} moved ${by === -1 ? "up" : "down"}${where}, now ${String(place)} of ${String(next.order.length)}.`,
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

  const onOption =
    (name: string) => (option: CustomizeOption<Screen>, on: boolean) => {
      // "By category: Show as donut chart." for a choice, "By category: Sorting off."
      const what =
        option.said?.(on) ??
        (option.ways === undefined
          ? `${option.name} ${on ? "on" : "off"}`
          : `${option.name} ${option.ways[on ? 1 : 0].toLowerCase()}`);
      apply(
        model.withScreen(layout, tab, option.switched(on)),
        `${name}: ${what}${where}.`,
      );
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
            <DialogTitle className={SHEET_TITLE}>{model.title}</DialogTitle>
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
          <div className="flex flex-col rounded-2xl border px-4 py-1">
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
                  model.setSame(layout, same, tab),
                  same
                    ? `Phones, tablets and computers all use the ${SCREEN_NAMES[tab].toLowerCase()} layout now.`
                    : "Phones have a layout of their own now, a copy of this one.",
                  layout,
                );
              }}
            />
            {model.pageOptions?.(current, computers).map((option) => {
              // A choice of a few ways, such as the width, sits under a rule.
              if ("picked" in option) {
                return (
                  <div key={option.name} className="mt-1 border-t pt-1">
                    <WaysRow
                      name={option.name}
                      ways={option.ways}
                      about={option.about}
                      picked={option.picked}
                      icons={model.wayIcons}
                      onChange={(index) => {
                        // The pressed button and the line under it say what changed, so the
                        // status line goes back to its usual words.
                        onChange(
                          model.withScreen(layout, tab, option.chosen(index)),
                        );
                        setStatus(null);
                      }}
                    />
                  </div>
                );
              }
              const change = (on: boolean) => {
                const what =
                  option.said?.(on) ?? `${option.name} ${on ? "on" : "off"}`;
                apply(
                  model.withScreen(layout, tab, option.switched(on)),
                  `${what}${where}.`,
                );
              };
              return option.ways === undefined ? (
                <SettingRow
                  key={option.name}
                  name={option.name}
                  about={option.about}
                  on={option.on}
                  onChange={change}
                />
              ) : (
                <div key={option.name} className="mt-1 border-t pt-1">
                  <WaysRow
                    name={option.name}
                    ways={option.ways}
                    about={option.about}
                    picked={option.on ? 1 : 0}
                    icons={model.wayIcons}
                    onChange={(index) => {
                      change(index === 1);
                    }}
                  />
                </div>
              );
            })}
          </div>
          <SectionRow
            key={`${tab}-lead`}
            rowKey={model.lead.key}
            section={{ ...model.lead, locked: true }}
            shown
            lead
            focused={focus === model.lead.key}
            options={model.options(current, null, computers)}
            onOption={onOption(model.lead.name)}
            wayIcons={model.wayIcons}
          />
          <ol className="flex flex-col gap-2">
            {current.order.map((key, index) => {
              const section = model.section(key);
              const shown = !current.hidden.includes(key);
              return (
                <SectionRow
                  // A new tab is a new list: each row starts with its Options closed.
                  key={`${tab}-${key}`}
                  rowKey={key}
                  section={section}
                  shown={shown}
                  first={index === 0}
                  last={index === current.order.length - 1}
                  onToggle={() => {
                    const next = model.toggle(current, key);
                    apply(
                      model.withScreen(layout, tab, next),
                      `${section.name} ${next.hidden.includes(key) ? "hidden" : "shown"}${where}.`,
                    );
                  }}
                  onMove={(by) => {
                    moveSection(key, by);
                  }}
                  focused={key === focus}
                  options={model.options(current, key, computers)}
                  onOption={onOption(section.name)}
                  wayIcons={model.wayIcons}
                />
              );
            })}
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
              disabled={model.isDefault(current)}
              onClick={() => {
                apply(
                  model.withScreen(layout, tab, model.defaultLayout),
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

/**
 * A section in the list: its name and what it shows, Options if it has any, a switch (or a lock),
 * and arrows to move it. The lead has neither switch nor arrows, on a muted ground.
 */
function SectionRow<Screen>({
  rowKey,
  section,
  shown,
  lead = false,
  first = false,
  last = false,
  onToggle,
  onMove,
  options,
  onOption,
  focused,
  wayIcons,
}: {
  rowKey: string;
  section: CustomizeSection;
  shown: boolean;
  /** The part always at the top: no arrows, on a muted ground. */
  lead?: boolean;
  first?: boolean;
  last?: boolean;
  onToggle?: () => void;
  onMove?: (by: -1 | 1) => void;
  /** The section's own settings, if it has any. They show under Options while it's shown. */
  options: readonly CustomizeOption<Screen>[] | undefined;
  onOption: (option: CustomizeOption<Screen>, on: boolean) => void;
  /** The sheet was opened from this section: its Options start open. */
  focused: boolean;
  wayIcons: Readonly<Record<string, LucideIcon>> | undefined;
}) {
  const nameId = useId();
  const aboutId = useId();
  const optionsId = useId();
  const [open, setOpen] = useState(focused);
  // Opened from this section: it comes to the top of the list, so its Options are in view.
  const row = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!focused) return;
    const frame = requestAnimationFrame(() => {
      row.current?.scrollIntoView({ block: "start" });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [focused]);
  const hasOptions = options !== undefined && options.length > 0 && shown;
  const Row = lead ? "div" : "li";

  return (
    <Row
      ref={(element: HTMLElement | null) => {
        row.current = element;
      }}
      className={cn(
        "flex flex-col rounded-2xl px-4 py-2.5",
        lead ? "bg-muted" : "border",
      )}
    >
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
              id={optionsButtonId(rowKey)}
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
        {section.locked === true || onToggle === undefined ? (
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
        {onMove !== undefined && (
          <div className="flex shrink-0 flex-col">
            <Button
              id={arrowId(rowKey, -1)}
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
              id={arrowId(rowKey, 1)}
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
        )}
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
                picked={option.on ? 1 : 0}
                icons={wayIcons}
                onChange={(index) => {
                  onOption(option, index === 1);
                }}
              />
            ),
          )}
        </div>
      )}
    </Row>
  );
}

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
  picked,
  icons,
  onChange,
}: {
  name: string;
  /** Two, side by side, or three, each with its icon over its name so they fit a phone. */
  ways: readonly string[];
  /** What the way picked does. */
  about?: string;
  /** The way picked, by its place in `ways`. */
  picked: number;
  icons: Readonly<Record<string, LucideIcon>> | undefined;
  onChange: (index: number) => void;
}) {
  const nameId = useId();
  const aboutId = useId();
  const three = ways.length > 2;
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
        value={[String(picked)]}
        onValueChange={(value: readonly unknown[]) => {
          // Pressing the one already picked leaves it picked.
          const next = value.find((one) => typeof one === "string");
          if (typeof next === "string") onChange(Number(next));
        }}
        className={cn("grid w-full", three ? "grid-cols-3" : "grid-cols-2")}
      >
        {ways.map((way, index) => {
          const Icon = icons?.[way];
          return (
            <ToggleGroupItem
              key={way}
              value={String(index)}
              className={cn(
                "w-full text-sm aria-pressed:bg-accent aria-pressed:text-accent-foreground",
                three
                  ? "h-auto min-h-14 flex-col gap-1 px-1 py-2"
                  : "h-11 gap-2 px-3",
              )}
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
