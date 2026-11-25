// Setup: the wizard a new user goes through right after sign-up (J1 steps 2–7), ending on Home.
// A welcome, a board to tick what they have, then one question at a time about those only, and
// their net worth at the end. The place is in the URL (`?step=`). Features F07 and F08.
//
// The accounts, gold and silver, stocks and funds, and property steps are working forms. Debts and
// money lent are being designed (F12, F20, below). Variant a keeps their stand-ins, which add samples.
//
// F09, gold and silver by weight: "Add a piece" (it was variant d) won over Jeweller's slip, One at a
// time and Piece by piece (prototypes/components/metals/). The `gold-` scenarios open on its step.
// - One panel holds everything about a piece, open for the first one: name, gold or silver,
//   jewellery or a bar or coin (21K and 24K at first), karat, and the weight in tola, masha and
//   ratti, or grams. Today's value shows under the weight as it's typed.
// - "I don't know the exact weight" opens a pop-up that asks for the exact weight first. A rough
//   weight is the quieter way out: marked ≈, counted, and a Things to check reminder.
// - When it was bought: an exact date or just the month and year (the day is optional), then the
//   price paid. The date field is shared with the property form (prototypes/components/).
//   The month's average Sarafa rate shows as the price is typed. A price under half or over 3
//   times that gets a warning that never blocks saving.
// - A deduction per piece, for jewellery only, starting at the last % typed.
// - A summary: today's value, the cost (the price paid, or ≈ from the month's rate), and the
//   profit or loss as of today. Saved pieces are rows with a total, and a row opens in place.
//
// Decided while finalizing, for the forms still to design:
// - A committee counts by turn. Before your turn, what you've paid in is in Portfolio. After it,
//   what's still to pay is in Debts. Its step asks whether your turn has come.
// - Foreign-currency accounts are their own feature, F13. Setup is PKR only until then.
// - A half-done setup shows in Home's Things to check: "Finish setting up: gold and debts left".
//
// Decided while finalizing F09 (handoff: specs/F09-gold-and-silver-by-weight/handoff.md):
// - The typical weights for a rough guess stay, and get checked with a jeweller before launch.
// - The last deduction % and the last unit are saved on the user's account.
// - The ≈ reminder ("Get your wedding set weighed") is F03's item, built with Home's Things to check.
// - With no rate at all, a piece saves by weight and is priced once the rate is in.
// - Silver has one rate, as pure.
// - The rate source, its daily refresh and how far back past rates go are for the spec and an ADR.
//   A month uses its average rate.
// - With no price and no date, profit counts from the day it's added: the cost is its value that
//   day, after any deduction, so it starts at Rs 0.
//
// F10, stocks and funds: finalized on 2026-11-19 (specs/F10-stocks-and-funds-as-buys/). "Add a
// holding" (it was stocks-a, prototypes/components/stocks/) is the gold form's panel, and the
// `stocks-` scenarios open on it. b "Copy from your broker app" (a ledger, one line per holding) and
// c "Pick, then fill" (tick what's held, then one at a time on big lines) were dropped and deleted.
// Decided before building:
// - A share or ETF is entered buy by buy (the exact day, how many, the price a share), or as its
//   total and average price, as the broker app shows it. "Separate buys | One average" (a
//   full-width segmented control under its heading, set as a field label) switches, and keeps
//   what was typed. Buys of the same share join one holding, whose average works itself out.
//   The buys' labels show once, over columns, and each buy is one row of boxes with × at its end,
//   like a spreadsheet. On phones, where three boxes don't fit across, each buy keeps its labels.
//   (Tried and dropped: finished buys folding to a line, and tighter rows that keep their labels.)
//   Under the buys: a full-width dashed "Add another buy", where the next one goes, so it looks
//   unlike the step's own "Add another". Then a total row in a shaded band: "Total", then each
//   figure large under its own column ("150 / shares in all", "Rs 1,020 / average a share").
//   "Where do I find these numbers?" sits beside "Enter your shares as", by the question that
//   asks for them. (Tried and dropped: the sum beside Add under a hairline, the same in a shaded
//   bar, and the help under the buys.)
//   An average shows in whole rupees, under the buys and on a saved row. Typed prices, and the
//   average box, keep their paisa, so the cost and profit stay exact.
//   Today's value, the investment (what was paid, called that and not "cost") and the profit
//   show once, at the end of the panel, no longer also under the inputs. They read as a sum on a
//   receipt: today's value with how it's worked out ("150 shares at Rs 1,125.00, the PSX closing
//   price on 12 Nov"; a fund's "the fund's NAV on 12 Nov"), less the investment, then the profit
//   under a rule, large, signed and coloured.
//   No lakh note under today's value (dropped by choice). Until a quantity is in, a line says
//   they'll show there. (Tried and dropped: the profit first and large, value and profit side by
//   side, and plain sentences.)
//   "Held at (optional)": where a share or ETF is held, a broker or the CDC Investor Account,
//   in one searchable list. Typing finds a place; a broker that isn't there is added from the
//   list's last choice, "Add “…” as your broker", and offered as "Added by you" after that.
//   Clearing it leaves it not set. (Tried and dropped: the phone's own list, with a separate box
//   for another broker's name.) A new holding starts at the last one's place, since most people
//   keep everything at one broker. A share held in two places is a holding for each. The search
//   marks one added with where it's held ("Added · AKD Securities"), and picking it again starts
//   a new holding for another place: "You have … at AKD Securities. This one is for another
//   place.", with "Change the one at AKD Securities instead". Its place starts empty if the
//   prefill is where it's held already, and the same share twice at one place is an error. A fund
//   picked again opens the one added. (Changed: picking an added share used to open it, with a
//   hidden "Add it for another place".) Saved holdings list as a broker app does: from tablet
//   width, column heads once ("Shares", "Avg price", "Today's value"; a fund's "Units" in place
//   of "Shares"), each figure under its own; on phones the figures sit under the name. Rows name the
//   place, under the name, only when holdings are in more than one place. (Changed: the shares and
//   average were a grey line under the name.)
//   A share held in more than one place is entered in one go, its places as tabs with one in
//   view, each with its own "Held at" and buys or average. "+ Add place" ends the row of place
//   tabs, or sits by "Held at" while there's one place; "Remove place" sits by an extra place's
//   "Held at". Each place saves as its own holding, and the summary adds them all up. (Tried and
//   dropped: the places one under another, and one place at a time with "Save, then add another
//   place".)
//   Funds don't ask: their AMC holds them. (Not chosen: asking once for the whole step, or not
//   tracking it. Later, maybe: brokers as accounts, with any idle cash at the broker.)
//   Later buys and sells go through Add trade (J4). (Changed after the first build: it was the
//   average only.)
// - Step 1 of the improvements (decided 2026-11-18): buys stay first. A buy's day uses the phone's
//   own date box. Each buy needs its price. For someone who doesn't know what they paid, a link
//   inside the last buy's hint, "Use today's price, Rs …", fills in today's close and today's
//   day, so the profit counts from today. An empty step starts on its search, "Which share do you
//   hold?" or "Which fund do you hold?", and a pick opens the panel with it. Once it has
//   something, its "Add" opens the panel. (Tried and dropped: the shares panel open on arrival, as Gold's, and chips of the commonly held, as Accounts' banks. With
//   hundreds of shares and funds, a few chips rarely hold the one you own.) "Where do I find these
//   numbers?" opens a pop-up, like Gold's weight help.
// - When both kinds shared one screen, each section's heading was its title with the subtotal and a
//   quiet count line ("Title and count", picked over a rule, small capitals and a side column). Once
//   they became their own steps, the step's title and the totals under the rows say the same, so the
//   section heading went.
// - A fund is entered as a share is (decided 2026-11-19): "Enter your units as: Separate buys |
//   One average". Each buy is its day, the units (up to 4 decimals) and the "NAV paid", in the same
//   columns, dashed "Add another buy" and total row as a share's. One average is the units held
//   and the "Average price", the average NAV paid a unit. Its help is about the fund app, and
//   "Use today's NAV, Rs …" is there for someone who doesn't know what they paid. Saved funds show
//   "Units" and "Avg price", as shares do. (Changed: a fund took its units, then what went in, as
//   one total, one by one or a monthly amount (a SIP). Before that, the value the app shows could
//   be typed instead of the units. Also tried and dropped: the units and what went in side by
//   side, as a fund app's card, and the value first, big, as a question.)
// - A fund that isn't on the list is added by name, as a broker is (decided 2026-11-19): typing
//   its name makes the search's last choice "Add “…” as a fund", with "Not on our list. You'll
//   enter its NAV." under it. Its panel asks for "Today's NAV" first, since the day's prices
//   don't have it, and it stays at that NAV until the user changes it. It's offered again as
//   "Added by you", and the totals say "and the NAVs you entered". (Not chosen: its value today
//   in rupees, or no value until its NAV is known.) Later: matching it to MUFAP's list, and a
//   reminder in Things to check to update its NAV.
// - A share's price is needed either way it's entered, each buy's or the average, with "Use
//   today's price, Rs …" for someone who doesn't know it: then it counts from today, as gold does,
//   and profit starts at 0. (Changed: the average was optional, which buys weren't.) A fund's is
//   the same, with "Use today's NAV, Rs …". (Changed: what went into a fund was optional.)
// - Shares and ETFs, and mutual funds, are their own things, as banks and wallets are: two tiles on
//   the board ("Shares or ETFs", "Mutual funds"), and two parts of the Stocks and funds step, each
//   with its own pill, screen, search, rows and total. Someone with only funds never sees shares.
//   (Changed twice after the first build: it was one search for both, then two sections on one
//   screen.)
// - ETFs are entered like a share, priced at the PSX close.
// - Dividends, bonus and right shares stay out of setup. The quantity includes bonus and right
//   shares, and later ones come through J4.
// - A fund's units are the total across every account, and searching for one already added opens
//   it. A share's are per place, a holding for each.
// Decided when finalizing (2026-11-19):
// - Charges (brokerage, its tax, CDC, NCCPL and SECP fees): the price is the broker or fund app's
//   figure as it is, with no charges added, so the profit matches the app. The spec checks what
//   the main brokers include.
// - A money market fund pays its profit as new units, which Separate buys miss, since they
//   weren't bought. Left for the spec, with MUFAP's fund types, and for J4 to keep units current.
// - Where a share is held is asked: "Held at (optional)", above.
// - A sales load: the fund help says to enter the price paid with the load, the statement's offer
//   price, so a new fund shows a small loss at first, and says why.
// - Where prices come from and when they refresh each day is for the spec and an ADR.
//
// Open questions: None.
//
// F11, property: finalized on 2026-11-19 (specs/F11-property-at-your-own-value/). "Size × rate" (it
// was property-c, prototypes/components/property/) won over Add a property and Value first, then
// was reworked into an address-first form. The `property-` scenarios open on its step.
// - The order people describe a property in: what it is, where it is, its size and share, how it
//   was bought (when, the price, instalments), then what it would sell for and the profit.
// - Where it is: the city (required, a select with "Somewhere else") and the area (required),
//   then optional lines. Each kind asks in its own words, from KIND_FORM in value.ts: a house's
//   area or society, block and house no.; a flat's area, building name, block or phase and flat
//   no.; a plot's society or scheme, block and plot no.; a file's society and phase, with no
//   number until balloting; a shop's market, plaza and shop no.; land's nearest city, village and
//   tehsil and khasra no.
// - Each kind's size has its own units: marla, kanal or sq yd for a house, plot or file; sq ft or
//   sq yd for a flat or shop; acres or kanal for land. Land has no instalments.
// - The name is built from the address: "10 marla house, DHA Phase 6, Lahore". No name field.
// - The size is required and stays in its unit. The city picks the usual unit: square yards in
//   Karachi and Hyderabad, marla elsewhere, acres for land, square feet for a flat or shop.
// - The value is typed as a whole: a building isn't priced per marla. Plots, files and land can
//   work it out from a rate per unit instead.
// - When you bought it is an open section: the date (an exact day, or just the month and year),
//   the price paid, and the "Still paying instalments?" switch, which shows the instalment
//   fields when it's on.
// Decided before building:
// - The value is the user's own: what the whole property would sell for today. There's no price
//   feed. Zameen's price index is a link for someone unsure. Sizes stay in the unit typed.
// - Only the user's share counts: Whole, Half, A third, A quarter, or another %. What they paid is
//   their own money.
// - A plot or file still being paid for adds a loan for what's left to Debts, in this step. They
//   save and go together. A file without a plot number is valued at its file rate.
// - A typed value gets a check in Things to check every 6 months (F03 builds the item).
// - Rent stays out: it's Received in Quick add.
//
// Decided when finalizing (2026-11-19):
// - The instalments loan in Debts opens its property, and can't be changed or removed on its own.
//   Removing the property, or turning its instalments off, removes it. F12's loan model needs
//   instalments every 3 months.
// - The kinds stay House, Flat, Plot, File, Shop and Land, with Plot picked first.
// - When you bought it stays optional: inherited or gifted property has no price, and profit then
//   counts from today, as with gold.
//
// Open questions: None.
//
// F12 and F20, debts and money lent: being designed (started 2026-11-20). "Add a debt" (debts-a, the
// gold form's panel, ending on its sum) won on 2026-11-22 over b "Timeline" (a drawing of the debt
// over time first, the fields under it) and c "In a sentence" (fill in the blanks), which were
// deleted. It's swapped into the same View through DebtFormsContext (prototypes/components/debts/)
// until it's finalized. The `debts-` and `lent-` scenarios open on its step.
// Decided before building:
// - Loan: what's owed today, then "Do you pay a fixed instalment?" Yes: the instalment, how often
//   (every month, or every 3 months with "Next one due", as property's instalments), the
//   instalments left, the day and the account it's paid from. No: an optional "repay by" date. The
//   app works out what's left to pay, the markup with its yearly rate, and the end month. The user
//   never types a rate.
// - "Paid from" starts on the first bank account added, usually where the salary lands, then on the
//   last one picked. With no account added, the loan saves without one.
// - Card: what's owed (Rs 0 is fine), the bill's due day and the credit limit. The limit is
//   required: Quick add's "left on the card" and its warning need it. Over the limit warns, and
//   still saves.
// - Committee: the monthly amount, the people in it, the start month, the turns paid (the months
//   since the start, until the user changes it), whether their turn has come, and its number if
//   known. The app works out the pot, what's paid in, what's still to pay and the end month. Before
//   the turn, what's paid in counts in what you own, apart from the Debts total, with its own line
//   under it. After it, the turns left count in Debts.
// - Money lent is its own step, "Money you've lent": one item per person ("Lent to Ali bhai"), the
//   amount still to come back, and an optional "back by" date. Its tile is the last of what you
//   own, so its step comes before Debts, and Setup can show 6 steps.
// - Names are required: Quick add and the Debts list need them.
// - A property's instalments show under Loans, and open the property (F11).
//
// Open questions:
// - Does this month's payment count in the starting turns paid? It starts at the whole months since
//   the start month, as the money model says.
// - Should a loan show its yearly markup rate ("about 11% a year"), or only the markup in rupees?
// - A committee with every turn paid: show it as paid off in Setup, or not allow it there?

import {
  accounts,
  type Account,
  type AccountKind,
} from "@proto/fixtures/accounts";
import type { DebtDraft } from "@proto/components/debts/forms";
import {
  type DebtPlan,
  debtPlans,
  samplePlan,
} from "@proto/fixtures/debt-plans";
import { debts } from "@proto/fixtures/debts";
import { type LentPlan, lentPlans } from "@proto/fixtures/lent";
import {
  portfolioGroups,
  type PortfolioGroupKind,
} from "@proto/fixtures/portfolio";
import { valueOf } from "@proto/components/metals/weight";
import {
  metalPieces,
  metalRates,
  staleMetalRates,
  type MetalPiece,
  type MetalRates,
} from "@proto/fixtures/metals";
import type { Scenarios } from "@proto/kit/scenarios";
import type { PropertyDraft } from "@proto/components/property/form";
import { rowsOf } from "@proto/components/property/value";
import {
  properties,
  type Property,
  sampleProperty,
} from "@proto/fixtures/property";
import type { HoldingDraft } from "@proto/components/stocks/form";
import {
  displayName,
  GROUP_OF,
  securityOf,
  valueOf as holdingValue,
} from "@proto/components/stocks/holding";
import {
  type Holding,
  holdings,
  SAMPLE_COUNT,
  staleStockPrices,
  type StockPrices,
  stockPrices,
} from "@proto/fixtures/stocks";
import { lentItem, planItem } from "./debt-items";

/** The six things setup asks about, in order. */
export const GROUPS = [
  "accounts",
  "metals",
  "stocks",
  "property",
  "lent",
  "debts",
] as const;
export type SetupGroup = (typeof GROUPS)[number];

/** Where the user is in setup. Each variant maps it to its own screen. */
export type SetupPlace = "start" | SetupGroup | "done";

/** Something owned or owed that isn't an account. Its step is a stand-in in this build. */
export type ItemKind =
  | "metals"
  | "shares"
  | "funds"
  | "property"
  | "lent"
  | "loan"
  | "card"
  | "committee";

export interface SetupItem {
  id: string;
  kind: ItemKind;
  name: string;
  /** What it is worth today, or what is still owed, in whole rupees. */
  amount: number;
  /** Gold and silver only: the piece by weight. Its amount is its value at the day's rate. */
  piece?: MetalPiece;
  /** Stocks and funds only: the holding. Its amount is its value at the day's price. */
  holding?: Holding;
  /** Property only: what it is. Its amount is the user's share of the value they gave it. */
  property?: Property;
  /** A loan, card or committee entered with its plan. Its amount is what it counts at. */
  plan?: DebtPlan;
  /** Money lent to one person. Its amount is what's still to come back. */
  lent?: LentPlan;
}

/** What the user can tick on the board. */
export type Thing = AccountKind | ItemKind;

/** An account as typed into the form, before it is saved. */
export interface AccountDraft {
  kind: AccountKind;
  name: string;
  /** Whole rupees. */
  balance: number;
}

export interface Setup {
  at: SetupPlace;
  accounts: readonly Account[];
  /** Gold, stocks, property and debts added so far. */
  items: readonly SetupItem[];
  /** Groups the user has answered, with something added or with "I don't have any". */
  answered: readonly SetupGroup[];
  /** What the user ticked on the board. */
  ticked: readonly Thing[];
  /** What each stand-in step adds when asked. */
  samples: readonly SetupItem[];
  /** An account whose save just failed. The form shows it again, with the error. */
  failedDraft: AccountDraft | null;
  /** True when the user comes back to a setup they left half-way. */
  resumed: boolean;
  /** The day's Sarafa rates, per tola. */
  metalRates: MetalRates;
  /** The user's buy-back deduction on jewellery, as a share: 0.1 is 10%. 0 is the full rate. */
  metalDeduction: number;
  /** A gold or silver piece whose save failed, or is still saving. Its form shows it again. */
  metalsDraft: { piece: MetalPiece; status: "failed" | "saving" } | null;
  /**
   * The stocks and funds step: the day's prices, a holding whose save failed or is still saving,
   * and a search typed before the form opened. Left out, the step uses today's prices.
   */
  stocks?: { prices: StockPrices; draft: HoldingDraft | null; search: string };
  /** The property step: a property whose save failed or is saving, or one opened in place. */
  property?: { draft: PropertyDraft | null };
  /** The debts step: a debt whose save failed or is saving, or one opened in place. */
  debts?: { draft: DebtDraft | null };
}

/** The View's props. Loading and error are states the View shows, so they are props too. */
export type SetupViewProps =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; setup: Setup };

const groups = portfolioGroups();
const worth = (kind: PortfolioGroupKind) =>
  groups.find((group) => group.kind === kind)?.value ?? 0;

const debtItems = (count: number): SetupItem[] =>
  debts(count).map((debt) => ({
    id: debt.id,
    kind: debt.kind,
    name: debt.name,
    amount: debt.owed,
  }));

/** A piece as a setup item, worth its weight at the given rates. */
const pieceItem = (
  piece: MetalPiece,
  rates: MetalRates = metalRates,
  deduction = 0,
): SetupItem => ({
  id: piece.id,
  kind: "metals",
  name: piece.name,
  amount: valueOf(piece, rates, deduction),
  piece,
});

// 2 tola of 22K at today's rate is Rs 912,000, and it cost what Home's Portfolio says it did.
const gold = pieceItem({
  id: "item-gold",
  metal: "gold",
  form: "jewellery",
  name: "Gold jewellery",
  karat: "22K",
  tola: 2,
  unit: "tola",
  estimated: false,
  paid: groups.find((group) => group.kind === "metals")?.cost ?? null,
  cut: null,
  bought: "2023-04",
});

// The plot Home's Portfolio counts: worth Rs 30 lakh today, bought for Rs 25 lakh.
const homePlot: Property = {
  ...sampleProperty(1),
  id: "item-plot",
  rate: null,
  value: worth("property"),
  paid: groups.find((group) => group.kind === "property")?.cost ?? null,
};

// The same values Home's Portfolio uses, so a finished setup adds up to Home's net worth.
const samples: SetupItem[] = [
  gold,
  // Four shares and ETFs and a fund, which add up to Home's Stocks and funds.
  ...holdings(5).map((holding) => holdingItem(holding)),
  ...rowsOf(homePlot),
  ...debtItems(3),
];

const EVERYTHING: Thing[] = [
  "bank",
  "wallet",
  "cash",
  "metals",
  "shares",
  "funds",
  "property",
  "lent",
  "loan",
  "card",
  "committee",
];

// Just signed up: the welcome, then the board with "Bank account" ticked, as the persona's salary
// lands in one.
const fresh: Setup = {
  at: "start",
  accounts: [],
  items: [],
  answered: [],
  ticked: ["bank"],
  // Money lent's stand-in adds one person. It isn't on Home yet, so the finish leaves it out.
  samples: [...samples, ...lentPlans(1).map(lentItem)],
  failedDraft: null,
  resumed: false,
  metalRates,
  metalDeduction: 0,
  metalsDraft: null,
};

// A salaried investor part-way through the first step: the salary account and a wallet are in.
const typical: Setup = {
  ...fresh,
  at: "accounts",
  accounts: accounts(2),
  ticked: ["bank", "wallet", "metals", "card"],
};

// Many accounts, long names and a crore-sized total, back on the accounts step to add more.
const heavy: Setup = {
  ...fresh,
  at: "accounts",
  accounts: accounts(12),
  items: [
    ...metalPieces(3).map((piece) => pieceItem(piece)),
    ...holdings(15).map((holding) => holdingItem(holding)),
    // The half share with Bhai, and Home's plot.
    ...rowsOf({ ...sampleProperty(6), id: "item-house" }),
    ...rowsOf(homePlot),
    ...lentPlans(4).map(lentItem),
    ...debtItems(4),
  ],
  answered: [...GROUPS],
  ticked: EVERYTHING,
};

// Left after gold and came back another day.
const halfWay: Setup = {
  ...fresh,
  at: "stocks",
  accounts: accounts(3),
  items: [gold],
  answered: ["accounts", "metals"],
  ticked: ["bank", "wallet", "metals", "shares", "funds", "card"],
  resumed: true,
};

// Everything answered: the finish, with the same total as Home.
const finished: Setup = {
  ...fresh,
  at: "done",
  accounts: accounts(5),
  items: samples,
  answered: [...GROUPS],
  ticked: EVERYTHING,
};

// The gold and silver step, for comparing its forms. Typical's accounts are in, and the bar shows
// Accounts, Gold and silver, and Debts.
const onGold: Setup = { ...typical, at: "metals" };
const twoPieces = metalPieces(2).map((piece) => pieceItem(piece));

// Bangles of 2 tola 4 masha, typed in full, whose save didn't go through.
const bangles: MetalPiece = {
  id: "metal-draft",
  metal: "gold",
  form: "jewellery",
  name: "Bangles",
  karat: "21K",
  tola: 2 + 4 / 12,
  unit: "tola",
  estimated: false,
  paid: 980_000,
  cut: null,
  bought: "2025-08",
};

// The stocks and funds step, for comparing its forms. Typical's accounts are in, and the bar shows
// Accounts, Gold and silver, Stocks and funds, and Debts.
const onStocks: Setup = {
  ...typical,
  at: "stocks",
  ticked: [...typical.ticked, "shares", "funds"],
};

/**
 * A holding as a setup item, worth its quantity at the given prices. Shares and ETFs, and mutual
 * funds, are ticked and added apart, as banks and wallets are.
 */
function holdingItem(
  holding: Holding,
  prices: StockPrices = stockPrices,
): SetupItem {
  return {
    id: holding.id,
    kind:
      GROUP_OF[securityOf(holding.symbol).kind] === "funds"
        ? "funds"
        : "shares",
    name: displayName(securityOf(holding.symbol)),
    amount: holdingValue(holding, prices),
    holding,
  };
}

// The first five add up to Home's Stocks and funds.
const fiveHoldings = holdings(5).map((holding) => holdingItem(holding));

// 200 Systems Limited shares at an average of Rs 610, typed in full, whose save didn't go through.
const systems: Holding = {
  id: "holding-draft",
  symbol: "SYS",
  quantity: 200,
  averagePrice: 610,
  buys: null,
  heldAt: "akd",
};

// The property step, for comparing its forms. Typical's accounts are in, and the bar shows
// Accounts, Gold and silver, Property, and Debts. A property on instalments adds its loan to Debts.
const onProperty: Setup = {
  ...typical,
  at: "property",
  ticked: [...typical.ticked, "property"],
};
const propertyRows = (list: readonly Property[]): SetupItem[] =>
  list.flatMap(rowsOf);
const house = sampleProperty(0);
const halfShare = sampleProperty(6);
const onInstalments = sampleProperty(4);
const twoProperties = propertyRows(properties(2));

// A flat in Karachi, typed in full, whose save didn't go through.
const flat: Property = { ...sampleProperty(2), id: "property-draft" };

// The debts step, for comparing its forms. Typical's accounts are in, and the bar shows Accounts,
// Gold and silver, and Debts, with Loan, Credit card and Committee as its parts.
const onDebts: Setup = {
  ...typical,
  at: "debts",
  ticked: [...typical.ticked, "loan", "committee"],
};
// A car loan, a card and an office committee after the turn.
const threeDebts = debtPlans(3).map(planItem);
// A personal loan, typed in full, whose save didn't go through.
const personalLoan: DebtPlan = { ...samplePlan(7), id: "debt-draft" };
// Only Committee ticked, so the step opens on it.
const onCommittee: Setup = {
  ...typical,
  at: "debts",
  ticked: ["bank", "wallet", "metals", "committee"],
};
// 8 of 10 turns paid, and the turn is the last one, in December.
const family = samplePlan(4);
const beforeTurn: DebtPlan =
  family.kind === "committee" ? { ...family, turn: 10 } : family;
const afterTurn = samplePlan(2);
const fromChacha = samplePlan(3);

// The money lent step: Typical's things, and Money lent.
const onLent: Setup = {
  ...typical,
  at: "lent",
  ticked: [...typical.ticked, "lent"],
};

export const scenarios = {
  default: { status: "ready", setup: typical },
  empty: { status: "ready", setup: fresh },
  many: { status: "ready", setup: heavy },
  partial: { status: "ready", setup: halfWay },
  done: { status: "ready", setup: finished },
  "save-error": {
    status: "ready",
    setup: {
      ...typical,
      failedDraft: { kind: "bank", name: "HBL Current", balance: 82_150 },
    },
  },
  loading: { status: "loading" },
  gold: { status: "ready", setup: { ...onGold, items: twoPieces } },
  "gold-empty": { status: "ready", setup: onGold },
  "gold-many": {
    status: "ready",
    setup: {
      ...onGold,
      items: metalPieces(8).map((piece) => pieceItem(piece, metalRates, 0.1)),
      metalDeduction: 0.1,
    },
  },
  "gold-save-error": {
    status: "ready",
    setup: {
      ...onGold,
      items: twoPieces,
      metalsDraft: { piece: bangles, status: "failed" },
    },
  },
  "gold-saving": {
    status: "ready",
    setup: {
      ...onGold,
      items: twoPieces,
      metalsDraft: { piece: bangles, status: "saving" },
    },
  },
  "gold-stale-price": {
    status: "ready",
    setup: {
      ...onGold,
      items: metalPieces(2).map((piece) => pieceItem(piece, staleMetalRates)),
      metalRates: staleMetalRates,
    },
  },
  "stocks-empty": { status: "ready", setup: onStocks },
  "stocks-default": {
    status: "ready",
    setup: { ...onStocks, items: fiveHoldings },
  },
  "stocks-many": {
    status: "ready",
    setup: {
      ...onStocks,
      items: holdings(SAMPLE_COUNT).map((holding) => holdingItem(holding)),
    },
  },
  "stocks-saving": {
    status: "ready",
    setup: {
      ...onStocks,
      items: fiveHoldings,
      stocks: {
        prices: stockPrices,
        draft: { holding: systems, status: "saving" },
        search: "",
      },
    },
  },
  "stocks-save-error": {
    status: "ready",
    setup: {
      ...onStocks,
      items: fiveHoldings,
      stocks: {
        prices: stockPrices,
        draft: { holding: systems, status: "failed" },
        search: "",
      },
    },
  },
  "stocks-stale-price": {
    status: "ready",
    setup: {
      ...onStocks,
      items: holdings(5).map((holding) =>
        holdingItem(holding, staleStockPrices),
      ),
      stocks: { prices: staleStockPrices, draft: null, search: "" },
    },
  },
  "stocks-not-found": {
    status: "ready",
    setup: {
      ...onStocks,
      items: fiveHoldings,
      stocks: { prices: stockPrices, draft: null, search: "Lucky Cemnt" },
    },
  },
  "property-empty": { status: "ready", setup: onProperty },
  "property-default": {
    status: "ready",
    setup: { ...onProperty, items: twoProperties },
  },
  "property-many": {
    status: "ready",
    setup: { ...onProperty, items: propertyRows(properties(8)) },
  },
  "property-saving": {
    status: "ready",
    setup: {
      ...onProperty,
      items: twoProperties,
      property: { draft: { property: flat, status: "saving" } },
    },
  },
  "property-save-error": {
    status: "ready",
    setup: {
      ...onProperty,
      items: twoProperties,
      property: { draft: { property: flat, status: "failed" } },
    },
  },
  "property-shared": {
    status: "ready",
    setup: {
      ...onProperty,
      items: propertyRows([house, halfShare]),
      property: { draft: { property: halfShare, status: "open" } },
    },
  },
  "property-instalments": {
    status: "ready",
    setup: {
      ...onProperty,
      items: propertyRows([house, onInstalments]),
      property: { draft: { property: onInstalments, status: "open" } },
    },
  },
  "debts-empty": { status: "ready", setup: onDebts },
  "debts-default": {
    status: "ready",
    setup: { ...onDebts, items: threeDebts },
  },
  "debts-many": {
    status: "ready",
    setup: { ...onDebts, items: debtPlans(10).map(planItem) },
  },
  "debts-saving": {
    status: "ready",
    setup: {
      ...onDebts,
      items: threeDebts,
      debts: { draft: { plan: personalLoan, status: "saving" } },
    },
  },
  "debts-save-error": {
    status: "ready",
    setup: {
      ...onDebts,
      items: threeDebts,
      debts: { draft: { plan: personalLoan, status: "failed" } },
    },
  },
  "debts-committee-before-turn": {
    status: "ready",
    setup: {
      ...onCommittee,
      items: [planItem(beforeTurn)],
      debts: { draft: { plan: beforeTurn, status: "open" } },
    },
  },
  "debts-committee-after-turn": {
    status: "ready",
    setup: {
      ...onCommittee,
      items: [planItem(afterTurn)],
      debts: { draft: { plan: afterTurn, status: "open" } },
    },
  },
  "debts-loan-no-fixed-amount": {
    status: "ready",
    setup: {
      ...onDebts,
      items: [planItem(samplePlan(0)), planItem(fromChacha)],
      debts: { draft: { plan: fromChacha, status: "open" } },
    },
  },
  "lent-empty": { status: "ready", setup: onLent },
  "lent-default": {
    status: "ready",
    setup: { ...onLent, items: lentPlans(3).map(lentItem) },
  },
  error: {
    status: "error",
    message:
      "What you added is safe. Check your connection and try again in a moment.",
  },
} satisfies Scenarios<SetupViewProps>;
