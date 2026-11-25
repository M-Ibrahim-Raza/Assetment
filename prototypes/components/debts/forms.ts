import { type ComponentType, createContext, type Ref } from "react";
import type { Account } from "@proto/fixtures/accounts";
import type { DebtPlan } from "@proto/fixtures/debt-plans";
import type { LentPlan } from "@proto/fixtures/lent";

// The debts and money lent forms' contract. Setup uses them now. The Debts tab and Quick add's
// "Add debt" will use the same forms later, so they know nothing about the screen around them.

export type DebtKind = DebtPlan["kind"];

/** A saved debt, as the form lists it. */
export interface DebtRow {
  id: string;
  name: string;
  /** What it counts at, in whole rupees. A committee before the turn is owned, not owed. */
  amount: number;
  /** Null for a debt saved before plans (an old sample), or a property's instalments. */
  plan: DebtPlan | null;
  /** True for a property's instalments: they change only through the property (F11). */
  fromProperty: boolean;
}

/** A debt whose save failed or is still saving, or one opened in place, for a scenario. */
export interface DebtDraft {
  plan: DebtPlan;
  status: "failed" | "saving" | "open";
}

export interface DebtFormProps {
  kind: DebtKind;
  /** The heading, e.g. "Your loans". */
  title: string;
  /** One line under the heading. */
  help: string;
  rows: readonly DebtRow[];
  /** The accounts a loan can be paid from, in the order they were added. */
  accounts: readonly Account[];
  /** Adds the debt, or changes the one with its id. */
  onSave: (plan: DebtPlan) => void;
  onRemove: (row: DebtRow) => void;
  /** Opens the property a property's instalments belong to. */
  onOpenProperty: () => void;
  draft: DebtDraft | null;
  heading: Ref<HTMLHeadingElement>;
  /** The way on once something is added, e.g. "Next: Credit cards". */
  done: { label: string; onDone: () => void };
  /** A way past while nothing is added, e.g. "Skip for now". */
  skip: { label: string; onSkip: () => void } | null;
}

export interface LentFormProps {
  title: string;
  help: string;
  rows: readonly LentPlan[];
  onSave: (plan: LentPlan) => void;
  onRemove: (plan: LentPlan) => void;
  heading: Ref<HTMLHeadingElement>;
  done: { label: string; onDone: () => void };
  skip: { label: string; onSkip: () => void } | null;
}

/** One variant's pair of forms. */
export interface DebtForms {
  Debt: ComponentType<DebtFormProps>;
  Lent: ComponentType<LentFormProps>;
}

/**
 * The forms Setup's debts and money lent steps use. Each variant puts its own in, so the other steps
 * stay as they are. Null is today's Setup, whose steps are still stand-ins.
 */
export const DebtFormsContext = createContext<DebtForms | null>(null);
