"use client";

import { MoveRight, TrendingDown, TrendingUp } from "lucide-react";
import { Fragment, type ReactNode, useId, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AppShell } from "@proto/components/app-shell";
import {
  CustomizeButton,
  CustomizeSheet,
  SectionCustomizeButton,
} from "@proto/components/customize-sheet";
import { Money } from "@proto/components/amounts";
import { ScreenLink } from "@proto/components/screen-link";
import { useProtoAction } from "@proto/kit/use-proto-action";
import {
  CategoryMenu,
  entriesWord,
  entryCount,
  useBook,
} from "@proto/screens/categories/manage";
import {
  type BookSummary,
  type CategoryLine,
  entriesOf,
  lineOf,
  spentInLabel,
} from "@proto/screens/categories/math";
import {
  BackToCategories,
  ErrorBlock,
  NotFoundBlock,
  RangeChoice,
} from "@proto/screens/categories/parts";
import type { CategoryBook } from "@proto/screens/categories/scenarios";
import {
  type CategoriesParams,
  useCategoriesParams,
} from "@proto/screens/categories/use-categories-params";
import {
  ByMonthChart,
  type Colours,
} from "@proto/screens/categories/month-chart";
import {
  AgainstAverage,
  ClearChip,
  MonthStepper,
  SURFACE,
  spanOf,
} from "@proto/screens/categories/chart-parts";
import {
  BigNumber,
  LEFT,
  RIGHT,
  SPLIT,
  SpendingByMonthSkeleton,
  Stat,
} from "@proto/screens/categories/variants/mix-top";
import {
  monthsWord,
  rangeTitle,
  CARD_HEADING,
} from "@proto/screens/categories/look";
import { Headline, joinAnd } from "@proto/screens/spending/parts";
import { useScreen } from "@proto/screens/spending/use-screen";
import {
  forecastOf,
  sitsIn,
  type Trend,
  trendOf,
  type Typical,
  typicalOf,
  yearBefore,
} from "../insights";
import {
  CUSTOMIZE,
  DEFAULT_LAYOUT,
  type DetailLayout,
  type DetailSectionKey,
  isShown,
  LEAD,
  type MonthsSettings,
  normalize,
  screenLayout,
  sectionSettings,
} from "../layout";
import type { CategoryDetailViewProps } from "../scenarios";
import { useShownCategory } from "../use-shown-category";
import {
  AutoFileDialog,
  MonthNote,
  PaidWith,
  RangeEntries,
  Places,
  Repeats,
  Unusual,
  WhyItChanged,
  Years,
} from "./mix-sections";

/**
 * Mix (d) for one category, in d's Categories look. On top, its months: the average a month with
 * its usual range and trend, and the same split-bar chart, here one category, with totals on top,
 * the usual range as a band, notes as dots and this month's likely end as a dashed box. A picked
 * month swaps the numbers for that month. Under it, cards that go past what Spending and
 * Categories show (why it changed, places over time, repeats, what stands out, accounts, years),
 * then the entries of every month, as on Spending. Auto-file rules are in the ⋯ menu. Customize,
 * in the header and on each card, shows, hides and orders the cards and switches their extras, as
 * on Spending; one layout for every category, saved to the account.
 */
export function MixDetail(props: CategoryDetailViewProps) {
  if (props.status === "ready") {
    return (
      <Ready
        initial={props.book}
        start={props.category}
        seeded={props.notes}
        saved={props.layout ?? DEFAULT_LAYOUT}
      />
    );
  }
  return (
    <AppShell current="spending" title="Category">
      {props.status === "loading" ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Loading this category</span>
          <SpendingByMonthSkeleton />
          <div className="grid gap-3 @min-[46rem]:grid-cols-2">
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
          </div>
        </div>
      ) : (
        <ErrorBlock message={props.message} />
      )}
    </AppShell>
  );
}

function Ready({
  initial,
  start,
  seeded,
  saved,
}: {
  initial: CategoryBook;
  start: string;
  seeded: Readonly<Record<string, string>>;
  /** The layout saved to the account. */
  saved: DetailLayout;
}) {
  const base = useBook(initial);
  const { shown, deleted, state, onMerged, onDeleted } = useShownCategory(
    base,
    start,
  );
  const { book } = base;
  const params = useCategoriesParams(book);
  const [notes, setNotes] = useState(seeded);
  const [rules, setRules] = useState<readonly string[]>([]);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [layout, setLayout] = useState(() => normalize(saved));
  // A phone shows the phone's own layout, if it has one.
  const screen = useScreen();
  const here = screenLayout(layout, screen);
  // Customize is open: from the header (focus null), or from a card's own button.
  const [customizing, setCustomizing] = useState<{
    focus: string | null;
  } | null>(null);
  const customize = (focus: string | null) => () => {
    setCustomizing({ focus });
  };
  // Saving to the account runs in memory here. `?latency=slow` shows "Saving…".
  const save = useProtoAction(() => undefined);

  if (shown === undefined) {
    return (
      <AppShell current="spending" title={deleted ?? start}>
        <div className="flex flex-col gap-3">
          <BackToCategories rangeQuery={params.rangeQuery} />
          {deleted === null ? (
            <NotFoundBlock name={start} />
          ) : (
            <Deleted name={deleted} />
          )}
        </div>
      </AppShell>
    );
  }

  const line = lineOf(book, params.months, shown);
  const picked = line.cells.find((cell) => cell.month.key === params.month);
  const months = picked === undefined ? params.months : [picked.month];
  const period =
    picked === undefined
      ? rangeTitle(params.months, params.range, book.today)
      : `${picked.month.name} ${String(picked.month.year)}`;
  const dated = entriesOf(book, shown, months);
  const rangeDated = entriesOf(book, shown, params.months);

  return (
    <AppShell
      current="spending"
      title={shown}
      actions={
        <div className="flex items-center gap-1">
          <CustomizeButton
            label="Customize this page"
            onClick={customize(null)}
          />
          <CategoryMenu
            state={state}
            name={shown}
            onMerged={onMerged}
            onDeleted={onDeleted}
            more={[
              {
                label: "Auto-file places…",
                onSelect: () => {
                  setRulesOpen(true);
                },
              },
            ]}
          />
        </div>
      }
    >
      <div className="@container flex flex-col gap-3">
        <BackToCategories rangeQuery={params.rangeQuery} />
        {book.hidden.includes(shown) && (
          <p className="text-sm text-muted-foreground">
            Hidden: it doesn&apos;t show when you add an entry. Its history
            stays here.
          </p>
        )}
        {rules.length > 0 && (
          <p className="text-sm text-muted-foreground">
            New entries from {joinAnd(rules)} file here on their own.
          </p>
        )}
        {entryCount(book, shown) === 0 ? (
          <NothingYet name={shown} />
        ) : (
          <>
            <MonthsBlock
              book={book}
              line={line}
              params={params}
              settings={sectionSettings(here, "months")}
              onCustomize={customize(LEAD.key)}
              notes={notes}
              onNote={(key, text) => {
                setNotes((now) => {
                  // An empty note removes it.
                  const others = Object.fromEntries(
                    Object.entries(now).filter(([month]) => month !== key),
                  );
                  return text === "" ? others : { ...others, [key]: text };
                });
              }}
            />
            <SectionRuns
              order={here.order.filter((key) => isShown(here, key))}
              cards={{
                why: (
                  <WhyItChanged
                    line={line}
                    today={book.today}
                    settings={sectionSettings(here, "why")}
                    onCustomize={customize("why")}
                  />
                ),
                places: (
                  <Places
                    book={book}
                    name={shown}
                    line={line}
                    months={months}
                    period={period}
                    settings={sectionSettings(here, "places")}
                    onCustomize={customize("places")}
                  />
                ),
                repeats: (
                  <Repeats
                    book={book}
                    name={shown}
                    settings={sectionSettings(here, "repeats")}
                    onCustomize={customize("repeats")}
                  />
                ),
                unusual: (
                  <Unusual
                    dated={dated}
                    usualOver={rangeDated}
                    period={period}
                    onCustomize={customize("unusual")}
                  />
                ),
                paid: (
                  <PaidWith
                    dated={dated}
                    period={period}
                    onCustomize={customize("paid")}
                  />
                ),
                years: (
                  <Years
                    book={book}
                    name={shown}
                    onCustomize={customize("years")}
                  />
                ),
                entries: (
                  <RangeEntries
                    book={book}
                    name={shown}
                    months={months}
                    period={period}
                    settings={sectionSettings(here, "entries")}
                    onCustomize={customize("entries")}
                  />
                ),
              }}
            />
          </>
        )}
      </div>
      <CustomizeSheet
        model={CUSTOMIZE}
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
      <AutoFileDialog
        open={rulesOpen}
        onOpenChange={setRulesOpen}
        book={book}
        name={shown}
        rules={rules}
        onSave={setRules}
      />
    </AppShell>
  );
}

/**
 * The shown cards in the person's order: a run of cards flows down two columns from tablet width,
 * and the entries, a list that grows, take the full width where they come.
 */
function SectionRuns({
  order,
  cards,
}: {
  order: readonly DetailSectionKey[];
  cards: Readonly<Record<DetailSectionKey, ReactNode>>;
}) {
  const runs: DetailSectionKey[][] = [];
  for (const key of order) {
    const last = runs.at(-1);
    if (key === "entries" || last === undefined || last[0] === "entries") {
      runs.push([key]);
    } else {
      last.push(key);
    }
  }
  return (
    <>
      {runs.map((run) =>
        run[0] === "entries" ? (
          <div key="entries">{cards.entries}</div>
        ) : (
          // Each card keeps a gap under it; the run takes back the last one's.
          <div
            key={run.join("-")}
            className="-mb-3 columns-1 gap-3 @min-[46rem]:columns-2"
          >
            {run.map((key) => (
              <Fragment key={key}>{cards[key]}</Fragment>
            ))}
          </div>
        ),
      )}
    </>
  );
}

/**
 * The months on top, as d's "Spending by month" block: the numbers on the left, the chart on the
 * right, one card. A picked month swaps the numbers for that month; on phones it shows under the
 * chart, where it was tapped.
 */
function MonthsBlock({
  book,
  line,
  params,
  settings,
  onCustomize,
  notes,
  onNote,
}: {
  book: CategoryBook;
  line: CategoryLine;
  params: CategoriesParams;
  /** Its extras, switched in Customize. */
  settings: MonthsSettings;
  onCustomize: () => void;
  notes: Readonly<Record<string, string>>;
  onNote: (month: string, text: string) => void;
}) {
  const headingId = useId();
  const typical = settings.usualRange ? typicalOf(line.cells) : null;
  const trend = settings.trend ? trendOf(line.cells) : null;
  const forecast =
    settings.forecast && line.cells.some((cell) => cell.month.current)
      ? forecastOf(book, line.name)
      : null;
  const index = line.cells.findIndex((cell) => cell.month.key === params.month);
  const title = rangeTitle(params.months, params.range, book.today);
  // The chart draws one category: the book's chart, fed this category alone.
  const summary: BookSummary = {
    ...line,
    months: params.months,
    lines: [line],
    now: line.now,
  };
  const colours: Colours = new Map([[line.name, "var(--chart-1)"]]);

  return (
    <section
      aria-labelledby={headingId}
      className={cn(SURFACE, "@container/top flex flex-col gap-5")}
    >
      {/* The heading, then the range, then Customize at the right; on phones the range takes a row. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-3 @min-[28rem]/top:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={headingId} className={CARD_HEADING}>
            Month by month
          </h2>
          <p className="text-sm text-muted-foreground">
            {params.months.length > 1
              ? `${title} · ${spanOf(params.months)}`
              : title}
          </p>
        </div>
        <RangeChoice
          params={params}
          className="col-span-2 row-start-2 w-full *:flex-1 *:px-2 @min-[28rem]/top:col-span-1 @min-[28rem]/top:row-start-1 @min-[28rem]/top:w-auto @min-[28rem]/top:*:flex-none @min-[28rem]/top:*:px-3"
        />
        <SectionCustomizeButton
          name="Month by month"
          onClick={onCustomize}
          className="-mr-2"
        />
      </div>

      <div className={SPLIT}>
        <Overview
          line={line}
          typical={typical}
          trend={trend}
          className={cn(LEFT, index !== -1 && "@min-[46rem]/top:hidden")}
        />
        <div className={cn("@container/chart flex min-w-0 flex-col", RIGHT)}>
          <ByMonthChart
            summary={summary}
            colours={colours}
            params={{ ...params, category: undefined }}
            amounts={settings.totals}
            biggest={settings.biggest}
            keyOnTop
            fill
            band={typical}
            {...(settings.notes ? { marked: new Set(Object.keys(notes)) } : {})}
            forecast={
              forecast === null
                ? null
                : { likely: forecast.likely, month: forecast.month }
            }
          />
        </div>
        {index !== -1 && (
          <PickedMonth
            book={book}
            line={line}
            index={index}
            params={params}
            typical={typical}
            settings={settings}
            note={notes[params.month ?? ""]}
            onNote={onNote}
          />
        )}
      </div>
    </section>
  );
}

/** "Usually Rs 72,000 to Rs 77,100 a month", or for a rare one, "Most months: nothing". */
function TypicalLine({ typical }: { typical: Typical }) {
  return (
    <p className="text-muted-foreground">
      {typical.high === 0 ? (
        "Most months: nothing"
      ) : (
        <>
          Usually <Money value={typical.low} /> to{" "}
          <Money value={typical.high} /> a month
        </>
      )}
    </p>
  );
}

/** "Rising: about Rs 2,400 more each month", with an arrow, never colour alone. */
function TrendLine({ trend }: { trend: Trend }) {
  const Icon =
    trend.kind === "rising"
      ? TrendingUp
      : trend.kind === "falling"
        ? TrendingDown
        : MoveRight;
  return (
    <p className="inline-flex items-center gap-1.5">
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {trend.kind === "steady" ? (
        "Steady over these months"
      ) : (
        <span>
          {trend.kind === "rising" ? "Rising" : "Falling"}: about{" "}
          <Money value={trend.perMonth} />{" "}
          {trend.kind === "rising" ? "more" : "less"} each month
        </span>
      )}
    </p>
  );
}

/** The range, nothing picked: the average a month, its usual range and trend, then the figures. */
function Overview({
  line,
  typical,
  trend,
  className,
}: {
  line: CategoryLine;
  typical: Typical | null;
  trend: Trend | null;
  className: string;
}) {
  const current = line.cells.find((cell) => cell.month.current);
  return (
    <div className={cn("@container flex min-w-0 flex-col gap-4", className)}>
      <BigNumber
        value={line.average ?? line.now.total}
        label={
          line.average === null ? "so far this month" : "a month on average"
        }
      >
        {typical !== null && <TypicalLine typical={typical} />}
        {trend !== null && <TrendLine trend={trend} />}
      </BigNumber>
      {line.cells.length > 1 && (
        <dl className="flex flex-wrap gap-x-6 gap-y-3 border-t border-foreground/10 pt-4 tabular-nums">
          <Stat term={`In ${monthsWord(line.cells.length)}`}>
            <Money value={line.total} />
          </Stat>
          <Stat term="How often">{spentInLabel(line)}</Stat>
          {current !== undefined && line.average !== null && (
            <Stat term={`${current.month.name} so far`}>
              <Money value={current.spent} />
            </Stat>
          )}
        </dl>
      )}
      <p>
        {line.isNew ? (
          "New this month: nothing before it to compare with."
        ) : (
          <Headline summary={line.now} />
        )}
      </p>
      <p className="text-sm text-muted-foreground">
        Pick a month on the chart for a closer look.
      </p>
    </div>
  );
}

/**
 * A picked month: what it came to against its average and its usual range, the same month last
 * year and its note. Its entries are in the card under the page.
 */
function PickedMonth({
  book,
  line,
  index,
  params,
  typical,
  settings,
  note,
  onNote,
}: {
  book: CategoryBook;
  line: CategoryLine;
  index: number;
  params: CategoriesParams;
  typical: Typical | null;
  settings: MonthsSettings;
  note: string | undefined;
  onNote: (month: string, text: string) => void;
}) {
  const cell = line.cells[index];
  if (cell === undefined) return null;
  const { month } = cell;
  const lastYear = settings.lastYear
    ? yearBefore(book, line.name, month.key)
    : null;
  const where =
    typical === null || typical.high === 0 || month.current
      ? null
      : sitsIn(typical, cell.spent);

  return (
    <div className={cn("@container flex min-w-0 flex-col gap-4", LEFT)}>
      <div className="flex flex-wrap gap-2">
        <ClearChip
          label={`${month.name} ${String(month.year)}`}
          onClear={() => {
            params.setMonth(undefined);
          }}
        />
      </div>
      <MonthStepper
        months={params.months}
        month={month}
        onPick={params.setMonth}
      />
      <BigNumber
        value={cell.spent}
        label={`spent · ${entriesWord(cell.entries)}`}
      >
        {month.current ? (
          <p>
            <Headline summary={line.now} />
          </p>
        ) : (
          <AgainstAverage spent={cell.spent} average={line.average} its />
        )}
        {where !== null && typical !== null && (
          <p className="text-muted-foreground">
            {where === "within"
              ? "Within its usual range"
              : where === "above"
                ? "Above its usual range"
                : "Below its usual range"}{" "}
            of <Money value={typical.low} /> to <Money value={typical.high} />
          </p>
        )}
      </BigNumber>
      {lastYear !== null && (
        <p>
          {lastYear.month.name} {lastYear.month.year}:{" "}
          <Money value={lastYear.spent} className="font-semibold" />
        </p>
      )}
      {settings.notes && (
        <MonthNote
          key={month.key}
          month={month}
          note={note}
          onSave={(text) => {
            onNote(month.key, text);
          }}
        />
      )}
    </div>
  );
}

/** A category with nothing spent in it, ever: what shows here once there is. */
function NothingYet({ name }: { name: string }) {
  return (
    <section className={cn(SURFACE, "flex flex-col items-start gap-3")}>
      <h2 className={cn(CARD_HEADING, "wrap-break-word")}>
        Nothing spent on {name} yet
      </h2>
      <p className="max-w-md text-muted-foreground">
        Its months, its average and where it goes show here once you log an
        expense in it.
      </p>
      <ScreenLink
        screen="Quick add"
        className={cn(
          buttonVariants({ variant: "secondary", size: "lg" }),
          "h-11",
        )}
      >
        Log an expense
      </ScreenLink>
    </section>
  );
}

/** After Delete: the category is gone. Undo, in the message, brings it back. */
function Deleted({ name }: { name: string }) {
  return (
    <section className={cn(SURFACE, "flex flex-col items-start gap-3")}>
      <h2 className={cn(CARD_HEADING, "wrap-break-word")}>{name} is deleted</h2>
      <p className="max-w-md text-muted-foreground">
        It had no entries, so nothing else changed.
      </p>
      <Link
        href="/spending/categories"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-11",
        )}
      >
        See all categories
      </Link>
    </section>
  );
}
