import { ArrowDown, ArrowRight, ArrowUp, Minus } from "lucide-react";
import { use } from "react";
import { cn } from "@/lib/utils";
import { AmountsContext, Money } from "@proto/components/amounts";
import { ScreenLink } from "@proto/components/screen-link";
import { Sparkline } from "@proto/components/sparkline";
import {
  formatLakhCrore,
  formatPkr,
  formatSignedPercent,
  formatSignedPkr,
} from "@proto/kit/format";
import type { NetWorth } from "./scenarios";
import { BLOCK, DISPLAY, EYEBROW, HeroBlock, PAD } from "./parts";

/**
 * A type size that keeps the headline amount on one line, from a 320 px phone up. It steps with
 * the hero's width up to 72 px, and longer amounts start a step smaller. On phones it stays bigger
 * than the month headline.
 */
function headlineSize(characters: number): string {
  if (characters <= 12) {
    return "text-4xl @xs:text-5xl @lg:text-6xl @3xl:text-7xl";
  }
  if (characters <= 14) {
    return "text-3xl @xs:text-4xl @lg:text-5xl @3xl:text-6xl";
  }
  return "text-2xl @xs:text-3xl @lg:text-4xl @3xl:text-5xl";
}

/** Net worth as the one thing on the screen, then the two parts it is made of as a split block. */
export function NetWorthHero({ netWorth }: { netWorth: NetWorth }) {
  const { hidden: amountsHidden } = use(AmountsContext);
  const total = netWorth.portfolio - netWorth.debts;
  const change = netWorth.changeThisMonth;
  const monthStart = total - change;
  const spoken = formatLakhCrore(total);
  const firstPoint = netWorth.trend[0];
  // On the green block, the arrow and the sign say which way it went. Gain and loss colours don't show on green.
  const ChangeArrow = change > 0 ? ArrowUp : change < 0 ? ArrowDown : Minus;

  return (
    <>
      <HeroBlock>
        <div className="flex flex-col gap-3">
          <h2 className={EYEBROW}>Net worth</h2>
          <p
            className={cn(
              DISPLAY,
              "leading-none font-extrabold tracking-tighter",
              // Sized from the real amount, so hiding amounts doesn't change the layout.
              headlineSize(formatPkr(total).length),
            )}
          >
            <Money value={total} />
          </p>
          {spoken !== null && !amountsHidden && (
            <p className="text-xl font-semibold text-primary-foreground/80">
              {spoken}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="flex flex-wrap items-center gap-x-1.5 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-sm font-semibold">
            <ChangeArrow aria-hidden="true" className="size-4 shrink-0" />
            <Money value={change} signed />
            {monthStart > 0 && (
              <span className="tabular-nums">
                ({formatSignedPercent(change / monthStart)})
              </span>
            )}
            <span className="font-normal">this month</span>
          </p>
          <p className="text-sm text-primary-foreground/80">
            Prices as of {netWorth.pricesAsOf}
          </p>
        </div>

        {firstPoint !== undefined && (
          <Sparkline
            points={netWorth.trend}
            className="h-16 text-primary-foreground/70"
            label={
              amountsHidden
                ? `Net worth over the last ${String(netWorth.trend.length)} months`
                : `Net worth over the last ${String(netWorth.trend.length)} months, from ${formatPkr(firstPoint)} to ${formatPkr(total)}`
            }
          />
        )}
      </HeroBlock>

      <div className="grid grid-cols-2 gap-3">
        <Tile
          screen="Portfolio"
          label="Portfolio"
          caption="What you own"
          value={netWorth.portfolio}
          className="bg-card text-card-foreground"
        />
        <Tile
          screen="Debts"
          label="Debts"
          caption="What you owe"
          value={-netWorth.debts}
          signed
          // The ink tile is the one away from the sidebar, which is ink too.
          className="bg-foreground text-background"
        />
      </div>
    </>
  );
}

interface TileProps {
  /** The screen it opens. */
  screen: string;
  label: string;
  caption: string;
  /** Whole rupees. */
  value: number;
  signed?: boolean;
  /** The tile's field and text colours. */
  className: string;
}

/** Half of the split block under the hero. The whole tile is the link. */
function Tile({
  screen,
  label,
  caption,
  value,
  signed = false,
  className,
}: TileProps) {
  const characters = (signed ? formatSignedPkr(value) : formatPkr(value))
    .length;
  return (
    <ScreenLink
      screen={screen}
      className={cn("flex min-w-0 flex-col gap-1 py-5", BLOCK, PAD, className)}
    >
      <span className={cn(EYEBROW, "flex items-center justify-between gap-2")}>
        {label}
        <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
      </span>
      <Money
        value={value}
        signed={signed}
        // Half a 320 px phone is narrow, so a crore-sized amount starts a step smaller.
        className={cn(
          "font-bold",
          characters <= 12 ? "text-lg sm:text-2xl" : "text-sm sm:text-xl",
        )}
      />
      <span className="text-sm opacity-80">{caption}</span>
    </ScreenLink>
  );
}
