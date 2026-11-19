// Property: houses, flats, plots, files, shops and land, at the value the user gives them. There's
// no price feed. A marla isn't the same size everywhere (225 or 272 sq ft), so a size stays in the
// unit it was typed in and is never converted.

export type PropertyKind = "house" | "flat" | "plot" | "file" | "shop" | "land";

/** Lahore and Islamabad talk in marla and kanal, Karachi in square yards, flats in square feet. */
export type AreaUnit = "marla" | "kanal" | "sq-yd" | "sq-ft" | "acre";

export type InstalmentEvery = "month" | "quarter";

/** A plot or file still being paid for. Until it's paid off, it's owned and the rest is owed. */
export interface Instalments {
  /** What the user still has to pay, in whole rupees. It counts in Debts. */
  left: number;
  /** Each instalment, in whole rupees. Null when not known. */
  amount: number | null;
  every: InstalmentEvery;
}

export interface Property {
  id: string;
  kind: PropertyKind;
  /** What the app calls it, built from its size, kind and address: "10 marla house, DHA Phase 6, Lahore". */
  name: string;
  /** Null for a town that isn't in the city list. */
  city: string | null;
  /** The society, scheme or area: "DHA Phase 6", "Johar Town", "Clifton". */
  area: string;
  /** A flat's building or a shop's plaza, e.g. "Sea View Apartments". Null for everything else. */
  building: string | null;
  /** The block, sector or phase inside the area, e.g. "Block Q". */
  block: string | null;
  /** The plot, house, flat or shop number, or the khasra number for land. A file has none yet. */
  number: string | null;
  size: { amount: number; unit: AreaUnit } | null;
  /** The going rate for one unit of size, when the value was worked out from it. */
  rate: number | null;
  /** What the whole property would sell for today, as the user sees it. Whole rupees. */
  value: number;
  /** The month the value was given, e.g. "2026-11". Typed values get old. */
  valuedOn: string;
  /** The user's part of it: 1 is all of it, 0.5 a half share. Only this part counts. */
  share: number;
  /**
   * What the user paid, from their own money. For a plot on instalments, the full price with every
   * instalment. Null for a gift, an inheritance, or when not known.
   */
  paid: number | null;
  /** When it was bought: the month, e.g. "2014-03", or the day, e.g. "2025-05-14". */
  bought: string | null;
  instalments: Instalments | null;
}

/** The prototype's this month: every value typed in setup is from it. */
export const PROPERTY_TODAY = "2026-11";

// Realistic Pakistani property across Lahore, Karachi, Islamabad and Rawalpindi, including a
// long address to test wrapping. Without the id, which `properties` adds.
const SAMPLES = [
  {
    kind: "house",
    name: "7 marla house, Johar Town, Lahore",
    city: "Lahore",
    area: "Johar Town",
    building: null,
    block: "Block R-1",
    number: "214",
    size: { amount: 7, unit: "marla" },
    rate: null,
    value: 32_000_000,
    valuedOn: PROPERTY_TODAY,
    share: 1,
    paid: 14_000_000,
    bought: "2014-03",
    instalments: null,
  },
  {
    kind: "plot",
    name: "5 marla plot, Bahria Town, Lahore",
    city: "Lahore",
    area: "Bahria Town",
    building: null,
    block: "Overseas B",
    number: "412",
    size: { amount: 5, unit: "marla" },
    rate: 1_300_000,
    value: 6_500_000,
    valuedOn: PROPERTY_TODAY,
    share: 1,
    paid: 4_800_000,
    bought: "2021-09",
    instalments: null,
  },
  {
    kind: "flat",
    name: "1,150 sq ft flat, Sea View Apartments, Clifton, Karachi",
    city: "Karachi",
    area: "Clifton",
    building: "Sea View Apartments",
    block: "Block 2",
    number: "C-704",
    size: { amount: 1150, unit: "sq-ft" },
    rate: null,
    value: 28_000_000,
    valuedOn: PROPERTY_TODAY,
    share: 1,
    paid: 17_500_000,
    bought: "2019-11",
    instalments: null,
  },
  {
    kind: "shop",
    name: "300 sq ft shop, Saeed Plaza, Blue Area, Islamabad",
    city: "Islamabad",
    area: "Blue Area",
    building: "Saeed Plaza",
    block: null,
    number: "14",
    size: { amount: 300, unit: "sq-ft" },
    rate: null,
    value: 36_000_000,
    valuedOn: PROPERTY_TODAY,
    // Inherited with two siblings: no price.
    share: 1 / 3,
    paid: null,
    bought: null,
    instalments: null,
  },
  {
    // 20% down, then 12 quarterly instalments of Rs 16 lakh. Six are paid, six are left.
    kind: "plot",
    name: "1 kanal plot, DHA Phase 9 Prism, Lahore",
    city: "Lahore",
    area: "DHA Phase 9 Prism",
    building: null,
    block: "Block J",
    number: "1021",
    size: { amount: 1, unit: "kanal" },
    rate: 23_000_000,
    value: 23_000_000,
    valuedOn: PROPERTY_TODAY,
    share: 1,
    paid: 24_000_000,
    bought: "2025-05-14",
    instalments: { left: 9_600_000, amount: 1_600_000, every: "quarter" },
  },
  {
    // Not balloted yet, so no plot number. Valued at the file rate dealers quote.
    kind: "file",
    name: "5 marla file, Bahria Town Phase 8, Rawalpindi",
    city: "Rawalpindi",
    area: "Bahria Town Phase 8",
    building: null,
    block: null,
    number: null,
    size: { amount: 5, unit: "marla" },
    rate: null,
    value: 3_400_000,
    valuedOn: PROPERTY_TODAY,
    share: 1,
    paid: 3_000_000,
    bought: "2024-08",
    instalments: { left: 1_500_000, amount: 250_000, every: "quarter" },
  },
  {
    kind: "house",
    // Half share with Bhai.
    name: "10 marla house, DHA Phase 6, Lahore",
    city: "Lahore",
    area: "DHA Phase 6",
    building: null,
    block: "Block Q",
    number: "123",
    size: { amount: 10, unit: "marla" },
    rate: null,
    value: 85_000_000,
    valuedOn: PROPERTY_TODAY,
    share: 1 / 2,
    paid: 9_000_000,
    bought: "2012-04",
    instalments: null,
  },
  {
    kind: "land",
    // Abbu's land, shared by three siblings. The long address tests wrapping.
    name: "4 acres of land, Mauza Kot Abdul Malik, Tehsil Ferozewala, District Sheikhupura",
    city: null,
    area: "Mauza Kot Abdul Malik, Tehsil Ferozewala, District Sheikhupura",
    building: null,
    block: null,
    number: "1187",
    size: { amount: 4, unit: "acre" },
    rate: 6_000_000,
    value: 24_000_000,
    valuedOn: PROPERTY_TODAY,
    share: 1 / 3,
    paid: null,
    bought: null,
    instalments: null,
  },
] as const satisfies readonly Omit<Property, "id">[];

const withId = (index: number): Property => {
  const sample = SAMPLES[index % SAMPLES.length] ?? SAMPLES[0];
  const round = Math.floor(index / SAMPLES.length);
  return {
    ...sample,
    id: `property-${String(index + 1)}`,
    name: round === 0 ? sample.name : `${sample.name} ${String(round + 1)}`,
  };
};

/** `count` properties, the same every time. The first two are a house and a plot. */
export function properties(count: number): Property[] {
  return Array.from({ length: count }, (_, index) => withId(index));
}

/** One sample by its place in the list: 0 is the house, 4 the plot on instalments, 6 the half share. */
export function sampleProperty(index: number): Property {
  return withId(index);
}
