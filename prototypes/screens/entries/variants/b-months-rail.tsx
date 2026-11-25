"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { DISPLAY } from "@proto/components/display";
import { type MonthGroup, monthName } from "../model";

// Months' spine: the rail beside the list on wide screens, and the strip over it below that. Both
// jump to a month and follow the scroll, marking the month in view.

/** A month section's id, as the rail and the strip link to it. */
export const monthId = (key: string) => `month-${key}`;

/** Scrolls a month's section to the top and moves focus to its heading, for keyboard users. */
export function jumpToMonth(key: string) {
  const section = document.getElementById(monthId(key));
  if (section === null) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  section.scrollIntoView({
    block: "start",
    behavior: still ? "auto" : "smooth",
  });
  section
    .querySelector<HTMLElement>("[data-month-heading]")
    ?.focus({ preventScroll: true });
}

/**
 * The month in view: the first section crossing a band near the window's top, under the sticky
 * headings. The newest month until one is seen.
 */
export function useMonthInView(keys: readonly string[]): string | null {
  const [inView, setInView] = useState<string | null>(null);
  const joined = keys.join(",");
  useEffect(() => {
    const order = joined === "" ? [] : joined.split(",");
    const crossing = new Set<string>();
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          const key = record.target.id.slice("month-".length);
          if (record.isIntersecting) crossing.add(key);
          else crossing.delete(key);
        }
        const first = order.find((key) => crossing.has(key));
        if (first !== undefined) setInView(first);
      },
      { rootMargin: "-25% 0px -70% 0px" },
    );
    for (const key of order) {
      const section = document.getElementById(monthId(key));
      if (section !== null) observer.observe(section);
    }
    return () => {
      observer.disconnect();
    };
  }, [joined]);
  return inView !== null && keys.includes(inView) ? inView : (keys[0] ?? null);
}

interface SpineProps {
  months: readonly MonthGroup[];
  today: string;
  /** The month in view. */
  current: string | null;
  className?: string | undefined;
}

/** One figure in the rail: its word and amount, over a bar measured against the largest month. */
function RailFigure({
  word,
  value,
  largest,
  received,
}: {
  word: string;
  value: number;
  largest: number;
  received: boolean;
}) {
  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{word}</span>
        <Money value={value} className="font-semibold" />
      </span>
      <span
        aria-hidden="true"
        className="block h-1.5 rounded-full bg-foreground/10"
      >
        <span
          className={cn(
            "block h-full rounded-full",
            received ? "bg-gain" : "bg-foreground",
          )}
          style={{ width: `${String((value / largest) * 100)}%` }}
        />
      </span>
    </span>
  );
}

/** Every month, newest first, with what went out and came in: the jump list and the overview. */
export function MonthRail({ months, today, current, className }: SpineProps) {
  const largest = Math.max(
    1,
    ...months.map((month) =>
      Math.max(month.totals.spent, month.totals.received),
    ),
  );
  return (
    <nav aria-label="Months" className={cn("flex flex-col gap-2", className)}>
      <ol className="flex flex-col gap-1">
        {months.map((month) => {
          const on = month.key === current;
          return (
            <li key={month.key}>
              <a
                href={`#${monthId(month.key)}`}
                aria-current={on ? "true" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  jumpToMonth(month.key);
                }}
                className={cn(
                  "flex flex-col gap-2 rounded-2xl border-l-4 p-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  on
                    ? "border-primary bg-card shadow-sm dark:border-accent-foreground"
                    : "border-transparent hover:bg-card/60",
                )}
              >
                <span
                  className={cn(
                    DISPLAY,
                    "text-2xl leading-none font-extrabold tracking-tight",
                  )}
                >
                  {monthName(month.key, today)}
                </span>
                <RailFigure
                  word="Spent"
                  value={month.totals.spent}
                  largest={largest}
                  received={false}
                />
                <RailFigure
                  word="Received"
                  value={month.totals.received}
                  largest={largest}
                  received
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The rail, folded into a row of months that scrolls inside itself. It keeps the month in view in sight. */
export function MonthStrip({ months, today, current, className }: SpineProps) {
  const strip = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = strip.current;
    if (list === null || current === null) return;
    const item = list.querySelector<HTMLElement>(`[data-month="${current}"]`);
    if (item === null) return;
    list.scrollTo({
      left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2,
    });
  }, [current]);
  return (
    <nav aria-label="Months" className={className}>
      <ol ref={strip} className="relative flex gap-2 overflow-x-auto py-2">
        {months.map((month) => {
          const on = month.key === current;
          return (
            <li key={month.key} data-month={month.key} className="shrink-0">
              <a
                href={`#${monthId(month.key)}`}
                aria-current={on ? "true" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  jumpToMonth(month.key);
                }}
                className={cn(
                  DISPLAY,
                  "inline-flex h-11 items-center rounded-full px-4 text-base font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  on
                    ? "bg-foreground text-background"
                    : "bg-card hover:bg-muted",
                )}
              >
                {monthName(month.key, today)}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
