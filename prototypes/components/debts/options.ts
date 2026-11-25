import { onOff, type ProtoOption } from "@proto/kit/options";

// Ideas for the loan form, to try on and off in the ProtoBar (2026-11-22). Each starts on today's
// form. Once one is chosen, it's built in or dropped, and its option goes. No client-only code here,
// so the server page can pass them to the ProtoBar.

/** Ask the kind of loan first, which sets the answers that follow from it. */
export const LOAN_START: ProtoOption<"name" | "kind"> = {
  key: "loan-start",
  label: "Loan: start with",
  choices: [
    { value: "name", label: "Its name" },
    { value: "kind", label: "Its kind" },
  ],
  default: "name",
};

/** Bank chips under the name, which build it: "Meezan car loan". */
export const LOAN_BANKS = onOff(
  "loan-banks",
  "Loan: bank chips for the name",
  false,
);

/** The fixed-instalment question as two cards that say what each answer does. */
export const LOAN_ANSWERS: ProtoOption<"plain" | "cards"> = {
  key: "loan-answers",
  label: "Loan: fixed or not",
  choices: [
    { value: "plain", label: "Yes or No" },
    { value: "cards", label: "Cards that say what happens" },
  ],
  default: "plain",
};

/** Instalments left as a count, or as the month of the last one, which many people know better. */
export const LOAN_LEFT: ProtoOption<"count" | "either"> = {
  key: "loan-left",
  label: "Loan: instalments left",
  choices: [
    { value: "count", label: "A count" },
    { value: "either", label: "A count or the last month" },
  ],
  default: "count",
};

/** The sum as the fields are typed, right under them, not only at the end. */
export const LOAN_LIVE = onOff(
  "loan-live",
  "Loan: running sum under the fields",
  false,
);

/** "How often" and "Paid from" start as one line, since their defaults fit most loans. */
export const LOAN_FOLD = onOff(
  "loan-fold",
  "Loan: fold how often and paid from",
  false,
);

/** Short fields side by side from tablet width, and hints only where they add something. */
export const LOAN_TIGHT = onOff(
  "loan-tight",
  "Loan: short fields in pairs, fewer hints",
  false,
);

/** A pop-up that says where each number is: the bank's app, the statement, the schedule. */
export const LOAN_HELP = onOff(
  "loan-help",
  "Loan: “Where do I find these numbers?”",
  false,
);

/** A bar in the sum: what's owed today, and the markup on top. */
export const LOAN_SPLIT = onOff(
  "loan-split",
  "Loan: bar of owed and markup in the sum",
  false,
);

export const LOAN_OPTIONS = [
  LOAN_START,
  LOAN_BANKS,
  LOAN_ANSWERS,
  LOAN_LEFT,
  LOAN_LIVE,
  LOAN_FOLD,
  LOAN_TIGHT,
  LOAN_HELP,
  LOAN_SPLIT,
] as const;
