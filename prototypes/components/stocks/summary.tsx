"use client";

import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { DISPLAY } from "@proto/components/display";
import { formatGainShare } from "@proto/components/metals/weight";
import type { Security, StockPrices } from "@proto/fixtures/stocks";
import { type Cost, formatPrice, formatQuantity, isOwnFund } from "./holding";
import { priceSource } from "./parts";

// The end of a holding's panel: what it's worth today, what was invested, and the profit, worked
// out as a sum is written on a receipt. Shown once, here, so today's value isn't said twice.

/** Where the investment comes from. "places" is a share held in more than one, entered in one go. */
type Basis = "buys" | "average" | "places";

/**
 * Where the investment comes from, under its label: "Your shares at your average price", or
 * "Your units …" for an ETF or fund. The money's what was invested, not a cost.
 */
const investedFrom = (basis: Basis, security: Security): string => {
  switch (basis) {
    case "buys":
      return "What you paid for your buys";
    case "average":
      return `Your ${security.kind === "share" ? "shares" : "units"} at your average price`;
    case "places":
      return "What you paid, at every place";
  }
};

interface HoldingSummaryProps {
  value: number;
  /** What was invested, or, with no price, its value today. */
  cost: Cost;
  /** Where the investment comes from: the buys, the average, or a share's places together. */
  basis: Basis;
  /** How many shares or units are held, as typed or worked out. */
  quantity: number;
  /** The day's close or NAV, or the NAV typed for a fund the user added. Null when not known. */
  price: number | null;
  security: Security;
  prices: StockPrices;
}

/**
 * Today's value, less the investment, and the profit under a rule. Today's value says how it's
 * worked out: "150 shares at Rs 1,125.00, the PSX closing price on 12 Nov". With no price, the investment
 * is its value today, so the profit counts from today.
 */
export function HoldingSummary({
  value,
  cost,
  basis,
  quantity,
  price,
  security,
  prices,
}: HoldingSummaryProps) {
  // Nothing to sum yet: say where the figures will come from.
  if (quantity <= 0) {
    return (
      <p className="border-t pt-4 text-sm text-muted-foreground">
        {"Today's value and profit show here once you add how many you hold."}
      </p>
    );
  }
  const profit = value - cost.amount;
  // A NAV the user typed isn't the day's, so the day's prices being late doesn't touch it.
  const late = prices.stale && !isOwnFund(security.symbol);
  const workedOut =
    price === null
      ? null
      : `${formatQuantity(quantity, security.kind)} at ${formatPrice(price)}, the ${priceSource(security, prices)}${late ? " (today's isn't out yet)" : ""}`;
  const share =
    cost.fromToday || cost.amount === 0
      ? null
      : formatGainShare(profit / cost.amount);
  // Green for a profit, red for a loss: always with its sign, never colour alone.
  const tone = profit > 0 ? "text-gain" : profit < 0 ? "text-loss" : "";

  return (
    <div
      aria-live="polite"
      className="flex flex-col gap-3 border-t pt-4 tabular-nums"
    >
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3">
        <dt className="flex flex-col">
          <span>{"Today's value"}</span>
          {workedOut !== null && (
            <span className="text-sm text-muted-foreground">{workedOut}</span>
          )}
        </dt>
        <dd className="text-right">
          <Money value={value} className="font-semibold" />
        </dd>
        <dt className="flex flex-col">
          <span>Investment</span>
          <span className="text-sm text-muted-foreground">
            {cost.fromToday
              ? "Its value today: no price yet"
              : investedFrom(basis, security)}
          </span>
        </dt>
        <dd className="text-right font-semibold">
          {/* Taken away, as on a receipt. */}
          <span aria-hidden="true">{"− "}</span>
          <Money value={cost.amount} />
        </dd>
      </dl>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t-2 border-foreground pt-3">
        <span className="font-semibold">
          {profit < 0 ? "Loss as of today" : "Profit as of today"}
        </span>
        <span className="ml-auto text-right">
          <Money
            value={profit}
            signed
            className={cn(
              DISPLAY,
              "block text-2xl leading-none font-extrabold tracking-tight",
              tone,
            )}
          />
          {(share !== null || cost.fromToday) && (
            <span className="block pt-1 text-sm text-muted-foreground">
              {cost.fromToday ? "counts from today" : share}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
