"use client";

import { type Ref, use } from "react";
import { DebtFormsContext } from "@proto/components/debts/forms";
import { lentItem } from "./debt-items";
import { StandInQuestion } from "./question-parts";
import type { SetupState } from "./use-setup";

interface LentStepProps {
  title: string;
  help: string;
  state: SetupState;
  heading: Ref<HTMLHeadingElement>;
  /** "Next: Loans", or "See my net worth" when it's the last step. */
  nextLabel: string;
  onDone: () => void;
}

/**
 * Setup's money lent step: the variant's money lent form, fed from what setup holds. Without a form
 * (variant a) it's still the stand-in that adds a sample.
 */
export function LentStep({
  title,
  help,
  state,
  heading,
  nextLabel,
  onDone,
}: LentStepProps) {
  const forms = use(DebtFormsContext);
  if (forms === null) {
    return (
      <StandInQuestion
        title={title}
        help={help}
        kinds={["lent"]}
        state={state}
        heading={heading}
        labels={{ yes: "Add a sample", no: "Skip for now", next: nextLabel }}
        onDone={onDone}
      />
    );
  }
  const rows = state.items.flatMap((item) =>
    item.lent === undefined ? [] : [item.lent],
  );
  return (
    <forms.Lent
      title={title}
      help={help}
      rows={rows}
      onSave={(plan) => {
        state.saveItem(lentItem(plan));
      }}
      onRemove={(plan) => {
        const item = state.items.find((each) => each.id === plan.id);
        if (item !== undefined) state.removeItem(item);
      }}
      heading={heading}
      done={{ label: nextLabel, onDone }}
      skip={{ label: "Skip for now", onSkip: onDone }}
    />
  );
}
