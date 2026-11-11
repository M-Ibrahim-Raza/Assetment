"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Account } from "@proto/fixtures/accounts";
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
    saveAccount,
    removeAccount,
    addSamples,
    removeItem,
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
