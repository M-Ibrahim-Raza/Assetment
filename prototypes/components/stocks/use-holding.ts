"use client";

import { useState } from "react";
import type {
  Buy,
  Holding,
  Security,
  SecurityKind,
  StockPrices,
} from "@proto/fixtures/stocks";
import { useProtoAction } from "@proto/kit/use-proto-action";
import type { HoldingDraft } from "./form";
import {
  displayName,
  formatPrice,
  isFund,
  isOwnFund,
  navOf,
  placeName,
  samePlace,
  securityOf,
} from "./holding";

// One holding as it's typed: every field is text until it's saved, so nothing typed is lost.

/** One buy as it's typed. The key keeps a row's place while rows are added and removed. */
export interface BuyFields {
  key: number;
  /** The exact day, as the phone's date box gives it: "2024-03-12". */
  date: string;
  quantity: string;
  price: string;
}

/** A share, ETF or fund is entered buy by buy, or as how many and the average price. */
type Entry = "buys" | "average";

export interface HoldingFields {
  /** The saved holding's id, or the failed draft's. Null for a new one. */
  id: string | null;
  symbol: string | null;
  /** Shares, or a fund's units, as typed. */
  quantity: string;
  /** A fund the user added by name: today's NAV, with paisa, from the fund app. */
  nav: string;
  /** The average price a share or unit, with paisa: for a fund, the average NAV it was bought at. */
  averagePrice: string;
  /** Buy by buy, or how many and the average. */
  entry: Entry;
  /** Entered buy by buy. There's always at least one row. */
  buys: readonly BuyFields[];
  /** A share or ETF: where it's held. A place's id, a broker's name the user added, or "". */
  heldAt: string;
}

/** Where the fields say it's held, as it's saved: a place's id, a broker's name, or null. */
const heldAtOf = (fields: HoldingFields): string | null =>
  fields.heldAt === "" ? null : fields.heldAt;

const emptyBuy = (key: number): BuyFields => ({
  key,
  date: "",
  quantity: "",
  price: "",
});

/**
 * A new holding starts buy by buy, with one empty buy: share, ETF or fund alike. Where a share is
 * held starts as the last holding's place, since most people keep everything at one broker.
 */
export const emptyFields = (
  symbol: string | null = null,
  heldAt = "",
): HoldingFields => ({
  id: null,
  symbol,
  quantity: "",
  nav: "",
  averagePrice: "",
  entry: "buys",
  buys: [emptyBuy(0)],
  heldAt,
});

/** A saved holding as fields, entered the way it was saved. */
export function fieldsOf(holding: Holding): HoldingFields {
  return {
    id: holding.id,
    symbol: holding.symbol,
    quantity: String(holding.quantity),
    nav: holding.ownNav === undefined ? "" : String(holding.ownNav),
    averagePrice:
      holding.averagePrice === null ? "" : String(holding.averagePrice),
    entry: holding.buys === null ? "average" : "buys",
    buys:
      holding.buys === null
        ? [emptyBuy(0)]
        : holding.buys.map((buy, key) => ({
            key,
            date: buy.date,
            quantity: String(buy.quantity),
            price: String(buy.price),
          })),
    heldAt: holding.heldAt ?? "",
  };
}

/** True when it's being entered buy by buy. */
const byBuys = (fields: HoldingFields): boolean =>
  fields.symbol !== null && fields.entry === "buys";

/** The buys as numbers, oldest first. An empty box counts as 0. */
function buysOf(fields: HoldingFields): Buy[] {
  return fields.buys
    .map((buy) => ({
      date: buy.date,
      quantity: buy.quantity === "" ? 0 : Number(buy.quantity),
      price: buy.price === "" ? 0 : Number(buy.price),
    }))
    .toSorted((a, b) => a.date.localeCompare(b.date));
}

/** The average price of some buys, to 4 decimals. Null with no shares yet. */
function averageOf(buys: readonly Buy[]): number | null {
  const quantity = buys.reduce((sum, buy) => sum + buy.quantity, 0);
  if (quantity === 0) return null;
  const cost = buys.reduce((sum, buy) => sum + buy.quantity * buy.price, 0);
  return Math.round((cost / quantity) * 10_000) / 10_000;
}

/** How many shares or units the fields hold: the buys' total, or as typed. */
export function quantityOf(fields: HoldingFields): number {
  if (fields.symbol === null) return 0;
  if (byBuys(fields)) {
    return buysOf(fields).reduce((sum, buy) => sum + buy.quantity, 0);
  }
  return fields.quantity === "" ? 0 : Number(fields.quantity);
}

/** The fields' price: the day's close or NAV, or the NAV typed for a fund the user added. */
export function navOfFields(
  fields: HoldingFields,
  prices: StockPrices,
): number | null {
  if (fields.symbol === null) return null;
  return navOf(
    {
      symbol: fields.symbol,
      ...(isOwnFund(fields.symbol) && fields.nav !== ""
        ? { ownNav: Number(fields.nav) }
        : {}),
    },
    prices,
  );
}

/** What the fields' shares or units are worth at that price, in whole rupees. */
export function valueOfFields(
  fields: HoldingFields,
  prices: StockPrices,
): number {
  const price = navOfFields(fields, prices);
  return price === null ? 0 : Math.round(quantityOf(fields) * price);
}

/** The holding the fields describe. Call it only once they're valid. */
export function holdingOf(
  fields: HoldingFields,
  prices: StockPrices,
  id: string,
): Holding {
  const symbol = fields.symbol ?? "";
  const fund = isFund(securityOf(symbol).kind);
  const buys = byBuys(fields) ? buysOf(fields) : null;
  return {
    id,
    symbol,
    quantity: quantityOf(fields),
    averagePrice:
      buys !== null
        ? averageOf(buys)
        : fields.averagePrice === ""
          ? null
          : Number(fields.averagePrice),
    buys,
    ...(isOwnFund(symbol) && fields.nav !== ""
      ? { ownNav: Number(fields.nav) }
      : {}),
    heldAt: fund ? null : heldAtOf(fields),
  };
}

export interface BuyErrors {
  date: string | null;
  quantity: string | null;
  price: string | null;
}

export interface HoldingErrors {
  symbol: string | null;
  quantity: string | null;
  price: string | null;
  /** One for each buy row, in the rows' order. */
  buys: readonly BuyErrors[];
  /** The same share already added at the same place. */
  place: string | null;
  /** A fund the user added by name: today's NAV, which the day's prices don't have. */
  nav: string | null;
}

export const NO_ERRORS: HoldingErrors = {
  symbol: null,
  quantity: null,
  price: null,
  buys: [],
  place: null,
  nav: null,
};

/**
 * A share can be held in more than one place, each its own holding, but only once in each place.
 * `others` are the holdings already added; the one being changed is left out by its id.
 */
export function placeError(
  fields: HoldingFields,
  others: readonly Holding[],
): string | null {
  const { symbol } = fields;
  if (symbol === null || isFund(securityOf(symbol).kind)) return null;
  const heldAt = heldAtOf(fields);
  const clash = others.some(
    (other) =>
      other.symbol === symbol &&
      other.id !== fields.id &&
      samePlace(other.heldAt, heldAt),
  );
  if (!clash) return null;
  const name = displayName(securityOf(symbol));
  return heldAt === null
    ? `You've added ${name} already. Pick where this one's held, so the two can be told apart.`
    : `You've added ${name} at ${placeName(heldAt)} already. Pick another place, or change that one.`;
}

/** What a buy's price is called in its error: a fund's is the NAV it was bought at. */
const BUY_PRICE: Readonly<Record<SecurityKind, string>> = {
  share: "Enter the price a share.",
  etf: "Enter the price a unit.",
  fund: "Enter the NAV you bought at.",
};

/** What stops a buy from saving. Each buy needs its day, how many and its price. */
function buyErrors(
  buy: BuyFields,
  today: string,
  kind: SecurityKind,
): BuyErrors {
  return {
    date:
      buy.date === ""
        ? "Enter the day you bought them."
        : buy.date > today
          ? "That's after today."
          : null,
    quantity:
      buy.quantity === "" || Number(buy.quantity) === 0
        ? `Enter the ${kind === "share" ? "shares" : "units"}.`
        : null,
    price: buy.price === "" || Number(buy.price) === 0 ? BUY_PRICE[kind] : null,
  };
}

/**
 * A fund the user added by name has no NAV in the day's prices, so its NAV is needed, however
 * it's entered.
 */
function navError(fields: HoldingFields): string | null {
  if (fields.symbol === null || !isOwnFund(fields.symbol)) return null;
  if (fields.nav === "") return "Enter today's NAV, from your fund app.";
  return Number(fields.nav) === 0 ? "Enter a NAV above Rs 0." : null;
}

/** What stops a save, field by field. A price is needed, and 0 isn't one. */
export function errorsOf(
  fields: HoldingFields,
  prices: StockPrices,
): HoldingErrors {
  if (fields.symbol === null) {
    return { ...NO_ERRORS, symbol: "Pick a share, ETF or fund first." };
  }
  const { kind } = securityOf(fields.symbol);
  const nav = navError(fields);
  if (byBuys(fields)) {
    return {
      ...NO_ERRORS,
      nav,
      buys: fields.buys.map((buy) => buyErrors(buy, prices.date, kind)),
    };
  }
  const missing =
    kind === "share"
      ? "Enter how many shares you hold."
      : "Enter how many units you hold.";
  // The average is needed, as each buy's price is. Not known? Today's price is a start.
  const today = isFund(kind) ? "today's NAV" : "today's price";
  const price =
    fields.averagePrice === ""
      ? `Enter your average price, or use ${today}.`
      : Number(fields.averagePrice) === 0
        ? "Enter a price above Rs 0."
        : null;
  return {
    ...NO_ERRORS,
    nav,
    quantity: quantityOf(fields) > 0 ? null : missing,
    price,
  };
}

const hasBuyErrors = (errors: BuyErrors): boolean =>
  errors.date !== null || errors.quantity !== null || errors.price !== null;

export const hasErrors = (errors: HoldingErrors): boolean =>
  errors.symbol !== null ||
  errors.quantity !== null ||
  errors.price !== null ||
  errors.place !== null ||
  errors.nav !== null ||
  errors.buys.some(hasBuyErrors);

/**
 * A word of warning when an average price is over 10 times today's price, or under a tenth: most
 * often a slipped decimal point. It never blocks saving: a share bought years ago can be that far off.
 */
export function priceWarning(
  averagePrice: string,
  today: number | null,
): string | null {
  const paid = averagePrice === "" ? 0 : Number(averagePrice);
  if (paid === 0 || today === null) return null;
  if (paid > today * 10) {
    return `That's over 10 times today's price of ${formatPrice(today)}. Check the decimal point.`;
  }
  if (paid < today / 10) {
    return `That's under a tenth of today's price of ${formatPrice(today)}. Check for a missing digit.`;
  }
  return null;
}

/** The fields of one holding, and a way to change them. Picking another holding keeps the numbers. */
/** A change to one holding's fields: from the current fields to the next. */
type FieldsUpdate = (change: (current: HoldingFields) => HoldingFields) => void;

/** One holding's fields, kept in the panel's own state. */
export function useHoldingFields(initial: HoldingFields) {
  const [fields, setFields] = useState(initial);
  return fieldActions(fields, setFields);
}

/**
 * The ways to change one holding's fields, over whatever state holds them: a panel's own, or one
 * place's among several, when a share held in more than one place is entered in one go.
 */
export function fieldActions(fields: HoldingFields, setFields: FieldsUpdate) {
  const set = (patch: Partial<HoldingFields>) => {
    setFields((current) => ({ ...current, ...patch }));
  };
  const pick = (security: Security | null) => {
    set({ symbol: security?.symbol ?? null });
  };

  /**
   * Switches between buys and an average, keeping what was typed: an average becomes one buy with
   * its day still to fill in, and buys become their total and average.
   */
  const setEntry = (entry: Entry) => {
    setFields((current) => {
      if (current.entry === entry) return current;
      if (entry === "buys") {
        if (current.quantity === "" && current.averagePrice === "") {
          return { ...current, entry };
        }
        return {
          ...current,
          entry,
          buys: [
            {
              ...emptyBuy(nextKey(current.buys)),
              quantity: current.quantity,
              price: current.averagePrice,
            },
          ],
        };
      }
      const buys = buysOf(current);
      const total = buys.reduce((sum, buy) => sum + buy.quantity, 0);
      const average = averageOf(buys);
      return {
        ...current,
        entry,
        quantity: total === 0 ? "" : String(total),
        averagePrice: average === null ? "" : String(average),
      };
    });
  };

  const setBuy = (key: number, patch: Partial<Omit<BuyFields, "key">>) => {
    setFields((current) => ({
      ...current,
      buys: current.buys.map((buy) =>
        buy.key === key ? { ...buy, ...patch } : buy,
      ),
    }));
  };

  /** Adds an empty buy at the end, and returns its key so focus can move there. */
  const addBuy = (): number => {
    const key = nextKey(fields.buys);
    setFields((current) => ({
      ...current,
      buys: [...current.buys, emptyBuy(key)],
    }));
    return key;
  };

  /** Removes a buy. The last one stays: a holding bought buy by buy has at least one. */
  const removeBuy = (key: number) => {
    setFields((current) =>
      current.buys.length <= 1
        ? current
        : { ...current, buys: current.buys.filter((buy) => buy.key !== key) },
    );
  };

  return {
    fields,
    set,
    pick,
    setEntry,
    setBuy,
    addBuy,
    removeBuy,
  };
}

/** The key after the highest: a new buy's. */
const nextKey = (rows: readonly { key: number }[]): number =>
  rows.reduce((max, row) => Math.max(max, row.key), -1) + 1;

export type HoldingFieldsState = ReturnType<typeof fieldActions>;

/**
 * Saves through the prototype's latency, and remembers a failed save so the button says Try again.
 * A share held in more than one place saves as a holding for each.
 */
export function useSaveHolding(
  onSaved: (holdings: readonly Holding[]) => void,
  draft: HoldingDraft | null,
) {
  const action = useProtoAction(onSaved);
  const [failed, setFailed] = useState(draft?.status === "failed");
  return {
    pending: action.pending || draft?.status === "saving",
    failed,
    run: (holdings: readonly Holding[]) => {
      setFailed(false);
      action.run(holdings);
    },
  };
}
