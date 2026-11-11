import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { ScreenLink } from "@proto/components/screen-link";
import type { MonthStory } from "./scenarios";
import { BLOCK, DISPLAY, EYEBROW, INK, PAD } from "./parts";

interface MonthBlockProps {
  month: MonthStory;
  /** How far net worth moved this month: what was kept, plus what the Portfolio did. */
  netWorthChange: number;
}

/**
 * The month as one loud sentence on a sage block, then the sum behind it, ending in an ink bar
 * with the net worth change. Spending and the Portfolio meet here.
 */
export function MonthBlock({ month, netWorthChange }: MonthBlockProps) {
  const kept = month.earned - month.spent;
  // The share of this month's income that went out, capped at all of it.
  const spentShare =
    month.earned > 0 ? Math.min(1, month.spent / month.earned) : null;

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden bg-secondary text-secondary-foreground",
        BLOCK,
      )}
    >
      <div className={cn("flex flex-1 flex-col gap-6 py-8", PAD)}>
        <h2 className={EYEBROW}>{month.name} so far</h2>
        <p
          className={cn(
            DISPLAY,
            "text-4xl leading-none font-extrabold tracking-tight text-balance sm:text-5xl",
          )}
        >
          {kept >= 0 ? (
            <>
              You kept <Money value={kept} />
            </>
          ) : (
            <>
              You spent <Money value={-kept} /> more than you earned
            </>
          )}
        </p>

        {spentShare !== null && <SplitBar spentShare={spentShare} />}

        <dl className="flex flex-col">
          <Row label="Earned" screen="Spending">
            <Money value={month.earned} signed />
          </Row>
          <Row label="Spent" screen="Spending">
            <Money value={-month.spent} signed />
          </Row>
          <Row label="Portfolio moved" screen="Portfolio">
            <Direction value={month.portfolioMoved} />
            <Money value={month.portfolioMoved} signed />
          </Row>
        </dl>
      </div>
      <p
        className={cn(
          "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-4",
          INK,
          PAD,
        )}
      >
        <span className="font-semibold">Net worth this month</span>
        <span className="flex items-center gap-1.5 text-lg font-bold">
          <Direction value={netWorthChange} />
          <Money value={netWorthChange} signed />
        </span>
      </p>
    </section>
  );
}

/** Up, down or flat. On a coloured block this, with the sign, stands in for the gain and loss colours. */
function Direction({ value }: { value: number }) {
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  return <Icon aria-hidden="true" className="size-4 shrink-0" />;
}

/** What was earned, as two solid bars: spent in ink, kept in green. The caption carries the numbers. */
function SplitBar({ spentShare }: { spentShare: number }) {
  const spent = Math.round(spentShare * 100);
  const kept = 100 - spent;
  return (
    <div className="flex flex-col gap-2">
      <div aria-hidden="true" className="flex h-6 gap-1">
        <div
          className={cn("bg-(--ink)", BLOCK)}
          style={{ width: `${String(spent)}%` }}
        />
        <div
          className={cn("bg-primary", BLOCK)}
          style={{ width: `${String(kept)}%` }}
        />
      </div>
      <p className="flex justify-between gap-3 text-sm font-medium">
        <span>Spent {spent}%</span>
        <span>Kept {kept}%</span>
      </p>
    </div>
  );
}

interface RowProps {
  label: string;
  /** The screen that explains this number. */
  screen: string;
  children: ReactNode;
}

function Row({ label, screen, children }: RowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-foreground/20 py-3">
      <dt>
        <ScreenLink
          screen={screen}
          className="font-medium underline-offset-4 hover:underline"
        >
          {label}
        </ScreenLink>
      </dt>
      <dd className="flex items-center gap-1.5 font-bold">{children}</dd>
    </div>
  );
}
