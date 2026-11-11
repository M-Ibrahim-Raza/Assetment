// Quick add: the form behind the Add button, for logging money spent, received or moved (J2 steps 1–3 and 5).
//
// Finalized on 2026-11-11: "Big number" won over "Sentence" (the form as one sentence) and
// "Your usuals" (tiles first). The user liked Big number best and called the usuals "really
// great", so Big number took them as a row above the amount.
//
// Decided with the user:
// - It opens over the screen the user is on: full height on phones, a centred box on desktop.
//   After Save it closes and the user is back where they were. Every later form copies this.
// - The amount is the hero, on a block in the kind's colour, with the keypad open at once.
// - A row of usuals sits above the amount, where it stays in view while the phone's keypad is up.
//   A tap fills the category and account, and offers last time's amount as "Rs 680 again"
//   without filling it in.
// - Save stays at the bottom, the same on every form. On Android the number keypad's ✓ key saves.
//   On iPhone the keypad has no such key: the user taps Done, then Save.
// - Debts are in Quick add. "Paid from" also lists credit cards: spending on a card adds to what
//   is owed on it. Moved money can go to a debt (a card bill, a loan instalment, a committee): it
//   lowers what is owed, and net worth stays the same. The whole payment counts as paid off. Any
//   markup in it is corrected later, when Home's balance check asks about the debt.
// - Add leads to money: the form opens at once. A quiet line under Save reads "Bought gold, shares
//   or property? Add a trade · Add gold or property", so an investment isn't logged as spending.
//   It won over Add opening Quick add alone, and over a menu of everything first.
// - The kind lives in the link: /add is Spent, /add?kind=income Received, /add?kind=transfer
//   Moved. Switching updates the link in place, with no Back steps. A reload keeps the kind, and
//   other screens or a phone shortcut can open Add on the right one. Clear keeps the kind.
// - Money in is "Received" everywhere. Home's month block said "Earned"; it now says "Received",
//   which fits salary, freelance, gifts, refunds and rent alike. F02's handoff note says so too.
// - Foreign-currency accounts come with F13. Then the amount is typed in the account's own
//   currency, with its rupee value at today's rate under it. A move between currencies asks for
//   both amounts ("$1,000 out, Rs 277,000 in"), so balances match the bank. Until then, PKR only.
//
// Calls made while building, to judge on screen:
// - The row: up to 8 usuals of the selected kind, most used first. It is hidden before there is
//   any history. The usual that matches the form shows pressed.
// - On phones the row is a swipe strip (asked for by the user): it runs to the screen's edges, the
//   third card peeks in, cards snap one by one, and there is no scrollbar. Wider screens show a
//   grid of three.
// - A usual's own name ("Careem") goes in the note, so the entry is saved under it, unless the
//   user typed a note of their own.
// - The line under the amount says what is being saved ("Careem · JazzCash"), so it can be
//   checked while the keypad covers the fields. "Again" moves focus to Save, which closes the keypad.
// - The kinds read "Spent · Received · Moved". Colour says the kind: ink, bottle green, sage.
// - The phone's number keypad, whole rupees, and the lakh note under large amounts.
// - The most used categories and accounts show as chips, the rest under More, where accounts and
//   debts sit under their own headings.
// - The account shows its balance, and what it will be after this entry. A debt shows what is
//   owed, and warns when a payment is more than that.
// - After Save: a toast with Undo and Add another, and Home's numbers move.
// - Closing keeps what was typed. Opening Add again brings it back, with Clear.
//
// In the prototype the panel sits over Home's default data and closes in place, so the URL stays
// /add. Production would open it over whichever screen the user is on, and close by going back.
//
// Features: F14 Quick add, F15 Your usuals, F16 Card spending and debt payments, F17 Receipt scan
// (open). Their handoff notes are in specs/, with the build notes for production.
//
// Open questions (write them here while exploring, resolve them in /prototype-finalize):
// None.

import { accounts, type Account } from "@proto/fixtures/accounts";
import { categories, type CategoryKind } from "@proto/fixtures/categories";
import { type Debt, debts } from "@proto/fixtures/debts";
import type { EntryKind } from "@proto/fixtures/entries";
import { usuals, type Usual } from "@proto/fixtures/usuals";
import type { Scenarios } from "@proto/kit/scenarios";
import { daysBefore, TODAY, YESTERDAY } from "./days";

/** What the form holds while the user fills it in. */
export interface Draft {
  kind: EntryKind;
  /** The amount typed so far, as digits with no commas. Empty when nothing was typed. */
  digits: string;
  /** Empty for moved money. */
  category: string;
  /** The id of the account or credit card the money leaves, or the account it lands in for income. */
  account: string;
  /** The id of the account or debt moved money goes to. Empty otherwise. */
  toAccount: string;
  /** The day it happened, as an ISO date. */
  day: string;
  note: string;
}

export interface QuickAdd {
  /** Most used first. With none, the user is sent to add one. */
  accounts: readonly Account[];
  /** Credit cards, loans and committees. Spending can come from a card; moved money can pay any of them. */
  debts: readonly Debt[];
  /** Most used first. */
  categories: Readonly<Record<CategoryKind, readonly string[]>>;
  /** What the user logs often, most used first. Empty before their first entries. */
  usuals: readonly Usual[];
  /** What the form opens with: defaults learned from history, or an entry part-way typed. */
  draft: Draft;
  /** True when saving this draft just failed. The form opens with the error showing. */
  failed: boolean;
}

/** The View's props. Loading and error are states the View shows, so they are props too. */
export type QuickAddViewProps =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; quickAdd: QuickAdd };

const MEEZAN = "Meezan Bank – Salary";
const JAZZCASH = "JazzCash";
const CASH = "Cash in hand";
const UBL = "UBL Bachat Savings Account (joint with Ammi)";
const HBL_CARD = "HBL credit card";

/** The id of the account or debt with this name, or of the first one. */
function idOf(
  list: readonly { id: string; name: string }[],
  name: string,
): string {
  const found = list.find((place) => place.name === name) ?? list[0];
  return found?.id ?? "";
}

/** An empty form with its defaults: spent, the most used category, the last-used account, today. */
function blank(list: readonly Account[]): Draft {
  return {
    kind: "expense",
    digits: "",
    category: "Groceries",
    account: idOf(list, CASH),
    toAccount: "",
    day: TODAY,
    note: "",
  };
}

// A salaried investor with five accounts, a credit card, a car loan, a committee, and a few months
// of history. The debts are the ones Home shows.
const five = accounts(5);
const three = debts(3);
const typical: QuickAdd = {
  accounts: five,
  debts: three,
  categories: {
    expense: categories("expense", 9),
    income: categories("income", 6),
  },
  usuals: usuals([...five, ...three]),
  draft: blank(five),
  failed: false,
};

const groceries: Draft = { ...blank(five), digits: "4250" };

// Someone who has added accounts but logged nothing yet: no usuals, and defaults that aren't learned.
const two = accounts(2);
const firstEntry: QuickAdd = {
  ...typical,
  accounts: two,
  usuals: [],
  draft: blank(two),
};

// Many accounts, debts and categories, long names, a long note, a crore-sized amount and an older day.
const thirty = accounts(30);
const eight = debts(8);
const heavy: QuickAdd = {
  accounts: thirty,
  debts: eight,
  categories: {
    expense: categories("expense", 20),
    income: categories("income", 8),
  },
  usuals: usuals([...thirty, ...eight]),
  draft: {
    kind: "expense",
    digits: "12500000",
    category: "Children's school fees and tuition",
    account: idOf(thirty, UBL),
    toAccount: "",
    day: daysBefore(TODAY, 8),
    note: "Fees for both children for the whole year, paid at the school office",
  },
  failed: false,
};

export const scenarios = {
  default: { status: "ready", quickAdd: typical },
  filled: { status: "ready", quickAdd: { ...typical, draft: groceries } },
  income: {
    status: "ready",
    quickAdd: {
      ...typical,
      draft: {
        ...blank(five),
        kind: "income",
        digits: "310000",
        category: "Salary",
        account: idOf(five, MEEZAN),
        day: YESTERDAY,
      },
    },
  },
  transfer: {
    status: "ready",
    quickAdd: {
      ...typical,
      draft: {
        ...blank(five),
        kind: "transfer",
        digits: "5000",
        category: "",
        account: idOf(five, MEEZAN),
        toAccount: idOf(five, JAZZCASH),
      },
    },
  },
  // Shopping on the credit card: what is owed on it goes up.
  card: {
    status: "ready",
    quickAdd: {
      ...typical,
      draft: {
        ...blank(five),
        digits: "3499",
        category: "Clothes",
        account: idOf(three, HBL_CARD),
        note: "Daraz order",
      },
    },
  },
  // Paying the card bill from the bank: what is owed goes down, and net worth stays the same.
  "pay-debt": {
    status: "ready",
    quickAdd: {
      ...typical,
      draft: {
        ...blank(five),
        kind: "transfer",
        digits: "25000",
        category: "",
        account: idOf(five, MEEZAN),
        toAccount: idOf(three, HBL_CARD),
        note: "HBL card bill",
      },
    },
  },
  "first-entry": { status: "ready", quickAdd: firstEntry },
  empty: {
    status: "ready",
    quickAdd: { ...firstEntry, accounts: [], debts: [] },
  },
  many: { status: "ready", quickAdd: heavy },
  loading: { status: "loading" },
  error: {
    status: "error",
    message:
      "Nothing is lost. Check your connection and try again in a moment.",
  },
  "save-error": {
    status: "ready",
    quickAdd: { ...typical, draft: groceries, failed: true },
  },
} satisfies Scenarios<QuickAddViewProps>;
