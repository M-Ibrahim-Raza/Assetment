import { formatGainShare } from "@proto/components/metals/weight";
import {
  type Holding,
  ownFundName,
  places,
  type Security,
  type SecurityKind,
  securities,
  type StockPrices,
} from "@proto/fixtures/stocks";
import { formatSignedPkr } from "@proto/kit/format";

// The sums behind a holding: what it's worth today, what it cost, and the profit. Kept apart from
// the forms so Quick add's Add trade and Portfolio can reuse them.

/** Shares and ETFs sit in a CDC account and are copied from the broker app. Funds come from the fund's app. */
export type HoldingGroup = "listed" | "funds";

export const GROUP_OF: Readonly<Record<SecurityKind, HoldingGroup>> = {
  share: "listed",
  etf: "listed",
  fund: "funds",
};

/** Each kind has its own way in: its own search and its own add. */
export const GROUP_ADD: Readonly<Record<HoldingGroup, string>> = {
  listed: "Add a share or ETF",
  funds: "Add a mutual fund",
};

/** The search's label in each kind's entry. */
export const GROUP_SEARCH: Readonly<Record<HoldingGroup, string>> = {
  listed: "Share or ETF",
  funds: "Mutual fund",
};

/** The holdings of one kind, in the order they were added. */
export const inGroup = (
  list: readonly Holding[],
  group: HoldingGroup,
): Holding[] =>
  list.filter((holding) => GROUP_OF[securityOf(holding.symbol).kind] === group);

/** What each kind is called, for search results and rows. */
export const KIND_NAME: Readonly<Record<SecurityKind, string>> = {
  share: "Share",
  etf: "ETF",
  fund: "Mutual fund",
};

/** What one of it is called: a share, or a unit of an ETF or fund. */
const ONE: Readonly<Record<SecurityKind, [string, string]>> = {
  share: ["share", "shares"],
  etf: ["unit", "units"],
  fund: ["unit", "units"],
};

export const isFund = (kind: SecurityKind): boolean => kind === "fund";

/** A fund the user added by name has no NAV in the day's prices: they type it in. */
export const isOwnFund = (symbol: string): boolean =>
  ownFundName(symbol) !== null;

export function securityOf(symbol: string): Security {
  const own = ownFundName(symbol);
  if (own !== null)
    return { symbol, name: own, kind: "fund", by: "Added by you" };
  const found = securities.find((security) => security.symbol === symbol);
  if (found === undefined) throw new Error(`No security called ${symbol}.`);
  return found;
}

/** A row's name: "Lucky Cement (LUCK)" for something on PSX. A fund goes by its name alone. */
export const displayName = (security: Security): string =>
  isFund(security.kind)
    ? security.name
    : `${security.name} (${security.symbol})`;

/** Where a share is held, by name: a place on the list, or the broker's name as the user typed it. */
export const placeName = (heldAt: string): string =>
  places[heldAt]?.name ?? heldAt;

/** Two places are the same when they name the same one, whatever the case or spaces. */
export const samePlace = (a: string | null, b: string | null): boolean =>
  (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

/** Today's close or NAV. Null when there is no price for it. */
export const priceOf = (symbol: string, prices: StockPrices): number | null =>
  prices.prices[symbol] ?? null;

/** A holding's price: the day's close or NAV, or the NAV the user typed for a fund they added. */
export const navOf = (
  holding: Pick<Holding, "symbol" | "ownNav">,
  prices: StockPrices,
): number | null => holding.ownNav ?? priceOf(holding.symbol, prices);

/** What it's worth at the day's price, in whole rupees. */
export function valueOf(
  holding: Pick<Holding, "symbol" | "quantity" | "ownNav">,
  prices: StockPrices,
): number {
  const price = navOf(holding, prices);
  return price === null ? 0 : Math.round(holding.quantity * price);
}

export interface Cost {
  /** Whole rupees. */
  amount: number;
  /** True with no price paid: the cost is its value today, so the profit starts at Rs 0. */
  fromToday: boolean;
}

/** The cost is what the buys cost, or how many at the average price: share, ETF or fund alike. */
export function costOf(holding: Holding, prices: StockPrices): Cost {
  const known =
    holding.buys !== null
      ? Math.round(
          holding.buys.reduce((sum, buy) => sum + buy.quantity * buy.price, 0),
        )
      : holding.averagePrice === null
        ? null
        : Math.round(holding.quantity * holding.averagePrice);
  return known === null
    ? { amount: valueOf(holding, prices), fromToday: true }
    : { amount: known, fromToday: false };
}

const whole = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });
const units = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 4 });
const paisa = new Intl.NumberFormat("en-PK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

/** "150 shares", "1 share" or "6,250.5 units". */
export function formatQuantity(quantity: number, kind: SecurityKind): string {
  const [one, many] = ONE[kind];
  const number = isFund(kind) ? units.format(quantity) : whole.format(quantity);
  return `${number} ${quantity === 1 ? one : many}`;
}

/** A price per share or unit, with paisa: "Rs 248.37" or "Rs 79.8488". */
export const formatPrice = (rupees: number): string =>
  `Rs ${paisa.format(rupees)}`;

const day = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** A day as people say it: "5 Jan 2024". */
export const formatDay = (date: string): string =>
  day.format(new Date(`${date}T00:00:00Z`));

/** A profit with its share of the cost, e.g. "+Rs 15,750 (+10.3%)". */
export function profitText(profit: number, cost: number): string {
  const share = cost === 0 ? "" : ` (${formatGainShare(profit / cost)})`;
  return `${formatSignedPkr(profit)}${share}`;
}

// Letters and digits only, so "D.G. Khan" finds DGKC and "lucky cement" finds Lucky Cement.
const fold = (text: string): string =>
  text.toLowerCase().replaceAll(/[^a-z0-9]/g, "");

/** True when what's typed starts its symbol, or is part of its name. A fund also matches its AMC. */
export function matches(security: Security, query: string): boolean {
  const typed = fold(query);
  if (typed === "") return true;
  return (
    fold(security.symbol).startsWith(typed) ||
    fold(security.name).includes(typed) ||
    (isFund(security.kind) && fold(security.by).includes(typed))
  );
}

/** What was typed, cut to digits and one point, with at most `places` decimals. Commas and "Rs" drop out. */
export function decimalInput(text: string, places: number): string {
  const [before = "", ...rest] = text.replaceAll(/[^\d.]/g, "").split(".");
  const digits = before.replace(/^0+(?=\d)/, "").slice(0, 9);
  if (rest.length === 0 || places === 0) return digits;
  return `${digits === "" ? "0" : digits}.${rest.join("").slice(0, places)}`;
}

/** The totals of a list: today's value, the cost, and the profit on it. */
export function totalsOf(
  list: readonly Holding[],
  prices: StockPrices,
): { value: number; cost: number; profit: number; fromToday: number } {
  let value = 0;
  let cost = 0;
  let fromToday = 0;
  for (const holding of list) {
    const each = costOf(holding, prices);
    value += valueOf(holding, prices);
    cost += each.amount;
    if (each.fromToday) fromToday += 1;
  }
  return { value, cost, profit: value - cost, fromToday };
}
