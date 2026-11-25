"use client";

import { type SyntheticEvent, useState } from "react";
import type { DebtPlan } from "@proto/fixtures/debt-plans";
import type { LentPlan } from "@proto/fixtures/lent";
import type { DebtKind } from "./forms";
import { lentName } from "./plan";
import type { PanelArgs } from "./shell";
import { sumsOf } from "./sums";
import {
  type DebtField,
  type DebtFields,
  debtErrors,
  debtWarning,
  fieldId,
  firstError,
  type LentFields,
  lentErrors,
  lentPlanOf,
  planOf,
  useDebtFields,
  useSave,
} from "./use-debt";

/** What a kind is called when it has no name yet, and on its buttons. */
export const NOUN: Readonly<Record<DebtKind, string>> = {
  loan: "loan",
  card: "card",
  committee: "committee",
};

const focus = (id: string) => {
  document.getElementById(id)?.focus();
};

/**
 * One debt's panel, whatever it looks like: its fields, the errors once a save is tried, the
 * warning, the sums, and saving. A failed save keeps what was typed.
 */
export function useDebtPanel(
  args: PanelArgs<DebtFields>,
  onSave: (plan: DebtPlan) => void,
) {
  const { fields, set } = useDebtFields(args.fields);
  const [tried, setTried] = useState(false);
  const save = useSave((plan: DebtPlan) => {
    onSave(plan);
    args.onSaved(plan.id);
  }, args.status);
  const errors = debtErrors(fields);
  const error = (field: DebtField): string | null =>
    tried ? (errors[field] ?? null) : null;
  const name =
    fields.name.trim() === "" ? `the ${NOUN[fields.kind]}` : fields.name.trim();

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    const first = firstError(fields, errors);
    if (first !== null) {
      focus(fieldId(args.id, first));
      return;
    }
    save.run(planOf(fields));
  };

  return {
    fields,
    set,
    error,
    save,
    submit,
    name,
    warning: debtWarning(fields),
    sums: sumsOf(fields),
    title: args.isNew
      ? `Add a ${NOUN[fields.kind]}`
      : `Change ${args.fields.name}`,
    submitLabel: args.isNew ? `Add ${NOUN[fields.kind]}` : "Save",
  };
}

const LENT_ORDER = ["to", "amount", "backBy"] as const;

/** One person's money lent, in a panel. */
export function useLentPanel(
  args: PanelArgs<LentFields>,
  onSave: (plan: LentPlan) => void,
) {
  const [fields, setFields] = useState(args.fields);
  const set = (patch: Partial<LentFields>) => {
    setFields((current) => ({ ...current, ...patch }));
  };
  const [tried, setTried] = useState(false);
  const save = useSave((plan: LentPlan) => {
    onSave(plan);
    args.onSaved(plan.id);
  }, args.status);
  const errors = lentErrors(fields);
  const error = (field: "to" | "amount" | "backBy"): string | null =>
    tried ? (errors[field] ?? null) : null;

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    const first = LENT_ORDER.find((field) => errors[field] !== undefined);
    if (first !== undefined) {
      focus(fieldId(args.id, first));
      return;
    }
    save.run(lentPlanOf(fields));
  };

  return {
    fields,
    set,
    error,
    save,
    submit,
    name: fields.to.trim() === "" ? "it" : lentName(fields.to),
    amount: fields.amount === "" ? null : Number(fields.amount),
    title: args.isNew ? "Add money lent" : `Change ${lentName(args.fields.to)}`,
    submitLabel: args.isNew ? "Add" : "Save",
  };
}
