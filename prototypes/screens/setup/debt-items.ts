import { amountOf, lentName } from "@proto/components/debts/plan";
import type { DebtPlan } from "@proto/fixtures/debt-plans";
import type { LentPlan } from "@proto/fixtures/lent";
import type { SetupItem } from "./scenarios";

// Debts and money lent as the rows Setup keeps. Not a client module, so scenarios can use it too.

/** A debt with its plan, at what it counts: what's owed, or a committee's amount for where it stands. */
export const planItem = (plan: DebtPlan): SetupItem => ({
  id: plan.id,
  kind: plan.kind,
  name: plan.name,
  amount: amountOf(plan),
  plan,
});

/** Money lent to one person: "Lent to Ali bhai". It's owned. */
export const lentItem = (lent: LentPlan): SetupItem => ({
  id: lent.id,
  kind: "lent",
  name: lentName(lent.to),
  amount: lent.amount,
  lent,
});
