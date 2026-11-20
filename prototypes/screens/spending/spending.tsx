"use client";

import { CalendarRange } from "lucide-react";
import {
  createContext,
  Fragment,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AppShell } from "@proto/components/app-shell";
import { HeadingLink } from "@proto/components/heading-link";
import { categoryPath } from "@proto/screens/categories/math";
import { shellWidth } from "@proto/components/page-width";
import { AmountsContext, Money } from "@proto/components/amounts";
import { formatDigits } from "@proto/kit/format";
import { useProtoAction } from "@proto/kit/use-proto-action";
import {
  BLOCK,
  DISPLAY,
  HEADING,
  INK,
  PAD,
} from "@proto/screens/dashboard/parts";
import { arrange, type Row } from "./arrange";
import { HabitsSection } from "./habits-block";
import { BreakdownDonut } from "./breakdown-donut";
import {
  CustomizeButton,
  CustomizeSheet,
  SectionCustomizeButton,
} from "./customize-sheet";
import {
  type BreakdownSettings,
  type CalendarSettings,
  DEFAULT_ARRANGEMENT,
  DEFAULT_LAYOUT,
  DEFAULT_WIDTH,
  type EntriesSettings,
  isShown,
  normalize,
  screenLayout,
  type SectionKey,
  sectionSettings,
  type SpendingLayout,
} from "./layout";
import {
  type BreakdownRow,
  dailyTotals,
  type DayRange,
  daysLabel,
  isFirstUse,
  longDayLabel,
  type MonthSummary,
  type RowOrder,
  sortRows,
  summarize,
  usualLeaders,
} from "./math";
import { SummaryBlock } from "./pace-block";
import { type SortField, SortMenu } from "./sort-menu";
import { PaceChartBlock } from "./pace-chart";
import {
  BreakdownLegend,
  BreakdownRows,
  EntriesList,
  ERROR_TITLE,
  FIRST_USE,
  FirstExpenseLink,
  RetryButton,
  RowActions,
  useAmountText,
} from "./parts";
import type { Spending, SpendingFilters, SpendingViewProps } from "./scenarios";
import { useScreen } from "./use-screen";
import { type SpendingParams, useSpendingParams } from "./use-spending-params";
import { useStickyTop } from "./use-sticky-top";

// Monday first, as Pakistani calendars print it.
const WEEKDAYS = [
  { key: "mon", letter: "M" },
  { key: "tue", letter: "T" },
  { key: "wed", letter: "W" },
  { key: "thu", letter: "T" },
  { key: "fri", letter: "F" },
  { key: "sat", letter: "S" },
  { key: "sun", letter: "S" },
] as const;

// How far a finger must travel sideways to change month.
const SWIPE_PX = 50;

// How many categories or accounts show before "Show all".
const TOP_ROWS = 5;

/**
 * Days: the month's total and answer on ink, always first. Under it, the sections the person
 * chose, in their order: the pace chart, the biggest categories, the month as a calendar shaded by
 * what was spent, and the entries. Customize, in the header, shows, hides and moves them. On a
 * computer they sit in rows by shape, with the entries beside a sticky side column or on a row of
 * their own, a choice in Customize.
 */
export function Days(props: SpendingViewProps) {
  if (props.status === "ready" && !isFirstUse(props.spending)) {
    return (
      <Ready
        spending={props.spending}
        start={props.start ?? {}}
        saved={props.layout ?? DEFAULT_LAYOUT}
      />
    );
  }
  return (
    <AppShell
      current="spending"
      title="Spending"
      wide={shellWidth(DEFAULT_WIDTH, "wide")}
    >
      <NotReady {...props} />
    </AppShell>
  );
}

/** Loading, an error, or nothing logged yet. There is nothing to customize until there is data. */
function NotReady(props: SpendingViewProps) {
  if (props.status === "loading") return <Loading />;
  if (props.status === "error") {
    return (
      <section
        role="alert"
        className={cn(
          "flex flex-col items-start gap-4 bg-secondary py-8 text-secondary-foreground",
          BLOCK,
          PAD,
        )}
      >
        <h2 className={HEADING}>{ERROR_TITLE}</h2>
        <p className="max-w-md">{props.message}</p>
        <RetryButton className="bg-card text-card-foreground" />
      </section>
    );
  }
  return (
    <section
      className={cn(
        "flex flex-col items-start gap-4 bg-secondary py-10 text-secondary-foreground",
        BLOCK,
        PAD,
      )}
    >
      <h2 className={HEADING}>{FIRST_USE.title}</h2>
      <p className="max-w-md">{FIRST_USE.body}</p>
      <FirstExpenseLink className="bg-card text-card-foreground" />
    </section>
  );
}

/** Brings the entries list into view, after the URL change has rendered. */
function scrollToEntries() {
  requestAnimationFrame(() => {
    document.getElementById("entries")?.scrollIntoView({ block: "start" });
  });
}

// Two columns from this width of the sections area, not the window's: the sidebar takes room.
const TWO_COLUMNS = "flex flex-col gap-3 @min-[44rem]:grid";

/** A row's two columns: halves, or 3 of 5 for the wider one, the first or the second. */
function columns(wider: 0 | 1 | null): string {
  if (wider === null) return "@min-[44rem]:grid-cols-2";
  return wider === 0
    ? "@min-[44rem]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    : "@min-[44rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]";
}

/**
 * The sections in rows by shape. Cards in a row stretch to one height. On phones and
 * narrow windows, the same rows stack in one column, in the person's order.
 */
function SectionRows({
  rows,
  sections,
}: {
  rows: readonly Row[];
  sections: Record<SectionKey, ReactNode>;
}) {
  return (
    <div className="@container flex flex-col gap-3">
      {rows.map((row) => {
        if (row.kind === "wide" || row.kind === "full") {
          return <Fragment key={row.key}>{sections[row.key]}</Fragment>;
        }
        if (row.kind === "list") {
          return (
            <ListRow
              key={[row.key, ...row.side].join("-")}
              row={row}
              sections={sections}
            />
          );
        }
        const [first, second] = row.keys;
        return (
          <div
            key={row.keys.join("-")}
            className={cn(TWO_COLUMNS, columns(row.wider))}
          >
            {sections[first]}
            {sections[second]}
          </div>
        );
      })}
    </div>
  );
}

/** Whether the entries sit beside a side column, where their head stays in view too. */
const BesideSideColumn = createContext(false);

/**
 * The entries in one column, and tiles in the other, which stays in view while the list scrolls.
 * It's first in the page when it's on the left, so Tab follows the screen.
 */
function ListRow({
  row,
  sections,
}: {
  row: Extract<Row, { kind: "list" }>;
  sections: Record<SectionKey, ReactNode>;
}) {
  const column = useRef<HTMLDivElement>(null);
  const top = useStickyTop(column);
  const side = (
    // `top` does nothing until the column is sticky, from two columns.
    <div
      ref={column}
      style={{ top }}
      className="flex flex-col gap-3 @min-[44rem]:sticky @min-[44rem]:self-start"
    >
      {row.side.map((key) => (
        <Fragment key={key}>{sections[key]}</Fragment>
      ))}
    </div>
  );
  const left = row.at === "left";
  // The wider column, 0 or 1: the side column's place if it's wider, else the entries'.
  const wider = (row.wider === "side") === left ? 0 : 1;
  return (
    <div className={cn(TWO_COLUMNS, columns(wider))}>
      {left && side}
      <BesideSideColumn value>{sections[row.key]}</BesideSideColumn>
      {!left && side}
    </div>
  );
}

function Ready({
  spending,
  start,
  saved,
}: {
  spending: Spending;
  start: SpendingFilters;
  /** The layout saved to the account. */
  saved: SpendingLayout;
}) {
  const params = useSpendingParams(spending, start);
  const [layout, setLayout] = useState(() => normalize(saved));
  // A phone shows the phone's own layout, if it has one.
  const screen = useScreen();
  const here = screenLayout(layout, screen);
  // The sections' own settings, switched in Customize.
  const categoryOptions = sectionSettings(here, "categories");
  const accountOptions = sectionSettings(here, "accounts");
  // Customize is open: from the header (focus null), or from a section's own button.
  const [customizing, setCustomizing] = useState<{
    focus: SectionKey | null;
  } | null>(null);
  const customize = (focus: SectionKey) => () => {
    setCustomizing({ focus });
  };
  // Saving to the account runs in memory here. `?latency=slow` shows "Saving…".
  const save = useProtoAction(() => undefined);
  // Home's "See all entries" opens /spending#entries. The page draws after the link would have
  // scrolled, so it brings the entries into view itself.
  useEffect(() => {
    if (window.location.hash === "#entries") scrollToEntries();
  }, []);

  // The picked category and account narrow everything. The calendar and the chart show the whole
  // month in them, and everything else only the picked days. With no days picked they are the same.
  const scope = { category: params.category, account: params.account };
  const wholeMonth = summarize(spending, params.month, scope, params.compare);
  const summary =
    params.days === undefined
      ? wholeMonth
      : summarize(
          spending,
          params.month,
          { ...scope, days: params.days },
          params.compare,
        );
  const { days } = summary;

  const sections: Record<SectionKey, ReactNode> = {
    pace: (
      <PaceChartBlock
        spending={spending}
        summary={wholeMonth}
        scope={scope}
        days={days}
        daysTotal={summary.total}
        options={sectionSettings(here, "pace")}
        onCustomize={customize("pace")}
      />
    ),
    categories: (
      <BreakdownSection
        id="categories"
        heading="By category"
        by="category"
        plural="categories"
        chart={categoryOptions.chart}
        donut={categoryOptions}
        usual={usualLeaders(spending, "category")}
        summary={summary}
        rows={summary.categories}
        selected={params.category}
        onSelect={params.setCategory}
        detail={categoryPath}
        headingOpens="/spending/categories"
        order={params.categoryOrder}
        onOrder={params.setCategoryOrder}
        share={categoryOptions.share}
        sorting={categoryOptions.sorting}
        movers={categoryOptions.movers ? summary.drivers : []}
        onCustomize={customize("categories")}
      />
    ),
    accounts: (
      <BreakdownSection
        id="accounts"
        heading="By account"
        by="account"
        plural="accounts"
        chart={accountOptions.chart}
        donut={accountOptions}
        usual={usualLeaders(spending, "account")}
        summary={summary}
        rows={summary.accounts}
        selected={params.account}
        onSelect={params.setAccount}
        order={params.accountOrder}
        onOrder={params.setAccountOrder}
        share={accountOptions.share}
        sorting={accountOptions.sorting}
        movers={accountOptions.movers ? summary.accountDrivers : []}
        onCustomize={customize("accounts")}
      />
    ),
    calendar: (
      <section
        aria-labelledby="calendar-heading"
        className={cn("flex flex-col gap-4 bg-card px-3 py-5 md:px-6", BLOCK)}
      >
        <Calendar
          key={wholeMonth.month.key}
          spending={spending}
          summary={wholeMonth}
          params={params}
          days={days}
          options={sectionSettings(here, "calendar")}
          onCustomize={customize("calendar")}
        />
      </section>
    ),
    habits: (
      <HabitsSection
        spending={spending}
        month={params.month}
        category={params.category}
        account={params.account}
        options={sectionSettings(here, "habits")}
        onCustomize={customize("habits")}
      />
    ),
    entries: (
      <EntriesSection
        summary={summary}
        params={params}
        options={sectionSettings(here, "entries")}
        onCustomize={customize("entries")}
      />
    ),
  };
  const shown = here.order.filter((key) => isShown(here, key));

  return (
    <AppShell
      current="spending"
      title="Spending"
      wide={shellWidth(here.width ?? DEFAULT_WIDTH, screen)}
      actions={
        <CustomizeButton
          onClick={() => {
            setCustomizing({ focus: null });
          }}
        />
      }
    >
      <div className="flex flex-col gap-3">
        <SummaryBlock spending={spending} summary={summary} params={params} />
        <SectionRows
          rows={arrange(shown, {
            sideColumn:
              (here.arrangement ?? DEFAULT_ARRANGEMENT) === "side-column",
          })}
          sections={sections}
        />
      </div>

      <CustomizeSheet
        open={customizing !== null}
        onOpenChange={(open) => {
          if (!open) setCustomizing(null);
        }}
        focus={customizing?.focus ?? null}
        layout={layout}
        screen={screen}
        onChange={(next) => {
          setLayout(next);
          save.run();
        }}
        saving={save.pending}
      />
    </AppShell>
  );
}

/** The entries picked on the screen, newest first, with search, order and filters. */
function EntriesSection({
  summary,
  params,
  options,
  onCustomize,
}: {
  summary: MonthSummary;
  params: SpendingParams;
  options: EntriesSettings;
  /** Opens Customize at this section. */
  onCustomize: () => void;
}) {
  const { month, days } = summary;
  const pinned = use(BesideSideColumn);

  return (
    <section
      id="entries"
      aria-labelledby="entries-heading"
      className={cn("flex scroll-mt-3 flex-col gap-4 bg-card py-6", BLOCK, PAD)}
    >
      <EntriesList
        summary={summary}
        params={params}
        options={options}
        pinned={pinned}
        head={
          <>
            <div className="flex items-center justify-between gap-2">
              <h2
                id="entries-heading"
                className={cn(
                  DISPLAY,
                  "text-2xl font-extrabold tracking-tight",
                )}
              >
                {days === null
                  ? `All of ${month.name}`
                  : daysLabel(month, days)}
              </h2>
              <SectionCustomizeButton
                name="Entries"
                onClick={onCustomize}
                className="-my-2 -mr-2"
              />
            </div>
            {days !== null && (
              <Button
                variant="outline"
                size="lg"
                className="h-11 self-start"
                onClick={() => {
                  params.setDays(undefined);
                }}
              >
                See all of {month.name}
              </Button>
            )}
          </>
        }
      />
    </section>
  );
}

/**
 * The biggest categories or accounts, each against the comparison, with the rest one tap away.
 * Picking one narrows the whole screen; its chip on the ink block clears it. The shares, the
 * movers and the sorting are the section's own settings. "Show 14 more · Rs 454,300" says what
 * is hidden. Its Donut chart setting shows how the total splits instead; the list's settings and
 * sort don't apply to it.
 */
function BreakdownSection({
  id,
  heading,
  by,
  plural,
  chart,
  donut,
  usual,
  summary,
  rows,
  selected,
  onSelect,
  detail,
  headingOpens,
  order,
  onOrder,
  share,
  sorting,
  movers = [],
  onCustomize,
}: {
  /** Makes the heading's id, such as "categories-heading". */
  id: string;
  heading: string;
  by: "category" | "account";
  /** "categories", for "Sort categories by". */
  plural: string;
  /** A donut chart in place of the list: a setting in Customize. */
  chart: boolean;
  /** The chart's own settings. */
  donut: Pick<
    BreakdownSettings,
    "byEntries" | "amounts" | "change" | "summary"
  >;
  /** The rows usually biggest, which keep their chart colours. */
  usual: readonly string[];
  summary: MonthSummary;
  rows: readonly BreakdownRow[];
  selected: string | undefined;
  onSelect: (name: string | undefined) => void;
  /** The page a picked row opens, if it has one: its path, from its name. */
  detail?: (name: string) => string;
  /** Where the heading opens, if anywhere: all of them over the months. */
  headingOpens?: "/spending/categories";
  /** How the rows are sorted: by amount, change, name or entries, either way. */
  order: RowOrder;
  onOrder: (order: RowOrder) => void;
  /** Each row's share of spending, "31%". */
  share: boolean;
  /** The "Sort:" controls. */
  sorting: boolean;
  /** The rows the headline names, biggest change first. They stay in view, tagged. */
  movers?: readonly string[];
  /** Opens Customize at this section. */
  onCustomize: () => void;
}) {
  const canSort = sorting && rows.length > 1;
  // Change needs something to compare with. Without it, a sort by change shows by amount.
  const hasChange = summary.before !== null;
  const sort: RowOrder =
    order.by === "change" && !hasChange
      ? { by: "amount", reversed: false }
      : order;
  const [expanded, setExpanded] = useState(false);

  const ordered = canSort ? sortRows(rows, sort) : rows;
  // The top few, plus the picked row and the movers wherever they are.
  const short = ordered.filter(
    (row, index) =>
      index < TOP_ROWS || row.name === selected || movers.includes(row.name),
  );
  const hidden = ordered.filter((row) => !short.includes(row));
  // One hidden row just shows: a button for it would say no less than the row.
  const folds = hidden.length > 1;
  const shown = folds && !expanded ? short : ordered;
  const hiddenTotal = hidden.reduce((all, row) => all + row.spent, 0);

  const actions = (picked: BreakdownRow) => (
    <RowActions
      row={picked}
      count={picked.entries}
      {...(detail === undefined ? {} : { detail: detail(picked.name) })}
      onSeeEntries={scrollToEntries}
    />
  );

  const direction =
    summary.before !== null && summary.total < summary.before ? "drop" : "rise";
  const tags = Object.fromEntries(
    movers.map((name, index) => [
      name,
      `${index === 0 ? "Biggest" : "2nd biggest"} ${direction}`,
    ]),
  );

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={cn("flex flex-col gap-5 bg-card py-6", BLOCK, PAD)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 id={`${id}-heading`} className={HEADING}>
            {headingOpens === undefined ? (
              heading
            ) : (
              <HeadingLink
                href={headingOpens}
                opens="all categories over the months"
              >
                {heading}
              </HeadingLink>
            )}
          </h2>
          <SectionCustomizeButton
            name={heading}
            onClick={onCustomize}
            className="-my-2 -mr-2"
          />
        </div>
        {!chart && (
          // The row gap makes room for the menu button's full height when it wraps.
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <BreakdownLegend summary={summary} />
            {canSort && (
              // On narrow phones it wraps to its own line, on the right.
              <SortMenu
                fields={SORTS}
                keys={SORT_KEYS.filter((key) => hasChange || key !== "change")}
                order={sort}
                onOrder={onOrder}
                label={`Sort ${plural}`}
                className="-my-2 -mr-2 ml-auto"
              />
            )}
          </div>
        )}
      </div>
      {chart ? (
        // In a card stretched to its neighbour's height, the chart sits in the middle of the room.
        <div className="flex flex-1 flex-col justify-center">
          <BreakdownDonut
            summary={summary}
            rows={rows}
            by={by}
            plural={plural}
            selected={selected}
            onSelect={onSelect}
            usual={usual}
            options={donut}
            actions={actions}
          />
        </div>
      ) : (
        <BreakdownRows
          summary={summary}
          rows={ordered}
          shown={shown}
          selected={selected}
          onSelect={onSelect}
          share={share}
          counts={canSort && sort.by === "entries"}
          tags={tags}
          actions={actions}
        />
      )}
      {!chart && folds && (
        <Button
          variant="outline"
          size="lg"
          aria-expanded={expanded}
          className="h-11 self-start"
          onClick={() => {
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            `Show the top ${String(TOP_ROWS)}`
          ) : (
            <span>
              Show {hidden.length} more · <Money value={hiddenTotal} />
            </span>
          )}
        </Button>
      )}
    </section>
  );
}

// Each sort: its name, what its usual and reversed ways are called, and whether it sorts words.
// Change isn't offered with nothing to compare.
const SORTS = {
  amount: { name: "Amount", ways: ["High to low", "Low to high"] },
  change: { name: "Change", ways: ["Rises first", "Drops first"] },
  name: { name: "Name", ways: ["A to Z", "Z to A"], words: true },
  entries: { name: "Entries", ways: ["Most first", "Fewest first"] },
} as const satisfies Record<RowOrder["by"], SortField>;
const SORT_KEYS = ["amount", "change", "name", "entries"] as const;

/** One of five shades, from nothing to the busiest day. The list and the labels carry the numbers. */
function shade(amount: number, largest: number): string {
  if (amount === 0) return "bg-muted";
  const share = amount / largest;
  if (share <= 0.25) return "bg-primary/20";
  if (share <= 0.5) return "bg-primary/40";
  if (share <= 0.75) return "bg-primary/65";
  return "bg-primary text-primary-foreground";
}

/** Swipes left or right on touch. Everyone else has the arrows on the ink block. */
function useSwipe(onSwipe: (by: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      start.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: PointerEvent) => {
      const from = start.current;
      start.current = null;
      if (from === null) return;
      const dx = event.clientX - from.x;
      const dy = event.clientY - from.y;
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
        onSwipe(dx < 0 ? 1 : -1);
      }
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}

/** The first and last of two days, in order. */
function between(one: number, two: number): DayRange {
  return { from: Math.min(one, two), to: Math.max(one, two) };
}

/**
 * A day's cell: square, and shorter than square when the calendar is wide, alone on a row, so the
 * month isn't 800 px tall.
 */
const CELL_SHAPE = "aspect-square @min-[40rem]:aspect-3/2";

/** With week totals, from tablet width: seven days, then a wider column for the week's total. */
const WEEK_GRID =
  "grid-cols-7 @min-[30rem]:grid-cols-[repeat(7,minmax(0,1fr))_minmax(0,1.5fr)]";

/**
 * "5 no-spend days so far", or for a category or account, "18 days with nothing on Groceries so
 * far". Today isn't counted until it's over.
 */
function noSpendLine(summary: MonthSummary, count: number): string {
  const { month, category, account } = summary;
  const where = [
    category === undefined ? "" : `on ${category}`,
    account === undefined ? "" : `from ${account}`,
  ]
    .filter((part) => part !== "")
    .join(" ");
  const when = month.current ? "so far" : `in ${month.name}`;
  const plural = count === 1 ? "" : "s";
  if (where === "") {
    return count === 0
      ? `You spent every day ${when}.`
      : `${String(count)} no-spend day${plural} ${when}.`;
  }
  return count === 0
    ? `You spent ${where} every day ${when}.`
    : `${String(count)} day${plural} with nothing ${where} ${when}.`;
}

/**
 * The month as a grid of days, Monday first, each shaded by what was spent. Tapping a day picks it.
 * "Pick days" picks a run: tap the first day, then the last, with no dragging. On a computer,
 * Shift+click picks from the picked day to the one clicked. Its settings: each day's amount (on by
 * default), a ring on no-spend days with their count, and week totals, beside each week from
 * tablet width and listed under the grid on phones.
 */
function Calendar({
  spending,
  summary,
  params,
  days,
  options,
  onCustomize,
}: {
  spending: Spending;
  /** The whole month. */
  summary: MonthSummary;
  params: SpendingParams;
  /** The days picked, outlined here. */
  days: DayRange | null;
  /** The calendar's own settings, switched in Customize. */
  options: CalendarSettings;
  /** Opens Customize at this section. */
  onCustomize: () => void;
}) {
  const amountText = useAmountText();
  const { month } = summary;
  const keys = spending.months.map((data) => data.month);
  const index = keys.indexOf(month.key);
  const swipe = useSwipe((by) => {
    const key = keys[index + by];
    if (key !== undefined) params.setMonth(key);
  });
  // Null, or picking a run of days: before the first tap, then with the first day.
  const [picking, setPicking] = useState<{ first: number | null } | null>(null);

  const daily = dailyTotals(summary.entries, month.through);
  const largest = Math.max(1, ...daily);
  // Blank cells before the 1st, Monday first.
  const lead = (month.firstWeekday + 6) % 7;
  // The grid's rows: each week's days in this month, and what was spent in them so far.
  const weeks = Array.from(
    { length: Math.ceil((lead + month.days) / 7) },
    (_, row) => {
      const from = Math.max(1, row * 7 - lead + 1);
      const to = Math.min(month.days, row * 7 + 7 - lead);
      const counted = Math.min(to, month.through);
      return {
        row,
        from,
        to,
        counted,
        total:
          from > month.through
            ? null
            : daily
                .slice(from - 1, counted)
                .reduce((all, amount) => all + amount, 0),
      };
    },
  );
  // A day that is over with nothing spent. Today isn't over yet.
  const isNoSpend = (day: number) =>
    options.noSpend &&
    day <= month.through &&
    (daily[day - 1] ?? 0) === 0 &&
    !(month.current && day === month.through);
  const noSpendCount = weeks
    .flatMap(({ from, to }) =>
      Array.from({ length: to - from + 1 }, (_, offset) => from + offset),
    )
    .filter(isNoSpend).length;

  const isPicked = (day: number) =>
    picking
      ? picking.first === day
      : days !== null && day >= days.from && day <= days.to;

  const tap = (day: number, event: MouseEvent) => {
    if (picking?.first === null) {
      setPicking({ first: day });
    } else if (picking) {
      params.setDays(between(picking.first, day));
      setPicking(null);
    } else if (event.shiftKey && days !== null) {
      params.setDays(between(days.from, day));
    } else {
      const only = days?.from === day && days.to === day;
      params.setDays(only ? undefined : { from: day, to: day });
    }
  };

  // One day's cell: a button that picks it, or a faint number for a day still to come.
  const dayCell = (day: number) => {
    const amount = daily[day - 1] ?? 0;
    const today = month.current && day === month.through;
    const name = `${today ? "Today, " : ""}${longDayLabel(month, day)}`;
    if (day > month.through) {
      return (
        <li key={day}>
          <span
            className={cn(
              "flex w-full items-start rounded-lg p-1.5 text-xs text-muted-foreground/60 @min-[30rem]:text-sm",
              CELL_SHAPE,
            )}
          >
            <span className="sr-only">{name}, still to come</span>
            <span aria-hidden="true">{day}</span>
          </span>
        </li>
      );
    }
    const picked = isPicked(day);
    const noSpend = isNoSpend(day);
    const spent =
      amount > 0
        ? `${amountText(amount)} spent`
        : noSpend
          ? "nothing spent, a no-spend day"
          : "nothing spent";
    return (
      <li key={day}>
        <button
          type="button"
          aria-pressed={picked}
          aria-label={`${name}: ${spent}`}
          onClick={(event) => {
            tap(day, event);
          }}
          className={cn(
            "relative flex w-full flex-col justify-between overflow-hidden rounded-lg p-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            CELL_SHAPE,
            shade(amount, largest),
            picked && "ring-2 ring-foreground ring-offset-1 ring-offset-card",
          )}
        >
          <span
            className={cn(
              "text-xs font-semibold @min-[30rem]:text-sm",
              today && "underline decoration-2 underline-offset-2",
            )}
          >
            {day}
          </span>
          {amount > 0 && options.amounts && <CellAmount value={amount} />}
          {noSpend && (
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full border-2 border-primary"
            />
          )}
        </button>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Customize stays at the top right, as on every section; on narrow phones only Pick days
          wraps, under the heading. */}
      <div className="flex items-start gap-1 px-1">
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
          <h2
            id="calendar-heading"
            className={cn(DISPLAY, "text-2xl font-extrabold tracking-tight")}
          >
            {month.name} by day
          </h2>
          <Button
            variant="outline"
            size="lg"
            className="h-11"
            onClick={() => {
              setPicking(picking ? null : { first: null });
            }}
          >
            {picking ? (
              "Cancel"
            ) : (
              <>
                <CalendarRange aria-hidden="true" />
                Pick days
              </>
            )}
          </Button>
        </div>
        <SectionCustomizeButton
          name="Calendar"
          onClick={onCustomize}
          className="-mr-2"
        />
      </div>
      <p
        aria-live="polite"
        className={cn(
          picking
            ? "rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground"
            : "sr-only",
        )}
      >
        {picking &&
          (picking.first === null
            ? "Tap the first day."
            : `From ${longDayLabel(month, picking.first)}. Now tap the last day.`)}
      </p>

      <div className="@container touch-pan-y select-none" {...swipe}>
        <div
          aria-hidden="true"
          className={cn(
            "grid gap-1 pb-1 text-center text-xs font-semibold text-muted-foreground",
            options.weekTotals ? WEEK_GRID : "grid-cols-7",
          )}
        >
          {WEEKDAYS.map(({ key, letter }) => (
            <span key={key}>{letter}</span>
          ))}
          {options.weekTotals && (
            <span className="hidden pr-1 text-right @min-[30rem]:block">
              Week
            </span>
          )}
        </div>
        <ol
          className={cn(
            "grid animate-in gap-1 duration-200 fade-in motion-reduce:animate-none",
            options.weekTotals ? WEEK_GRID : "grid-cols-7",
          )}
        >
          {weeks.map((week) => {
            const before = week.row === 0 ? lead : 0;
            const count = week.to - week.from + 1;
            return (
              <Fragment key={week.from}>
                {Array.from({ length: before }, (_, blank) => (
                  <li key={`blank-${String(blank)}`} aria-hidden="true" />
                ))}
                {Array.from({ length: count }, (_, offset) =>
                  dayCell(week.from + offset),
                )}
                {options.weekTotals && (
                  <>
                    {/* The last week's empty days, so its total stays in the last column. */}
                    {Array.from({ length: 7 - before - count }, (_, blank) => (
                      <li key={`after-${String(blank)}`} aria-hidden="true" />
                    ))}
                    <li className="hidden items-center justify-end pr-1 text-right text-xs/tight font-semibold tabular-nums @min-[30rem]:flex">
                      {week.total !== null && (
                        <span>
                          <span className="sr-only">
                            {`Week of ${daysLabel(month, { from: week.from, to: week.counted })}: `}
                          </span>
                          <Money value={week.total} />
                        </span>
                      )}
                    </li>
                  </>
                )}
              </Fragment>
            );
          })}
        </ol>
        {options.weekTotals && (
          // Phones have no room for a column, so the weeks are listed under the grid.
          <div className="mt-3 flex flex-col gap-1 border-t pt-3 @min-[30rem]:hidden">
            <p className="px-1 text-sm font-semibold">Weeks</p>
            <dl className="flex flex-col">
              {weeks.map(
                (week) =>
                  week.total !== null && (
                    <div
                      key={week.from}
                      className="flex items-baseline justify-between gap-3 p-1 text-sm"
                    >
                      <dt className="text-muted-foreground">
                        {daysLabel(month, {
                          from: week.from,
                          to: week.counted,
                        })}
                      </dt>
                      <dd className="font-semibold tabular-nums">
                        <Money value={week.total} />
                      </dd>
                    </div>
                  ),
              )}
            </dl>
          </div>
        )}
      </div>
      {options.noSpend && (
        <p className="flex items-center gap-2 px-1 text-sm">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full border-2 border-primary"
          />
          {noSpendLine(summary, noSpendCount)}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 text-sm text-muted-foreground">
        <span aria-hidden="true" className="inline-flex items-center gap-1.5">
          Less
          {[
            "bg-muted",
            "bg-primary/20",
            "bg-primary/40",
            "bg-primary/65",
            "bg-primary",
          ].map((swatch) => (
            <span key={swatch} className={cn("size-3.5 rounded-sm", swatch)} />
          ))}
          More
        </span>
        <span>Tap a day. Swipe for other months.</span>
      </div>
    </div>
  );
}

/**
 * A day's amount in its cell, from tablet width. It breaks only after "Rs", never inside the
 * number. The button's label says the amount to screen readers.
 */
function CellAmount({ value }: { value: number }) {
  const { hidden } = use(AmountsContext);
  return (
    <span
      aria-hidden="true"
      className="hidden text-[0.625rem]/tight font-semibold tabular-nums @min-[30rem]:block"
    >
      Rs {hidden ? "•••••" : formatDigits(value)}
    </span>
  );
}

/** A breakdown's card while loading: its heading and five rows. */
function BreakdownSkeleton() {
  return (
    <div className={cn("flex flex-col gap-4 bg-card py-6", BLOCK, PAD)}>
      <Skeleton className="h-8 w-40" />
      {[0, 1, 2, 3, 4].map((line) => (
        <div key={line} className="flex flex-col gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-4 w-44" />
        </div>
      ))}
    </div>
  );
}

// The skeleton for each section, for the rows of d and e.
const SKELETONS: Record<SectionKey, ReactNode> = {
  pace: (
    <div className={cn("flex flex-col gap-4 py-6", INK, BLOCK, PAD)}>
      <Skeleton className="h-8 w-40 bg-(--ink-foreground)/20" />
      <Skeleton className="h-48 w-full bg-(--ink-foreground)/20" />
    </div>
  ),
  categories: <BreakdownSkeleton />,
  accounts: <BreakdownSkeleton />,
  calendar: (
    <div className={cn("flex flex-col gap-3 bg-card px-3 py-5 md:px-6", BLOCK)}>
      <Skeleton className="h-8 w-48" />
      <div className="@container">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, cell) => (
            <Skeleton
              key={`cell-${String(cell)}`}
              className={cn("w-full", CELL_SHAPE)}
            />
          ))}
        </div>
      </div>
    </div>
  ),
  habits: (
    <div className={cn("flex flex-col gap-4 bg-card py-6", BLOCK, PAD)}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
    </div>
  ),
  entries: (
    <div className={cn("flex flex-col gap-4 bg-card py-6", BLOCK, PAD)}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-11 w-full" />
      {[0, 1, 2, 3, 4, 5].map((line) => (
        <Skeleton key={line} className="h-11 w-full" />
      ))}
    </div>
  ),
};

// The sections shown before anything is customized.
const DEFAULT_SHOWN = DEFAULT_LAYOUT.order.filter((key) =>
  isShown(DEFAULT_LAYOUT, key),
);

/** Shaped like the default layout: the ink summary, then the default sections in their rows. */
function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">Loading your spending</span>
      <div className={cn("flex flex-col gap-3 pt-3 pb-6", INK, BLOCK, PAD)}>
        <Skeleton className="mx-auto h-11 w-48 bg-(--ink-foreground)/20" />
        <Skeleton className="h-12 w-56 max-w-full bg-(--ink-foreground)/20" />
        <Skeleton className="h-5 w-full max-w-md bg-(--ink-foreground)/20" />
        <Skeleton className="h-5 w-full max-w-xs bg-(--ink-foreground)/20" />
      </div>
      <SectionRows
        rows={arrange(DEFAULT_SHOWN, {
          sideColumn: DEFAULT_ARRANGEMENT === "side-column",
        })}
        sections={SKELETONS}
      />
    </div>
  );
}
