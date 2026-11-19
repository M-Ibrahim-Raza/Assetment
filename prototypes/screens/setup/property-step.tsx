"use client";

import type { Ref } from "react";
import { AddPropertyForm } from "@proto/components/property/add-property-form";
import type { PropertyDraft } from "@proto/components/property/form";
import { debtId, rowsOf } from "@proto/components/property/value";
import { PROPERTY_TODAY } from "@proto/fixtures/property";
import { GROUP_HELP } from "./things";
import type { SetupState } from "./use-setup";

interface PropertyStepProps {
  state: SetupState;
  /** A property whose save failed or is saving, or one opened in place, for a scenario. */
  draft: PropertyDraft | null;
  heading: Ref<HTMLHeadingElement>;
  /** "Next: Credit cards", or "See my net worth" when it's the last step. */
  nextLabel: string;
  /** Called after a property is saved, so its draft isn't shown again. */
  onSaved: () => void;
  onDone: () => void;
}

/**
 * Setup's property step: the property form, fed from what setup holds. A property still being
 * paid for saves with its instalments, as a loan in Debts, and they go together.
 */
export function PropertyStep({
  state,
  draft,
  heading,
  nextLabel,
  onSaved,
  onDone,
}: PropertyStepProps) {
  const properties = state.items.flatMap((item) =>
    item.property === undefined ? [] : [item.property],
  );
  return (
    <AddPropertyForm
      title="Your property"
      help={GROUP_HELP.property}
      properties={properties}
      today={PROPERTY_TODAY}
      onSave={(saved) => {
        // Instalments switched off take their loan out of Debts.
        state.saveItems(
          rowsOf(saved),
          saved.instalments === null ? [debtId(saved.id)] : [],
        );
        onSaved();
      }}
      onRemove={(removed) => {
        state.removeItems(
          state.items.filter(
            (row) => row.id === removed.id || row.id === debtId(removed.id),
          ),
          removed.name,
        );
      }}
      draft={draft}
      heading={heading}
      done={{ label: nextLabel, onDone }}
      skip={{ label: "Skip for now", onSkip: onDone }}
    />
  );
}
