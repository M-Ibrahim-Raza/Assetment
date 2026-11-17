"use client";

import { ArrowDown, ArrowUp, ChevronDown, Minus } from "lucide-react";
import {
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { formatPkr } from "@proto/kit/format";
import type { BreakdownSettings } from "./layout";
import type { BreakdownRow, MonthSummary } from "./math";
import { joinAnd, nothingSpent, sharePercent, useAmountText } from "./parts";

/** The theme's 5 chart colours, one for each of the top 5. */
const COLOURS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/** A part without a chart colour of its own: a 6th, or one picked out of Other. */
const PLAIN = "var(--muted-foreground)";

// The ring, in a box from -50 to 50 around its centre: its outer and inner radius, the picked
// part's outer radius, which stands out, and the gap on each side of a part, as part of a turn.
const OUTER = 46;
const INNER = 32;
const RAISED = 50;
const GAP = 0.004;

/** How many parts have their own colour before the rest go into Other. */
const TOP = 5;

/** What the ring splits: the amount spent, or how many entries. Each row's now and before. */
interface Measure {
  entries: boolean;
  now: (row: BreakdownRow) => number;
  /** Null with nothing to compare. */
  before: (row: BreakdownRow) => number | null;
}

function measureOf(entries: boolean): Measure {
  return entries
    ? { entries, now: (row) => row.entries, before: (row) => row.entriesBefore }
    : { entries, now: (row) => row.spent, before: (row) => row.before };
}

/** A part of the ring: a row, or Other with the rest. */
interface Part {
  name: string;
  /** Spent, or entries. */
  value: number;
  /** The same in the comparison. Null with nothing to compare. */
  before: number | null;
  /** Its slice's colour. Null for Other, which is striped. */
  colour: string | null;
  /** The rows in Other. Empty for a row's own part. */
  rest: readonly BreakdownRow[];
}

const OTHER_KEY = "other";
const rowKey = (name: string) => `row:${name}`;

const totalOf = (rows: readonly BreakdownRow[], measure: Measure) =>
  rows.reduce((all, row) => all + measure.now(row), 0);

/** The comparison's total of some rows, or null if any has nothing to compare. */
function totalBefore(
  rows: readonly BreakdownRow[],
  measure: Measure,
): number | null {
  let all = 0;
  for (const row of rows) {
    const before = measure.before(row);
    if (before === null) return null;
    all += before;
  }
  return all;
}

/** "1 entry", "12 entries". */
const entriesText = (count: number) =>
  `${String(count)} ${count === 1 ? "entry" : "entries"}`;

/**
 * Each part's colour, by its place in `usual`: the rows usually biggest keep theirs from month to
 * month, and a newcomer takes the colour of one it pushed out of the top 5.
 */
function colourSlots(
  names: readonly string[],
  usual: readonly string[],
): number[] {
  const fixed = names.map((name) => {
    const at = usual.indexOf(name);
    return at < COLOURS.length ? at : -1;
  });
  const free = COLOURS.map((_, slot) => slot).filter(
    (slot) => !fixed.includes(slot),
  );
  return fixed.map((slot) => (slot === -1 ? (free.shift() ?? 0) : slot));
}

/**
 * The top 5 in their colours, then Other with the rest, striped. One row left over shows by its
 * name rather than as "1 more", and a picked row comes out of Other to stand on its own, even
 * at nothing. Both are grey. `ranked` holds the rows with something, biggest first.
 */
function partsOf(
  rows: readonly BreakdownRow[],
  ranked: readonly BreakdownRow[],
  selected: string | undefined,
  usual: readonly string[],
  measure: Measure,
): Part[] {
  const named = ranked.length === TOP + 1 ? ranked : ranked.slice(0, TOP);
  const picked = rows.find((row) => row.name === selected);
  const own =
    picked === undefined || named.includes(picked) ? named : [...named, picked];
  const rest = ranked.filter((row) => !own.includes(row));
  const slots = colourSlots(
    named.slice(0, TOP).map((row) => row.name),
    usual,
  );
  const parts: Part[] = own.map((row, index) => ({
    name: row.name,
    value: measure.now(row),
    before: measure.before(row),
    colour: COLOURS[slots[index] ?? -1] ?? PLAIN,
    rest: [],
  }));
  if (rest.length === 0) return parts;
  return [
    ...parts,
    {
      name: "Other",
      value: totalOf(rest, measure),
      before: totalBefore(rest, measure),
      colour: null,
      rest,
    },
  ];
}

/** A point on a circle of `radius`, `turn` of the way round from the top, clockwise. */
function point(radius: number, turn: number): string {
  const angle = turn * 2 * Math.PI;
  const x = radius * Math.sin(angle);
  const y = -radius * Math.cos(angle);
  return `${x.toFixed(3)} ${y.toFixed(3)}`;
}

/** The ring from one point of the turn to another, with a gap at each end, or the full ring. */
function slicePath(from: number, to: number, outer: number): string {
  const r = (radius: number) => `${String(radius)} ${String(radius)}`;
  if (to - from > 0.9999) {
    return [
      `M 0 ${String(-outer)} A ${r(outer)} 0 1 1 0 ${String(outer)}`,
      `A ${r(outer)} 0 1 1 0 ${String(-outer)} Z`,
      `M 0 ${String(-INNER)} A ${r(INNER)} 0 1 0 0 ${String(INNER)}`,
      `A ${r(INNER)} 0 1 0 0 ${String(-INNER)} Z`,
    ].join(" ");
  }
  // A sliver too thin for gaps keeps its full width.
  const gap = to - from > 4 * GAP ? GAP : 0;
  const start = from + gap;
  const end = to - gap;
  const large = end - start > 0.5 ? 1 : 0;
  return [
    `M ${point(outer, start)}`,
    `A ${r(outer)} 0 ${String(large)} 1 ${point(outer, end)}`,
    `L ${point(INNER, end)}`,
    `A ${r(INNER)} 0 ${String(large)} 0 ${point(INNER, start)} Z`,
  ].join(" ");
}

/**
 * One line on how the total splits, naming the biggest: the fewest rows that make up half or more,
 * up to 3, or the biggest alone when it's spread wider. Accounts "paid" it. Split by entries, it
 * counts entries: "Groceries and Eating out are 48% of your entries."
 */
function takeaway(
  ranked: readonly BreakdownRow[],
  measure: Measure,
  by: "category" | "account",
  summary: MonthSummary,
): string {
  const sum = totalOf(ranked, measure);
  const names = ranked.map((row) => row.name);
  const first = names[0] ?? "";
  const accounts = by === "account";
  let whose = measure.entries ? "your entries" : "your spending";
  if (!accounts && summary.account !== undefined) {
    whose = measure.entries
      ? `the entries from ${summary.account}`
      : `what ${summary.account} paid`;
  } else if (accounts && summary.category !== undefined) {
    whose = `your ${summary.category} ${measure.entries ? "entries" : "spending"}`;
  }
  // Accounts pay for spending, and for entries.
  const paid = measure.entries ? "paid for" : "paid";
  if (ranked.length === 1) {
    if (accounts) return `${first} paid for all of ${whose}.`;
    return measure.entries
      ? `All of ${whose} are in ${first}.`
      : `All of ${whose} went on ${first}.`;
  }
  for (const count of [1, 2, 3]) {
    const share = totalOf(ranked.slice(0, count), measure) / sum;
    if (share >= 0.5 && count < ranked.length) {
      const who = joinAnd(names.slice(0, count));
      // Short of everything, it never says 100%.
      const percent = `${String(Math.min(99, Math.round(share * 100)))}%`;
      if (accounts) return `${who} ${paid} ${percent} of ${whose}.`;
      return `${who} ${count === 1 ? "is" : "are"} ${percent} of ${whose}.`;
    }
  }
  const top = ranked[0];
  const percent = sharePercent(top === undefined ? 0 : measure.now(top) / sum);
  if (accounts) return `${first} ${paid} the most, ${percent} of ${whose}.`;
  return measure.entries
    ? `${first} has the most, ${percent} of ${whose}.`
    : `${first} is the biggest, at ${percent} of ${whose}.`;
}

/** A slice of the ring: its part, and where it starts and ends, as parts of a turn from the top. */
interface Slice {
  part: Part;
  /** Names it for hover and for its label and line. */
  target: string;
  from: number;
  to: number;
}

/** Where a part's label sits: beside which half of the ring, and on which row of it. */
interface Place {
  side: "left" | "right";
  /** From 1, top to bottom. */
  row: number;
}

/**
 * Puts each label beside the half of the ring its slice's middle is in, in the order they come
 * round: down the right side from the top, and down the left from the top. The side with fewer
 * labels is centred against the other.
 */
function place(slices: readonly Slice[]): {
  places: Map<string, Place>;
  rows: number;
} {
  const middle = (slice: Slice) => (slice.from + slice.to) / 2;
  const right = slices.filter((slice) => middle(slice) < 0.5);
  const left = slices.filter((slice) => middle(slice) >= 0.5).toReversed();
  const rows = Math.max(right.length, left.length, 1);
  const places = new Map<string, Place>();
  for (const [side, list] of [
    ["right", right],
    ["left", left],
  ] as const) {
    const first = Math.floor((rows - list.length) / 2) + 1;
    for (const [index, slice] of list.entries()) {
      places.set(slice.target, { side, row: first + index });
    }
  }
  return { places, rows };
}

/**
 * Draws each label's line: from its slice's middle, just outside the ring, across to beside the
 * ring at the label's height, then straight to the label. Measured on the page, since labels
 * wrap to as many lines as their names need.
 */
function drawLines(chart: HTMLElement) {
  const ring = chart.querySelector<HTMLElement>("[data-ring]");
  if (ring === null) return;
  const box = chart.getBoundingClientRect();
  const round = ring.getBoundingClientRect();
  const cx = round.left + round.width / 2 - box.left;
  const cy = round.top + round.height / 2 - box.top;
  const scale = round.width / 100;
  const labels = [...chart.querySelectorAll<HTMLElement>("[data-label]")];
  for (const line of chart.querySelectorAll<SVGPathElement>(
    "path[data-line]",
  )) {
    const label = labels.find((one) => one.dataset.label === line.dataset.line);
    if (label === undefined) continue;
    const at = label.getBoundingClientRect();
    const right = line.dataset.side === "right";
    const angle = Number(line.dataset.turn) * 2 * Math.PI;
    const radius = (Number(line.dataset.radius) + 2) * scale;
    const x = cx + radius * Math.sin(angle);
    const y = cy - radius * Math.cos(angle);
    const labelY = at.top + at.height / 2 - box.top;
    const labelX = (right ? at.left : at.right) - box.left;
    const knee = right
      ? Math.max(x, round.right - box.left) + 3
      : Math.min(x, round.left - box.left) - 3;
    line.setAttribute(
      "d",
      [
        `M ${x.toFixed(1)} ${y.toFixed(1)}`,
        `L ${knee.toFixed(1)} ${labelY.toFixed(1)}`,
        `L ${labelX.toFixed(1)} ${labelY.toFixed(1)}`,
      ].join(" "),
    );
  }
}

/** A label beside the ring: the name over the percent, then the amount and change if asked. */
const LABEL =
  "flex min-h-11 max-w-full flex-col justify-center rounded-lg px-1 py-1 text-[0.6875rem]/tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50 @min-[26rem]:px-2 @min-[26rem]:text-xs/tight";

// The three columns: labels, the ring, labels. The ring takes 45% of the card, from 120 px on a
// small phone, so the labels keep room for a word like "Groceries", up to 224 px.
const COLUMNS =
  "grid-cols-[minmax(0,1fr)_clamp(7.5rem,45cqw,14rem)_minmax(0,1fr)] gap-x-1 @min-[26rem]:gap-x-4";

/** An amount, or a count when the ring splits by entries. */
function Value({
  value,
  entries,
  className,
}: {
  value: number;
  entries: boolean;
  className?: string | undefined;
}) {
  if (entries) {
    return (
      <span className={cn("tabular-nums", className)}>
        {entriesText(value)}
      </span>
    );
  }
  return (
    <Money value={value} {...(className === undefined ? {} : { className })} />
  );
}

/**
 * The value in the ring's middle, on one line. A long amount, a crore or more, is a size smaller,
 * so it stays inside a phone's small ring.
 */
function RingValue({ value, entries }: { value: number; entries: boolean }) {
  const long = !entries && formatPkr(value).length > "Rs 999,999".length;
  return (
    <Value
      value={value}
      entries={entries}
      className={cn(
        "font-bold whitespace-nowrap",
        long
          ? "text-[0.625rem]/tight @min-[26rem]:text-xs/tight @xl:text-sm/tight"
          : "text-xs/tight @min-[26rem]:text-sm/tight @xl:text-base/tight",
      )}
    />
  );
}

/** What a part rose or fell by: an arrow and the difference, never red. More isn't wrong. */
function ChangeMark({
  diff,
  entries,
  className,
}: {
  diff: number;
  entries: boolean;
  className?: string | undefined;
}) {
  const Icon = diff > 0 ? ArrowUp : diff < 0 ? ArrowDown : Minus;
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex items-center gap-0.5 tabular-nums", className)}
    >
      <Icon className="size-3 shrink-0" />
      {diff === 0 ? "Same" : <Value value={Math.abs(diff)} entries={entries} />}
    </span>
  );
}

/** One of the rest, in the list "14 more" opens: its name and share. A tap picks it. */
function RestButton({
  name,
  value,
  sum,
  entries,
  amounts,
  onPick,
  onHover,
}: {
  name: string;
  value: number;
  sum: number;
  entries: boolean;
  /** Show its amount, or count, beside its share. */
  amounts: boolean;
  onPick: () => void;
  /** The pointer or focus is on it, or has left. */
  onHover: (on: boolean) => void;
}) {
  const amountText = useAmountText();
  const percent = sharePercent(value / sum);
  return (
    <button
      type="button"
      data-part={name}
      aria-pressed={false}
      onClick={onPick}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") onHover(true);
      }}
      onPointerLeave={() => {
        onHover(false);
      }}
      onFocus={() => {
        onHover(true);
      }}
      onBlur={() => {
        onHover(false);
      }}
      className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="min-w-0 flex-1 font-medium wrap-break-word">{name}</span>
      {amounts && (
        <span aria-hidden="true" className="shrink-0 text-muted-foreground">
          <Value value={value} entries={entries} />
        </span>
      )}
      <span aria-hidden="true" className="shrink-0 font-semibold tabular-nums">
        {percent}
      </span>
      <span className="sr-only">
        , {percent === "<1%" ? "under 1%" : percent},{" "}
        {entries ? entriesText(value) : amountText(value)}
      </span>
    </button>
  );
}

/** The chart's own settings, from Customize. */
type DonutOptions = Pick<
  BreakdownSettings,
  "byEntries" | "amounts" | "change" | "summary"
>;

/**
 * How the total splits, as a donut: the top 5 in the theme's chart colours, biggest first from
 * the top, then the rest together, striped, as "14 more". It isn't called Other, since a category
 * may be. A line above names the biggest. Each part's name and percent sit beside the ring, on the
 * side of its slice, joined to it by a thin line, so there's no key to read across to. Its name
 * and amount show in the middle on hover, focus or a tap; the label already gives the percent. A
 * tap on a part, its label or its slice, picks it like a row in the list, and "14 more" opens to
 * list the rest, each of which can be picked. The ring and lines are a picture only: screen
 * readers get the line above and the labels, in size order, each with its share and amount.
 *
 * Its settings: split by entries rather than amount; each label's amount, or count, beside its
 * percent; each label's change against the comparison; and the line above, on by default.
 */
export function BreakdownDonut({
  summary,
  rows,
  by,
  plural,
  selected,
  onSelect,
  usual,
  options,
  actions,
}: {
  summary: MonthSummary;
  /** Every row, biggest first. */
  rows: readonly BreakdownRow[];
  by: "category" | "account";
  /** "categories", for "14 more categories". */
  plural: string;
  selected: string | undefined;
  onSelect: (name: string | undefined) => void;
  /** The rows usually biggest, most first. They keep their colours from month to month. */
  usual: readonly string[];
  options: DonutOptions;
  /** Shown under the chart for the picked row. */
  actions: (row: BreakdownRow) => ReactNode;
}) {
  const stripes = `stripes-${useId().replaceAll(/[^\w-]/g, "")}`;
  const restId = useId();
  const amountText = useAmountText();
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const chart = useRef<HTMLDivElement>(null);
  // A pick can move a row out of the rest or back, so focus follows it to its new button.
  const refocus = useRef<string | null>(null);
  useEffect(() => {
    const name = refocus.current;
    if (name === null) return;
    refocus.current = null;
    const buttons = [
      ...(root.current?.querySelectorAll<HTMLButtonElement>(
        "[data-label], [data-part]",
      ) ?? []),
    ];
    (
      buttons.find(
        (button) =>
          button.dataset.label === rowKey(name) || button.dataset.part === name,
      ) ?? buttons.find((button) => button.dataset.label === OTHER_KEY)
    )?.focus();
  }, [selected]);

  const measure = measureOf(options.byEntries);
  const ranked = rows
    .filter((row) => measure.now(row) > 0)
    .toSorted((one, two) => measure.now(two) - measure.now(one));
  const sum = totalOf(ranked, measure);
  const empty = sum === 0;
  // The lines follow the labels after every render, and whenever the card changes size.
  useLayoutEffect(() => {
    if (chart.current !== null) drawLines(chart.current);
  });
  useEffect(() => {
    const box = chart.current;
    if (box === null) return;
    const observer = new ResizeObserver(() => {
      drawLines(box);
    });
    observer.observe(box);
    return () => {
      observer.disconnect();
    };
  }, [empty]);

  if (empty) {
    return <p className="text-sm font-medium">{nothingSpent(summary)}</p>;
  }

  const parts = partsOf(rows, ranked, selected, usual, measure);
  const other = parts.find((part) => part.rest.length > 0);
  const pickedRow = rows.find((row) => row.name === selected);
  const pick = (name: string, fromLabel: boolean) => {
    if (fromLabel) refocus.current = name;
    onSelect(name === selected ? undefined : name);
  };
  const hover = (target: string) => (on: boolean) => {
    setHovered(on ? target : null);
  };
  const valueText = (value: number) =>
    measure.entries ? entriesText(value) : amountText(value);
  // "Rs 6,200 more than October", "3 fewer entries than your usual month".
  const against = summary.comparison?.name ?? "before";
  const changeText = (diff: number) => {
    if (diff === 0) return `the same as ${against}`;
    const size = Math.abs(diff);
    if (measure.entries) {
      const unit = size === 1 ? "entry" : "entries";
      return `${String(size)} ${diff > 0 ? "more" : "fewer"} ${unit} than ${against}`;
    }
    return `${amountText(size)} ${diff > 0 ? "more" : "less"} than ${against}`;
  };

  // The middle shows the part under the pointer or focus, else the picked one, else the total.
  const lookup = (target: string | null) => {
    if (target === null) return undefined;
    if (target === OTHER_KEY) {
      return other === undefined
        ? undefined
        : { label: `${String(other.rest.length)} more`, value: other.value };
    }
    const row = rows.find((one) => rowKey(one.name) === target);
    return row === undefined
      ? undefined
      : { label: row.name, value: measure.now(row) };
  };
  const focus =
    lookup(hovered) ?? lookup(selected === undefined ? null : rowKey(selected));

  const slices: Slice[] = [];
  let turned = 0;
  for (const part of parts) {
    const to = turned + part.value / sum;
    const target = part.rest.length > 0 ? OTHER_KEY : rowKey(part.name);
    slices.push({ part, target, from: turned, to });
    turned = to;
  }
  const { places, rows: lines } = place(slices);

  return (
    <div ref={root} className="@container flex flex-col gap-4">
      {options.summary && (
        <p className="font-medium text-pretty">
          {takeaway(ranked, measure, by, summary)}
        </p>
      )}
      <div
        ref={chart}
        role="list"
        aria-label={`How the ${plural} split`}
        className={cn("relative grid items-center", COLUMNS)}
        style={{
          gridTemplateRows: `repeat(${String(lines)}, minmax(2.75rem, auto))`,
        }}
      >
        <div
          aria-hidden="true"
          data-ring=""
          className="relative col-start-2 row-span-full aspect-square w-full self-center"
        >
          <svg viewBox="-50 -50 100 100" className="size-full overflow-visible">
            <defs>
              <pattern
                id={stripes}
                width="4"
                height="4"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="4" height="4" fill="var(--muted)" />
                <rect width="1.5" height="4" fill="var(--muted-foreground)" />
              </pattern>
            </defs>
            {slices.map(({ part, target, from, to }) => {
              if (to <= from) return null;
              const isOther = part.rest.length > 0;
              const picked = !isOther && part.name === selected;
              return (
                <path
                  key={target}
                  d={slicePath(from, to, picked ? RAISED : OUTER)}
                  fill={part.colour ?? `url(#${stripes})`}
                  fillRule="evenodd"
                  stroke="var(--foreground)"
                  strokeOpacity={0.15}
                  strokeWidth={0.5}
                  className={cn(
                    "cursor-pointer transition-opacity",
                    selected !== undefined && !picked && "opacity-30",
                  )}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") setHovered(target);
                  }}
                  onPointerLeave={() => {
                    setHovered(null);
                  }}
                  onClick={() => {
                    if (isOther) setOpen(!open);
                    else pick(part.name, false);
                  }}
                />
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-[20%] flex flex-col items-center justify-center text-center">
            {focus === undefined ? (
              <>
                <span className="text-[0.6875rem]/tight text-muted-foreground @min-[26rem]:text-xs/tight">
                  Total
                </span>
                <RingValue value={sum} entries={measure.entries} />
              </>
            ) : (
              <>
                <span className="line-clamp-2 text-[0.6875rem]/tight font-medium wrap-break-word @min-[26rem]:text-xs/tight">
                  {focus.label}
                </span>
                <RingValue value={focus.value} entries={measure.entries} />
              </>
            )}
          </div>
        </div>

        {slices.map(({ part, target }) => {
          const at = places.get(target);
          if (at === undefined) return null;
          const isOther = part.rest.length > 0;
          const picked = !isOther && part.name === selected;
          const left = at.side === "left";
          const percent = sharePercent(part.value / sum);
          const words = percent === "<1%" ? "under 1%" : percent;
          // On the picked label's tint, the extra lines keep its colour.
          const quiet = picked ? undefined : "text-muted-foreground";
          const diff =
            options.change && part.before !== null
              ? part.value - part.before
              : null;
          return (
            <div
              key={target}
              role="listitem"
              className={cn(
                "min-w-0",
                left ? "justify-self-end" : "justify-self-start",
              )}
              style={{ gridColumn: left ? 1 : 3, gridRow: at.row }}
            >
              <button
                type="button"
                data-label={target}
                {...(isOther
                  ? { "aria-expanded": open, "aria-controls": restId }
                  : { "aria-pressed": picked })}
                onClick={() => {
                  if (isOther) setOpen(!open);
                  else pick(part.name, true);
                }}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setHovered(target);
                }}
                onPointerLeave={() => {
                  setHovered(null);
                }}
                onFocus={() => {
                  setHovered(target);
                }}
                onBlur={() => {
                  setHovered(null);
                }}
                className={cn(
                  LABEL,
                  left ? "items-end text-right" : "items-start text-left",
                  picked && "bg-accent text-accent-foreground",
                  !picked && hovered === target && "bg-muted",
                  !picked && "hover:bg-muted",
                )}
              >
                {isOther ? (
                  <span className="inline-flex items-center gap-0.5 font-medium">
                    {part.rest.length} more
                    <span className="sr-only"> {plural}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "size-3.5 shrink-0 transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </span>
                ) : (
                  <span className="font-medium wrap-break-word hyphens-auto">
                    {part.name}
                  </span>
                )}
                {/* The amount sits beside the percent where there's room, under it where not. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex flex-wrap gap-x-1.5",
                    left && "justify-end",
                  )}
                >
                  <span className="font-semibold tabular-nums">{percent}</span>
                  {options.amounts && (
                    <Value
                      value={part.value}
                      entries={measure.entries}
                      className={quiet}
                    />
                  )}
                </span>
                {diff !== null && (
                  <ChangeMark
                    diff={diff}
                    entries={measure.entries}
                    className={quiet}
                  />
                )}
                <span className="sr-only">
                  , {words}, {valueText(part.value)}
                  {diff === null ? "" : `, ${changeText(diff)}`}
                </span>
              </button>
            </div>
          );
        })}

        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          {slices.map(({ part, target, from, to }) => {
            const at = places.get(target);
            if (at === undefined) return null;
            const picked = part.rest.length === 0 && part.name === selected;
            return (
              <path
                key={target}
                data-line={target}
                data-turn={(from + to) / 2}
                data-radius={picked ? RAISED : OUTER}
                data-side={at.side}
                fill="none"
                stroke="var(--muted-foreground)"
                strokeOpacity={0.6}
                strokeWidth={1}
              />
            );
          })}
        </svg>
      </div>

      {other !== undefined && open && (
        <ul
          id={restId}
          aria-label={`${String(other.rest.length)} more ${plural}`}
          className="-mx-2 grid grid-cols-1 @min-[30rem]:grid-cols-2 @min-[30rem]:gap-x-4"
        >
          {other.rest.map((row) => (
            <li key={row.name}>
              <RestButton
                name={row.name}
                value={measure.now(row)}
                sum={sum}
                entries={measure.entries}
                amounts={options.amounts}
                onPick={() => {
                  pick(row.name, true);
                }}
                onHover={hover(rowKey(row.name))}
              />
            </li>
          ))}
        </ul>
      )}

      {pickedRow !== undefined && (
        <div className="-mx-3">{actions(pickedRow)}</div>
      )}
    </div>
  );
}
