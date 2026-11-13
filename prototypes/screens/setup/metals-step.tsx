"use client";

import type { Ref } from "react";
import { AddPieceForm } from "@proto/components/metals/add-piece-form";
import type { Setup } from "./scenarios";
import { GROUP_HELP } from "./things";
import type { SetupState } from "./use-setup";

interface MetalsStepProps {
  state: SetupState;
  draft: Setup["metalsDraft"];
  heading: Ref<HTMLHeadingElement>;
  /** "Next: Credit cards", or "See my net worth" when it's the last step. */
  nextLabel: string;
  /** Called after a piece is saved, so a failed draft isn't shown again. */
  onSaved: () => void;
  onDone: () => void;
}

/** Setup's gold and silver step: the gold and silver form, fed from what setup holds. */
export function MetalsStep({
  state,
  draft,
  heading,
  nextLabel,
  onSaved,
  onDone,
}: MetalsStepProps) {
  return (
    <AddPieceForm
      title="Your gold and silver"
      help={GROUP_HELP.metals}
      pieces={state.pieces}
      rates={state.metalRates}
      deduction={state.deduction}
      onSave={(piece) => {
        state.saveMetal(piece);
        onSaved();
      }}
      onRemove={(piece) => {
        const item = state.items.find((row) => row.id === piece.id);
        if (item !== undefined) state.removeItem(item);
      }}
      draft={draft}
      heading={heading}
      done={{ label: nextLabel, onDone }}
      skip={{ label: "Skip for now", onSkip: onDone }}
    />
  );
}
