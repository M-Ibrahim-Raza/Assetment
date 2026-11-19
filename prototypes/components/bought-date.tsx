"use client";

import { CircleAlert } from "lucide-react";
import { useId } from "react";
import { FieldDescription, FieldError } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

// When something was bought: an exact date, or just the month and year, since many people only
// remember that. The gold and property forms share it, so both ask the same way.

/** The date as typed: a day "1" to "31", a month "1" to "12" and a year "2014". Any may be empty. */
export interface DateParts {
  day: string;
  month: string;
  year: string;
}

/** "2014-03", or "2014-03-12" with a day. Null unless the month and the year are both picked. */
export function dateOf({ day, month, year }: DateParts): string | null {
  if (year === "" || month === "") return null;
  const yearMonth = `${year}-${month.padStart(2, "0")}`;
  return day === "" ? yearMonth : `${yearMonth}-${day.padStart(2, "0")}`;
}

/** A saved date, "2014-03" or "2014-03-12", back as the parts the menus show. */
export function partsOf(date: string | null): DateParts {
  const [year = "", month = "", day = ""] = (date ?? "").split("-");
  return {
    day: day === "" ? "" : String(Number(day)),
    month: month === "" ? "" : String(Number(month)),
    year,
  };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * What's wrong with the date, in plain words: a day or month needs the year, a day needs the
 * month, the day must be in that month, and nothing is bought after `thisMonth` ("2026-11").
 */
export function dateError(parts: DateParts, thisMonth: string): string | null {
  const { day, month, year } = parts;
  if ((day !== "" || month !== "") && year === "") return "Pick the year too.";
  if ((day !== "" || year !== "") && month === "") return "Pick the month too.";
  const date = dateOf(parts);
  if (date === null) return null;
  // Day 0 of the next month is the last day of this one.
  const days = new Date(Number(year), Number(month), 0).getDate();
  if (day !== "" && Number(day) > days) {
    const name = MONTH_NAMES[Number(month) - 1] ?? "";
    return `${name} ${year} has only ${String(days)} days.`;
  }
  // `thisMonth` has no day, so a day this month still counts as this month.
  return date.slice(0, 7) > thisMonth ? "That's after this month." : null;
}

/** Short month names, so the day, month and year fit side by side on a phone. */
const MONTHS = [
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

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

// A little less room for the chevron than the default, so "Month" fits at 320 px.
const SELECT = "w-full [&_select]:h-12 [&_select]:pr-7 [&_select]:text-base";

interface BoughtDateProps {
  /** The day menu's id, so a form can move focus to the field. */
  id: string;
  parts: DateParts;
  onChange: (patch: Partial<DateParts>) => void;
  /** The years offered, from the latest back to the first. */
  firstYear: number;
  lastYear: number;
  error: string | null;
  /** The line under the menus while there's no error. */
  hint?: string;
}

/** "Date bought": a day (optional), a month and a year, side by side. */
export function BoughtDate({
  id,
  parts,
  onChange,
  firstYear,
  lastYear,
  error,
  hint = "Just the month and year is fine.",
}: BoughtDateProps) {
  const labelId = useId();
  const noteId = useId();
  const invalid = error !== null;
  const years = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, index) => lastYear - index,
  );
  const shared = {
    "aria-invalid": invalid,
    "aria-describedby": noteId,
    className: SELECT,
  };
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex flex-col gap-2"
      data-invalid={invalid}
    >
      <span id={labelId} className="text-sm font-medium">
        Date bought
      </span>
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_5.25rem] gap-1.5">
        <NativeSelect
          id={id}
          aria-label="Day, optional"
          value={parts.day}
          onChange={(event) => {
            onChange({ day: event.target.value });
          }}
          {...shared}
        >
          <NativeSelectOption value="">Day</NativeSelectOption>
          {DAYS.map((day) => (
            <NativeSelectOption key={day} value={String(day)}>
              {day}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Month"
          value={parts.month}
          onChange={(event) => {
            onChange({ month: event.target.value });
          }}
          {...shared}
        >
          <NativeSelectOption value="">Month</NativeSelectOption>
          {MONTHS.map((month, index) => (
            <NativeSelectOption key={month} value={String(index + 1)}>
              {month}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Year"
          value={parts.year}
          onChange={(event) => {
            onChange({ year: event.target.value });
          }}
          {...shared}
        >
          <NativeSelectOption value="">Year</NativeSelectOption>
          {years.map((year) => (
            <NativeSelectOption key={year} value={String(year)}>
              {year}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {error === null ? (
        <FieldDescription id={noteId}>{hint}</FieldDescription>
      ) : (
        <FieldError id={noteId} className="flex items-center gap-1.5">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </FieldError>
      )}
    </div>
  );
}
