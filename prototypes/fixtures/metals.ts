// Gold and silver: the day's Sarafa rates, and sample pieces weighed in tola.
// 1 tola = 12 masha = 96 ratti = 11.664 g. Rates are per tola, by karat, refreshed daily.

export type Metal = "gold" | "silver";

/** Jewellery takes the user's buy-back deduction. Bars and coins always get the full rate. */
export type MetalForm = "jewellery" | "bar" | "coin";

export const KARATS = ["24K", "22K", "21K", "18K"] as const;
export type Karat = (typeof KARATS)[number];

/** How the weight was typed, so it's shown back the same way. */
export type WeightUnit = "tola" | "grams";

export interface MetalPiece {
  id: string;
  metal: Metal;
  form: MetalForm;
  name: string;
  /** Null for silver, which has one rate. */
  karat: Karat | null;
  /** The weight in tola. */
  tola: number;
  unit: WeightUnit;
  /** True for a guessed weight, shown with ≈. */
  estimated: boolean;
  /** What was paid, in whole rupees. Null for a gift, an inheritance, or when not known. */
  paid: number | null;
  /** This piece's own buy-back deduction, as a share. Null uses the user's general one. */
  cut: number | null;
  /** When it was bought: the month, e.g. "2021-03", or the day, e.g. "2021-03-12". */
  bought: string | null;
}

export interface MetalRates {
  /** The day the rates are from, e.g. "2026-11-12". */
  date: string;
  /** True when they aren't today's, because today's rate isn't out yet. */
  stale: boolean;
  /** Rupees per tola. */
  gold: Readonly<Record<Karat, number>>;
  /** Rupees per tola. */
  silver: number;
}

/** Today's Sarafa rates. 22K at Rs 456,000 a tola makes Home's 2-tola sample Rs 912,000. */
export const metalRates: MetalRates = {
  date: "2026-11-12",
  stale: false,
  gold: { "24K": 497_800, "22K": 456_000, "21K": 435_600, "18K": 373_400 },
  silver: 5_850,
};

/** Rates from two days ago: today's Sarafa rate isn't out yet. */
export const staleMetalRates: MetalRates = {
  date: "2026-11-10",
  stale: true,
  gold: { "24K": 494_200, "22K": 452_700, "21K": 432_400, "18K": 370_700 },
  silver: 5_810,
};

// The 24K rate a tola at points in the past, for what a piece cost when only the month it was
// bought is known. A month between two points falls in between. Made up, but the right shape.
const PAST_24K: readonly (readonly [string, number])[] = [
  ["1990-01", 2_500],
  ["1995-01", 4_500],
  ["2000-01", 6_500],
  ["2005-01", 9_000],
  ["2008-01", 18_000],
  ["2010-01", 31_000],
  ["2012-01", 53_000],
  ["2013-06", 45_000],
  ["2016-01", 43_000],
  ["2018-01", 55_000],
  ["2019-01", 70_000],
  ["2019-12", 87_000],
  ["2020-08", 125_000],
  ["2021-03", 104_000],
  ["2022-01", 125_000],
  ["2022-12", 185_000],
  ["2023-04", 220_000],
  ["2024-01", 215_000],
  ["2024-06", 240_000],
  ["2025-02", 300_000],
  ["2025-08", 360_000],
  ["2026-11", 497_800],
];

/** The first month there are past rates for. */
export const FIRST_RATE_MONTH = "1990-01";

/** "2021-03" as a count of months, so two months can be compared and spaced. */
function monthNumber(month: string): number {
  const [year = 0, number = 1] = month.split("-").map(Number);
  return year * 12 + number - 1;
}

const toHundred = (rupees: number) => Math.round(rupees / 100) * 100;

/** That month's average Sarafa rates, per tola. Null for a month there are no rates for. */
export function monthRates(month: string): MetalRates | null {
  const at = monthNumber(month);
  const after = PAST_24K.findIndex(([point]) => monthNumber(point) >= at);
  const next = PAST_24K[after];
  const before = PAST_24K[after - 1] ?? next;
  if (next === undefined || before === undefined) return null;
  const start = monthNumber(before[0]);
  if (at < start) return null;
  const span = monthNumber(next[0]) - start;
  const share = span === 0 ? 1 : (at - start) / span;
  const gold24 = before[1] + (next[1] - before[1]) * share;
  return {
    date: `${month}-01`,
    stale: false,
    gold: {
      "24K": toHundred(gold24),
      "22K": toHundred(gold24 * 0.916),
      "21K": toHundred(gold24 * 0.875),
      "18K": toHundred(gold24 * 0.75),
    },
    silver: Math.round(gold24 / 85 / 10) * 10,
  };
}

// Realistic pieces for a Pakistani family, including a long name to test wrapping.
// The first three are the brief's: a wedding set, a biscuit and silver. Eight pass a crore.
const SAMPLES = [
  {
    name: "Wedding set",
    metal: "gold",
    form: "jewellery",
    karat: "21K",
    tola: 12,
    unit: "tola",
    estimated: false,
    paid: null,
    cut: null,
    bought: "2014-12",
  },
  {
    name: "Gold biscuit",
    metal: "gold",
    form: "bar",
    karat: "24K",
    tola: 1,
    unit: "tola",
    estimated: false,
    paid: 412_000,
    cut: null,
    bought: "2024-06",
  },
  {
    name: "Silver",
    metal: "silver",
    form: "bar",
    karat: null,
    tola: 40,
    unit: "tola",
    estimated: false,
    paid: null,
    cut: null,
    bought: null,
  },
  {
    name: "Bangles from Ammi's dowry, made by Haji Sahib Jewellers in Saddar, Rawalpindi",
    metal: "gold",
    form: "jewellery",
    karat: "22K",
    tola: 4.5,
    unit: "tola",
    estimated: true,
    paid: null,
    cut: null,
    bought: "1998-04",
  },
  {
    name: "Gold bar",
    metal: "gold",
    form: "bar",
    karat: "24K",
    tola: 10,
    unit: "tola",
    estimated: false,
    paid: 3_650_000,
    cut: null,
    bought: "2022-01",
  },
  {
    name: "Engagement ring",
    metal: "gold",
    form: "jewellery",
    karat: "21K",
    // 5 masha 3 ratti.
    tola: 5 / 12 + 3 / 96,
    unit: "tola",
    estimated: false,
    paid: 160_000,
    cut: null,
    bought: "2019-12",
  },
  {
    name: "Jhumkay",
    metal: "gold",
    form: "jewellery",
    karat: "22K",
    tola: 1,
    unit: "tola",
    estimated: true,
    paid: null,
    cut: null,
    bought: null,
  },
  {
    name: "Gold bar, 10 grams",
    metal: "gold",
    form: "bar",
    karat: "24K",
    tola: 10 / 11.664,
    unit: "grams",
    estimated: false,
    paid: 389_000,
    cut: null,
    bought: "2025-02",
  },
] as const satisfies readonly Omit<MetalPiece, "id">[];

/** `count` pieces, the same every time. After the samples run out, names get a number. */
export function metalPieces(count: number): MetalPiece[] {
  return Array.from({ length: count }, (_, index) => {
    const sample = SAMPLES[index % SAMPLES.length] ?? SAMPLES[0];
    const round = Math.floor(index / SAMPLES.length);
    return {
      ...sample,
      id: `metal-${String(index + 1)}`,
      name: round === 0 ? sample.name : `${sample.name} ${String(round + 1)}`,
    };
  });
}
