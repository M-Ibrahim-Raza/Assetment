import { accounts } from "./accounts";
import { debts } from "./debts";
import type { EntryKind } from "./entries";

// Six months of every kind of entry, 1 Jun to 11 Nov 2026, for the Entries pages. The same every
// time: amounts and days come from a seeded generator, and a few hand-placed entries show off
// notes, a split, tags, app-added instalments, a correction and a long name.

/** The full record holds what Quick add logs, plus corrections to a debt. */
export type HistoryKind = EntryKind | "correction";

/** One part of a split entry. */
export interface EntryPart {
  category: string;
  /** Whole rupees. */
  amount: number;
}

/** What added an entry by itself on its day: a loan instalment, or an approved committee payment. */
export interface EntrySource {
  kind: "loan" | "committee";
  /** The debt it pays, e.g. "Meezan car loan". */
  name: string;
  /** The part that counts as Spent, under "Loan markup". Zero for a committee. */
  markup: number;
}

export interface HistoryEntry {
  id: string;
  kind: HistoryKind;
  /** Its name, e.g. "Imtiaz Super Market". */
  title: string;
  /** Whole rupees, always positive. The kind says which way the money went. */
  amount: number;
  /** For spent or received money. Empty for moved money and corrections. A split's biggest part. */
  category: string;
  /** A split: spent money across two or more categories, adding up to the amount. */
  parts?: readonly EntryPart[];
  /** Where the money left, or where received money landed. A correction's debt. */
  account: string;
  /** Moved money only: the account or debt it went to. */
  toAccount?: string;
  /** The day it happened, as an ISO date. */
  date: string;
  /** When it was typed, as a local ISO date and time. */
  loggedAt: string;
  /** When it was last changed, if ever. */
  editedAt?: string;
  note?: string;
  tags?: readonly string[];
  /** Set when the app added it by itself. */
  source?: EntrySource;
}

/** An account or debt with what it held, or what was owed, on 1 June. */
export interface OpeningPlace {
  id: string;
  name: string;
  /** Null for an account. */
  debt: "card" | "loan" | "committee" | null;
  /** An account's balance, or what was owed on a debt, in whole rupees. */
  opening: number;
}

/** Today in these entries. It matches Quick add's, so the edit form's Today is the same day. */
export const HISTORY_TODAY = "2026-11-11";

const [MEEZAN, JAZZCASH, HBL, CASH, EASYPAISA, UBL] = accounts(6).map(
  (account) => account.name,
) as [string, string, string, string, string, string];
const [CARD, CAR_LOAN, COMMITTEE] = debts(3).map((debt) => debt.name) as [
  string,
  string,
  string,
];
const LENT = "Lent to Ali bhai";

/**
 * The accounts and debts these entries touch, with what each held or owed on 1 June. A heavy
 * spender's, for `manyEntryHistory`, start bigger.
 */
export function historyPlaces(heavy = false): OpeningPlace[] {
  const opening = heavy
    ? [9_000_000, 1_500_000, 500_000, 400_000, 100_000, 2_000_000]
    : [180_000, 6_000, 60_000, 20_000, 8_000, 650_000];
  const owed = heavy
    ? [600_000, 3_120_000, 1_080_000]
    : [30_000, 520_000, 180_000];
  return [
    ...accounts(6).map((account, index) => ({
      id: account.id,
      name: account.name,
      debt: null,
      opening: opening[index] ?? 0,
    })),
    ...debts(3).map((debt, index) => ({
      id: debt.id,
      name: debt.name,
      debt: debt.kind,
      opening: owed[index] ?? 0,
    })),
  ];
}

// Hand-placed entries, so links and scenarios can name them.
export const SAMPLE_SPENT_ID = "e-1042";
export const SAMPLE_RECEIVED_ID = "e-1001";
export const SAMPLE_MOVED_ID = "e-1017";
export const SAMPLE_SPLIT_ID = "e-1055";
export const SAMPLE_APP_ADDED_ID = "e-1009";
export const SAMPLE_CORRECTION_ID = "e-1066";

/** A small seeded generator, so the "random" amounts are the same every time. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mix = Math.imul(state ^ (state >>> 15), 1 | state);
    mix = (mix + Math.imul(mix ^ (mix >>> 7), 61 | mix)) ^ mix;
    return ((mix ^ (mix >>> 14)) >>> 0) / 4_294_967_296;
  };
}

interface Month {
  /** "2026-06". */
  key: string;
  /** 0 for June, 5 for November. */
  index: number;
  /** The last day with entries: the month's end, or today in November. */
  last: number;
}

const MONTHS: readonly Month[] = [
  { key: "2026-06", index: 0, last: 30 },
  { key: "2026-07", index: 1, last: 31 },
  { key: "2026-08", index: 2, last: 31 },
  { key: "2026-09", index: 3, last: 30 },
  { key: "2026-10", index: 4, last: 31 },
  { key: "2026-11", index: 5, last: 11 },
];

const iso = (month: Month, day: number) =>
  `${month.key}-${String(day).padStart(2, "0")}`;

const at = (date: string, hour: number, minute: number) =>
  `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

/** Rounds to a price people pay: tens under Rs 2,000, fifties above. */
const price = (value: number) =>
  value < 2_000 ? Math.round(value / 10) * 10 : Math.round(value / 50) * 50;

type Draft = Omit<HistoryEntry, "id" | "loggedAt"> & { loggedAt?: string };

/** Picks one of a list, by the generator. */
function oneOf<T>(random: () => number, list: readonly T[]): T {
  const item = list[Math.floor(random() * list.length)] ?? list[0];
  if (item === undefined) throw new Error("oneOf needs a list.");
  return item;
}

interface Options {
  seed: number;
  /** How many more everyday entries than usual: 1 is a typical person. */
  density: number;
  /** Multiplies every amount, for a heavy spender. */
  scale: number;
  /** Gives places their full, long names. */
  longNames: boolean;
}

const GROCERS = [
  "Imtiaz Super Market",
  "Imtiaz Super Market",
  "Al-Fatah",
  "Naheed Supermarket",
  "Chase Up",
  "Carrefour",
] as const;
const LONG_PLACE: Readonly<Record<string, string>> = {
  "Imtiaz Super Market":
    "Imtiaz Super Market, Gulshan-e-Iqbal Block 13-D, Karachi",
  "Al-Fatah": "Al-Fatah Departmental Store, MM Alam Road, Gulberg III, Lahore",
  Foodpanda: "Foodpanda order from Kolachi Restaurant, Do Darya, DHA Phase 8",
  Careem: "Careem Go from Shahrah-e-Faisal to I.I. Chundrigar Road",
  Daraz: "Daraz order: Dawlance inverter AC remote and stabiliser set",
};
const RESTAURANTS = [
  "Kolachi",
  "Cheezious",
  "Savour Foods",
  "OPTP",
  "Ginsoy",
] as const;
const DARAZ_CATEGORIES = [
  "Clothes",
  "Home repairs",
  "Personal care",
  "Other",
] as const;

/** The everyday and monthly entries of one month. */
function monthEntries(
  month: Month,
  random: () => number,
  options: Options,
): Draft[] {
  const { index, last } = month;
  const name = (place: string) =>
    options.longNames ? (LONG_PLACE[place] ?? place) : place;
  const money = (value: number) => price(value * options.scale);
  const between = (low: number, high: number) =>
    money(low + random() * (high - low));
  const list: Draft[] = [];
  const add = (day: number, entry: Omit<Draft, "date">) => {
    if (day > last) return;
    list.push({ ...entry, date: iso(month, day) });
  };

  // Money in, on its usual days. November's salary is hand-placed.
  if (month.key !== "2026-11") {
    add(1, {
      kind: "income",
      title: options.longNames
        ? "Salary – Engro Corporation, Regional Finance"
        : "Salary",
      amount: money(310_000),
      category: "Salary",
      account: MEEZAN,
    });
  }
  if (index % 2 === 1) {
    add(25, {
      kind: "income",
      title: "Upwork payout via Payoneer",
      amount: between(60_000, 95_000),
      category: "Freelance",
      account: HBL,
    });
  }
  add(16, {
    kind: "income",
    title: "Profit on savings",
    amount: money(2_100 + index * 40),
    category: "Profit and dividends",
    account: UBL,
  });

  // Monthly moves between the user's own accounts and debts.
  add(2, {
    kind: "transfer",
    title: "To savings",
    amount: money(30_000),
    category: "",
    account: MEEZAN,
    toAccount: UBL,
  });
  add(4, {
    kind: "transfer",
    title: "For the bills",
    amount: money(25_000),
    category: "",
    account: MEEZAN,
    toAccount: HBL,
  });
  for (const day of [1, 8, 15, 22]) {
    if (month.key === "2026-11" && day === 8) continue;
    add(day, {
      kind: "transfer",
      title: "To JazzCash",
      amount: money(9_000 * options.density),
      category: "",
      account: MEEZAN,
      toAccount: JAZZCASH,
    });
  }
  for (const day of [3, 17]) {
    add(day, {
      kind: "transfer",
      title: "Cash from ATM",
      amount: money(25_000 * options.density),
      category: "",
      account: MEEZAN,
      toAccount: CASH,
    });
  }
  add(18, {
    kind: "transfer",
    title: "To Easypaisa",
    amount: money(3_000),
    category: "",
    account: HBL,
    toAccount: EASYPAISA,
  });
  if (month.key !== "2026-11") {
    add(20, {
      kind: "transfer",
      title: "HBL card bill",
      amount: money(
        ([58_000, 71_500, 66_200, 74_000, 62_700][index] ?? 65_000) *
          options.density,
      ),
      category: "",
      account: MEEZAN,
      toAccount: CARD,
    });
    add(5, {
      kind: "transfer",
      title: "Meezan car loan instalment",
      amount: money(28_500),
      category: "",
      account: MEEZAN,
      toAccount: CAR_LOAN,
      source: {
        kind: "loan",
        name: CAR_LOAN,
        markup: money(6_400 - index * 70),
      },
    });
  }
  add(10, {
    kind: "transfer",
    title: "Office committee",
    amount: money(10_000),
    category: "",
    account: MEEZAN,
    toAccount: COMMITTEE,
    source: { kind: "committee", name: COMMITTEE, markup: 0 },
  });

  // Monthly bills and fixed costs.
  add(2, {
    kind: "expense",
    title: "House rent – Mr. Qureshi",
    amount: money(65_000),
    category: "Rent",
    account: MEEZAN,
  });
  add(3, {
    kind: "expense",
    title: "Maasi's salary",
    amount: money(15_000),
    category: "Household help",
    account: CASH,
  });
  add(8, {
    kind: "expense",
    title: "K-Electric bill",
    amount: money(
      [18_400, 21_900, 22_700, 19_300, 13_800, 11_340][index] ?? 15_000,
    ),
    category: "Bills",
    account: HBL,
    ...(index === 2
      ? { note: "Bill was high because of the AC in August." }
      : {}),
  });
  add(9, {
    kind: "expense",
    title: "SNGPL gas bill",
    amount: money([1_850, 1_640, 1_580, 1_720, 2_460, 3_980][index] ?? 2_000),
    category: "Bills",
    account: HBL,
  });
  add(12, {
    kind: "expense",
    title: "PTCL Flash Fiber",
    amount: money(3_799),
    category: "Mobile and internet",
    account: HBL,
  });
  add(15, {
    kind: "expense",
    title: "Netflix",
    amount: money(1_100),
    category: "Subscriptions",
    account: CARD,
  });
  add(21, {
    kind: "expense",
    title: "Edhi Foundation",
    amount: money(5_000),
    category: "Charity and zakat",
    account: MEEZAN,
  });
  if (index === 1 || index === 4) {
    add(6, {
      kind: "expense",
      title: "Beaconhouse term fees",
      amount: money(42_000),
      category: "Children's school fees and tuition",
      account: MEEZAN,
    });
  }

  // Everyday spending, on the days the generator picks.
  for (let day = 1; day <= last; day += 1) {
    const chance = (odds: number) => random() < odds * options.density;
    if (chance(0.17)) {
      const grocer = oneOf(random, GROCERS);
      add(day, {
        kind: "expense",
        title: name(grocer),
        amount: between(2_800, 9_500),
        category: "Groceries",
        account: oneOf(random, [CASH, MEEZAN, CARD]),
      });
    }
    if (chance(0.28)) {
      add(day, {
        kind: "expense",
        title: name("Foodpanda"),
        amount: between(1_150, 3_600),
        category: "Eating out",
        account: JAZZCASH,
      });
    }
    if (chance(0.4)) {
      add(day, {
        kind: "expense",
        title: name("Careem"),
        amount: between(340, 1_250),
        category: "Transport",
        account: JAZZCASH,
      });
    }
    if (chance(0.06)) {
      add(day, {
        kind: "expense",
        title: "Bykea",
        amount: between(180, 420),
        category: "Transport",
        account: CASH,
      });
    }
    if (chance(0.1)) {
      add(day, {
        kind: "expense",
        title: oneOf(random, ["Shell", "PSO", "Total Parco"]),
        amount: between(6_000, 12_000),
        category: "Transport",
        account: CARD,
      });
    }
    if (chance(0.07)) {
      add(day, {
        kind: "expense",
        title: name("Daraz"),
        amount: between(1_299, 12_999),
        category: oneOf(random, DARAZ_CATEGORIES),
        account: CARD,
      });
    }
    if (chance(0.06)) {
      add(day, {
        kind: "expense",
        title: oneOf(random, RESTAURANTS),
        amount: between(2_500, 9_800),
        category: "Eating out",
        account: oneOf(random, [CARD, CASH]),
      });
    }
    if (chance(0.05)) {
      add(day, {
        kind: "expense",
        title: oneOf(random, ["D. Watson", "Fazal Din Pharma Plus"]),
        amount: between(1_800, 4_600),
        category: "Health",
        account: oneOf(random, [CASH, MEEZAN]),
      });
    }
    if (chance(0.07)) {
      add(day, {
        kind: "expense",
        title: "Jazz load",
        amount: money(1_000),
        category: "Mobile and internet",
        account: JAZZCASH,
      });
    }
    if (chance(0.03)) {
      add(day, {
        kind: "expense",
        title: "Cinepax",
        amount: between(1_800, 3_200),
        category: "Entertainment",
        account: EASYPAISA,
      });
    }
  }
  return list;
}

/** The hand-placed entries: each kind with a note, a split, tags, a correction and a long name. */
function featured(scale: number): HistoryEntry[] {
  const money = (value: number) => price(value * scale);
  const murree = ["Murree trip"];
  const wedding = ["Sana's wedding"];
  return [
    {
      id: SAMPLE_SPENT_ID,
      kind: "expense",
      title: "Imtiaz Super Market",
      amount: money(4_250),
      category: "Groceries",
      account: MEEZAN,
      date: "2026-11-08",
      loggedAt: "2026-11-10T22:14",
      editedAt: "2026-11-10T22:31",
      note: "Monthly grocery run. Also got Ammi's green tea.",
    },
    {
      id: SAMPLE_RECEIVED_ID,
      kind: "income",
      title: "Salary",
      amount: money(310_000),
      category: "Salary",
      account: MEEZAN,
      date: "2026-11-01",
      loggedAt: "2026-11-01T10:05",
    },
    {
      id: SAMPLE_MOVED_ID,
      kind: "transfer",
      title: "To JazzCash",
      amount: money(8_000),
      category: "",
      account: MEEZAN,
      toAccount: JAZZCASH,
      date: "2026-11-07",
      loggedAt: "2026-11-10T22:12",
      note: "For Careem and Foodpanda this week.",
    },
    {
      id: SAMPLE_SPLIT_ID,
      kind: "expense",
      title: "Al-Fatah",
      amount: money(8_050),
      category: "Groceries",
      parts: [
        { category: "Groceries", amount: money(6_200) },
        { category: "Personal care", amount: money(1_850) },
      ],
      account: CARD,
      date: "2026-11-03",
      loggedAt: "2026-11-03T20:40",
      note: "Shampoo and soap went on Personal care.",
    },
    {
      id: SAMPLE_APP_ADDED_ID,
      kind: "transfer",
      title: "Meezan car loan instalment",
      amount: money(28_500),
      category: "",
      account: MEEZAN,
      toAccount: CAR_LOAN,
      date: "2026-11-05",
      loggedAt: "2026-11-05T06:00",
      source: { kind: "loan", name: CAR_LOAN, markup: money(6_050) },
    },
    {
      id: SAMPLE_CORRECTION_ID,
      kind: "correction",
      title: "Balance correction",
      amount: money(1_150),
      category: "",
      account: CARD,
      date: "2026-10-28",
      loggedAt: "2026-10-28T21:03",
      note: "Matched the October statement.",
    },
    {
      id: "e-1031",
      kind: "expense",
      title: "Farewell dinner for Ayesha at Monal with the whole office team",
      amount: money(6_900),
      category: "Eating out",
      account: CASH,
      date: "2026-10-31",
      loggedAt: "2026-11-01T00:20",
      tags: ["Office"],
    },
    {
      id: "e-1021",
      kind: "transfer",
      title: LENT,
      amount: money(20_000),
      category: "",
      account: MEEZAN,
      toAccount: LENT,
      date: "2026-09-02",
      loggedAt: "2026-09-02T13:15",
      note: "For his bike repair. Back by Eid.",
    },
    {
      id: "e-1022",
      kind: "transfer",
      title: "Ali bhai paid back",
      amount: money(10_000),
      category: "",
      account: LENT,
      toAccount: MEEZAN,
      date: "2026-10-05",
      loggedAt: "2026-10-05T18:30",
    },
    {
      id: "e-1023",
      kind: "expense",
      title: "Hotel One, Mall Road",
      amount: money(24_000),
      category: "Travel",
      account: CARD,
      date: "2026-08-14",
      loggedAt: "2026-08-16T23:10",
      tags: murree,
    },
    {
      id: "e-1024",
      kind: "expense",
      title: "Fuel for the drive to Murree",
      amount: money(9_500),
      category: "Transport",
      account: CARD,
      date: "2026-08-13",
      loggedAt: "2026-08-16T23:08",
      tags: murree,
    },
    {
      id: "e-1025",
      kind: "expense",
      title: "Lunch at Usmania",
      amount: money(5_400),
      category: "Eating out",
      account: CASH,
      date: "2026-08-15",
      loggedAt: "2026-08-16T23:12",
      tags: murree,
      note: "Chicken karahi for six.",
    },
    {
      id: "e-1026",
      kind: "expense",
      title: "Gift for Sana's wedding",
      amount: money(15_000),
      category: "Gifts and shaadi season",
      account: CASH,
      date: "2026-11-06",
      loggedAt: "2026-11-10T22:10",
      tags: wedding,
      note: "Salami envelope from both of us.",
    },
    {
      id: "e-1027",
      kind: "expense",
      title: "Mehndi outfit – Khaadi",
      amount: money(12_500),
      category: "Clothes",
      account: CARD,
      date: "2026-11-04",
      loggedAt: "2026-11-04T21:45",
      tags: wedding,
    },
    {
      id: "e-1028",
      kind: "income",
      title: "Eid gift from Abbu",
      amount: money(20_000),
      category: "Gift",
      account: CASH,
      date: "2026-06-07",
      loggedAt: "2026-06-07T17:20",
    },
  ];
}

/** Every entry, newest first: by date, then by when it was logged. */
function build(options: Options): HistoryEntry[] {
  const random = seeded(options.seed);
  const generated = MONTHS.flatMap((month) =>
    monthEntries(month, random, options),
  );
  let next = 2000;
  const withIds: HistoryEntry[] = generated.map((entry) => {
    next += 1;
    const appAdded = entry.source !== undefined;
    // Most entries are typed the same day. A few days in November were typed in one go, later.
    const late = entry.date >= "2026-11-06" && entry.date <= "2026-11-09";
    const loggedAt = appAdded
      ? at(entry.date, 6, 0)
      : late
        ? at("2026-11-10", 22, Math.floor(random() * 30))
        : at(
            entry.date,
            8 + Math.floor(random() * 15),
            Math.floor(random() * 60),
          );
    return { ...entry, id: `e-${String(next)}`, loggedAt };
  });
  return [...withIds, ...featured(options.scale)].toSorted(
    (one, two) =>
      two.date.localeCompare(one.date) ||
      two.loggedAt.localeCompare(one.loggedAt),
  );
}

/** A typical person's six months, newest first, the same every time. */
export function entryHistory(): HistoryEntry[] {
  return build({ seed: 11, density: 1, scale: 1, longNames: false });
}

/**
 * 600 entries for a heavy spender, newest first: long names, and totals in crores. The newest
 * 600 of a busy six months.
 */
export function manyEntryHistory(): HistoryEntry[] {
  return build({ seed: 29, density: 2.4, scale: 6, longNames: true }).slice(
    0,
    600,
  );
}

/** The tags in use, most used first. */
export function historyTags(entries: readonly HistoryEntry[]): string[] {
  const counts = new Map<string, number>();
  for (const tag of entries.flatMap((entry) => entry.tags ?? [])) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts]
    .toSorted((one, two) => two[1] - one[1])
    .map(([tag]) => tag);
}
