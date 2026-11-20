"use client";

import { cn } from "@/lib/utils";
import { BLOCK, HEADING, PAD } from "@proto/components/blocks";
import { SectionCustomizeButton } from "./customize-sheet";
import type { HabitsSettings } from "./layout";
import { type MonthInfo, monthInfo } from "./math";
import { sharePercent } from "./parts";
import type { Spending } from "./scenarios";

/** One entry where habits are concerned: how much, on which day of which month. */
interface Dated {
  amount: number;
  day: number;
  month: MonthInfo;
}

/** When the money goes: shares by weekday, Monday first, and by week of the month. */
export interface Habits {
  weekdays: number[];
  weeks: number[];
}

/** Monday 0 to Sunday 6, for a day of a month. */
function weekdayOf(month: MonthInfo, day: number): number {
  return (month.firstWeekday + day - 1 + 6) % 7;
}

/** By amount, so a big shop counts for more than a samosa. Needs 6 entries. */
export function habitsOf(dated: readonly Dated[]): Habits | null {
  if (dated.length < 6) return null;
  const weekdays = [0, 0, 0, 0, 0, 0, 0];
  const weeks = [0, 0, 0, 0];
  for (const { amount, day, month } of dated) {
    const weekday = weekdayOf(month, day);
    const week = Math.min(3, Math.floor((day - 1) / 7));
    weekdays[weekday] = (weekdays[weekday] ?? 0) + amount;
    weeks[week] = (weeks[week] ?? 0) + amount;
  }
  const total = Math.max(
    weekdays.reduce((all, value) => all + value, 0),
    1,
  );
  return {
    weekdays: weekdays.map((value) => value / total),
    weeks: weeks.map((value) => value / total),
  };
}

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const WEEKS = ["1st to 7th", "8th to 14th", "15th to 21st", "22nd on"];

/** How many months the section looks back over, the shown one too. */
const MONTHS = 3;

/**
 * When you spend: which weekdays and which part of the month the money goes, by amount, over the
 * 3 months up to the one shown. A picked category or account narrows it, as it does the rest of
 * the screen; picked days don't, since a few days have no pattern. Its setting: the part of the
 * month, under the weekdays. Hidden until switched on in Customize.
 */
export function HabitsSection({
  spending,
  month,
  category,
  account,
  options,
  onCustomize,
}: {
  spending: Spending;
  /** The month shown, such as "2026-11". */
  month: string;
  category: string | undefined;
  account: string | undefined;
  options: HabitsSettings;
  onCustomize: () => void;
}) {
  const at = spending.months.findIndex((data) => data.month === month);
  const months = spending.months.slice(Math.max(0, at - MONTHS + 1), at + 1);
  const dated = months.flatMap((data) => {
    const info = monthInfo(data.month, spending.today);
    return data.entries
      .filter(
        (entry) =>
          (category === undefined || entry.category === category) &&
          (account === undefined || entry.account === account),
      )
      .map((entry) => ({ amount: entry.amount, day: entry.day, month: info }));
  });
  const habits = habitsOf(dated);
  const first = months[0];
  const last = months.at(-1);
  const span =
    first === undefined || last === undefined
      ? ""
      : first.month === last.month
        ? monthInfo(first.month, spending.today).name
        : `${monthInfo(first.month, spending.today).short} to ${monthInfo(last.month, spending.today).short}`;
  const narrowed = [category, account].filter((one) => one !== undefined);

  return (
    <section
      aria-labelledby="habits-heading"
      className={cn("@container flex flex-col gap-4 bg-card py-6", BLOCK, PAD)}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h2 id="habits-heading" className={HEADING}>
            When you spend
          </h2>
          <SectionCustomizeButton
            name="When you spend"
            onClick={onCustomize}
            className="-my-2 -mr-2"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {span}
          {narrowed.length > 0 && ` · ${narrowed.join(" · ")}`}
        </p>
      </div>
      {habits === null ? (
        <p className="text-sm text-muted-foreground">
          Shows once there are 6 entries in these months.
        </p>
      ) : (
        <HabitsBody habits={habits} weeks={options.weeks} />
      )}
    </section>
  );
}

/** The answer in words, then the weekdays as bars, then the weeks of the month. */
function HabitsBody({ habits, weeks }: { habits: Habits; weeks: boolean }) {
  const top = Math.max(...habits.weekdays);
  const day = WEEKDAYS[habits.weekdays.indexOf(top)] ?? "";
  const busiest = Math.max(...habits.weeks);
  const week = WEEKS[habits.weeks.indexOf(busiest)] ?? "";

  return (
    <>
      <p>
        {top < 0.22
          ? "Spread through the week."
          : `Most on ${day}s: ${sharePercent(top)}.`}
        {weeks &&
          (busiest >= 0.4
            ? ` ${sharePercent(busiest)} from the ${week}.`
            : " Spread through the month.")}
      </p>
      <div aria-hidden="true" className="flex h-24 items-end gap-1.5">
        {habits.weekdays.map((share, index) => (
          <div
            key={WEEKDAYS[index]}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
          >
            <span
              className={cn(
                "w-full rounded-t-sm",
                share === top
                  ? "bg-primary dark:bg-chart-1"
                  : "bg-foreground/20",
              )}
              style={{
                height: `${String(Math.max(4, (share / Math.max(top, 0.01)) * 100))}%`,
              }}
            />
            <span className="text-xs text-muted-foreground">
              {(WEEKDAYS[index] ?? "").slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
      {weeks && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm @sm:grid-cols-4">
          {habits.weeks.map((share, index) => (
            <div key={WEEKS[index]} className="flex flex-col">
              <dt className="text-muted-foreground">{WEEKS[index]}</dt>
              <dd className="font-semibold">{sharePercent(share)}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
}
