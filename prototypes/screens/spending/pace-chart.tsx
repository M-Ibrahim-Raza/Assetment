"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  use,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { AmountsContext, Money } from "@proto/components/amounts";
import { formatLakhCrore, formatPkr } from "@proto/kit/format";
import { BLOCK, EYEBROW, INK, PAD } from "@proto/screens/dashboard/parts";
import type { PaceSettings } from "./layout";
import {
  type ComparePace,
  comparePace,
  dayLabel,
  type DayRange,
  daysLabel,
  longDayLabel,
  longDaysLabel,
  type MonthInfo,
  type MonthSummary,
  monthPace,
  niceSteps,
  projectLike,
  type Scope,
  type UsualRange,
  usualRange,
} from "./math";
import { SectionCustomizeButton } from "./customize-sheet";
import { Figure, figureTerm, INK_ICON } from "./pace-block";
import { ChangeIcon, joinAnd, useAmountText } from "./parts";
import type { Spending } from "./scenarios";

/** Days marked along the bottom. */
const TICK_DAYS = [1, 8, 15, 22, 29];

/**
 * The month's running total as a line against another month's, dotted, on its own ink block: the
 * screen's comparison, picked on the ink block at the top (last month, the usual month or any
 * other month). Picked days are marked: one day as a line, a run of days as a band. The rest are
 * its settings: in the current month, a dashed line to where it ends if the rest goes like the
 * comparison (on by default); a bar for each day; the average a day; and the usual range, a band
 * from the lowest to the highest of the months the usual month averages, keyed under the days.
 * The numbers under the chart are figures, a term and an amount, as on the ink block at the top.
 */
export function PaceChartBlock({
  spending,
  summary,
  scope,
  days,
  daysTotal,
  options,
  onCustomize,
}: {
  spending: Spending;
  /** The whole month, whatever days are picked. */
  summary: MonthSummary;
  /** The picked category and account. */
  scope: Pick<Scope, "category" | "account">;
  /** The days picked, if any. */
  days: DayRange | null;
  /** What was spent on the picked days. */
  daysTotal: number;
  /** The chart's own settings, switched in Customize. */
  options: PaceSettings;
  /** Opens Customize at this section. */
  onCustomize: () => void;
}) {
  const { month } = summary;
  const amountText = useAmountText();
  const pace = monthPace(spending, month.key, scope);
  if (!pace) return null;

  const current = pace.running;
  const through = current.length;
  const total = current.at(-1) ?? 0;
  const comparison = summary.comparison
    ? comparePace(spending, month.key, scope, summary.comparison)
    : null;
  // The comparison by the same day, or in all for a past month.
  const before = comparison
    ? (comparison.running[sameDay(month, through, comparison) - 1] ?? null)
    : null;
  const ahead =
    options.ahead && month.current && comparison && through < month.days
      ? projectLike(current, comparison.running, month.days)
      : null;
  const range = options.usualRange
    ? usualRange(spending, month.key, scope)
    : null;
  // Each day's spending, from the running total.
  const daily = options.dailyBars
    ? current.map((value, index) => value - (current[index - 1] ?? 0))
    : null;
  const busiest = daily ? Math.max(...daily) : 0;
  const busiestDay = daily ? daily.indexOf(busiest) + 1 : 0;
  // The comparison's days so far: the same day, or its whole month for a past one.
  const thenDays = comparison ? sameDay(month, through, comparison) : 0;
  // "Usual", "October" or "Mar 2026", as in the ink block's figures.
  const thenTerm = summary.comparison ? figureTerm(summary.comparison) : "";
  const oneDay = days !== null && days.from === days.to;
  // One day is marked unless it is the last one counted, which the line's end dot already marks.
  const marked =
    oneDay && days.from < through
      ? { day: days.from, total: current[days.from - 1] ?? 0 }
      : null;
  const band = days !== null && !oneDay ? days : null;
  const label = [
    `${amountText(total)} spent ${month.current ? `by ${String(month.through)} ${month.short}` : `in ${month.name}`}.`,
    comparison && before !== null
      ? `${capitalize(comparison.name)}: ${amountText(before)} ${month.current ? "by the same day" : "in all"}.`
      : "",
    ahead && comparison
      ? `If the rest goes like ${comparison.name}: about ${amountText(ahead.at(-1) ?? total)}.`
      : "",
    marked
      ? `By ${dayLabel(month, marked.day)}: ${amountText(marked.total)}.`
      : "",
    band
      ? `Shaded: ${longDaysLabel(month, band)}, ${amountText(daysTotal)} spent.`
      : "",
    range
      ? `Usual range ${month.current ? "by now" : "in all"}: ${amountText(range.low[through - 1] ?? 0)} to ${amountText(range.high[through - 1] ?? 0)}.`
      : "",
    daily && busiest > 0
      ? `Biggest day: ${longDayLabel(month, busiestDay)}, ${amountText(busiest)}.`
      : "",
  ]
    .filter((part) => part !== "")
    .join(" ");

  return (
    <section
      aria-labelledby="pace-heading"
      className={cn("@container flex flex-col gap-4 py-6", INK, BLOCK, PAD)}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="pace-heading" className={EYEBROW}>
          Pace{comparison ? ` against ${comparison.name}` : ""}
        </h2>
        <SectionCustomizeButton
          name="Pace chart"
          onClick={onCustomize}
          className={cn(INK_ICON, "-my-3 -mr-2")}
        />
      </div>
      <PaceChart
        month={month}
        current={current}
        comparison={comparison}
        before={before}
        ahead={ahead}
        markDay={marked?.day}
        band={band}
        bandTotal={daysTotal}
        range={range}
        daily={daily}
        label={label}
        legend={
          range ? (
            <RangeKey range={range} />
          ) : options.usualRange ? (
            "The usual range shows once there are 2 months before this one."
          ) : null
        }
      />
      {(ahead !== null || options.dailyAverage || marked !== null) && (
        <dl className="flex flex-col gap-1.5 border-t border-(--ink-foreground)/20 pt-4 @md:flex-row @md:flex-wrap @md:gap-x-8 @md:gap-y-3">
          {ahead && (
            <Figure
              term={`By ${String(month.days)} ${month.short}, if like ${thenTerm}`}
            >
              about <Rough value={ahead.at(-1) ?? total} />
            </Figure>
          )}
          {options.dailyAverage && (
            <Figure
              term={month.current ? "A day so far" : `A day in ${month.name}`}
              value={Math.round(total / Math.max(1, through))}
            />
          )}
          {options.dailyAverage && before !== null && (
            <Figure
              term={`${thenTerm}, a day${month.current ? " by now" : ""}`}
              value={Math.round(before / Math.max(1, thenDays))}
            />
          )}
          {marked && (
            <Figure
              term={`By ${dayLabel(month, marked.day)}`}
              value={marked.total}
            />
          )}
        </dl>
      )}
    </section>
  );
}

/** The usual range's key, under the days: a swatch in the band's shade, and what it spans. */
function RangeKey({ range }: { range: UsualRange }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="mt-0.5 size-3 shrink-0 rounded-xs bg-(--chart-4)/30"
      />
      <span>
        Usual range: lowest to highest of{" "}
        {joinAnd(range.months.toReversed().map((month) => month.short))}.
      </span>
    </>
  );
}

/** The comparison's day to set against this month's last counted one: the same day, or its end. */
function sameDay(
  month: MonthInfo,
  through: number,
  comparison: ComparePace,
): number {
  return month.current
    ? Math.min(through, comparison.running.length)
    : comparison.running.length;
}

function capitalize(words: string): string {
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "Rs 4.1 lakh", or to the nearest hundred under a lakh. For guesses, so never exact. */
function roughPkr(value: number): string {
  const spoken = formatLakhCrore(value);
  return spoken === null
    ? formatPkr(Math.round(value / 100) * 100)
    : `Rs ${spoken}`;
}

function Rough({ value }: { value: number }) {
  const { hidden } = use(AmountsContext);
  if (hidden) return <Money value={value} />;
  return <span className="tabular-nums">{roughPkr(value)}</span>;
}

/** A gridline's amount: "2 lakh", or "Rs 50,000" under a lakh. */
function tickLabel(value: number): string {
  return formatLakhCrore(value) ?? formatPkr(value);
}

const WIDTH = 100;
const HEIGHT = 50;

interface PaceChartProps {
  month: MonthInfo;
  /** This month's running total, to the last day counted. */
  current: readonly number[];
  comparison: ComparePace | null;
  /** The comparison at the same day, or in all for a past month. */
  before: number | null;
  /** From today to the month's end, if the rest goes like the comparison. */
  ahead: readonly number[] | null;
  /** A day to mark with a line and a dot. */
  markDay: number | undefined;
  /** Days to shade, with a tag saying which and what was spent. */
  band: DayRange | null;
  /** What was spent on the shaded days. */
  bandTotal: number;
  /** The usual range, a band behind the lines. */
  range: UsualRange | null;
  /** Each day's spending, as bars in a strip under the chart. */
  daily: readonly number[] | null;
  label: string;
  /** A key under the days, for what isn't labelled on the chart. */
  legend: ReactElement | string | null;
}

/**
 * Running totals across a month: this one solid, the comparison dotted, and the guess ahead
 * dashed. Each line runs from its month's 1st on the left to its last day on the right, so they
 * compare as pace, not dates. Pointing at it with a mouse, holding a finger on it, or the arrow
 * keys show a day's amounts; it never changes the screen. Text is drawn in HTML over the SVG, so
 * it never stretches. The daily bars sit in a strip of their own under it, like a stock chart's
 * volume, the busiest day at its full height: on the running totals' scale a day would barely
 * show. Plain SVG until the app has a chart library.
 */
function PaceChart({
  month,
  current,
  comparison,
  before,
  ahead,
  markDay,
  band,
  bandTotal,
  range,
  daily,
  label,
  legend,
}: PaceChartProps) {
  const amountText = useAmountText();
  const { hidden } = use(AmountsContext);
  // The day being read: under the mouse, under a finger while it is held, or moved to by the
  // arrow keys.
  const [reading, setReading] = useState<number | null>(null);
  const held = useRef(false);

  const through = current.length;
  const end = through - 1;
  const largest = Math.max(
    1,
    ...current,
    ...(comparison?.running ?? []),
    ...(ahead ?? []),
    ...(range?.high ?? []),
  );
  const x = (index: number, days: number) =>
    (index / Math.max(1, days - 1)) * WIDTH;
  const y = (value: number) => HEIGHT - 1 - (value / largest) * (HEIGHT - 2);
  const line = (values: readonly number[], days: number, from = 0) =>
    values
      .map(
        (value, index) =>
          `${String(x(from + index, days))},${String(y(value))}`,
      )
      .join(" ");
  // A point as a share of the chart's box, for HTML drawn over it.
  const place = (index: number, days: number, value: number) => ({
    left: `${String(x(index, days))}%`,
    top: `${String((y(value) / HEIGHT) * 100)}%`,
  });
  const compareAt = (day: number) =>
    comparison?.running[Math.min(day, comparison.running.length) - 1] ?? 0;
  const aheadAt = (day: number) => ahead?.[day - through] ?? 0;
  // Past today, the days can be read where the guess ahead is drawn.
  const last = ahead ? month.days : through;

  const now = current[end] ?? 0;
  const nowAt = place(end, month.days, now);
  const thenIndex = comparison ? sameDay(month, through, comparison) - 1 : -1;
  const thenAt =
    comparison && before !== null
      ? place(thenIndex, comparison.days, before)
      : null;
  // Near the right edge, labels go to the left of today.
  const flip = x(end, month.days) > 60;
  const nowHigher = before === null || now >= before;
  const nowTag = (
    <Tag swatch="h-0.75 rounded-full bg-(--ink-foreground)">
      {month.short} <Money value={now} />
    </Tag>
  );
  const thenTag = comparison && before !== null && (
    <Tag swatch="border-t-3 border-dotted border-(--chart-4)" faint>
      {comparison.short}
      {month.current ? " by now" : ""} <Money value={before} />
    </Tag>
  );
  const gapTag = before !== null && now !== before && (
    <Tag>
      <ChangeIcon change={now - before} />
      <Money value={Math.abs(now - before)} /> {now > before ? "more" : "less"}
    </Tag>
  );
  const marker = markDay;
  // The daily bars' scale: the busiest day fills the strip. A day over twice the next biggest,
  // like rent on the 1st, is cut short with a notch instead, so the other days stay readable.
  const busiest = Math.max(1, ...(daily ?? []));
  const next = (daily ?? []).toSorted((one, two) => two - one)[1] ?? 0;
  const scale = next > 0 && busiest > 2 * next ? next * 1.25 : busiest;
  // A day's bar lights up while it is read, marked or in the picked days.
  const lit = (day: number) =>
    day === reading ||
    day === marker ||
    (band !== null && day >= band.from && day <= band.to);
  const rangeAt = (day: number) =>
    range
      ? {
          low: range.low[Math.min(day, range.low.length) - 1] ?? 0,
          high: range.high[Math.min(day, range.high.length) - 1] ?? 0,
        }
      : null;
  // Gridlines at round amounts, each labelled at the left.
  const steps = niceSteps(largest);
  const gridlines = steps.map((amount) => y(amount));

  const valueText = (day: number) => {
    const usual = rangeAt(day);
    return [
      `${longDayLabel(month, day)}:`,
      day <= through
        ? `${amountText(current[day - 1] ?? 0)} spent by then.`
        : `about ${amountText(aheadAt(day))} if the rest goes like ${comparison?.name ?? "before"}.`,
      daily && day <= through
        ? `${amountText(daily[day - 1] ?? 0)} that day.`
        : "",
      comparison
        ? `${capitalize(comparison.name)}: ${amountText(compareAt(day))}.`
        : "",
      usual
        ? `Usual range: ${amountText(usual.low)} to ${amountText(usual.high)}.`
        : "",
    ]
      .filter((part) => part !== "")
      .join(" ");
  };
  const dayAt = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const share = (event.clientX - box.left) / Math.max(1, box.width);
    return Math.min(
      last,
      Math.max(1, Math.round(share * (month.days - 1)) + 1),
    );
  };
  const step = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setReading(null);
      return;
    }
    const from = reading ?? through;
    const next = {
      ArrowLeft: from - 1,
      ArrowDown: from - 1,
      ArrowRight: from + 1,
      ArrowUp: from + 1,
      Home: 1,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setReading(Math.min(last, Math.max(1, next)));
  };
  const value = reading ?? through;

  return (
    <figure className="flex flex-col gap-2">
      {/* Room above the plot for a label over a point at the top. */}
      <div className="relative mt-4">
        <svg
          role="img"
          aria-label={label}
          viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
          preserveAspectRatio="none"
          className="h-40 w-full overflow-visible @xl:h-56"
        >
          {gridlines.map((level) => (
            <line
              key={level}
              x1="0"
              x2={WIDTH}
              y1={level}
              y2={level}
              stroke="currentColor"
              strokeOpacity="0.12"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {range && (
            <polygon
              points={[
                line(range.high, month.days),
                line(range.low, month.days).split(" ").toReversed().join(" "),
              ].join(" ")}
              fill="var(--chart-4)"
              fillOpacity="0.3"
            />
          )}
          {band && (
            <>
              <rect
                x={x(band.from - 1, month.days)}
                width={
                  x(band.to - 1, month.days) - x(band.from - 1, month.days)
                }
                y="0"
                height={HEIGHT}
                fill="currentColor"
                fillOpacity="0.16"
              />
              {[band.from, band.to].map((day) => (
                <line
                  key={day}
                  x1={x(day - 1, month.days)}
                  x2={x(day - 1, month.days)}
                  y1="0"
                  y2={HEIGHT}
                  stroke="currentColor"
                  strokeOpacity="0.5"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </>
          )}
          {marker !== undefined && (
            <line
              x1={x(marker - 1, month.days)}
              x2={x(marker - 1, month.days)}
              y1="0"
              y2={HEIGHT}
              stroke="currentColor"
              strokeOpacity="0.5"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {reading !== null && (
            <line
              x1={x(reading - 1, month.days)}
              x2={x(reading - 1, month.days)}
              y1="0"
              y2={HEIGHT}
              stroke="currentColor"
              strokeOpacity="0.7"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {comparison && (
            <polyline
              points={line(comparison.running, comparison.days)}
              fill="none"
              stroke="var(--chart-4)"
              strokeWidth="2.5"
              strokeDasharray="2 5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {ahead && (
            <polyline
              points={line(ahead, month.days, end)}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.6"
              strokeWidth="2"
              strokeDasharray="6 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {thenAt && before !== null && (
            <line
              x1={x(end, month.days)}
              x2={x(end, month.days)}
              y1={y(now)}
              y2={y(before)}
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <polyline
            points={line(current, month.days)}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {!hidden &&
          steps.map((amount) => (
            <span
              key={amount}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 -translate-y-full pb-0.5 text-[0.6875rem] font-medium text-(--ink-foreground)/80"
              style={{ top: `${String((y(amount) / HEIGHT) * 100)}%` }}
            >
              {tickLabel(amount)}
            </span>
          ))}
        {marker !== undefined && (
          <Dot
            className="size-2.5 bg-(--chart-4) ring-3"
            at={place(marker - 1, month.days, current[marker - 1] ?? 0)}
          />
        )}
        {thenAt && (
          <Dot className="size-2.5 bg-(--chart-4) ring-3" at={thenAt} />
        )}
        <Dot className="size-3 bg-(--ink-foreground) ring-4" at={nowAt} />

        {/* Labels go where a running total leaves room: above and left of the higher point,
            since earlier days are lower, and below and right of the lower one, since later days
            are higher. Near the right edge, the lower ones sit in the bottom-right corner. */}
        <AboveLeft
          x={
            nowHigher || !thenAt
              ? x(end, month.days)
              : x(thenIndex, comparison?.days ?? month.days)
          }
          top={(nowHigher || !thenAt ? nowAt : thenAt).top}
        >
          {nowHigher || !thenAt ? nowTag : thenTag}
        </AboveLeft>
        {thenAt && (
          <Pinned
            at={flip ? {} : nowHigher ? thenAt : nowAt}
            className={cn(
              "flex flex-col gap-1",
              flip ? "right-0 bottom-0 items-end" : "mt-2 ml-2 items-start",
            )}
          >
            {nowHigher ? thenTag : nowTag}
            {gapTag}
          </Pinned>
        )}
        {ahead && ahead.length > 1 && (
          <Pinned
            at={place(month.days - 1, month.days, ahead.at(-1) ?? now)}
            className="-mt-2 -translate-full"
          >
            <Tag swatch="border-t-2 border-dashed border-(--ink-foreground)/60">
              about <Rough value={ahead.at(-1) ?? now} />
            </Tag>
          </Pinned>
        )}

        {reading !== null && (
          <>
            {reading <= through && (
              <Dot
                className="size-2.5 bg-(--ink-foreground) ring-3"
                at={place(reading - 1, month.days, current[reading - 1] ?? 0)}
              />
            )}
            {ahead && reading > through && (
              <Dot
                className="size-2.5 bg-(--ink-foreground) ring-3"
                at={place(reading - 1, month.days, aheadAt(reading))}
              />
            )}
            {comparison && (
              <Dot
                className="size-2.5 bg-(--chart-4) ring-3"
                at={place(
                  Math.min(reading, comparison.running.length) - 1,
                  comparison.days,
                  compareAt(reading),
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute top-0 z-10 flex flex-col rounded-lg bg-(--ink-foreground) px-2.5 py-1.5 text-xs whitespace-nowrap text-(--ink) shadow-lg",
                x(reading - 1, month.days) > 50
                  ? "-ml-2 -translate-x-full"
                  : "ml-2",
              )}
              style={{ left: `${String(x(reading - 1, month.days))}%` }}
            >
              <span className="font-semibold">{dayLabel(month, reading)}</span>
              {daily && reading <= through && (
                <span>
                  That day <Money value={daily[reading - 1] ?? 0} />
                </span>
              )}
              {reading <= through ? (
                <span>
                  {month.short} <Money value={current[reading - 1] ?? 0} />
                </span>
              ) : (
                comparison && (
                  <span>
                    If like {comparison.short}: about{" "}
                    <Rough value={aheadAt(reading)} />
                  </span>
                )
              )}
              {comparison && (
                <span>
                  {comparison.short} <Money value={compareAt(reading)} />
                </span>
              )}
            </span>
          </>
        )}

        <div
          role="slider"
          tabIndex={0}
          aria-label="Read the chart by day"
          aria-valuemin={1}
          aria-valuemax={last}
          aria-valuenow={value}
          aria-valuetext={valueText(value)}
          className="absolute inset-0 cursor-crosshair touch-pan-y rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-(--ink-foreground)/50"
          onPointerDown={(event) => {
            held.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            setReading(dayAt(event));
          }}
          onPointerMove={(event) => {
            if (held.current || event.pointerType === "mouse") {
              setReading(dayAt(event));
            }
          }}
          onPointerUp={(event) => {
            held.current = false;
            // A mouse is still over the chart, so its reading stays until it leaves.
            if (event.pointerType !== "mouse") setReading(null);
          }}
          onPointerLeave={() => {
            if (!held.current) setReading(null);
          }}
          onPointerCancel={() => {
            held.current = false;
            setReading(null);
          }}
          onKeyDown={step}
          onBlur={() => {
            setReading(null);
          }}
        />
      </div>

      {daily && (
        // Thin bars on a hairline, faint but for the days being read or picked. The chart's label
        // and its day readout say the amounts.
        <div
          aria-hidden="true"
          className="relative h-8 border-b border-(--ink-foreground)/25"
        >
          {daily.map(
            (amount, index) =>
              amount > 0 && (
                <span
                  key={`day-${String(index + 1)}`}
                  className={cn(
                    "absolute bottom-0 w-0.75 -translate-x-1/2 rounded-t-xs transition-colors",
                    lit(index + 1)
                      ? "bg-(--ink-foreground)"
                      : "bg-(--ink-foreground)/40",
                  )}
                  style={{
                    left: `${String(x(index, month.days))}%`,
                    height: `${String(Math.min(100, Math.max(6, (amount / scale) * 100)))}%`,
                  }}
                >
                  {amount > scale && (
                    // A break across the top: taller than shown.
                    <span className="absolute -inset-x-0.5 top-1 h-0.5 bg-(--ink)" />
                  )}
                </span>
              ),
          )}
        </div>
      )}
      <div
        aria-hidden="true"
        className="relative h-4 text-[0.6875rem] font-medium text-(--ink-foreground)/80"
      >
        {TICK_DAYS.filter((day) => day <= month.days).map((day) => (
          <span
            key={day}
            className={cn("absolute", day > 1 && "-translate-x-1/2")}
            style={{ left: `${String(x(day - 1, month.days))}%` }}
          >
            {day}
          </span>
        ))}
      </div>
      {band && (
        <BandTag
          band={band}
          total={bandTotal}
          month={month}
          x={(day) => x(day - 1, month.days)}
        />
      )}
      {legend !== null && (
        <figcaption className="flex items-start gap-1.5 text-xs font-medium">
          {legend}
        </figcaption>
      )}
    </figure>
  );
}

/** A round dot on a line, ringed in ink so it stands off the lines under it. */
function Dot({ at, className }: { at: CSSProperties; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -translate-1/2 rounded-full ring-(--ink)",
        className,
      )}
      style={at}
    />
  );
}

/**
 * Says which days the band shades and what was spent on them: "3–9 Nov · Rs 48,200". It sits in
 * its own row under the days, where no line or label is ever drawn: a bar spans the band's days,
 * and the tag is centred under it, or kept to its edge near either side of the chart.
 */
function BandTag({
  band,
  total,
  month,
  x,
}: {
  band: DayRange;
  total: number;
  month: MonthInfo;
  /** A day's place across the chart, in percent. */
  x: (day: number) => number;
}) {
  const start = x(band.from);
  const end = x(band.to);
  const middle = (start + end) / 2;
  let at: CSSProperties = { left: `${String(middle)}%` };
  let shift = "-translate-x-1/2";
  if (middle < 20) {
    at = { left: `${String(start)}%` };
    shift = "";
  } else if (middle > 80) {
    at = { right: `${String(100 - end)}%` };
    shift = "";
  }
  return (
    <div aria-hidden="true" className="relative h-7">
      <span
        className="absolute top-0 h-1 rounded-full bg-(--ink-foreground)/50"
        style={{
          left: `${String(start)}%`,
          width: `${String(Math.max(end - start, 1))}%`,
        }}
      />
      <Pinned at={at} className={cn("top-2", shift)}>
        <Tag>
          {daysLabel(month, band)} · <Money value={total} />
        </Tag>
      </Pinned>
    </div>
  );
}

/**
 * HTML above a point and ending just left of it. It sits in a box from the chart's left edge to
 * the point, aligned to the box's end; on a narrow phone, where it doesn't fit, it starts at the
 * left edge instead of running off the chart.
 */
function AboveLeft({
  x,
  top,
  children,
}: {
  /** The point across the chart, in percent. */
  x: number;
  /** The point down the chart, as a CSS length. */
  top: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-0 flex -translate-y-full justify-end-safe pb-2"
      style={{ top, right: `calc(${String(100 - x)}% + 0.5rem)` }}
    >
      {children}
    </span>
  );
}

/** HTML placed at a point on the chart. `className` moves it off the point. */
function Pinned({
  at,
  className,
  children,
}: {
  at: CSSProperties;
  className: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute", className)}
      style={at}
    >
      {children}
    </span>
  );
}

/**
 * A small label on the chart, on ink so lines under it don't show through. A swatch matches it to
 * its line. The chart's own label says the same to screen readers.
 */
function Tag({
  swatch,
  faint = false,
  children,
}: {
  /** The line's look: solid, dotted or dashed. */
  swatch?: string;
  faint?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-(--ink) px-1.5 py-0.5 text-xs whitespace-nowrap",
        faint ? "font-medium" : "font-semibold",
      )}
    >
      {swatch !== undefined && <span className={cn("mr-0.5 w-3", swatch)} />}
      {children}
    </span>
  );
}
