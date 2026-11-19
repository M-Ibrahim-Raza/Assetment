import { formatSignedPercent } from "@proto/kit/format";
import type {
  Karat,
  Metal,
  MetalForm,
  MetalPiece,
  MetalRates,
  WeightUnit,
} from "@proto/fixtures/metals";

// Weights as jewellers in Pakistan say them, and what a piece is worth at the day's Sarafa rate.

export const GRAMS_PER_TOLA = 11.664;
export const MASHA_PER_TOLA = 12;
export const RATTI_PER_MASHA = 8;
const RATTI_PER_TOLA = MASHA_PER_TOLA * RATTI_PER_MASHA;

/** A weight split the way a jeweller writes it: "2 tola 4 masha 3 ratti". */
export interface TolaParts {
  tola: number;
  masha: number;
  ratti: number;
}

/** A weight in tola, to the nearest ratti, split into tola, masha and ratti. */
export function toParts(tola: number): TolaParts {
  const ratti = Math.round(tola * RATTI_PER_TOLA);
  return {
    tola: Math.floor(ratti / RATTI_PER_TOLA),
    masha: Math.floor((ratti % RATTI_PER_TOLA) / RATTI_PER_MASHA),
    ratti: ratti % RATTI_PER_MASHA,
  };
}

export const fromParts = ({ tola, masha, ratti }: TolaParts): number =>
  tola + masha / MASHA_PER_TOLA + ratti / RATTI_PER_TOLA;

const grams = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 });

/** "2 tola 4 masha", "6 masha 3 ratti" or "10 g", with "≈ " in front of a guess. */
export function formatWeight({
  tola,
  unit,
  estimated = false,
}: {
  tola: number;
  unit: WeightUnit;
  estimated?: boolean;
}): string {
  const about = estimated ? "≈ " : "";
  if (unit === "grams")
    return `${about}${grams.format(tola * GRAMS_PER_TOLA)} g`;
  const parts = toParts(tola);
  const said = [
    parts.tola > 0 ? `${String(parts.tola)} tola` : null,
    parts.masha > 0 ? `${String(parts.masha)} masha` : null,
    parts.ratti > 0 ? `${String(parts.ratti)} ratti` : null,
  ].filter((part) => part !== null);
  return `${about}${said.length === 0 ? "0 tola" : said.join(" ")}`;
}

/** The kind of piece, as a short line: "21K gold", "24K bar", "Silver". */
export function describe({
  metal,
  form,
  karat,
}: Pick<MetalPiece, "metal" | "form" | "karat">): string {
  if (metal === "silver") {
    return form === "jewellery" ? "Silver" : `Silver ${form}`;
  }
  return `${karat ?? "24K"} ${form}`;
}

/** The rate for one tola of this piece's metal and karat. */
export function rateOf(
  { metal, karat }: { metal: Metal; karat: Karat | null },
  rates: MetalRates,
): number {
  return metal === "silver" ? rates.silver : rates.gold[karat ?? "24K"];
}

/** The word a rate is quoted in, e.g. "Rs 37,346 a gram". */
export const UNIT_WORD: Readonly<Record<WeightUnit, string>> = {
  tola: "tola",
  grams: "gram",
};

/** A rate per tola, in whole rupees a tola or a gram: the unit the user weighs in. */
export const rateIn = (ratePerTola: number, unit: WeightUnit): number =>
  unit === "grams" ? Math.round(ratePerTola / GRAMS_PER_TOLA) : ratePerTola;

/** What it is worth at the day's rate, in whole rupees. Jewellery loses the user's deduction. */
export function valueOf(
  piece: {
    metal: Metal;
    form: MetalForm;
    karat: Karat | null;
    tola: number;
    cut?: number | null;
  },
  rates: MetalRates,
  deduction: number,
): number {
  return Math.round(
    piece.tola * rateOf(piece, rates) * (1 - cutOf(piece, deduction)),
  );
}

/** The deduction a piece is priced with: its own, else the user's general one. Jewellery only. */
export const cutOf = (
  piece: { form: MetalForm; cut?: number | null },
  deduction: number,
): number => (piece.form === "jewellery" ? (piece.cut ?? deduction) : 0);

/** What a piece cost, and how that's known. */
export interface Cost {
  /** Whole rupees. */
  amount: number;
  /** The rate a tola it was worked out at, from the month it was bought. Null for a price paid. */
  rate: number | null;
}

/**
 * What a piece cost: the price paid when it's known, since it includes making charges. Else its
 * weight at the Sarafa rate of the month it was bought. Null when neither is known.
 */
export function costOf(
  piece: Pick<MetalPiece, "metal" | "karat" | "tola" | "paid" | "bought">,
  ratesIn: (month: string) => MetalRates | null,
): Cost | null {
  if (piece.paid !== null) return { amount: piece.paid, rate: null };
  // A month has one average rate, so the day it was bought doesn't change it.
  const then = piece.bought === null ? null : ratesIn(piece.bought.slice(0, 7));
  if (then === null) return null;
  const rate = rateOf(piece, then);
  return { amount: Math.round(piece.tola * rate), rate };
}

const day = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** The day of a rate, as "12 Nov". */
export const formatRateDate = (date: string): string =>
  day.format(new Date(`${date}T00:00:00Z`));

const monthYear = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** When it was bought: "March 2021", or "12 March 2021" with a day. */
export function formatBought(bought: string): string {
  const [yearMonth, dayPart] = [bought.slice(0, 7), bought.slice(8)];
  const month = monthYear.format(new Date(`${yearMonth}-01T00:00:00Z`));
  return dayPart === "" ? month : `${String(Number(dayPart))} ${month}`;
}

const wholePercent = new Intl.NumberFormat("en-PK", {
  style: "percent",
  maximumFractionDigits: 0,
});

/** A gain as a share of its cost: one decimal under 100%, none from there up. "+3.7%", "+4,878%". */
export function formatGainShare(ratio: number): string {
  if (Math.abs(ratio) < 1) return formatSignedPercent(ratio);
  return `${ratio > 0 ? "+" : "−"}${wholePercent.format(Math.abs(ratio))}`;
}

const percent = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 1 });

/** A deduction as people say it, e.g. "10%". */
export const formatCut = (deduction: number): string =>
  `${percent.format(deduction * 100)}%`;
