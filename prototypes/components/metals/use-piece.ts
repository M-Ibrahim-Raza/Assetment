"use client";

import { useState } from "react";
import type {
  Karat,
  Metal,
  MetalForm,
  MetalPiece,
  WeightUnit,
} from "@proto/fixtures/metals";
import { useProtoAction } from "@proto/kit/use-proto-action";
import type { MetalsFormProps, PieceKind } from "./form";
import {
  fromParts,
  GRAMS_PER_TOLA,
  MASHA_PER_TOLA,
  RATTI_PER_MASHA,
  toParts,
} from "./weight";

// A piece as it's being typed: every field as text, so a half-typed weight survives a failed save.

export interface PieceFields {
  /** Null while it's a new piece. */
  id: string | null;
  metal: Metal;
  form: MetalForm;
  name: string;
  karat: Karat | null;
  unit: WeightUnit;
  /** Digits only. Each of tola, masha and ratti may be left empty. */
  tola: string;
  masha: string;
  ratti: string;
  /** A decimal number of grams, e.g. "10.5". */
  grams: string;
  estimated: boolean;
  /** Whole rupees, as digits. Empty when not known. */
  paid: string;
  /** This piece's own deduction in percent, e.g. "10". Empty uses the user's general one. */
  cut: string;
  /** When it was bought: a month "1" to "12" and a year "2021". Either may be empty. */
  month: string;
  year: string;
}

const digitsOf = (value: number): string => (value === 0 ? "" : String(value));

const gramsText = (tola: number): string =>
  tola === 0 ? "" : String(Math.round(tola * GRAMS_PER_TOLA * 100) / 100);

/** The weight fields for a weight in tola, in the unit asked. */
function weightFields(
  tola: number,
  unit: WeightUnit,
): Pick<PieceFields, "unit" | "tola" | "masha" | "ratti" | "grams"> {
  const parts = toParts(tola);
  return {
    unit,
    tola: digitsOf(parts.tola),
    masha: digitsOf(parts.masha),
    ratti: digitsOf(parts.ratti),
    grams: gramsText(tola),
  };
}

/** A share as the percent people type: 0.1 is "10". */
export const percentText = (share: number): string =>
  share === 0 ? "" : String(Math.round(share * 1000) / 10);

export function fieldsOf(piece: MetalPiece): PieceFields {
  const [year = "", month = ""] = (piece.bought ?? "").split("-");
  return {
    id: piece.id,
    metal: piece.metal,
    form: piece.form,
    name: piece.name,
    karat: piece.karat,
    estimated: piece.estimated,
    paid: piece.paid === null ? "" : String(piece.paid),
    cut: piece.cut === null ? "" : percentText(piece.cut),
    month: month === "" ? "" : String(Number(month)),
    year,
    ...weightFields(piece.tola, piece.unit),
  };
}

/** A new piece of a common kind, weighed in the unit the user used last. */
export function fieldsFor(kind: PieceKind, unit: WeightUnit): PieceFields {
  return {
    id: null,
    metal: kind.metal,
    form: kind.form,
    name: kind.name,
    karat: kind.karat,
    estimated: false,
    paid: "",
    cut: "",
    month: "",
    year: "",
    ...weightFields(0, unit),
  };
}

const count = (text: string): number => (text === "" ? 0 : Number(text));

/** The weight typed, in tola. Zero while nothing is typed. */
export function tolaOf(fields: PieceFields): number {
  if (fields.unit === "grams") {
    const grams = Number(fields.grams);
    return Number.isFinite(grams) ? grams / GRAMS_PER_TOLA : 0;
  }
  return fromParts({
    tola: count(fields.tola),
    masha: count(fields.masha),
    ratti: count(fields.ratti),
  });
}

/** What's wrong with the weight, in plain words. Null when it's fine. */
export function weightError(fields: PieceFields): string | null {
  if (fields.unit === "tola") {
    if (count(fields.masha) >= MASHA_PER_TOLA) {
      return "Masha go up to 11. 12 masha make 1 tola.";
    }
    if (count(fields.ratti) >= RATTI_PER_MASHA) {
      return "Ratti go up to 7. 8 ratti make 1 masha.";
    }
  }
  if (tolaOf(fields) <= 0) {
    return "Enter the weight, or tap “I don't know the weight”.";
  }
  return null;
}

/** The name shown when the user didn't give one. */
export function defaultName({
  metal,
  form,
}: Pick<PieceFields, "metal" | "form">): string {
  if (metal === "silver") {
    return form === "jewellery" ? "Silver" : `Silver ${form}`;
  }
  return form === "jewellery" ? "Gold jewellery" : `Gold ${form}`;
}

/** The piece to save. Call it once `weightError` is null. */
export function pieceOf(fields: PieceFields): MetalPiece {
  const name = fields.name.trim();
  return {
    id: fields.id ?? crypto.randomUUID(),
    metal: fields.metal,
    form: fields.form,
    name: name === "" ? defaultName(fields) : name,
    karat: fields.metal === "silver" ? null : (fields.karat ?? "24K"),
    tola: tolaOf(fields),
    unit: fields.unit,
    estimated: fields.estimated,
    paid: fields.paid === "" ? null : Number(fields.paid),
    cut:
      fields.form === "jewellery" && fields.cut !== ""
        ? Number(fields.cut) / 100
        : null,
    bought: boughtOf(fields),
  };
}

/** "2021-03", "2021", or null while no year is picked. */
export function boughtOf({
  month,
  year,
}: Pick<PieceFields, "month" | "year">): string | null {
  if (year === "" || month === "") return null;
  return `${year}-${month.padStart(2, "0")}`;
}

/** The largest deduction a jeweller would take, in percent. */
export const MAX_CUT = 50;

/** What's wrong with the deduction, in plain words. Null when it's fine or empty. */
export function cutError({ form, cut }: PieceFields): string | null {
  if (form !== "jewellery" || cut === "") return null;
  const share = Number(cut);
  return share > 0 && share <= MAX_CUT
    ? null
    : `Enter a deduction from 1 to ${String(MAX_CUT)}%, or leave it empty.`;
}

/**
 * What's wrong with the date it was bought: it needs the month and the year, or neither, and it
 * can't be after `thisMonth` ("2026-11").
 */
export function boughtError(
  fields: PieceFields,
  thisMonth: string,
): string | null {
  if (fields.month !== "" && fields.year === "") return "Pick the year too.";
  if (fields.year !== "" && fields.month === "") return "Pick the month too.";
  const bought = boughtOf(fields);
  return bought !== null && bought > thisMonth
    ? "That's after this month."
    : null;
}

/** Only digits, up to `max` of them, with no leading zeros. */
export const onlyDigits = (text: string, max: number): string =>
  text
    .replaceAll(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, max);

/** A decimal weight in grams: digits and one point, up to 3 places. */
export const gramsInput = (text: string): string => {
  const [whole = "", ...rest] = text.replaceAll(/[^\d.]/g, "").split(".");
  const kept = onlyDigits(whole, 6);
  return rest.length === 0 ? kept : `${kept}.${rest.join("").slice(0, 3)}`;
};

/** The piece being typed, and the changes the fields make to it. */
export function usePiece(
  initial: PieceFields,
  /** Told when the Tola/Grams switch changes, so the screen can quote rates in that unit. */
  onUnit?: (unit: WeightUnit) => void,
) {
  const [fields, setFields] = useState(initial);
  const set = (patch: Partial<PieceFields>) => {
    setFields((current) => ({ ...current, ...patch }));
  };
  /**
   * Gold or silver, jewellery or a bar or coin. Picking jewellery sets 21K and a bar or coin sets
   * 24K, the usual karat for each. The user can change it after. Silver has no karat.
   */
  const setKind = (metal: Metal, form: MetalForm) => {
    setFields((current) => {
      const usual: Karat = form === "jewellery" ? "21K" : "24K";
      const keep = form === current.form && current.karat !== null;
      return {
        ...current,
        metal,
        form,
        karat: metal === "silver" ? null : keep ? current.karat : usual,
      };
    });
  };
  /** Swaps the weight fields to the other unit, keeping the weight already typed. */
  const setUnit = (unit: WeightUnit) => {
    setFields((current) => ({
      ...current,
      ...weightFields(tolaOf(current), unit),
    }));
    onUnit?.(unit);
  };
  /** A typical weight, picked by someone who doesn't know theirs. */
  const guess = (tola: number) => {
    setFields((current) => ({
      ...current,
      ...weightFields(tola, current.unit),
      estimated: true,
    }));
  };
  return {
    fields,
    set,
    setKind,
    setUnit,
    guess,
    reset: setFields,
    tola: tolaOf(fields),
  };
}

export type Piece = ReturnType<typeof usePiece>;

/**
 * Saves a piece through the prototype's delay, so `?latency=slow` shows "Saving…". A draft that
 * failed opens with its error. A draft that is "saving" stays on "Saving…", for its scenario.
 */
export function useSavePiece(
  onSaved: (piece: MetalPiece) => void,
  draft: MetalsFormProps["draft"],
) {
  const action = useProtoAction(onSaved);
  const [failed, setFailed] = useState(draft?.status === "failed");
  return {
    pending: action.pending || draft?.status === "saving",
    failed,
    run: (piece: MetalPiece) => {
      setFailed(false);
      action.run(piece);
    },
  };
}
