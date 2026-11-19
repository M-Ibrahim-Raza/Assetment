"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { valueOf } from "@proto/components/metals/weight";
import type { Account } from "@proto/fixtures/accounts";
import type { MetalPiece } from "@proto/fixtures/metals";
import type {
  AccountDraft,
  ItemKind,
  Setup,
  SetupGroup,
  SetupItem,
  Thing,
} from "./scenarios";
import { isDebt, sum } from "./things";

// A toast with an action stays at least 10 s (docs/ui-ux-rules.md).
const UNDO_MS = 10_000;

/** The list with a removed row put back where it was. */
function restore<Row extends { id: string }>(
  rows: readonly Row[],
  row: Row,
  index: number,
): Row[] {
  if (rows.some((other) => other.id === row.id)) return [...rows];
  return rows.toSpliced(Math.min(index, rows.length), 0, row);
}

/** Everything the user has added during setup, kept in memory, with the totals it adds up to. */
export function useSetup(initial: Setup) {
  const [accounts, setAccounts] = useState(initial.accounts);
  const [items, setItems] = useState(initial.items);
  const [answered, setAnswered] = useState(initial.answered);
  const [ticked, setTicked] = useState(initial.ticked);
  // The general buy-back deduction, for jewellery saved without its own.
  const deduction = initial.metalDeduction;
  const rates = initial.metalRates;

  const cash = sum(accounts.map((account) => account.balance));
  const owned =
    cash +
    sum(items.filter((item) => !isDebt(item)).map((item) => item.amount));
  const owed = sum(items.filter(isDebt).map((item) => item.amount));

  /** Adds an account, or changes the one with the given id. */
  const saveAccount = (draft: AccountDraft, id: string | null = null) => {
    if (id === null) {
      const added = { id: crypto.randomUUID(), ...draft };
      setAccounts((current) => [...current, added]);
      return;
    }
    setAccounts((current) =>
      current.map((account) =>
        account.id === id ? { ...account, ...draft } : account,
      ),
    );
  };

  /** Removes it at once, with an Undo toast: nothing here needs a confirm step. */
  const removeAccount = (account: Account) => {
    const index = accounts.findIndex((row) => row.id === account.id);
    setAccounts((current) => current.filter((row) => row.id !== account.id));
    toast(`${account.name} removed`, {
      duration: UNDO_MS,
      action: {
        label: "Undo",
        onClick: () => {
          setAccounts((current) => restore(current, account, index));
        },
      },
    });
  };

  /** What a stand-in step does in place of its form: adds the sample rows of these kinds. */
  const addSamples = (kinds: readonly ItemKind[]) => {
    const wanted = initial.samples.filter((sample) =>
      kinds.includes(sample.kind),
    );
    setItems((current) => [
      ...current,
      ...wanted.filter(
        (sample) => !current.some((item) => item.id === sample.id),
      ),
    ]);
  };

  /** Adds a gold or silver piece, or changes the one with its id, worth its weight today. */
  const saveMetal = (piece: MetalPiece) => {
    const item: SetupItem = {
      id: piece.id,
      kind: "metals",
      name: piece.name,
      amount: valueOf(piece, rates, deduction),
      piece,
    };
    setItems((current) =>
      current.some((row) => row.id === piece.id)
        ? current.map((row) => (row.id === piece.id ? item : row))
        : [...current, item],
    );
  };

  /** Adds an item, or changes the one with its id. The form has worked out its amount. */
  const saveItem = (item: SetupItem) => {
    setItems((current) =>
      current.some((row) => row.id === item.id)
        ? current.map((row) => (row.id === item.id ? item : row))
        : [...current, item],
    );
  };

  const removeItem = (item: SetupItem) => {
    const index = items.findIndex((row) => row.id === item.id);
    setItems((current) => current.filter((row) => row.id !== item.id));
    toast(`${item.name} removed`, {
      duration: UNDO_MS,
      action: {
        label: "Undo",
        onClick: () => {
          setItems((current) => restore(current, item, index));
        },
      },
    });
  };

  /**
   * Saves several items at once, adding or changing each by its id, and takes out the ids in
   * `drop`. A property and the loan for its instalments save together.
   */
  const saveItems = (
    rows: readonly SetupItem[],
    drop: readonly string[] = [],
  ) => {
    setItems((current) =>
      rows.reduce(
        (list, item) =>
          list.some((row) => row.id === item.id)
            ? list.map((row) => (row.id === item.id ? item : row))
            : [...list, item],
        current.filter((row) => !drop.includes(row.id)),
      ),
    );
  };

  /** Removes several items at once, such as a property and its loan, with one Undo for them all. */
  const removeItems = (rows: readonly SetupItem[], name: string) => {
    const placed = rows
      .map((row) => ({
        row,
        index: items.findIndex((each) => each.id === row.id),
      }))
      .toSorted((one, other) => one.index - other.index);
    setItems((current) =>
      current.filter((row) => !rows.some((gone) => gone.id === row.id)),
    );
    toast(`${name} removed`, {
      duration: UNDO_MS,
      action: {
        label: "Undo",
        onClick: () => {
          setItems((current) =>
            placed.reduce(
              (list, { row, index }) => restore(list, row, index),
              [...current],
            ),
          );
        },
      },
    });
  };

  /** Marks a group as answered: something was added, or the user has none. */
  const answer = (group: SetupGroup) => {
    setAnswered((current) =>
      current.includes(group) ? current : [...current, group],
    );
  };

  const toggleTick = (thing: Thing) => {
    setTicked((current) =>
      current.includes(thing)
        ? current.filter((other) => other !== thing)
        : [...current, thing],
    );
  };

  return {
    accounts,
    items,
    answered,
    ticked,
    owned,
    owed,
    netWorth: owned - owed,
    /** Gold and silver, by weight, in the order they were added. */
    pieces: items.flatMap((item) =>
      item.piece === undefined ? [] : [item.piece],
    ),
    metalRates: rates,
    deduction,
    saveMetal,
    saveItem,
    saveAccount,
    removeAccount,
    addSamples,
    removeItem,
    saveItems,
    removeItems,
    answer,
    toggleTick,
  };
}

export type SetupState = ReturnType<typeof useSetup>;

/**
 * The place in setup, kept in the URL as `?step=`, so Back and reload keep it. Without the param
 * it is the scenario's own place.
 */
export function usePlace<Place extends string>(
  places: readonly Place[],
  initial: Place,
) {
  const params = useSearchParams();
  const wanted = params.get("step");
  const place = places.find((candidate) => candidate === wanted) ?? initial;

  const go = (next: Place) => {
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set("step", next);
    // Next.js keeps useSearchParams in step with the History API, so there is no server round trip.
    window.history.pushState(null, "", `?${nextParams.toString()}`);
    window.scrollTo({ top: 0 });
  };

  /** `moved` is false on the screen the scenario opens with, so that one doesn't animate. */
  return { place, go, moved: wanted !== null };
}

/**
 * A ref for the step's heading. Focus moves to it when the place changes, so keyboard and
 * screen-reader users land on the new step and not on a button that is gone.
 */
export function useStepHeading(place: string) {
  const heading = useRef<HTMLHeadingElement>(null);
  const last = useRef(place);

  useEffect(() => {
    if (last.current === place) return;
    last.current = place;
    heading.current?.focus();
  }, [place]);

  return heading;
}
