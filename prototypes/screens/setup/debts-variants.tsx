"use client";

import {
  AddDebtForm,
  AddLentForm,
} from "@proto/components/debts/add-debt-form";
import {
  type DebtForms,
  DebtFormsContext,
} from "@proto/components/debts/forms";
import type { SetupViewProps } from "./scenarios";
import { SetupView } from "./setup";

// F12 and F20's variant: the same Setup, with the debts and money lent forms swapped in. Every other
// step stays as it is.

const ADD: DebtForms = { Debt: AddDebtForm, Lent: AddLentForm };

/** "Add a debt": the gold form's panel, ending on its sum. */
export function DebtsA(props: SetupViewProps) {
  return (
    <DebtFormsContext value={ADD}>
      <SetupView {...props} />
    </DebtFormsContext>
  );
}
