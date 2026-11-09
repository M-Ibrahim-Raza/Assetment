const pkr = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

/** Whole rupees, e.g. "Rs 245,300". Prototype-only: production has its own money formatting. */
export function formatPkr(rupees: number): string {
  return pkr.format(rupees);
}
