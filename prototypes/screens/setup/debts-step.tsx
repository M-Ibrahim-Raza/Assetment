"use client";

import { type Ref, use } from "react";
import {
  type DebtDraft,
  type DebtFormProps,
  DebtFormsContext,
  type DebtKind,
} from "@proto/components/debts/forms";
import { debtId } from "@proto/components/property/value";
import { planItem } from "./debt-items";
import { StandInQuestion } from "./question-parts";
import type { SetupState } from "./use-setup";

interface DebtsStepProps {
  kind: DebtKind;
  title: string;
  help: string;
  state: SetupState;
  /** A debt whose save failed or is saving, or one opened in place, for a scenario. */
  draft: DebtDraft | null;
  heading: Ref<HTMLHeadingElement>;
  /** "Next: Credit cards", or "See my net worth" when it's the last step. */
  nextLabel: string;
  /** Called after a debt is saved, so its draft isn't shown again. */
  onSaved: () => void;
  onDone: () => void;
  /** Opens the property step, where a property's instalments are changed. */
  onOpenProperty: () => void;
}

/**
 * One part of Setup's debts step, a loan, a card or a committee: the variant's debt form, fed from
 * what setup holds. Without a form (variant a) it's still the stand-in that adds a sample.
 */
export function DebtsStep({
  kind,
  title,
  help,
  state,
  draft,
  heading,
  nextLabel,
  onSaved,
  onDone,
  onOpenProperty,
}: DebtsStepProps) {
  const forms = use(DebtFormsContext);
  if (forms === null) {
    return (
      <StandInQuestion
        title={title}
        help={help}
        kinds={[kind]}
        state={state}
        heading={heading}
        labels={{ yes: "Add a sample", no: "Skip for now", next: nextLabel }}
        onDone={onDone}
      />
    );
  }
  // A property's instalments are a loan in Debts, changed only through the property.
  const fromProperty = new Set(
    state.items.flatMap((item) =>
      item.property === undefined ? [] : [debtId(item.id)],
    ),
  );
  const rows: DebtFormProps["rows"] = state.items
    .filter((item) => item.kind === kind)
    .map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      plan: item.plan ?? null,
      fromProperty: fromProperty.has(item.id),
    }));
  return (
    <forms.Debt
      kind={kind}
      title={title}
      help={help}
      rows={rows}
      accounts={state.accounts}
      onSave={(plan) => {
        state.saveItem(planItem(plan));
        onSaved();
      }}
      onRemove={(row) => {
        const item = state.items.find((each) => each.id === row.id);
        if (item !== undefined) state.removeItem(item);
      }}
      onOpenProperty={onOpenProperty}
      draft={draft}
      heading={heading}
      done={{ label: nextLabel, onDone }}
      skip={{ label: "Skip for now", onSkip: onDone }}
    />
  );
}
