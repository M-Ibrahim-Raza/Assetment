"use client";

import { useSearchParams } from "next/navigation";
import { type SyntheticEvent, useEffect, useId, useState } from "react";
import type { EntryKind } from "@proto/fixtures/entries";
import type { Usual } from "@proto/fixtures/usuals";
import { useProtoAction } from "@proto/kit/use-proto-action";
import type { SavedEntry } from "./apply-entry";
import { dayLabel } from "./days";
import type { Place } from "./places";
import type { Draft, DraftPart, QuickAdd } from "./scenarios";

// What the user had typed when they closed the panel. It outlives the screen, so opening Add again
// brings it back. Production would keep it in sessionStorage.
let kept: Draft | null = null;

const isDirty = (draft: Draft) =>
  draft.digits !== "" ||
  draft.name.trim() !== "" ||
  draft.note.trim() !== "" ||
  draft.tags.length > 0 ||
  draft.parts.length > 0;

/** The name a usual gives the entry, such as "Careem". None when it is only the category's name. */
const usualName = (usual: Usual): string =>
  usual.title === usual.category ? "" : usual.title;

/** Whole rupees from typed digits. Nothing typed is zero. */
const rupees = (digits: string) => (digits === "" ? 0 : Number(digits));

/**
 * The usual the form is set to, if any: the same kind, category and accounts. When two match, the
 * one whose name the form carries.
 */
export function currentUsual(
  draft: Draft,
  usuals: readonly Usual[],
): Usual | undefined {
  const same = usuals.filter(
    (usual) =>
      usual.kind === draft.kind &&
      usual.category === draft.category &&
      usual.account === draft.account &&
      usual.toAccount === draft.toAccount,
  );
  return (
    same.find((usual) => usualName(usual) === draft.name.trim()) ?? same[0]
  );
}

/**
 * What the place will hold once this entry is saved. Money leaving an account lowers its balance.
 * Spending on a card adds to what is owed on it, and paying a debt lowers what is owed.
 */
function after(place: Place, change: number): number {
  return place.debt === null ? place.amount + change : place.amount - change;
}

// The kind lives in the link, as /add?kind=income or /add?kind=transfer, so a reload keeps it and
// other screens can open Add on the right one. Spent is the default, so its link has no kind.
const KIND_PARAM = "kind";

/** The kind a link names, if it names one. */
function linkedKind(value: string | null): EntryKind | null {
  return value === "expense" || value === "income" || value === "transfer"
    ? value
    : null;
}

/** Puts the kind in the link, in place: switching kinds adds no Back steps. */
function linkKind(kind: EntryKind) {
  const params = new URLSearchParams(window.location.search);
  if (kind === "expense") params.delete(KIND_PARAM);
  else params.set(KIND_PARAM, kind);
  const query = params.toString();
  const url = `${window.location.pathname}${query === "" ? "" : `?${query}`}`;
  if (url === `${window.location.pathname}${window.location.search}`) return;
  window.history.replaceState(null, "", url);
}

/**
 * The draft switched to another kind. It keeps the amount, the day, the name, the note and the
 * tags. The category and the second account follow the kind. Only spent money splits. A card can
 * only be spent from, so another kind goes back to the first account.
 */
function withKind(
  draft: Draft,
  next: EntryKind,
  categories: QuickAdd["categories"],
  places: readonly Place[],
): Draft {
  if (next === draft.kind) return draft;
  const accounts = places.filter((place) => place.debt === null);
  const from = places.find((place) => place.id === draft.account);
  const account =
    next !== "expense" && from !== undefined && from.debt !== null
      ? (accounts[0]?.id ?? "")
      : draft.account;
  return {
    ...draft,
    kind: next,
    category: next === "transfer" ? "" : (categories[next][0] ?? ""),
    parts: next === "expense" ? draft.parts : [],
    account,
    toAccount:
      next === "transfer"
        ? (accounts.find((candidate) => candidate.id !== account)?.id ?? "")
        : "",
  };
}

/**
 * The entry being typed, kept in memory, with what it does to the accounts and debts it touches.
 * In "add" mode it is Quick add: the kind lives in the link, and what was typed waits for the
 * next time when the panel closes. In "edit" mode it changes a saved entry: the draft is that
 * entry, the link is left alone, and nothing is kept.
 */
export function useEntryForm(
  quickAdd: QuickAdd,
  /** The accounts and debts as they stand, after anything saved in this visit. */
  places: readonly Place[],
  onSaved: (saved: SavedEntry) => void,
  mode: "add" | "edit" = "add",
) {
  const adding = mode === "add";
  const amountId = useId();
  const kindInLink = linkedKind(useSearchParams().get(KIND_PARAM));
  const linked = adding ? kindInLink : null;
  // A draft the scenario typed wins. Otherwise a kept one comes back.
  const [restored, setRestored] = useState(
    () => adding && kept !== null && !isDirty(quickAdd.draft),
  );
  // A kind the link names wins over the draft's.
  const [draft, setDraft] = useState(() => {
    const start =
      !adding || isDirty(quickAdd.draft)
        ? quickAdd.draft
        : (kept ?? quickAdd.draft);
    return linked === null
      ? start
      : withKind(start, linked, quickAdd.categories, places);
  });
  // More details opens by itself when the entry already has any.
  const [detailsOpen, setDetailsOpen] = useState(
    () =>
      draft.note.trim() !== "" ||
      draft.tags.length > 0 ||
      draft.parts.length > 0,
  );
  // Errors wait for the first try, so they never show while the user is still typing.
  const [tried, setTried] = useState(false);
  const [failed, setFailed] = useState(quickAdd.failed);

  const { kind } = draft;
  const amount = draft.digits === "" ? null : Number(draft.digits);
  const from = places.find((place) => place.id === draft.account) ?? null;
  const to = places.find((place) => place.id === draft.toAccount) ?? null;
  const moved = amount ?? 0;
  // What each will hold once this entry is saved. Received money adds; everything else leaves.
  const fromAfter =
    from === null ? null : after(from, kind === "income" ? moved : -moved);
  const toAfter = to === null ? null : after(to, moved);

  const amountError =
    tried && (amount === null || amount === 0) ? "Enter an amount." : null;

  // A split's parts must add up to the amount, and each part needs a category and an amount.
  const split = kind === "expense" && draft.parts.length > 0;
  const partsTotal = draft.parts.reduce(
    (total, part) => total + rupees(part.digits),
    0,
  );
  const splitLeft = (amount ?? 0) - partsTotal;
  const splitProblem = !split
    ? null
    : draft.parts.some((part) => part.category === "" || part.digits === "")
      ? "Give each part a category and an amount."
      : splitLeft !== 0
        ? "The parts must add up to the amount."
        : null;
  const splitError = tried ? splitProblem : null;

  const accounts = places.filter((place) => place.debt === null);
  // Money is spent from an account or a credit card. It comes into an account, and moves from one.
  const fromChoices =
    kind === "expense"
      ? [...accounts, ...places.filter((place) => place.debt === "card")]
      : accounts;
  // Moved money goes to another account, or pays off a debt.
  const toChoices =
    kind === "transfer"
      ? [
          ...accounts.filter((place) => place.id !== draft.account),
          ...places.filter((place) => place.debt !== null),
        ]
      : [];

  const update = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const setKind = (next: EntryKind) => {
    setDraft((current) => withKind(current, next, quickAdd.categories, places));
  };

  // In Quick add the link follows the kind: when it opens, and whenever it changes.
  useEffect(() => {
    if (adding) linkKind(kind);
  }, [kind, adding]);

  /** Money can't move to the account it leaves. Picking that one swaps the two. */
  const setAccount = (account: string) => {
    update(
      kind === "transfer" && account === draft.toAccount
        ? { account, toAccount: draft.account }
        : { account },
    );
  };

  /**
   * Fills the category and accounts from a usual. Its name goes in the Name field, so the entry is
   * saved as "Careem" and not as "Transport", unless the user typed a name of their own.
   */
  const applyUsual = (usual: Usual) => {
    const name = draft.name.trim();
    const nameIsAUsuals =
      name === "" || quickAdd.usuals.some((other) => usualName(other) === name);
    update({
      kind: usual.kind,
      category: usual.category,
      account: usual.account,
      toAccount: usual.toAccount,
      ...(nameIsAUsuals ? { name: usualName(usual) } : {}),
    });
  };

  const save = useProtoAction((saved: SavedEntry) => {
    onSaved(saved);
    if (!adding) return;
    kept = null;
    // Ready for the next one. The kind, category, accounts and day stay, for logging several in a row.
    update({ digits: "", name: "", note: "", tags: [], parts: [] });
    setTried(false);
    setRestored(false);
  });

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (amount === null || amount === 0 || from === null) {
      document.getElementById(amountId)?.focus();
      return;
    }
    if (splitProblem !== null) {
      setDetailsOpen(true);
      return;
    }
    setFailed(false);
    const name = draft.name.trim();
    const fallback =
      kind === "transfer"
        ? `To ${to?.name ?? "another account"}`
        : draft.category;
    save.run({
      draft,
      entry: {
        id: crypto.randomUUID(),
        title: name === "" ? fallback : name,
        kind,
        amount,
        category: kind === "transfer" ? "Transfer" : draft.category,
        account: from.name,
        day: dayLabel(draft.day),
      },
      account: draft.account,
      toAccount: draft.toAccount,
      fromDebt: from.debt !== null,
      toDebt: to !== null && to.debt !== null,
    });
  };

  /**
   * Called when the panel closes: what was typed waits for the next time Add opens, and the form
   * then says so.
   */
  const keep = () => {
    if (!adding) return;
    const dirty = isDirty(draft);
    kept = dirty ? draft : null;
    setRestored(dirty);
  };

  /** Empties the form, back to its defaults. It stays on the kind the user is on. */
  const clear = () => {
    kept = null;
    setDraft(
      withKind(
        {
          ...quickAdd.draft,
          digits: "",
          name: "",
          note: "",
          tags: [],
          parts: [],
        },
        kind,
        quickAdd.categories,
        places,
      ),
    );
    setTried(false);
    setRestored(false);
  };

  return {
    amountId,
    draft,
    /** Every account and debt, to name the ones a usual uses. */
    places,
    /** Where the money can come from for this kind: accounts, plus credit cards when spent. */
    fromChoices,
    /** Where moved money can go: the other accounts, then debts. Empty for other kinds. */
    toChoices,
    /** The categories of the current kind, most used first. None for moved money. */
    categories: kind === "transfer" ? [] : quickAdd.categories[kind],
    /** The usuals of the current kind. */
    usuals: quickAdd.usuals.filter((usual) => usual.kind === kind),
    amount,
    from,
    to,
    fromAfter,
    toAfter,
    amountError,
    /** Whether this form is changing a saved entry. */
    editing: !adding,
    /** Spent money split across categories. */
    split,
    /** What is left to share out between the parts: zero when they add up. */
    splitLeft,
    splitError,
    /** Tags already in use, offered under More details. */
    knownTags: quickAdd.tags ?? [],
    detailsOpen,
    setDetailsOpen,
    restored,
    failed,
    pending: save.pending || quickAdd.saving === true,
    setKind,
    setAccount,
    setDigits: (digits: string) => {
      update({ digits });
    },
    setCategory: (category: string) => {
      update({ category });
    },
    setToAccount: (toAccount: string) => {
      update({ toAccount });
    },
    setDay: (day: string) => {
      update({ day });
    },
    setName: (name: string) => {
      update({ name });
    },
    setNote: (note: string) => {
      update({ note });
    },
    setTags: (tags: readonly string[]) => {
      update({ tags });
    },
    setParts: (parts: readonly DraftPart[]) => {
      update({ parts });
    },
    applyUsual,
    submit,
    keep,
    clear,
  };
}

export type EntryForm = ReturnType<typeof useEntryForm>;
