// Days in the Quick add prototype, as ISO dates. "Today" is fixed, so screenshots repeat.

export const TODAY = "2026-11-11";

/** The ISO day `count` days before `day`. */
export function daysBefore(day: string, count: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - count);
  return date.toISOString().slice(0, 10);
}

export const YESTERDAY = daysBefore(TODAY, 1);

const short = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** A day as lists show it: "Today", "Yesterday" or "8 Nov". */
export function dayLabel(day: string): string {
  if (day === TODAY) return "Today";
  if (day === YESTERDAY) return "Yesterday";
  return short.format(new Date(`${day}T00:00:00Z`));
}
