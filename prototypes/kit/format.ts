const pkr = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

const short = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 1 });

const percent = new Intl.NumberFormat("en-PK", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const LAKH = 100_000;
const CRORE = 10_000_000;

/** Whole rupees, e.g. "Rs 245,300". Prototype-only: production has its own money formatting. */
export function formatPkr(rupees: number): string {
  return pkr.format(rupees);
}

/** Whole rupees with commas and no "Rs", e.g. "245,300": what an amount field shows while typing. */
export function formatDigits(rupees: number): string {
  return plain.format(rupees);
}

// A real minus sign, not a hyphen, so it lines up with the plus.
const sign = (value: number) => (value > 0 ? "+" : value < 0 ? "−" : "");

/** Whole rupees with a sign, e.g. "+Rs 310,000" or "−Rs 4,250". Zero has none. */
export function formatSignedPkr(rupees: number): string {
  return `${sign(rupees)}${pkr.format(Math.abs(rupees))}`;
}

/** A share with a sign, e.g. "+3.0%" for 0.03. */
export function formatSignedPercent(ratio: number): string {
  return `${sign(ratio)}${percent.format(Math.abs(ratio))}`;
}

/** How people say a large amount, e.g. "48.1 lakh" or "3 crore". Null under one lakh. */
export function formatLakhCrore(rupees: number): string | null {
  const size = Math.abs(rupees);
  if (size < LAKH) return null;
  // From 99.95 lakh up, one decimal rounds to "100 lakh", which people call 1 crore.
  if (size >= CRORE - LAKH / 20) return `${short.format(size / CRORE)} crore`;
  return `${short.format(size / LAKH)} lakh`;
}
