import type {
  AreaUnit,
  InstalmentEvery,
  Property,
  PropertyKind,
} from "@proto/fixtures/property";
import { formatDigits, formatLakhCrore, formatPkr } from "@proto/kit/format";

// The sums and words the property forms share. Pure, so Setup's scenarios can use them too.

export const KINDS: readonly PropertyKind[] = [
  "house",
  "flat",
  "plot",
  "file",
  "shop",
  "land",
];

export const KIND_LABEL: Readonly<Record<PropertyKind, string>> = {
  house: "House",
  flat: "Flat",
  plot: "Plot",
  file: "File",
  shop: "Shop",
  land: "Land",
};

/** A unit as people write it: "marla", "sq yd". */
export const UNIT_LABEL: Readonly<Record<AreaUnit, string>> = {
  marla: "marla",
  kanal: "kanal",
  "sq-yd": "sq yd",
  "sq-ft": "sq ft",
  acre: "acre",
};

/** How often an instalment is due, as the chips say it. */
export const EVERY_LABEL: Readonly<Record<InstalmentEvery, string>> = {
  month: "Every month",
  quarter: "Every 3 months",
};

/** The shares people say out loud. Anything else is typed as a %. */
export const SHARES = [
  { key: "whole", label: "Whole", share: 1 },
  { key: "half", label: "Half", share: 1 / 2 },
  { key: "third", label: "A third", share: 1 / 3 },
  { key: "quarter", label: "A quarter", share: 1 / 4 },
] as const;

export type ShareKey = (typeof SHARES)[number]["key"] | "other";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** "2026-11" as "Nov 2026", with a no-break space so it never splits across lines. */
export function formatMonth(month: string): string {
  const [year = "", number = "1"] = month.split("-");
  return `${MONTH_SHORT[Number(number) - 1] ?? ""}\u00a0${year}`;
}

/** When it was bought: "12 May 2025" with a day, or "May 2025" with just the month. */
export function formatBought(bought: string): string {
  const [, , day] = bought.split("-");
  const month = formatMonth(bought);
  return day === undefined ? month : `${String(Number(day))}\u00a0${month}`;
}

/** "10 marla", "1 kanal", "1,150 sq ft", "4 acres". */
export function formatSize({
  amount,
  unit,
}: {
  amount: number;
  unit: AreaUnit;
}): string {
  const word = unit === "acre" && amount !== 1 ? "acres" : UNIT_LABEL[unit];
  return `${formatDigits(amount)} ${word}`;
}

/** A rate or amount the short way people say it: "Rs 13 lakh", or "Rs 25,000" under a lakh. */
export function shortPkr(rupees: number): string {
  const spoken = formatLakhCrore(rupees);
  return spoken === null ? formatPkr(rupees) : `Rs ${spoken}`;
}

/** The user's part of what the property would sell for, in whole rupees. */
export const partOf = ({
  value,
  share,
}: Pick<Property, "value" | "share">): number => Math.round(value * share);

/** "Whole", "Half share", "A third", "A quarter", or "37.5% share". */
export function shareLabel(share: number): string {
  const said = SHARES.find((each) => Math.abs(each.share - share) < 0.0001);
  if (said === undefined)
    return `${String(Math.round(share * 1000) / 10)}% share`;
  return said.key === "half" ? "Half share" : said.label;
}

/** Which chip a share picks. */
export function shareKeyOf(share: number): ShareKey {
  return (
    SHARES.find((each) => Math.abs(each.share - share) < 0.0001)?.key ?? "other"
  );
}

/** Profit or loss on the user's part. Null with no price: it then counts from today. */
export const profitOf = (
  property: Pick<Property, "value" | "share" | "paid">,
): number | null =>
  property.paid === null ? null : partOf(property) - property.paid;

/** A gain with its share of the cost: "+Rs 85,800 (+20.8%)". */
export function profitText(profit: number, cost: number): string {
  const sign = profit > 0 ? "+" : profit < 0 ? "−" : "";
  const amount = `${sign}${formatPkr(Math.abs(profit))}`;
  if (cost === 0) return amount;
  const percent = Math.round((Math.abs(profit) / cost) * 1000) / 10;
  return `${amount} (${sign}${String(percent)}%)`;
}

/** How a title says the kind after the size: "10 marla house", "4 acres of land". */
const KIND_NOUN: Readonly<Record<PropertyKind, string>> = {
  house: "house",
  flat: "flat",
  plot: "plot",
  file: "file",
  shop: "shop",
  land: "of land",
};

/**
 * What the app calls a property, from its size, kind and address: "10 marla house, DHA Phase 6,
 * Lahore", or "1,150 sq ft flat, Sea View Apartments, Clifton, Karachi" with a flat's building or
 * a shop's plaza.
 * Whatever isn't filled in yet is left out, so a new one starts as just "Plot".
 */
export function titleOf({
  kind,
  size,
  building,
  area,
  city,
}: Pick<Property, "kind" | "size" | "building" | "area" | "city">): string {
  const what =
    size === null ? KIND_LABEL[kind] : `${formatSize(size)} ${KIND_NOUN[kind]}`;
  const named = KIND_FORM[kind].building === null ? null : building?.trim();
  return [what, named, area.trim(), city]
    .filter((part) => part !== null && part !== undefined && part !== "")
    .join(", ");
}

/** A label above a field, with the line under it. */
interface Asked {
  label: string;
  hint: string;
}

/**
 * How the form asks about one kind of property: its labels, which lines of the address it has,
 * the units its size comes in, and whether its value can come from a rate or it can be on
 * instalments. The form is the same for every kind; only these change.
 */
export interface KindForm {
  /** Land asks for the nearest city: it's usually in a village. */
  city: string;
  area: Asked;
  /** A flat's building, or a shop's plaza. Null where there's none. */
  building: Asked | null;
  block: Asked | null;
  /** What its number is called. Null for a file: it gets a plot number at balloting. */
  number: string | null;
  /** The units its size comes in, the usual one first. */
  units: readonly AreaUnit[];
  /** True when people price it by a rate per marla, kanal or acre. A building counts as a whole. */
  byRate: boolean;
  /** False for farmland, which is rarely bought on a payment plan. */
  instalments: boolean;
}

export const KIND_FORM: Readonly<Record<PropertyKind, KindForm>> = {
  house: {
    city: "City",
    area: {
      label: "Area or society",
      hint: "Like DHA Phase 6, Johar Town or F-7.",
    },
    building: null,
    block: { label: "Block or sector", hint: "Like Block Q or Sector C." },
    number: "House no.",
    units: ["marla", "kanal", "sq-yd"],
    byRate: false,
    instalments: true,
  },
  flat: {
    city: "City",
    area: { label: "Area", hint: "Like Clifton, Gulberg or E-11." },
    building: {
      label: "Building name",
      hint: "Like Sea View Apartments or Al-Habib Towers.",
    },
    block: { label: "Block or phase", hint: "Like Block 2 or Phase 8." },
    number: "Flat no.",
    units: ["sq-ft", "sq-yd"],
    byRate: false,
    instalments: true,
  },
  plot: {
    city: "City",
    area: {
      label: "Society or scheme",
      hint: "Like DHA Phase 9, Bahria Town or LDA Avenue 1.",
    },
    building: null,
    block: { label: "Block or sector", hint: "Like Block J or Sector C." },
    number: "Plot no.",
    units: ["marla", "kanal", "sq-yd"],
    byRate: true,
    instalments: true,
  },
  file: {
    city: "City",
    area: {
      label: "Society",
      hint: "Like Bahria Town Phase 8 or DHA Multan.",
    },
    building: null,
    block: {
      label: "Phase or sector",
      hint: "The phase or sector the file is for, if you know it.",
    },
    number: null,
    units: ["marla", "kanal", "sq-yd"],
    byRate: true,
    instalments: true,
  },
  shop: {
    city: "City",
    area: {
      label: "Market or area",
      hint: "Like Blue Area, Liberty Market or Saddar.",
    },
    building: {
      label: "Building or plaza",
      hint: "Like Saeed Plaza or Hafeez Centre.",
    },
    block: null,
    number: "Shop no.",
    units: ["sq-ft", "sq-yd"],
    byRate: false,
    instalments: true,
  },
  land: {
    city: "Nearest city",
    area: {
      label: "Village and tehsil",
      hint: "Like Mauza Kot Abdul Malik, Tehsil Ferozewala.",
    },
    building: null,
    block: null,
    number: "Khasra no.",
    units: ["acre", "kanal"],
    byRate: true,
    instalments: false,
  },
};

/** The id of the debt a property's instalments add, so the two save and go together. */
export const debtId = (propertyId: string): string =>
  `${propertyId}-instalments`;

/** A row Setup keeps: the property in Property, and its instalments in Debts as a loan. */
export interface PropertyRow {
  id: string;
  kind: "property" | "loan";
  name: string;
  amount: number;
  property?: Property;
}

/**
 * The rows a property adds: itself at the user's share, and, while it's still being paid for, a
 * loan for what's left. Net worth is the share minus what's left.
 */
export function rowsOf(property: Property): PropertyRow[] {
  const own: PropertyRow = {
    id: property.id,
    kind: "property",
    name: property.name,
    amount: partOf(property),
    property,
  };
  if (property.instalments === null) return [own];
  return [
    own,
    {
      id: debtId(property.id),
      kind: "loan",
      name: `Instalments for ${property.name}`,
      amount: property.instalments.left,
    },
  ];
}
