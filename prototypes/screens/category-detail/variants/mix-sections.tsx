"use client";

import { ArrowDown, ArrowUp, Plus, Search, StickyNote } from "lucide-react";
import { type ReactNode, type SyntheticEvent, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { SectionCustomizeButton } from "@proto/components/customize-sheet";
import { ScreenLink } from "@proto/components/screen-link";
import { EntriesLink, entriesWord } from "@proto/screens/categories/manage";
import {
  type CategoryLine,
  type DatedEntry,
  entriesOf,
  monthShort,
} from "@proto/screens/categories/math";
import type { CategoryBook } from "@proto/screens/categories/scenarios";
import { monthHeading, SURFACE } from "@proto/screens/categories/chart-parts";
import { Stat } from "@proto/screens/categories/variants/mix-top";
import { CARD_HEADING } from "@proto/screens/categories/look";
import { SHEET, SHEET_TITLE } from "@proto/components/customize-sheet";
import {
  dayLabel,
  type MonthInfo,
  monthInfo,
  search,
  sortEntries,
} from "@proto/screens/spending/math";
import { sharePercent } from "@proto/screens/spending/parts";
import {
  type SortField,
  SortMenu,
  type SortOrder,
} from "@proto/screens/spending/sort-menu";
import { useSpendingParams } from "@proto/screens/spending/use-spending-params";
import {
  movedOf,
  paidWith,
  placeStories,
  repeatsOf,
  unusualOf,
  usualEntry,
  yearBefore,
  yearsOf,
} from "../insights";
import type {
  EntriesSettings,
  PlacesSettings,
  RepeatsSettings,
  WhySettings,
} from "../layout";

// d's Category detail: the cards under the months, then the month's entries. A card says what it
// needs when there isn't enough data yet; Out of the ordinary shows only when something is.

/** A card: a title, what it covers, then its body. Cards flow down two columns from tablet width. */
function Section({
  title,
  about,
  onCustomize,
  children,
}: {
  title: string;
  about?: ReactNode;
  /** Opens Customize at this card. */
  onCustomize: () => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={cn(SURFACE, "mb-3 flex break-inside-avoid flex-col gap-3")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id={id} className={CARD_HEADING}>
            {title}
          </h2>
          {about !== undefined && (
            <p className="text-sm text-muted-foreground">{about}</p>
          )}
        </div>
        <SectionCustomizeButton
          name={title}
          onClick={onCustomize}
          className="-my-2 -mr-2"
        />
      </div>
      {children}
    </section>
  );
}

/** What a card needs before it can say anything. */
function Needs({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

/** A thin bar as long as a share, for lists. */
function ShareBar({ share }: { share: number }) {
  return (
    <span
      aria-hidden="true"
      className="block h-1.5 w-full overflow-hidden rounded-full bg-muted"
    >
      <span
        className="block h-full rounded-full bg-primary dark:bg-chart-1"
        style={{ width: `${String(Math.min(1, share) * 100)}%` }}
      />
    </span>
  );
}

/** "+8%" or "−3%", with an arrow: the words carry it, not the colour. */
function Moved({ ratio }: { ratio: number }) {
  if (Math.abs(ratio) < 0.01) {
    return <span className="whitespace-nowrap">about the same</span>;
  }
  const Icon = ratio > 0 ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
      <Icon aria-hidden="true" className="size-3.5" />
      {ratio > 0 ? "+" : "−"}
      {sharePercent(Math.abs(ratio))}
    </span>
  );
}

/** "8" or "5.6": entries a month, with a decimal only when it says something. */
function timesLabel(times: number): string {
  return times.toFixed(1).replace(/\.0$/, "");
}

/** "1st", "2nd", "16th". */
function ordinal(day: number): string {
  const tens = day % 100;
  if (tens >= 11 && tens <= 13) return `${String(day)}th`;
  const suffix = ["th", "st", "nd", "rd"][day % 10] ?? "th";
  return `${String(day)}${day % 10 > 3 ? "th" : suffix}`;
}

/** "Jan to May", or one month's name, with the year where it isn't this year. */
function spanLabel(
  months: readonly MonthInfo[],
  today: CategoryBook["today"],
): string {
  const first = months[0];
  const last = months.at(-1);
  if (first === undefined || last === undefined) return "";
  if (first.key === last.key) return monthShort(first, today);
  return `${monthShort(first, today)} to ${monthShort(last, today)}`;
}

/**
 * 3 · Why it changed: the later half of the finished months against the earlier half, a month
 * each, split into paying more (or less) each time and going more (or less) often.
 */
export function WhyItChanged({
  line,
  today,
  settings,
  onCustomize,
}: {
  line: CategoryLine;
  today: CategoryBook["today"];
  settings: WhySettings;
  onCustomize: () => void;
}) {
  const moved = movedOf(line.cells);
  if (moved === null) {
    return (
      <Section title="Why it changed" onCustomize={onCustomize}>
        <Needs>
          Shows once there are 4 finished months with regular spending to
          compare.
        </Needs>
      </Section>
    );
  }
  const { earlier, later, change, fromEach, fromTimes } = moved;
  const before = spanLabel(earlier.months, today);
  const after = spanLabel(later.months, today);
  const small = Math.max(earlier.perMonth * 0.02, 500);
  const parts = [
    {
      key: "each",
      value: fromEach,
      words: fromEach > 0 ? "paying more each time" : "paying less each time",
    },
    {
      key: "times",
      value: fromTimes,
      words: fromTimes > 0 ? "going more often" : "going less often",
    },
  ].filter((part) => Math.abs(part.value) >= small / 2);
  const sameWay = parts.every(
    (part) => Math.sign(part.value) === Math.sign(change),
  );

  return (
    <Section
      title="Why it changed"
      about={`${after}, against ${before}`}
      onCustomize={onCustomize}
    >
      <p>
        {Math.abs(change) < small ? (
          `About the same a month as in ${before}.`
        ) : (
          <>
            <Money value={Math.round(Math.abs(change))} />{" "}
            {change > 0 ? "more" : "less"} a month than in {before}.{" "}
            {parts.length === 1 && parts[0] !== undefined ? (
              // One cause: saying its amount again would repeat the change.
              `All of it from ${parts[0].words}.`
            ) : (
              <>
                {parts.map((part, index) => (
                  <span key={part.key}>
                    {index === 0 ? "" : " and "}
                    <Money value={Math.round(Math.abs(part.value))} /> from{" "}
                    {part.words}
                  </span>
                ))}
                {parts.length > 0 && "."}
              </>
            )}
          </>
        )}
      </p>
      {sameWay && parts.length === 2 && (
        <div
          aria-hidden="true"
          className="flex h-2.5 w-full gap-px overflow-hidden rounded-full"
        >
          <span
            className="h-full bg-primary dark:bg-chart-1"
            style={{
              width: `${String((fromEach / (fromEach + fromTimes)) * 100)}%`,
            }}
          />
          <span className="h-full flex-1 bg-chart-4" />
        </div>
      )}
      {settings.figures && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 tabular-nums">
          <Stat term="Each time">
            <Money value={Math.round(later.each)} />{" "}
            <span className="text-sm font-normal text-muted-foreground">
              <Moved ratio={later.each / Math.max(earlier.each, 1) - 1} />
            </span>
          </Stat>
          <Stat term="Times a month">
            {timesLabel(later.times)}{" "}
            <span className="text-sm font-normal whitespace-nowrap text-muted-foreground">
              {timesLabel(later.times) === timesLabel(earlier.times)
                ? "same as before"
                : `was ${timesLabel(earlier.times)}`}
            </span>
          </Stat>
        </dl>
      )}
    </Section>
  );
}

/** Places listed before "Show more". */
const PLACES_SHOWN = 6;

/**
 * 4 · Places, deeper: each place's share, how often, what each time costs and how that moved, and
 * which are new or no longer used.
 */
export function Places({
  book,
  name,
  line,
  months,
  period,
  settings,
  onCustomize,
}: {
  book: CategoryBook;
  name: string;
  line: CategoryLine;
  /** The months shown: the range, or a picked month. */
  months: readonly MonthInfo[];
  period: string;
  settings: PlacesSettings;
  onCustomize: () => void;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const stories = placeStories(book, name, months, line.cells);
  const all = open || settings.allPlaces;
  const shown = all ? stories : stories.slice(0, PLACES_SHOWN);
  const more = settings.allPlaces ? 0 : stories.length - PLACES_SHOWN;

  return (
    <Section title="Where it goes" about={period} onCustomize={onCustomize}>
      {stories.length === 0 ? (
        <Needs>Nothing spent here in {period.toLowerCase()}.</Needs>
      ) : (
        <>
          <ul id={listId} className="flex flex-col">
            {shown.map((place) => (
              <li
                key={place.name}
                className="flex flex-col gap-1.5 border-b border-foreground/10 py-2.5 last:border-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold wrap-break-word">
                      {place.name}
                    </span>
                    {settings.tags && place.since !== null && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                        New since {place.since.short}
                      </span>
                    )}
                    {settings.tags && place.lastUsed !== null && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        Not since {monthShort(place.lastUsed, book.today)}
                      </span>
                    )}
                  </span>
                  <Money
                    value={place.spent}
                    className="shrink-0 text-right font-semibold"
                  />
                </div>
                {settings.shareBars && <ShareBar share={place.share} />}
                <p className="text-sm text-muted-foreground">
                  {sharePercent(place.share)} · {place.entries}{" "}
                  {place.entries === 1 ? "time" : "times"}
                  {settings.eachTime && (
                    <>
                      {" · "}
                      <Money value={Math.round(place.each)} /> each
                      {place.eachChange !== null && (
                        <>
                          {" · "}
                          <Moved ratio={place.eachChange} />
                        </>
                      )}
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
          {more > 0 && (
            <Button
              variant="ghost"
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => {
                setOpen(!open);
              }}
              className="-mx-2 h-11 self-start px-2 text-muted-foreground"
            >
              {open ? "Show fewer" : `Show ${String(more)} more`}
            </Button>
          )}
        </>
      )}
    </Section>
  );
}

/** 6 · Repeats: what comes back every month, and whether this month's is in. */
export function Repeats({
  book,
  name,
  settings,
  onCustomize,
}: {
  book: CategoryBook;
  name: string;
  settings: RepeatsSettings;
  onCustomize: () => void;
}) {
  const repeats = repeatsOf(book, name);
  const { today } = book;
  const { short } = monthInfo(today.month, today);
  return (
    <Section title="Comes back every month" onCustomize={onCustomize}>
      {repeats.length === 0 ? (
        <Needs>
          Nothing here comes back every month at about the same amount.
        </Needs>
      ) : (
        <ul className="flex flex-col">
          {repeats.map((repeat) => (
            <li
              key={repeat.name}
              className="flex flex-col gap-0.5 border-b border-foreground/10 py-2.5 last:border-0"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 font-semibold wrap-break-word">
                  {repeat.name}
                </span>
                <span className="shrink-0 text-right font-semibold">
                  About <Money value={repeat.amount} />
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Around the {ordinal(repeat.day)}
                {!settings.due ? null : repeat.thisMonth !== null ? (
                  <>
                    {" · "}In on {repeat.thisMonth.day} {short}:{" "}
                    <Money value={repeat.thisMonth.amount} />
                    {/* Twice its usual or more: worth a look, said in words. */}
                    {repeat.thisMonth.amount >= repeat.amount * 2 &&
                      ", far more than usual"}
                  </>
                ) : today.day < repeat.day ? (
                  ` · Due around ${String(repeat.day)} ${short}`
                ) : (
                  " · Not in yet this month"
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** 7 · Unusual entries: far above the usual entry, biggest first. Nothing at all when none is. */
export function Unusual({
  dated,
  usualOver,
  period,
  onCustomize,
}: {
  /** The entries shown: the range's, or a picked month's. */
  dated: readonly DatedEntry[];
  /** The entries the usual entry comes from: the range's. */
  usualOver: readonly DatedEntry[];
  period: string;
  onCustomize: () => void;
}) {
  const usual = usualEntry(usualOver);
  const items = unusualOf(dated, usual);
  if (items.length === 0) return null;
  return (
    <Section
      title="Out of the ordinary"
      about={period}
      onCustomize={onCustomize}
    >
      <ul className="flex flex-col">
        {items.map(({ item, times }) => (
          <li
            key={item.entry.id}
            className="flex items-start justify-between gap-3 border-b border-foreground/10 py-2.5 last:border-0"
          >
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold wrap-break-word">
                {item.entry.title}
              </span>
              <span className="text-sm text-muted-foreground">
                {dayLabel(item.month, item.entry.day)} ·{" "}
                {times.toFixed(1).replace(/\.0$/, "")} times a usual entry
              </span>
            </span>
            <Money
              value={item.entry.amount}
              className="shrink-0 font-semibold"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** How the entries sort: Spending's fields, less the category, which is this page's. */
type EntryKey = "date" | "amount" | "name" | "account";
const ENTRY_SORTS = {
  date: { name: "Date", ways: ["Newest first", "Oldest first"] },
  amount: { name: "Amount", ways: ["High to low", "Low to high"] },
  name: { name: "Name", ways: ["A to Z", "Z to A"], words: true },
  account: { name: "Account", ways: ["A to Z", "Z to A"], words: true },
} as const satisfies Record<EntryKey, SortField>;
const ENTRY_KEYS = ["date", "amount", "name", "account"] as const;

/**
 * One entry, drawn as Spending draws it: its title, then its account and day (the category is
 * this page's), and the amount. It opens Entry detail.
 */
function EntryLine({
  item,
  compact,
}: {
  item: DatedEntry;
  /** One line: the account and day stay for screen readers only. */
  compact: boolean;
}) {
  const { entry, month } = item;
  const about = `${entry.account} · ${dayLabel(month, entry.day)}`;
  return (
    <ScreenLink
      screen="Entry detail"
      className={cn(
        "flex items-center justify-between gap-4",
        compact ? "min-h-11 py-2" : "min-h-14 py-3",
      )}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-semibold wrap-break-word">{entry.title}</span>
        <span className={compact ? "sr-only" : "text-sm text-muted-foreground"}>
          {compact ? `, ${about}` : about}
        </span>
      </span>
      <Money value={-entry.amount} signed className="shrink-0 font-bold" />
    </ScreenLink>
  );
}

/**
 * Entries, every month of the range (or the picked month), as on Spending: search, the sort menu
 * and a count, then a heading and total for each month, newest first. Sorted by amount, name or
 * account, one list across the months. Search and sort live in the URL, as on Spending.
 */
export function RangeEntries({
  book,
  name,
  months,
  period,
  settings,
  onCustomize,
}: {
  book: CategoryBook;
  name: string;
  months: readonly MonthInfo[];
  period: string;
  settings: EntriesSettings;
  onCustomize: () => void;
}) {
  const headingId = useId();
  const searchId = useId();
  const params = useSpendingParams(book);
  // Without the sort menu, the list keeps the usual order: newest first.
  const order: SortOrder<EntryKey> =
    !settings.sorting || params.sort.by === "category"
      ? { by: "date", reversed: false }
      : { by: params.sort.by, reversed: params.sort.reversed };
  const dated = entriesOf(book, name, months);
  const found = new Set(
    search(
      dated.map(({ entry }) => entry),
      params.q,
    ).map((entry) => entry.id),
  );
  const shown = dated.filter(({ entry }) => found.has(entry.id));
  const total = shown.reduce((all, { entry }) => all + entry.amount, 0);
  const byMonth = (order.reversed ? months : months.toReversed())
    .map((month) => ({
      month,
      items: sortEntries(
        shown
          .filter((item) => item.month.key === month.key)
          .map(({ entry }) => entry),
        { by: "date", reversed: order.reversed },
      ).map((entry) => ({ entry, month })),
    }))
    .filter(({ items }) => items.length > 0);
  const way = order.reversed ? -1 : 1;
  const ranked = shown.toSorted((one, two) => {
    if (order.by === "amount")
      return (two.entry.amount - one.entry.amount) * way;
    const field = order.by === "name" ? "title" : "account";
    return one.entry[field].localeCompare(two.entry[field]) * way;
  });

  return (
    <section
      aria-labelledby={headingId}
      className={cn(SURFACE, "flex flex-col gap-4")}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 id={headingId} className={CARD_HEADING}>
          Entries · {period}
        </h2>
        <div className="flex items-center gap-1">
          <EntriesLink
            category={name}
            className="inline-flex min-h-11 items-center px-1 text-sm font-semibold underline underline-offset-4"
          >
            Open in Entries
          </EntriesLink>
          <SectionCustomizeButton
            name="Entries"
            onClick={onCustomize}
            className="-mr-2"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={searchId} className="text-sm font-medium">
          Search entries
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={searchId}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={params.q}
            onChange={(event) => {
              params.setQuery(event.target.value);
            }}
            className="h-11 bg-background pl-9 text-base"
          />
        </div>
      </div>
      {settings.sorting && (
        <SortMenu
          fields={ENTRY_SORTS}
          keys={ENTRY_KEYS}
          order={order}
          onOrder={params.setSort}
          label="Sort entries"
          className="-mr-2 self-end"
        />
      )}
      {shown.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed p-5">
          <p className="font-semibold">No entries match “{params.q}”</p>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              params.setQuery("");
            }}
          >
            Clear search
          </Button>
        </div>
      ) : (
        <>
          <p aria-live="polite" className="text-sm font-semibold">
            {entriesWord(shown.length)} · <Money value={total} />
          </p>
          {order.by === "date" ? (
            <div className="flex flex-col gap-4">
              {byMonth.map(({ month, items }) => (
                <section key={month.key} aria-label={monthHeading(month)}>
                  <h3 className="flex items-baseline justify-between gap-3 border-b border-foreground/10 pb-1.5 text-sm font-semibold">
                    {monthHeading(month)}
                    {settings.monthTotals && (
                      <Money
                        value={items.reduce(
                          (all, { entry }) => all + entry.amount,
                          0,
                        )}
                        className="text-muted-foreground"
                      />
                    )}
                  </h3>
                  <ul className="flex flex-col">
                    {items.map((item) => (
                      <li key={item.entry.id}>
                        <EntryLine item={item} compact={settings.compact} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <ul className="flex flex-col">
              {ranked.map((item) => (
                <li key={item.entry.id}>
                  <EntryLine item={item} compact={settings.compact} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

/** 9 · Year view: each calendar year, and this month against the same month last year. */
export function Years({
  book,
  name,
  onCustomize,
}: {
  book: CategoryBook;
  name: string;
  onCustomize: () => void;
}) {
  const years = yearsOf(book, name);
  const lastYear = yearBefore(book, name, book.today.month);
  const now = book.months
    .find((month) => month.month === book.today.month)
    ?.entries.filter((entry) => entry.category === name)
    .reduce((all, entry) => all + entry.amount, 0);
  return (
    <Section title="By year" onCustomize={onCustomize}>
      <ul className="flex flex-col">
        {years.map((row) => (
          <li
            key={row.year}
            className="flex items-start justify-between gap-3 border-b border-foreground/10 py-2.5 last:border-0"
          >
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold">
                {row.year}
                {row.current ? " so far" : ""}
              </span>
              <span className="text-sm text-muted-foreground">
                {row.months} {row.months === 1 ? "month" : "months"} of data
                {row.perMonth !== null && (
                  <>
                    {" "}
                    · <Money value={row.perMonth} /> a month
                  </>
                )}
              </span>
            </span>
            <Money value={row.spent} className="shrink-0 font-semibold" />
          </li>
        ))}
      </ul>
      {lastYear === null ? (
        <Needs>
          Same month last year shows once there&apos;s a year of data.
        </Needs>
      ) : (
        <p className="text-sm">
          {lastYear.month.name} so far:{" "}
          <Money value={now ?? 0} className="font-semibold" />.{" "}
          {lastYear.month.name} {lastYear.month.year}:{" "}
          <Money value={lastYear.spent} className="font-semibold" />.
        </p>
      )}
    </Section>
  );
}

/** 10 · Paid with: each account's share. */
export function PaidWith({
  dated,
  period,
  onCustomize,
}: {
  dated: readonly DatedEntry[];
  period: string;
  onCustomize: () => void;
}) {
  const accounts = paidWith(dated);
  return (
    <Section title="Paid with" about={period} onCustomize={onCustomize}>
      {accounts.length === 0 ? (
        <Needs>No entries in {period.toLowerCase()}.</Needs>
      ) : (
        <ul className="flex flex-col gap-3">
          {accounts.map((account) => (
            <li key={account.account} className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 wrap-break-word">
                  {account.account}
                </span>
                <span className="shrink-0 text-right">
                  <Money value={account.spent} className="font-semibold" />{" "}
                  <span className="text-sm text-muted-foreground">
                    {sharePercent(account.share)}
                  </span>
                </span>
              </div>
              <ShareBar share={account.share} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/**
 * 11 · A note on a month, to say why it was big: shown, edited in place, or added. Saving an
 * empty note removes it.
 */
export function MonthNote({
  month,
  note,
  onSave,
}: {
  month: MonthInfo;
  note: string | undefined;
  onSave: (text: string) => void;
}) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note ?? "");

  if (editing) {
    return (
      <form
        className="flex flex-col gap-2"
        onSubmit={(event: SyntheticEvent) => {
          event.preventDefault();
          onSave(text.trim());
          setEditing(false);
        }}
      >
        <Label htmlFor={id}>Note on {month.name}</Label>
        <Input
          id={id}
          value={text}
          maxLength={80}
          onChange={(event) => {
            setText(event.target.value);
          }}
          className="h-11 text-base"
        />
        <div className="flex gap-2">
          <Button type="submit" size="lg" className="h-11">
            Save note
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-11"
            onClick={() => {
              setText(note ?? "");
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }
  if (note === undefined) {
    return (
      <Button
        variant="ghost"
        size="lg"
        className="-mx-2 h-11 self-start px-2"
        onClick={() => {
          setEditing(true);
        }}
      >
        <Plus aria-hidden="true" className="size-4" />
        Add a note on {month.name}
      </Button>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2">
      <StickyNote aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 flex-1 wrap-break-word">{note}</p>
      <Button
        variant="ghost"
        size="sm"
        className="-my-1 h-9"
        aria-label={`Edit the note on ${month.name}`}
        onClick={() => {
          setText(note);
          setEditing(true);
        }}
      >
        Edit
      </Button>
    </div>
  );
}

/**
 * 12 · Auto-file rules: pick places whose new entries go straight into this category. Saved in
 * memory, with a message that says what changed.
 */
export function AutoFileDialog({
  open,
  onOpenChange,
  book,
  name,
  rules,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: CategoryBook;
  name: string;
  rules: readonly string[];
  onSave: (places: readonly string[]) => void;
}) {
  const id = useId();
  const [picked, setPicked] = useState<readonly string[]>(rules);
  const places = [
    ...new Set(
      book.months.flatMap((month) =>
        month.entries
          .filter((entry) => entry.category === name)
          .map((entry) => entry.title.trim()),
      ),
    ),
  ].toSorted((one, two) => one.localeCompare(two));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setPicked(rules);
        onOpenChange(next);
      }}
    >
      <DialogContent className={SHEET}>
        <DialogHeader className="pr-10">
          <DialogTitle className={SHEET_TITLE}>
            Auto-file into {name}
          </DialogTitle>
          <DialogDescription className="text-base">
            New entries from the places you tick go straight into {name}. You
            can still change one by hand.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-1 flex max-h-[45svh] flex-col overflow-y-auto p-1">
          {places.map((place, index) => (
            <Label
              key={place}
              htmlFor={`${id}-${String(index)}`}
              className="flex min-h-11 items-center gap-3 rounded-xl p-2 text-base font-normal hover:bg-muted"
            >
              <Checkbox
                id={`${id}-${String(index)}`}
                checked={picked.includes(place)}
                onCheckedChange={(checked: boolean) => {
                  setPicked((now) =>
                    checked
                      ? [...now, place]
                      : now.filter((one) => one !== place),
                  );
                }}
              />
              <span className="min-w-0 wrap-break-word">{place}</span>
            </Label>
          ))}
        </div>
        <DialogFooter>
          <Button
            size="lg"
            className="h-11"
            onClick={() => {
              onSave(picked);
              onOpenChange(false);
              toast(
                picked.length === 0
                  ? `No places auto-file into ${name}`
                  : `${String(picked.length)} ${picked.length === 1 ? "place auto-files" : "places auto-file"} into ${name}`,
              );
            }}
          >
            Save rules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
