"use client";

import {
  CalendarClock,
  ChevronLeft,
  Download,
  Keyboard,
  ListFilter,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { SHEET, SHEET_TITLE } from "@proto/components/customize-sheet";
import { FilterChip } from "@proto/components/filter-chip";
import { FormPanel } from "@proto/components/form-panel";
import { ScreenLink } from "@proto/components/screen-link";
import type { HistoryEntry, HistoryKind } from "@proto/fixtures/entry-history";
import { QuickAddForm } from "@proto/screens/quick-add/quick-add";
import { useEntryForm } from "@proto/screens/quick-add/use-entry-form";
import { SortMenu } from "@proto/screens/spending/sort-menu";
import {
  categoriesOf,
  type EntryFilters,
  entriesWord,
  KIND_FILTER_WORD,
  KIND_WORD,
  KINDS,
  monthName,
  type Period,
  periodLabel,
  PRESET_WORD,
  PRESETS,
  SORT_FIELDS,
  SORT_KEYS,
  type Totals,
} from "./model";
import { type Editing, fromDraft, toDraft } from "./state";
import type { EntriesScreen } from "./use-entries-screen";

// The parts every Entries variant shares: what an entry says, the filters and their pickers, the
// bulk actions, saved views, export, the keys, the edit form and the states. Variants lay them out.

// ─── One entry ──────────────────────────────────────────────────────────────────────────────────

/**
 * An entry's amount, signed by its kind: spent money gets a minus, received money a plus and the
 * gain colour, and money moved between the user's own things has no sign, as on Home.
 */
export function EntryAmount({
  entry,
  className,
}: {
  entry: HistoryEntry;
  className?: string | undefined;
}) {
  switch (entry.kind) {
    case "expense":
      return (
        <Money
          value={-entry.amount}
          signed
          className={cn("font-bold", className)}
        />
      );
    case "income":
      return (
        <Money
          value={entry.amount}
          signed
          className={cn("font-bold text-gain", className)}
        />
      );
    case "transfer":
    case "correction":
      return (
        <Money
          value={entry.amount}
          className={cn("font-bold text-muted-foreground", className)}
        />
      );
  }
}

/**
 * Where the money went, in a few words: "Groceries · JazzCash", "Split: Groceries, Personal
 * care · HBL credit card", "Meezan Bank – Salary → JazzCash", or a correction's debt. A list
 * grouped by category or account can leave that part out.
 */
export function whereText(
  entry: HistoryEntry,
  hide?: "category" | "account",
): string {
  if (entry.kind === "transfer")
    return `${entry.account} → ${entry.toAccount ?? ""}`;
  if (entry.kind === "correction")
    return `Lowers what's owed on ${entry.account}`;
  const category =
    entry.parts === undefined
      ? entry.category
      : `Split: ${categoriesOf(entry).join(", ")}`;
  return [
    hide === "category" ? null : category,
    hide === "account" ? null : entry.account,
  ]
    .filter((part) => part !== null)
    .join(" · ");
}

/**
 * A word for kinds other than spent, which most entries are: Received, Moved or Correction. Not
 * colour alone, so it reads the same to everyone.
 */
export function KindMark({
  kind,
  className,
}: {
  kind: HistoryKind;
  className?: string | undefined;
}) {
  if (kind === "expense") return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border border-current/25 px-1.5 text-xs/5 font-semibold",
        kind === "income" ? "text-gain" : "text-muted-foreground",
        className,
      )}
    >
      {KIND_WORD[kind]}
    </span>
  );
}

/** For an entry the app added by itself: which loan or committee it came from. */
export function SourceMark({
  entry,
  className,
}: {
  entry: HistoryEntry;
  className?: string | undefined;
}) {
  if (entry.source === undefined) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <CalendarClock aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate">
        Added by the app · {entry.source.name}
      </span>
    </span>
  );
}

// ─── Filters ────────────────────────────────────────────────────────────────────────────────────

/** The filters in words: "“Daraz” in Groceries from JazzCash, tagged Murree trip, in October". */
export function describeFilters(filters: EntryFilters, today: string): string {
  const parts = [
    filters.q === "" ? null : `“${filters.q}”`,
    filters.kinds.length === 0
      ? null
      : filters.kinds
          .map((kind) => KIND_FILTER_WORD[kind].toLowerCase())
          .join(" or "),
    filters.category === undefined ? null : `in ${filters.category}`,
    filters.account === undefined ? null : `on ${filters.account}`,
    filters.tag === undefined ? null : `tagged ${filters.tag}`,
    filters.period.kind === "all"
      ? null
      : filters.period.kind === "month"
        ? `in ${periodLabel(filters.period, today)}`
        : periodLabel(filters.period, today).toLowerCase(),
  ];
  return parts.filter((part) => part !== null).join(" ");
}

/** The search field. Its id is the screen's, so "/" reaches it. */
export function SearchField({
  screen,
  label = "Search entries",
  hideLabel = false,
  className,
  inputClassName,
}: {
  screen: EntriesScreen;
  label?: string;
  /** For a layout where the field's place says what it is; screen readers still hear it. */
  hideLabel?: boolean;
  className?: string | undefined;
  inputClassName?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label
        htmlFor={screen.searchId}
        className={hideLabel ? "sr-only" : "text-sm font-medium"}
      >
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={screen.searchId}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-keyshortcuts="/"
          value={screen.filters.q}
          onChange={(event) => {
            screen.params.setQuery(event.target.value);
          }}
          className={cn(
            "h-11 bg-background pl-9 text-base md:text-base",
            inputClassName,
          )}
        />
      </div>
    </div>
  );
}

/** "Spent Rs 1.2 lakh · Received Rs 3.1 lakh · Moved Rs 40,000", for the parts that aren't zero. */
export function TotalsParts({
  totals,
  className,
}: {
  totals: Totals;
  className?: string | undefined;
}) {
  const parts = [
    { key: "spent", word: "Spent", value: totals.spent },
    { key: "received", word: "Received", value: totals.received },
    { key: "moved", word: "Moved", value: totals.moved },
    { key: "corrections", word: "Corrections", value: totals.corrections },
  ].filter((part) => part.value > 0);
  return (
    <span className={cn("inline-flex flex-wrap gap-x-3 gap-y-0.5", className)}>
      {parts.map((part) => (
        <span key={part.key} className="whitespace-nowrap">
          {part.word} <Money value={part.value} />
        </span>
      ))}
    </span>
  );
}

/** What the list shows: "58 entries · Spent Rs 1.2 lakh · Received …". Screen readers hear it. */
export function ResultLine({
  screen,
  className,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
}) {
  return (
    <p
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm font-semibold",
        className,
      )}
    >
      <span>{entriesWord(screen.totals.count)}</span>
      <TotalsParts totals={screen.totals} className="font-medium" />
    </p>
  );
}

/** Each filter that is on as a chip, with its ✕, then Clear filters. Nothing when none are on. */
export function FilterChips({
  screen,
  className,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
}) {
  const { filters, params, today } = screen;
  if (screen.filterCount === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {filters.q !== "" && (
        <FilterChip
          label={`“${filters.q}”`}
          onRemove={() => {
            params.setQuery("");
          }}
        />
      )}
      {filters.kinds.map((kind) => (
        <FilterChip
          key={kind}
          label={KIND_FILTER_WORD[kind]}
          onRemove={() => {
            params.toggleKind(kind);
          }}
        />
      ))}
      {filters.category !== undefined && (
        <FilterChip
          label={filters.category}
          onRemove={() => {
            params.setCategory(undefined);
          }}
        />
      )}
      {filters.account !== undefined && (
        <FilterChip
          label={filters.account}
          onRemove={() => {
            params.setAccount(undefined);
          }}
        />
      )}
      {filters.tag !== undefined && (
        <FilterChip
          label={`#${filters.tag}`}
          onRemove={() => {
            params.setTag(undefined);
          }}
        />
      )}
      {filters.period.kind !== "all" && (
        <FilterChip
          label={periodLabel(filters.period, today)}
          onRemove={() => {
            params.setPeriod({ kind: "all" });
          }}
        />
      )}
      <ClearFilters screen={screen} />
    </div>
  );
}

/** Clears every filter at once. At night the theme colour is too dark for text, so it uses the pale accent. */
export function ClearFilters({
  screen,
  className,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
}) {
  return (
    <Button
      variant="link"
      className={cn("h-11 px-1 dark:text-accent-foreground", className)}
      onClick={screen.params.clearFilters}
    >
      Clear filters
    </Button>
  );
}

/** The sort menu: date, when logged, amount, name, category or account, either way. */
export function SortControl({
  screen,
  className,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
}) {
  return (
    <SortMenu
      fields={SORT_FIELDS}
      keys={SORT_KEYS}
      order={screen.order}
      onOrder={screen.params.setSort}
      label="Sort entries"
      {...(className === undefined ? {} : { className })}
    />
  );
}

interface PickOption {
  value: string;
  label: string;
  /** The heading it sits under, such as "Received". */
  group?: string;
}

/** The options under each heading, in the order the headings first appear. */
function byGroup(options: readonly PickOption[]): [string, PickOption[]][] {
  const groups = new Map<string, PickOption[]>();
  for (const option of options) {
    const group = option.group ?? "";
    groups.set(group, [...(groups.get(group) ?? []), option]);
  }
  return [...groups];
}

/**
 * One pick from a list, in a menu: "Any category", then the options under their headings. The
 * trigger is the caller's, so a chip, a toolbar button or a word in a sentence can open it.
 */
export function PickMenu({
  label,
  value,
  options,
  anyLabel,
  onPick,
  className,
  children,
  align = "start",
}: {
  /** What it picks, "Category", which screen readers hear with the current pick. */
  label: string;
  value: string | undefined;
  options: readonly PickOption[];
  /** The choice that clears it, "Any category". */
  anyLabel: string;
  onPick: (value: string | undefined) => void;
  className?: string | undefined;
  children: ReactNode;
  align?: "start" | "end";
}) {
  const current =
    options.find((option) => option.value === value)?.label ?? anyLabel;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${label}: ${current}`}
        className={className}
      >
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="max-h-[min(28rem,70svh)] w-auto min-w-56"
      >
        <DropdownMenuRadioGroup
          value={value ?? ""}
          onValueChange={(next: unknown) => {
            onPick(typeof next === "string" && next !== "" ? next : undefined);
          }}
        >
          <DropdownMenuRadioItem value="" className="min-h-11 text-base">
            {anyLabel}
          </DropdownMenuRadioItem>
          {byGroup(options).map(([group, list]) => (
            <DropdownMenuGroup key={group}>
              {group !== "" && <DropdownMenuLabel>{group}</DropdownMenuLabel>}
              {list.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  className="min-h-11 text-base"
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Every category, spent ones then received ones. */
export function categoryOptions(screen: EntriesScreen): PickOption[] {
  return [
    ...screen.data.categories.expense.map((name) => ({
      value: name,
      label: name,
      group: "Spent",
    })),
    ...screen.data.categories.income.map((name) => ({
      value: name,
      label: name,
      group: "Received",
    })),
  ].filter(
    (option, index, all) =>
      all.findIndex((other) => other.value === option.value) === index,
  );
}

/** Every account and debt, then anything else entries name, such as money lent. */
export function accountOptions(screen: EntriesScreen): PickOption[] {
  const known = screen.places.map((place) => ({
    value: place.name,
    label: place.name,
    group: place.debt === null ? "Accounts" : "Cards and debts",
  }));
  const others = [
    ...new Set(
      screen.entries.flatMap((entry) => [entry.account, entry.toAccount ?? ""]),
    ),
  ]
    .filter(
      (name) => name !== "" && !known.some((option) => option.value === name),
    )
    .map((name) => ({ value: name, label: name, group: "Other" }));
  return [...known, ...others];
}

export function tagOptions(screen: EntriesScreen): PickOption[] {
  return screen.tags.map((tag) => ({ value: tag, label: tag }));
}

export function CategoryMenu({
  screen,
  className,
  children,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <PickMenu
      label="Category"
      value={screen.filters.category}
      options={categoryOptions(screen)}
      anyLabel="Any category"
      onPick={screen.params.setCategory}
      className={className}
    >
      {children}
    </PickMenu>
  );
}

export function AccountMenu({
  screen,
  className,
  children,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <PickMenu
      label="Account"
      value={screen.filters.account}
      options={accountOptions(screen)}
      anyLabel="Any account"
      onPick={screen.params.setAccount}
      className={className}
    >
      {children}
    </PickMenu>
  );
}

export function TagMenu({
  screen,
  className,
  children,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <PickMenu
      label="Tag"
      value={screen.filters.tag}
      options={tagOptions(screen)}
      anyLabel="Any tag"
      onPick={screen.params.setTag}
      className={className}
    >
      {children}
    </PickMenu>
  );
}

/** Which kinds show. Several can be on; none means every kind. Corrections only when there are any. */
export function KindMenu({
  screen,
  className,
  children,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
  children: ReactNode;
}) {
  const kinds = kindsInUse(screen);
  const on = screen.filters.kinds;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Kind: ${on.length === 0 ? "every kind" : on.map((kind) => KIND_FILTER_WORD[kind]).join(", ")}`}
        className={className}
      >
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Show</DropdownMenuLabel>
          {kinds.map((kind) => (
            <DropdownMenuCheckboxItem
              key={kind}
              checked={on.includes(kind)}
              onCheckedChange={() => {
                screen.params.toggleKind(kind);
              }}
              className="min-h-11 text-base"
            >
              {KIND_FILTER_WORD[kind]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        {on.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="min-h-11 text-base"
              onClick={() => {
                screen.params.setKinds([]);
              }}
            >
              Every kind
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The kinds to offer: the three Quick add logs, and Corrections when there are any. */
export function kindsInUse(screen: EntriesScreen): HistoryKind[] {
  return KINDS.filter(
    (kind) =>
      kind !== "correction" ||
      screen.entries.some((entry) => entry.kind === kind),
  );
}

/** The months to offer as periods: every month with entries, newest first. */
function monthKeys(screen: EntriesScreen): string[] {
  return [...new Set(screen.entries.map((entry) => entry.date.slice(0, 7)))];
}

/**
 * The period: All time, a preset, a month, or two dates. Picking dates opens a small form. The
 * trigger is the caller's.
 */
export function PeriodMenu({
  screen,
  className,
  children,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
  children: ReactNode;
}) {
  const [range, setRange] = useState(false);
  const { period } = screen.filters;
  const value =
    period.kind === "all"
      ? "all"
      : period.kind === "preset"
        ? period.preset
        : period.kind === "month"
          ? `month:${period.key}`
          : "range";
  const pick = (next: string) => {
    if (next === "range") {
      setRange(true);
      return;
    }
    if (next === "all") screen.params.setPeriod({ kind: "all" });
    else if (next.startsWith("month:")) {
      screen.params.setPeriod({ kind: "month", key: next.slice(6) });
    } else {
      const preset = PRESETS.find((one) => one === next);
      if (preset !== undefined)
        screen.params.setPeriod({ kind: "preset", preset });
    }
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Period: ${periodLabel(period, screen.today)}`}
          className={className}
        >
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-[min(30rem,70svh)] w-auto min-w-56"
        >
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next: unknown) => {
              if (typeof next === "string") pick(next);
            }}
          >
            <DropdownMenuRadioItem value="all" className="min-h-11 text-base">
              All time
            </DropdownMenuRadioItem>
            {PRESETS.map((preset) => (
              <DropdownMenuRadioItem
                key={preset}
                value={preset}
                className="min-h-11 text-base"
              >
                {PRESET_WORD[preset]}
              </DropdownMenuRadioItem>
            ))}
            <DropdownMenuGroup>
              <DropdownMenuLabel>A month</DropdownMenuLabel>
              {monthKeys(screen).map((key) => (
                <DropdownMenuRadioItem
                  key={key}
                  value={`month:${key}`}
                  className="min-h-11 text-base"
                >
                  {monthName(key, screen.today)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuRadioItem value="range" className="min-h-11 text-base">
              Pick dates…
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <RangeDialog screen={screen} open={range} onOpenChange={setRange} />
    </>
  );
}

/** Two dates, from and to. The device's own date picker fills each. */
function RangeDialog({
  screen,
  open,
  onOpenChange,
}: {
  screen: EntriesScreen;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fromId = useId();
  const toId = useId();
  const { period } = screen.filters;
  const [from, setFrom] = useState(period.kind === "range" ? period.from : "");
  const [to, setTo] = useState(
    period.kind === "range" ? period.to : screen.today,
  );
  const ready = from !== "" && to !== "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SHEET}>
        <DialogHeader className="pr-10">
          <DialogTitle className={SHEET_TITLE}>Pick dates</DialogTitle>
          <DialogDescription className="text-base">
            Show entries from one day to another.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!ready) return;
            screen.params.setPeriod({ kind: "range", from, to });
            onOpenChange(false);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={fromId}>From</FieldLabel>
              <Input
                id={fromId}
                type="date"
                value={from}
                max={screen.today}
                onChange={(event) => {
                  setFrom(event.target.value);
                }}
                className="h-11 text-base md:text-base"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={toId}>To</FieldLabel>
              <Input
                id={toId}
                type="date"
                value={to}
                max={screen.today}
                onChange={(event) => {
                  setTo(event.target.value);
                }}
                className="h-11 text-base md:text-base"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="h-11"
              disabled={!ready}
            >
              Show these dates
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** "Filters", with how many are on. Phones open the filters sheet with it. */
export function FiltersButton({
  screen,
  onClick,
  className,
}: {
  screen: EntriesScreen;
  onClick: () => void;
  className?: string | undefined;
}) {
  const count = screen.filterCount - (screen.filters.q === "" ? 0 : 1);
  return (
    <Button
      variant="outline"
      size="lg"
      className={cn("h-11 gap-2", className)}
      onClick={onClick}
      aria-label={count === 0 ? "Filters" : `Filters, ${String(count)} on`}
    >
      <ListFilter data-icon="inline-start" aria-hidden="true" />
      Filters
      {count > 0 && (
        <Badge
          aria-hidden="true"
          className="h-5 min-w-5 rounded-full px-1.5 tabular-nums"
        >
          {count}
        </Badge>
      )}
    </Button>
  );
}

/**
 * Every filter in one sheet, for phones: the period, the kinds, a category, an account and a tag.
 * Each change shows at once behind it; the button says how many entries that leaves.
 */
export function FiltersSheet({
  screen,
  open,
  onOpenChange,
}: {
  screen: EntriesScreen;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const ids = {
    period: useId(),
    category: useId(),
    account: useId(),
    tag: useId(),
  };
  const { filters, params, today } = screen;
  const [range, setRange] = useState(false);
  const periodValue =
    filters.period.kind === "all"
      ? "all"
      : filters.period.kind === "preset"
        ? filters.period.preset
        : filters.period.kind === "month"
          ? `month:${filters.period.key}`
          : "range";
  const select = "w-full [&>select]:h-11 [&>select]:text-base";
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(SHEET, "overflow-y-auto")}>
          <DialogHeader className="pr-10">
            <DialogTitle className={SHEET_TITLE}>Filters</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5">
            <Field>
              <FieldLabel htmlFor={ids.period}>Period</FieldLabel>
              <NativeSelect
                id={ids.period}
                value={periodValue}
                onChange={(event) => {
                  const next = event.target.value;
                  if (next === "range") setRange(true);
                  else if (next === "all") params.setPeriod({ kind: "all" });
                  else if (next.startsWith("month:")) {
                    params.setPeriod({ kind: "month", key: next.slice(6) });
                  } else {
                    const preset = PRESETS.find((one) => one === next);
                    if (preset !== undefined)
                      params.setPeriod({ kind: "preset", preset });
                  }
                }}
                className={select}
              >
                <NativeSelectOption value="all">All time</NativeSelectOption>
                {PRESETS.map((preset) => (
                  <NativeSelectOption key={preset} value={preset}>
                    {PRESET_WORD[preset]}
                  </NativeSelectOption>
                ))}
                <NativeSelectOptGroup label="A month">
                  {monthKeys(screen).map((key) => (
                    <NativeSelectOption key={key} value={`month:${key}`}>
                      {monthName(key, today)}
                    </NativeSelectOption>
                  ))}
                </NativeSelectOptGroup>
                <NativeSelectOption value="range">
                  {filters.period.kind === "range"
                    ? periodLabel(filters.period, today)
                    : "Pick dates…"}
                </NativeSelectOption>
              </NativeSelect>
            </Field>
            <FieldSet className="min-w-0 gap-2">
              <FieldLegend variant="label">Kind</FieldLegend>
              <ToggleGroup
                multiple
                variant="outline"
                value={[...filters.kinds]}
                onValueChange={(value) => {
                  params.setKinds(KINDS.filter((kind) => value.includes(kind)));
                }}
                className="w-full flex-wrap"
              >
                {kindsInUse(screen).map((kind) => (
                  <ToggleGroupItem
                    key={kind}
                    value={kind}
                    className="h-10 px-4 aria-pressed:bg-foreground aria-pressed:text-background"
                  >
                    {KIND_FILTER_WORD[kind]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>
            <SheetSelect
              id={ids.category}
              label="Category"
              anyLabel="Any category"
              value={filters.category}
              options={categoryOptions(screen)}
              onPick={params.setCategory}
            />
            <SheetSelect
              id={ids.account}
              label="Account"
              anyLabel="Any account"
              value={filters.account}
              options={accountOptions(screen)}
              onPick={params.setAccount}
            />
            {screen.tags.length > 0 && (
              <SheetSelect
                id={ids.tag}
                label="Tag"
                anyLabel="Any tag"
                value={filters.tag}
                options={tagOptions(screen)}
                onPick={params.setTag}
              />
            )}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <ClearFilters screen={screen} />
            <Button
              variant="secondary"
              size="lg"
              className="h-11"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Show {entriesWord(screen.totals.count)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <RangeDialog screen={screen} open={range} onOpenChange={setRange} />
    </>
  );
}

function SheetSelect({
  id,
  label,
  anyLabel,
  value,
  options,
  onPick,
}: {
  id: string;
  label: string;
  anyLabel: string;
  value: string | undefined;
  options: readonly PickOption[];
  onPick: (value: string | undefined) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect
        id={id}
        value={value ?? ""}
        onChange={(event) => {
          onPick(event.target.value === "" ? undefined : event.target.value);
        }}
        className="w-full [&>select]:h-11 [&>select]:text-base"
      >
        <NativeSelectOption value="">{anyLabel}</NativeSelectOption>
        {byGroup(options).map(([group, list]) =>
          group === "" ? (
            list.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))
          ) : (
            <NativeSelectOptGroup key={group} label={group}>
              {list.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelectOptGroup>
          ),
        )}
      </NativeSelect>
    </Field>
  );
}

// ─── Picking many ───────────────────────────────────────────────────────────────────────────────

/** "4 picked · Spent Rs 23,400 · Moved Rs 8,000". */
export function PickedLine({
  screen,
  className,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
}) {
  return (
    <p
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-baseline gap-x-3 font-semibold",
        className,
      )}
    >
      <span>{screen.picked.length} picked</span>
      <TotalsParts
        totals={screen.pickedTotal}
        className="text-sm font-medium"
      />
    </p>
  );
}

const BAR_BUTTON = cn(
  buttonVariants({ variant: "outline", size: "lg" }),
  "h-11",
);

/**
 * What can be done to the picked entries: change the category (when they're all one kind), the
 * account, the date or a tag, or delete them. Each applies at once and says so with Undo.
 */
export function BulkActions({
  screen,
  className,
  buttonClassName,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
  /** For a bar on a dark or coloured field. */
  buttonClassName?: string;
}) {
  const [dating, setDating] = useState(false);
  const [tagging, setTagging] = useState(false);
  const { bulk } = screen;
  const count = screen.picked.length;
  const button = cn(BAR_BUTTON, buttonClassName);
  if (count === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {bulk.canCategory && (
        <PickMenu
          label="Change category"
          value={undefined}
          options={bulk.categories.map((name) => ({
            value: name,
            label: name,
          }))}
          anyLabel="Keep as they are"
          onPick={(category) => {
            if (category !== undefined) bulk.setCategory(category);
          }}
          className={button}
        >
          Category
        </PickMenu>
      )}
      <PickMenu
        label="Change account"
        value={undefined}
        options={screen.places
          .filter((place) => place.debt === null || place.debt === "card")
          .map((place) => ({ value: place.name, label: place.name }))}
        anyLabel="Keep as they are"
        onPick={(account) => {
          if (account !== undefined) bulk.setAccount(account);
        }}
        className={button}
      >
        Account
      </PickMenu>
      <Button
        variant="outline"
        size="lg"
        className={cn("h-11", buttonClassName)}
        onClick={() => {
          setDating(true);
        }}
      >
        Date
      </Button>
      <Button
        variant="outline"
        size="lg"
        className={cn("h-11", buttonClassName)}
        onClick={() => {
          setTagging(true);
        }}
      >
        Tag
      </Button>
      <Button
        variant="outline"
        size="lg"
        className={cn("h-11 text-destructive", buttonClassName)}
        onClick={bulk.remove}
      >
        Delete {count}
      </Button>
      <DateDialog
        open={dating}
        onOpenChange={setDating}
        count={count}
        today={screen.today}
        onPick={bulk.setDate}
      />
      <TagDialog
        open={tagging}
        onOpenChange={setTagging}
        count={count}
        tags={screen.tags}
        onPick={bulk.addTag}
      />
    </div>
  );
}

/** Moves the picked entries to one day. */
function DateDialog({
  open,
  onOpenChange,
  count,
  today,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  today: string;
  onPick: (date: string) => void;
}) {
  const id = useId();
  const [date, setDate] = useState(today);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SHEET}>
        <DialogHeader className="pr-10">
          <DialogTitle className={SHEET_TITLE}>Change the date</DialogTitle>
          <DialogDescription className="text-base">
            {entriesWord(count)} move to the day you pick.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (date === "") return;
            onPick(date);
            onOpenChange(false);
          }}
        >
          <Field>
            <FieldLabel htmlFor={id}>Date</FieldLabel>
            <Input
              id={id}
              type="date"
              value={date}
              max={today}
              onChange={(event) => {
                setDate(event.target.value);
              }}
              className="h-11 text-base md:text-base"
            />
          </Field>
          <DialogFooter>
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="h-11"
            >
              Move {entriesWord(count)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Adds one tag to the picked entries: one already in use, or a new one. */
function TagDialog({
  open,
  onOpenChange,
  count,
  tags,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  tags: readonly string[];
  onPick: (tag: string) => void;
}) {
  const id = useId();
  const [typed, setTyped] = useState("");
  const done = (tag: string) => {
    const clean = tag.trim();
    if (clean === "") return;
    onPick(clean);
    setTyped("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SHEET}>
        <DialogHeader className="pr-10">
          <DialogTitle className={SHEET_TITLE}>Add a tag</DialogTitle>
          <DialogDescription className="text-base">
            To {entriesWord(count)}, such as a trip or a wedding.
          </DialogDescription>
        </DialogHeader>
        {tags.length > 0 && (
          <div
            role="group"
            aria-label="Tags you use"
            className="flex flex-wrap gap-2"
          >
            {tags.map((tag) => (
              <Button
                key={tag}
                variant="outline"
                className="h-10 max-w-full rounded-full"
                onClick={() => {
                  done(tag);
                }}
              >
                <span className="min-w-0 truncate">{tag}</span>
              </Button>
            ))}
          </div>
        )}
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            done(typed);
          }}
        >
          <Field>
            <FieldLabel htmlFor={id}>New tag</FieldLabel>
            <Input
              id={id}
              value={typed}
              maxLength={30}
              autoComplete="off"
              onChange={(event) => {
                setTyped(event.target.value);
              }}
              className="h-11 text-base md:text-base"
            />
          </Field>
          <DialogFooter>
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="h-11"
              disabled={typed.trim() === ""}
            >
              Tag {entriesWord(count)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Views, export and keys ─────────────────────────────────────────────────────────────────────

/**
 * Saved views: each opens its filters, search and sort. "Save this view" names the current one;
 * "Manage views" deletes them, with Undo.
 */
export function SavedViewsMenu({
  screen,
  className,
  children,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
  children: ReactNode;
}) {
  const [saving, setSaving] = useState(false);
  const [managing, setManaging] = useState(false);
  const { views } = screen;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Saved views" className={className}>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-auto max-w-[min(22rem,90vw)] min-w-60"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>Saved views</DropdownMenuLabel>
            {views.views.length === 0 && (
              <p className="px-1.5 py-2 text-sm text-muted-foreground">
                None yet. Set the filters, then save them here.
              </p>
            )}
            <DropdownMenuRadioGroup
              value={screen.params.view ?? ""}
              onValueChange={(id: unknown) => {
                const view = views.views.find((one) => one.id === id);
                if (view !== undefined)
                  screen.params.applyView(view.id, view.query);
              }}
            >
              {views.views.map((view) => (
                <DropdownMenuRadioItem
                  key={view.id}
                  value={view.id}
                  className="min-h-11 text-base"
                >
                  {view.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="min-h-11 text-base"
            disabled={
              screen.filterCount === 0 &&
              screen.order.by === "date" &&
              !screen.order.reversed
            }
            onClick={() => {
              setSaving(true);
            }}
          >
            Save this view…
          </DropdownMenuItem>
          {views.views.length > 0 && (
            <DropdownMenuItem
              className="min-h-11 text-base"
              onClick={() => {
                setManaging(true);
              }}
            >
              Manage views…
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <SaveViewDialog screen={screen} open={saving} onOpenChange={setSaving} />
      <ManageViewsDialog
        screen={screen}
        open={managing}
        onOpenChange={setManaging}
      />
    </>
  );
}

function SaveViewDialog({
  screen,
  open,
  onOpenChange,
}: {
  screen: EntriesScreen;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const [name, setName] = useState("");
  const [tried, setTried] = useState(false);
  const clean = name.trim();
  const problem =
    clean === ""
      ? "Give it a name."
      : screen.views.views.some(
            (view) => view.name.toLowerCase() === clean.toLowerCase(),
          )
        ? "You have a view with that name."
        : null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SHEET}>
        <DialogHeader className="pr-10">
          <DialogTitle className={SHEET_TITLE}>Save this view</DialogTitle>
          <DialogDescription className="text-base">
            {describeFilters(screen.filters, screen.today) || "Every entry"}, by{" "}
            {SORT_FIELDS[screen.order.by].name.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setTried(true);
            if (problem !== null) return;
            const viewId = screen.views.add(
              clean,
              screen.params.currentQuery(),
            );
            screen.params.applyView(viewId, screen.params.currentQuery());
            setName("");
            setTried(false);
            onOpenChange(false);
          }}
        >
          <Field data-invalid={tried && problem !== null}>
            <FieldLabel htmlFor={id}>Name</FieldLabel>
            <Input
              id={id}
              value={name}
              maxLength={40}
              autoComplete="off"
              aria-invalid={tried && problem !== null}
              aria-describedby={
                tried && problem !== null ? `${id}-error` : undefined
              }
              onChange={(event) => {
                setName(event.target.value);
              }}
              className="h-11 text-base md:text-base"
            />
            {tried && problem !== null && (
              <p
                id={`${id}-error`}
                className="text-sm font-medium text-destructive"
              >
                {problem}
              </p>
            )}
          </Field>
          <DialogFooter>
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="h-11"
            >
              Save view
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManageViewsDialog({
  screen,
  open,
  onOpenChange,
}: {
  screen: EntriesScreen;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SHEET}>
        <DialogHeader className="pr-10">
          <DialogTitle className={SHEET_TITLE}>Saved views</DialogTitle>
        </DialogHeader>
        {screen.views.views.length === 0 ? (
          <p className="text-base">No saved views left.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {screen.views.views.map((view) => (
              <li
                key={view.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="min-w-0 font-medium wrap-break-word">
                  {view.name}
                </span>
                <Button
                  variant="ghost"
                  className="h-11 text-destructive"
                  onClick={() => {
                    screen.views.remove(view.id);
                  }}
                >
                  Delete<span className="sr-only"> {view.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Downloads what's shown as a CSV file. */
export function ExportButton({
  screen,
  className,
  label = "Export",
}: {
  screen: EntriesScreen;
  className?: string | undefined;
  label?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="lg"
      className={cn("h-11", className)}
      onClick={screen.exportShown}
      disabled={screen.shown.length === 0}
      aria-label={`${label}: ${entriesWord(screen.shown.length)} as a CSV file`}
    >
      <Download data-icon="inline-start" aria-hidden="true" />
      {label}
    </Button>
  );
}

const KEYS = [
  ["J", "Next entry"],
  ["K", "Entry before"],
  ["Enter", "Open it"],
  ["X", "Pick it"],
  ["E", "Edit the open entry"],
  ["/", "Search"],
  ["Esc", "Clear what's picked, or close the entry"],
] as const;

/** The keys, in a small panel. Computers only: phones have no keyboard to use them with. */
export function ShortcutsButton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Keyboard shortcuts"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-lg" }),
          "max-md:hidden",
          className,
        )}
      >
        <Keyboard />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="font-semibold">Keyboard shortcuts</p>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
          {KEYS.map(([key, what]) => (
            <div key={key} className="contents">
              <dt>
                <Kbd>{key}</Kbd>
              </dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  );
}

// ─── States ─────────────────────────────────────────────────────────────────────────────────────

/** The screen behind the edit form: on phones the form is the page, so this leaves the flow. */
export function Behind({
  screen,
  children,
  className,
}: {
  screen: EntriesScreen;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div
      inert={screen.editor.open}
      className={cn(screen.editor.open && "max-md:hidden", className)}
    >
      {children}
    </div>
  );
}

/** Before anything is logged: what this page is for, and the way to log the first entry. */
export function EntriesFirstUse({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <section className={cn("flex flex-col items-start gap-3 py-6", className)}>
      <h2 className="text-xl font-bold">Every entry in one place</h2>
      <p className="max-w-prose">
        Everything you spend, receive and move, month after month. Find any
        entry, check it, and fix several at once.
      </p>
      {/* Secondary, as Add in the nav is the one primary button. */}
      <ScreenLink
        screen="Quick add"
        className={cn(
          buttonVariants({ variant: "secondary", size: "lg" }),
          "h-11",
        )}
      >
        Log your first entry
      </ScreenLink>
    </section>
  );
}

/** Nothing matches: what caused it, and Clear filters. Never the first-use message. */
export function NoResults({
  screen,
  className,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-2xl border border-dashed p-5",
        className,
      )}
    >
      <p className="font-semibold wrap-break-word">
        No entries match {describeFilters(screen.filters, screen.today)}
      </p>
      <p className="text-sm text-muted-foreground">
        Try other words, or clear the filters to see every entry.
      </p>
      <Button
        variant="outline"
        size="lg"
        className="h-11"
        onClick={screen.params.clearFilters}
      >
        Clear filters
      </Button>
    </div>
  );
}

/** The entries couldn't load: what happened, and Try again. */
export function EntriesError({
  message,
  className,
}: {
  message: string;
  className?: string | undefined;
}) {
  const router = useRouter();
  return (
    <section
      role="alert"
      className={cn("flex flex-col items-start gap-3 py-6", className)}
    >
      <h2 className="text-xl font-bold">{"We couldn't load your entries"}</h2>
      <p>{message}</p>
      <Button
        variant="secondary"
        size="lg"
        className="h-11"
        onClick={() => {
          router.refresh();
        }}
      >
        Try again
      </Button>
    </section>
  );
}

/** Back from Entry detail to the list, on phones, where the entry is its own page. */
export function BackToList({
  screen,
  className,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
}) {
  return (
    <Button
      variant="ghost"
      className={cn("-ml-2 h-11 gap-1 px-2", className)}
      onClick={screen.opened.close}
    >
      <ChevronLeft data-icon="inline-start" aria-hidden="true" />
      Entries
    </Button>
  );
}

/** The URL names an entry that isn't there: deleted, or a link from elsewhere that's out of date. */
export function NotFoundDetail({
  screen,
  className,
}: {
  screen: EntriesScreen;
  className?: string | undefined;
}) {
  return (
    <section className={cn("flex flex-col items-start gap-3", className)}>
      <h2 className="text-xl font-bold">{"This entry isn't here"}</h2>
      <p>It may have been deleted. Every other entry is still in the list.</p>
      <Button
        variant="outline"
        size="lg"
        className="h-11"
        onClick={screen.opened.close}
      >
        Back to entries
      </Button>
    </section>
  );
}

/**
 * Entry detail's actions, side by side: Edit, Log again and Delete. A correction comes from a
 * debt's balance check, so it's changed there, not here. Delete is undone from its toast.
 */
export function DetailActions({
  screen,
  entry,
  className,
}: {
  screen: EntriesScreen;
  entry: HistoryEntry;
  className?: string | undefined;
}) {
  const correction = entry.kind === "correction";
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {!correction && (
        <Button
          variant="secondary"
          size="lg"
          className="h-11"
          aria-keyshortcuts="E"
          onClick={() => {
            screen.editor.edit(entry.id);
          }}
        >
          Edit
        </Button>
      )}
      {!correction && entry.source === undefined && (
        <Button
          variant="outline"
          size="lg"
          className="h-11"
          onClick={() => {
            screen.editor.copy(entry.id);
          }}
        >
          Log again
        </Button>
      )}
      <Button
        variant="ghost"
        size="lg"
        className="h-11 text-destructive"
        onClick={screen.deleteOpen}
      >
        Delete
      </Button>
    </div>
  );
}

/**
 * The edit form over the screen: Quick add's form with the entry in it, titled "Edit entry". Log
 * again uses it too, titled "Add", with a copy dated today. Save closes it, with Undo.
 */
export function EntryFormPanel({ screen }: { screen: EntriesScreen }) {
  const { editing } = screen.editor;
  if (editing === null) return null;
  const entry = screen.entries.find((one) => one.id === editing.id);
  if (entry === undefined) return null;
  return (
    <EditForm
      key={`${editing.mode}:${editing.id}`}
      screen={screen}
      entry={entry}
      editing={editing}
    />
  );
}

function EditForm({
  screen,
  entry,
  editing,
}: {
  screen: EntriesScreen;
  entry: HistoryEntry;
  editing: Editing;
}) {
  const { places, data, today } = screen;
  const form = useEntryForm(
    {
      accounts: [],
      debts: [],
      categories: data.categories,
      usuals: [],
      draft: toDraft(entry, places, editing.mode, today),
      failed: editing.failed,
      saving: editing.saving,
      tags: screen.tags,
    },
    places,
    (saved) => {
      const next = fromDraft(
        saved.draft,
        entry,
        places,
        editing.mode,
        screen.now,
      );
      if (editing.mode === "edit") screen.book.save(next);
      else screen.book.add(next);
      screen.editor.close();
    },
    "edit",
  );
  return (
    <FormPanel
      open
      title={editing.mode === "edit" ? "Edit entry" : "Add"}
      onClose={screen.editor.close}
      focusId={form.amountId}
    >
      <QuickAddForm form={form} />
    </FormPanel>
  );
}

/** "Rs 4,250 counts in November's spending, under Groceries", and the like, for any variant. */
export function countsSentence(screen: EntriesScreen): string | null {
  const { impact } = screen;
  if (impact === null) return null;
  const month = monthName(impact.month, screen.today);
  if (impact.spent.length > 0) {
    return `Counts in ${month}'s spending, under ${impact.spent.map((part) => part.category).join(" and ")}.`;
  }
  if (impact.received.length > 0) {
    return `Counts in ${month}'s money received, under ${impact.received.map((part) => part.category).join(" and ")}.`;
  }
  if (screen.openEntry?.kind === "correction")
    return "Lowers what's owed. It isn't counted as received.";
  return "Moved between your own accounts, so it isn't spending and net worth stays the same.";
}

/** Exported for variants that write their own period picker. */
export type { Period };
