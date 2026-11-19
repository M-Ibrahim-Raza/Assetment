"use client";

import { type SyntheticEvent, useState } from "react";
import {
  type DateParts,
  dateError,
  dateOf,
  partsOf,
} from "@proto/components/bought-date";
import { gramsInput, onlyDigits } from "@proto/components/metals/use-piece";
import type {
  AreaUnit,
  InstalmentEvery,
  Property,
  PropertyKind,
} from "@proto/fixtures/property";
import { useProtoAction } from "@proto/kit/use-proto-action";
import type { PropertyDraft } from "./form";
import { KIND_FORM, SHARES, type ShareKey, shareKeyOf, titleOf } from "./value";

// A property as it's being typed: every field as text, so what was typed survives a failed save.

export interface PropertyFields {
  /** Null while it's a new property. */
  id: string | null;
  kind: PropertyKind;
  /** Empty while no city is picked. `ELSEWHERE` for a town that isn't in the list. */
  city: string;
  /** The society, scheme or area, e.g. "DHA Phase 6". */
  area: string;
  /** A flat's building or tower, e.g. "Sea View Apartments". Optional. */
  building: string;
  /** The block, sector or phase, e.g. "Block Q". Optional. */
  block: string;
  /** The plot, house, flat or shop number, or the khasra number. Optional. */
  number: string;
  /** A decimal number, e.g. "10" or "1.5". Empty when not typed. */
  size: string;
  unit: AreaUnit;
  /** True while a plot, file or land's value is worked out from a rate per unit of size. */
  byRate: boolean;
  /** Whole rupees for one unit of size, as digits. */
  rate: string;
  /** What the whole property would sell for, as digits. */
  value: string;
  share: ShareKey;
  /** The share in percent when `share` is "other", e.g. "37.5". */
  percent: string;
  /**
   * When it was bought: a day "1" to "31", a month "1" to "12" and a year "2014". The day is
   * optional, so just the month and year is fine. All may be empty.
   */
  day: string;
  month: string;
  year: string;
  /** What the user paid, as digits. Empty when not known. */
  paid: string;
  /** True while instalments are still being paid. */
  paying: boolean;
  left: string;
  instalment: string;
  every: InstalmentEvery;
}

/** The city picked for a town that isn't in the list. It's saved as no city. */
export const ELSEWHERE = "elsewhere";

/** The city to save: none for a town that isn't in the list. */
const cityOf = ({ city }: Pick<PropertyFields, "city">): string | null =>
  city === "" || city === ELSEWHERE ? null : city;

/** Typed text, or null when it's blank. */
const orNull = (typed: string): string | null =>
  typed.trim() === "" ? null : typed.trim();

/** The unit most people use for this kind of property in this city. Never a conversion. */
export function usualUnit(kind: PropertyKind, city: string): AreaUnit {
  if (kind === "land") return "acre";
  if (kind === "flat" || kind === "shop") return "sq-ft";
  return city === "Karachi" || city === "Hyderabad" ? "sq-yd" : "marla";
}

/** A new property. Plot comes first: it's the persona's likeliest one. */
export function freshFields(): PropertyFields {
  const kind: PropertyKind = "plot";
  return {
    id: null,
    kind,
    city: "",
    area: "",
    building: "",
    block: "",
    number: "",
    size: "",
    unit: usualUnit(kind, ""),
    byRate: false,
    rate: "",
    value: "",
    share: "whole",
    percent: "",
    day: "",
    month: "",
    year: "",
    paid: "",
    paying: false,
    left: "",
    instalment: "",
    every: "quarter",
  };
}

const text = (value: number | null): string =>
  value === null ? "" : String(value);

export function fieldsOf(property: Property): PropertyFields {
  const share = shareKeyOf(property.share);
  return {
    id: property.id,
    kind: property.kind,
    // A saved property always had a city picked: one without is from somewhere else.
    city: property.city ?? ELSEWHERE,
    area: property.area,
    building: property.building ?? "",
    block: property.block ?? "",
    number: property.number ?? "",
    size: text(property.size?.amount ?? null),
    unit: property.size?.unit ?? usualUnit(property.kind, property.city ?? ""),
    byRate: property.rate !== null,
    rate: text(property.rate),
    value: String(property.value),
    share,
    percent:
      share === "other" ? String(Math.round(property.share * 1000) / 10) : "",
    ...partsOf(property.bought),
    paid: text(property.paid),
    paying: property.instalments !== null,
    left: text(property.instalments?.left ?? null),
    instalment: text(property.instalments?.amount ?? null),
    every: property.instalments?.every ?? "quarter",
  };
}

const sizeOf = (fields: PropertyFields): number =>
  fields.size === "" ? 0 : Number(fields.size);

const sizeFor = (fields: PropertyFields): Property["size"] => {
  const size = sizeOf(fields);
  return size > 0 ? { amount: size, unit: fields.unit } : null;
};

/** True while the value comes from a rate: only plots, files and land are priced that way. */
export const usesRate = (
  fields: Pick<PropertyFields, "kind" | "byRate">,
): boolean => fields.byRate && KIND_FORM[fields.kind].byRate;

/** True while instalments are still being paid on a kind that can have them. */
export const paysInstalments = (
  fields: Pick<PropertyFields, "kind" | "paying">,
): boolean => fields.paying && KIND_FORM[fields.kind].instalments;

/** What the whole property would sell for: the size times the rate, or the value typed. */
export function valueOf(fields: PropertyFields): number {
  if (usesRate(fields)) {
    const size = sizeOf(fields);
    const rate = Number(fields.rate);
    return size > 0 && rate > 0 ? Math.round(size * rate) : 0;
  }
  return fields.value === "" ? 0 : Number(fields.value);
}

/** The share as a number from 0 to 1. Null while a typed % isn't from 1 to 99. */
export function shareOf(fields: PropertyFields): number | null {
  if (fields.share !== "other") {
    return SHARES.find((each) => each.key === fields.share)?.share ?? 1;
  }
  const percent = Number(fields.percent);
  return fields.percent !== "" && percent >= 1 && percent <= 99
    ? percent / 100
    : null;
}

/** "2014-03", or "2014-03-12" with a day. Null unless the month and the year are both picked. */
export const boughtOf = (fields: DateParts): string | null => dateOf(fields);

/** What the app calls it so far, from what's filled in: "10 marla house, DHA Phase 6, Lahore". */
export const titleFor = (fields: PropertyFields): string =>
  titleOf({
    kind: fields.kind,
    size: sizeFor(fields),
    building: fields.building,
    area: fields.area,
    city: cityOf(fields),
  });

export interface PropertyErrors {
  city: string | null;
  area: string | null;
  size: string | null;
  value: string | null;
  share: string | null;
  bought: string | null;
  left: string | null;
}

const NO_ERRORS: PropertyErrors = {
  city: null,
  area: null,
  size: null,
  value: null,
  share: null,
  bought: null,
  left: null,
};

/** What's wrong, in plain words, field by field. Null where it's fine. */
export function errorsOf(
  fields: PropertyFields,
  /** This month, e.g. "2026-11": nothing is bought after it. */
  today: string,
): PropertyErrors {
  const left = Number(fields.left);
  return {
    city: fields.city === "" ? "Pick the city it's in." : null,
    area:
      fields.area.trim() === ""
        ? "Enter the area or society, like DHA Phase 6."
        : null,
    size: sizeOf(fields) > 0 ? null : "Enter the size, like 10 marla.",
    // By rate, a missing size is the size's error, not the value's.
    value:
      valueOf(fields) > 0
        ? null
        : usesRate(fields)
          ? Number(fields.rate) > 0
            ? null
            : "Enter the rate, or type the value instead."
          : "Enter what it would sell for today.",
    share:
      shareOf(fields) === null
        ? "Enter a share from 1 to 99%, or pick one above."
        : null,
    bought: dateError(fields, today),
    left: !paysInstalments(fields)
      ? null
      : fields.left === "" || left <= 0
        ? "Enter what's left to pay, or turn instalments off."
        : fields.paid !== "" && left > Number(fields.paid)
          ? "That's more than the full price."
          : null,
  };
}

/** The property to save. Call it once `errorsOf` has no errors. */
export function propertyOf(fields: PropertyFields, today: string): Property {
  const size = sizeFor(fields);
  const city = cityOf(fields);
  const area = fields.area.trim();
  // Only the lines of the address this kind has are kept.
  const asked = KIND_FORM[fields.kind];
  const building = asked.building === null ? null : orNull(fields.building);
  return {
    id: fields.id ?? crypto.randomUUID(),
    kind: fields.kind,
    name: titleOf({ kind: fields.kind, size, building, area, city }),
    city,
    area,
    building,
    block: asked.block === null ? null : orNull(fields.block),
    number: asked.number === null ? null : orNull(fields.number),
    size,
    rate: usesRate(fields) ? Number(fields.rate) : null,
    value: valueOf(fields),
    valuedOn: today,
    share: shareOf(fields) ?? 1,
    paid: fields.paid === "" ? null : Number(fields.paid),
    bought: boughtOf(fields),
    instalments: paysInstalments(fields)
      ? {
          left: Number(fields.left),
          amount: fields.instalment === "" ? null : Number(fields.instalment),
          every: fields.every,
        }
      : null,
  };
}

/** Typing helpers: a size takes up to 3 decimals, a % one. */
export const sizeInput = (typed: string): string => gramsInput(typed);
export const percentInput = (typed: string): string => {
  const [whole = "", ...rest] = typed.replaceAll(/[^\d.]/g, "").split(".");
  const kept = onlyDigits(whole, 2);
  return rest.length === 0 ? kept : `${kept}.${rest.join("").slice(0, 1)}`;
};

/**
 * Saves through the prototype's delay, so `?latency=slow` shows "Saving…". A draft that failed
 * opens with its error. A draft that is "saving" stays on "Saving…", for its scenario.
 */
function useSaveProperty(
  onSaved: (property: Property) => void,
  draft: PropertyDraft | null,
) {
  const action = useProtoAction(onSaved);
  const [failed, setFailed] = useState(draft?.status === "failed");
  return {
    pending: action.pending || draft?.status === "saving",
    failed,
    run: (property: Property) => {
      setFailed(false);
      action.run(property);
    },
  };
}

interface PanelInput {
  /** Ids inside the panel start with it. */
  id: string;
  initial: PropertyFields;
  today: string;
  draft: PropertyDraft | null;
  onSaved: (property: Property) => void;
}

/**
 * Everything the property panel needs: the fields, what they add up to, the errors once the user
 * has tried to save, and the save itself. Errors show only after a try.
 */
export function usePropertyPanel({
  id,
  initial,
  today,
  draft,
  onSaved,
}: PanelInput) {
  const [fields, setFields] = useState(initial);
  const [tried, setTried] = useState(false);
  const save = useSaveProperty(onSaved, draft);

  const set = (patch: Partial<PropertyFields>) => {
    setFields((current) => ({ ...current, ...patch }));
  };
  /**
   * A kind or city picks its usual unit, until a size is typed in another. A kind whose units
   * don't include the one picked, such as a flat in marla, always takes its usual one.
   */
  const setPlace = (patch: Partial<Pick<PropertyFields, "kind" | "city">>) => {
    setFields((current) => {
      const next = { ...current, ...patch };
      const fits = KIND_FORM[next.kind].units.includes(next.unit);
      return current.size === "" || !fits
        ? { ...next, unit: usualUnit(next.kind, next.city) }
        : next;
    });
  };

  const errors = errorsOf(fields, today);
  const shown = tried ? errors : NO_ERRORS;
  const value = valueOf(fields);
  const share = shareOf(fields) ?? 1;
  const ids = {
    city: `${id}-city`,
    area: `${id}-area`,
    size: `${id}-size`,
    value: `${id}-value`,
    rate: `${id}-rate`,
    percent: `${id}-percent`,
    day: `${id}-day`,
    left: `${id}-left`,
  };

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    // The first problem, in the order the fields are on screen.
    const order: readonly [string | null, string][] = [
      [errors.city, ids.city],
      [errors.area, ids.area],
      [errors.size, ids.size],
      [errors.value, usesRate(fields) ? ids.rate : ids.value],
      [errors.share, ids.percent],
      [errors.bought, ids.day],
      [errors.left, ids.left],
    ];
    const first = order.find(([error]) => error !== null)?.[1] ?? null;
    if (first !== null) {
      // After the next paint, so a folded row that holds the error has opened.
      requestAnimationFrame(() => {
        document.getElementById(first)?.focus();
      });
      return;
    }
    save.run(propertyOf(fields, today));
  };

  return {
    fields,
    set,
    setPlace,
    errors: shown,
    value,
    share,
    part: Math.round(value * share),
    paid: fields.paid === "" ? null : Number(fields.paid),
    left:
      paysInstalments(fields) && fields.left !== "" ? Number(fields.left) : 0,
    name: titleFor(fields),
    ids,
    submit,
    save,
  };
}

export type PropertyPanelState = ReturnType<typeof usePropertyPanel>;
