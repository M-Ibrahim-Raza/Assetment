// Spending: this month's spending by category, against last month (J3 steps 1–2).
//
// Settled before building (2026-11-12):
// - Spent only. Money received isn't here, and Home's Received row should stop linking here.
// - Home's "See all entries" lands on this screen's list of spent entries.
// - Moved money (transfers, card bills, loan and committee payments) is never in the totals, and
//   Spending doesn't mention it. A line under the categories ("Not counted: Rs 30,000 moved…")
//   was removed on 2026-11-12.
// - Past months: swipe the calendar, or the arrows on the ink block.
// - The current month compares up to the same day, a past month whole months. What it compares
//   with is one choice for the whole screen (2026-11-17, below).
// - Spending more isn't an error: arrows, words and signs, never red.
// - The month, comparison, picks, orders and search live in the URL (`month`, `compare`,
//   `category`, `account`, `day`, `category-order`, `account-order`, `q`, `sort`).
// - Mobile first: one column, no tables on phones, 44 px targets, totals sized to fit at 320 px.
// - Picked on 2026-11-12: "Days" (c) won over "Answer first" (a) and "Month pace" (b), which
//   were deleted. It took b's ink block, with the pace chart, as its top. Tapping a day marks it
//   on the chart. A "By category" card shows the top 5 with "Show all", right after the ink block
//   on phones and in the left column on desktop. Picking a category narrows the chart, the
//   calendar and the entries; the chip on the ink block clears it.
// - Customize (2026-11-12): showing the pace chart and the calendar together overfilled the
//   screen, so people choose. The ink summary (month arrows, total, answer) is always first.
//   Customize, in the header next to Hide amounts, opens a sheet with a switch and up and down
//   buttons for each section (no dragging), Reset to default with Undo, and Done. Changes show at
//   once and save to the account, so the layout is the same on every device (phones can have their
//   own since 2026-11-17, below). Default: pace chart off; By category, Calendar and Entries on.
//   Entries can't be hidden: Home's "See all entries" lands there.
// - Picking days (2026-11-12): tap a day for that day, or "Pick days" on the calendar, then the
//   first and last day, for a run of days (Shift+click does the same on a computer). No dragging.
//   A pick stays inside one month and clears with the month. It works like a category: a chip on
//   the ink block clears it, and the total, By category, the pace chart (a band, or a line for one
//   day) and the entries all show only those days, against the same dates the month before. One
//   day isn't compared. With nothing picked, everything shows the whole month, and the entries
//   start with today. No analysis extras on the calendar (weekday bars, facts, week totals);
//   week totals came back on 2026-11-17 as a setting, off by default (below).
// - By account (2026-11-12): its own section after By category, shown by default, hidden or moved
//   in Customize. It works like By category: picking an account narrows the whole screen, with a
//   chip on the ink block. Each breakdown keeps the other's pick but not its own, so any row can
//   still be picked. No "Open" link yet: there is no Account detail screen.
// - Entries (2026-11-12): search also matches amounts ("4250"). Under it, Newest | Biggest (one
//   list from the largest down, each row with its day; a sort menu since 2026-11-17, below) and
//   Filters, a sheet with an amount range that narrowed the list only; removed on 2026-11-17, so
//   the list narrows by the sections' picks and search alone. A result line ("12 entries · Rs
//   34,500") counts what the list shows. Day headings stay at the top while scrolling their
//   entries. Rows stay text only, and a tap opens Entry detail.
// - Pace chart (2026-11-13): it compares with last month, the usual month (average of the 3
//   before) or another month, picked in a sheet ("Pick a month", with a calendar icon as on
//   "Pick days", replaced "Nov 2025"). The chips sat on the chart until 2026-11-17, when they
//   moved to the ink block for the whole screen. A dashed line shows where the month ends if
//   the rest goes like the comparison, in the current month only, with a figure under the chart
//   ("By 30 Nov, if like October · about Rs 4.1 lakh", a sentence until 2026-11-17). It is a
//   setting since 2026-11-17 (below). Days along the bottom (1, 8, 15, 22, 29) and gridlines
//   at round amounts ("2 lakh") are kept (2026-11-13). Reading a day: hovering with a mouse,
//   holding a finger on the chart, or the arrow keys show its date and amounts in a small box;
//   past today, the "if like" guess. The chart never picks days: the calendar does. A gap
//   marker at today joins the two lines, labelled with the difference ("↑ Rs 9,300 more"),
//   and each line is labelled with its amount at today ("Nov Rs 212,400",
//   "Oct by now Rs 203,100"), in place of a legend; both kept on 2026-11-13. Labels sit where
//   a running total leaves room: above-left of the higher point, below-right of the lower one.
//   Picked days show as a shaded band with edge lines, and a row under the days with a bar over
//   those days and a tag ("3–9 Nov · Rs 48,200"), clear of every line and label (2026-11-17).
// - One comparison for the screen (2026-11-17): Last month · Usual · Pick a month sit in the ink
//   block, under the answer. The answer, the figures, the pace chart and every category and
//   account row follow it ("Rs 4,000 more than usual by now", "Usual by now", the mark "Usual by
//   the 12th", "more than usual"). Usual averages up to 3 months before over the same days, rows
//   too, and needs 2. A past month can't pick the unfinished current month. A choice without
//   data falls back to last month.
// - By category additions (2026-11-17): the movers the headline names always show, tagged
//   "Biggest rise"; each row's share of spending, "31%"; the rest's total on the button, "Show
//   14 more · Rs 324,500", with no button for one hidden row; and sorting (below). Tried first
//   as ProtoBar switches, then made settings (below). The rest's total is built in, for By
//   account too: it needs no setting. By account got the share and sorting too, and its own
//   settings (below). Not added: budgets (a v1 non-goal), category groups (the data has none),
//   a donut or treemap.
// - Section settings (2026-11-17): in Customize, a section with its own settings has Options
//   under its name, closed until opened, with a switch for each. What most people want starts
//   on, the rest off, and any can be switched. Saved to the account with the layout; Reset to
//   default restores them, with Undo. Options show only while the section is shown. At most two
//   levels: the sheet, then Options. Planned a section at a time, each built before the next.
//   By category: Share of spending, Keep the biggest changes in view and Sorting, all on, kept
//   as they were after the section review. Not added: a 6-month trend on each row, every
//   category always listed, an entry count on every row (Sort by Entries shows it), a usual
//   amount on each row (comparing with Usual does it).
// - By account settings (2026-11-17): the same three as By category, with the same names and
//   order. Share of spending, on ("33%"). Keep the biggest changes in view, off: the two accounts
//   behind most of the change stay in the list, tagged "Biggest rise", as on By category; off
//   since the headline names categories, not accounts. Sorting, on. Not added: grouping by type
//   (Bank, Card, Wallet, Cash), which tangles with sorting and Show more for 6 or 7 accounts.
// - Calendar settings (2026-11-17): Amounts on each day, on: "Rs 12,790" in each day from tablet
//   width. Phones keep only the shading and a tap: an amount can't fit a 38 px cell. No-spend
//   days, off: a small ring on each day over with nothing spent (today counts once it's over),
//   and a line under the grid, "5 no-spend days so far", or with a pick, "18 days with nothing
//   on Groceries so far". Week totals, off: from tablet width an 8th column, "Week", beside each
//   row; on phones, a "Weeks" list under the grid ("2–8 Nov · Rs 99,120"), so the switch works
//   on every device. Not added: a weekday pattern (nothing to act on).
// - Entries settings (2026-11-17), in this order: Day totals, on: each day heading's total. Running
//   total, off: in date order, under each day's total, what the list adds up to by then ("Rs
//   207,470 by then", "so far" for today). Compact rows, off: one line per entry, its category,
//   account and day for screen readers only. Sorting, on: Newest | Biggest became By category's
//   sort menu, with Date (Newest first, Oldest first), Amount, Name, Category and Account (A to
//   Z), in the URL as `sort` ("amount", "date-reversed"). By date, rows group under days; by
//   category or account, under each one with its total, and rows leave it out; by amount or
//   name, one list, each row with its day. Filters: a switch for the button was tried, then the
//   Filters sheet and its amount range were removed the same day; the sections' picks and
//   search narrow the list. Not added: category and account filters for the list alone.
// - A Customize button on each section (2026-11-17): the header's sliders icon at the right of
//   each section's heading, "Customize By category" to screen readers. It opens the same sheet at
//   that section, its Options open and focused. One place for every setting, with the same Reset
//   and Undo. Apple keeps options that change part of a view in place; dashboards (Cloudscape,
//   ClickUp) give each card its own menu. Not chosen: a popover per section (two settings UIs),
//   an edit mode (a mode to get stuck in), the header alone (options two levels deep).
// - Pace chart settings (2026-11-17), in this order: Where the month may end, on: the dashed
//   line and the figure "By 30 Nov, if like October · about Rs 4.1 lakh", in the current month.
//   Average a day, off: the figures "A day so far · Rs 17,700" and "October, a day by now · Rs
//   16,900". Daily bars, off: thin bars (3 px) in a strip of their own between the chart and the
//   days, like a stock chart's volume, faint on a hairline, the busiest day at full height; the
//   day being read, the marked day or the picked days light up white, and the day readout adds
//   "That day". A day over twice the next biggest (rent on the 1st) is cut short with a break
//   notch, so the others stay readable. Inside the chart they ran under the lines and labels.
//   Usual range, off: a band from the lowest to the highest running
//   total of the months the usual month averages, keyed under the days ("Usual range: lowest to
//   highest of Aug, Sep and Oct."); without 2 months before, the key says so. The numbers under the
//   chart are figures, a term and an amount after a thin rule, as on the ink block, not
//   sentences. No switch for the comparison line, the gap at today, the line labels, the days
//   or the gridlines: they are how the chart reads, and nothing may need hover. Not added: a
//   budget line (budgets are a v1 non-goal), leaving out bills like rent (no bills yet).
// - Sorting (2026-11-17): two big pills above the rows weighed too much for a rare choice, and
//   a field menu with a separate icon toggle looked like two unrelated controls. It's one quiet
//   trigger at the end of the key line: the field, "Amount", after an icon that shows the way,
//   its arrow down for the usual way and up for the reverse (down with bars wide to narrow, or
//   A–Z; up with bars narrow to wide, or Z–A); screen readers hear the way in words. It opens
//   one menu in two groups: Sort by (Amount, Change, Name, Entries) and Order, each way with
//   its icon and words for the field (High to low; Rises first; A to Z; Most first; or the
//   reverse). The menu stays
//   open after a pick; a new sort starts its natural way. Change splits rises from drops, in
//   place of Most changed, and isn't offered with nothing to compare. Sorted by entries, each row
//   says how many ("9 entries"). On narrow phones the trigger wraps to its own line, on the
//   right. In the URL: `category-order` and `account-order`, such as "change", "name" or
//   "entries-reversed".
// - A donut chart for By category and By account (2026-11-17), from an interview: both answer
//   "how the total splits" at a glance, as an addition to the list, not a replacement. It's a
//   choice at the top of each section's Options in Customize: "Show as", two equal buttons with
//   icons, List (the default) and Donut chart, set apart from the switches by a rule. While the
//   chart is on, the list's settings (share, biggest changes, sorting) aren't shown, since they
//   don't apply. Tried the same day: a List and Chart switch by each heading, then a Donut chart
//   switch among the others, which read as one more option and showed only one of the two
//   formats. The section's own Customize button opens the sheet at its Options. The chart: this
//   month or the picked days only, following the screen; the top 5 in the theme's 5 chart
//   colours, then the rest together, striped, as "14 more" (not "Other", since a category may be
//   called that), which opens to list them; one left over shows by name. A line above names the
//   biggest ("Rent and Groceries are 53% of your spending"; accounts "paid" it). Each part's
//   name and percent sit beside the ring, on its slice's side, joined to it by a thin line, in
//   place of a key to read across to: the chart is shorter than the list, even at 320 px. The
//   ring takes 45% of the card's width, from 120 to 224 px, and the labels are small (11 px on
//   phones). Its name and amount show in the ring's middle on hover, focus or a tap, not the
//   percent, which the label gives; the amount is a size smaller when it's a crore or more.
//   A tap on a part, its label or its slice, picks it like a row, and a picked part from
//   the rest stands on its own. Screen readers get the labels in size order. Colours stay fixed:
//   the 5 usually biggest over the 3 months before the current one keep theirs; a newcomer takes
//   the colour of one it pushed out. Every part has a faint edge: chart-3 is 1.4:1 on the card in
//   every theme. Not chosen: a key beside or under the ring (tried first), a 100% bar, a
//   100-square grid, a treemap (slivers too small to tap), a pie (no middle for the amount).
// - Donut chart settings (2026-11-17), shown under Options only while Show as is Donut chart, as
//   the list's show only for the list. From research (Monarch, YNAB, Actual, Revolut, Copilot,
//   and chart guides: Elastic, Maersk, Domo, Genesys): Split by, Amount (default) or Entries, a
//   two-button choice like Show as: how often, not how much, so Eating out may beat Rent.
//   Amounts on labels, off: "23% Rs 48,600", or "12 entries", beside the percent where there's
//   room, under it where not. Change, off: "▲ Rs 6,200" under the percent, against the
//   comparison, with arrows and words, never red; screen readers hear "Rs 6,200 more than
//   October". Summary line, on: the line above the chart. Not added: a comparison ring inside
//   the donut (the inner ring is hard to read, and Change says it in words), more than 5 slices
//   (guides stop at about 6), grouping by Fixed/Flexible or category groups (no such data yet).
//   Later: leaving a category such as Rent out of the chart, as an action on a picked part, since
//   a list of categories under Options would be a third level.
// - A layout for phones (2026-11-17): phones and bigger screens suit different sections, so
//   Customize has "Same layout on phone and computer" at the top of its list, on by default.
//   Turned off, phones get a copy of the layout to change on their own, and tabs under the
//   heading pick which is being changed: Phone, or Computer, which tablets use too (the app's own
//   split: the tab bar under 48rem, the sidebar from there). "Tablet and computer" wrapped to two
//   lines on a phone, so the tab is "Computer", and the switch's line says tablets use it.
//   Everything can differ: sections, order and options. It opens on the tab for the screen it's
//   on, a section's own button too; off that screen, a line says where the changes will show.
//   Each change says where ("Calendar hidden on phones."). Turned back on, the layout on the tab
//   in view is kept for both, with Undo. Reset resets the tab in view. Both are saved to the
//   account, so every phone shows the phone's.
//   From Tableau (a phone layout that follows the main one until changed), Squirro (mobile in
//   sync with web until changed), Power BI and Explo (a phone layout that never touches the
//   desktop one). Not chosen: always two layouts (every change twice for most people), and
//   "Show on: Phone · Computer" per section (no different order or options).
// - Placing the sections on a computer (2026-11-18): c split them into two columns by count,
//   which left a tall strip of empty page beside the entries, put By category and By account at
//   different widths, and ended cards in a row at different heights. d places them by
//   shape: the pace chart is wide, By category, By account and the calendar are tiles, and the
//   entries are a list. People still choose what shows and in what order; the screen places it.
//   Two columns only when the sections area is at least 44rem wide, by its own width, not the
//   window's (the sidebar takes room). Read left to right, top to bottom, two to a row. A wide
//   section takes its own row, and a tile left alone before it takes a full row too. Two tiles
//   share a row and a height: two breakdowns half each, the calendar 3 of 5, so day amounts fit.
//   A donut chart sits in the middle of a stretched card, and lists keep to the top. A calendar
//   on its own row has cells shorter than square, so the month isn't 800 px tall.
//   Tried as d and e, both kept: Entries' Options in Customize start with "Layout on computers",
//   Side column (the default) or Rows, two buttons with icons like "Show as", with a line on the
//   one picked. It sat at the top of the sheet, under the switch for the phone's layout, until
//   later on 2026-11-18: it only moves the entries, and their own Customize button now opens
//   right at it. It isn't on the Phone tab: phones stack the sections. It's saved with the
//   computers' layout, and Reset there sets it back.
//   Side column: the entries take one column and tiles next to them the other, which sticks
//   while the list scrolls (scrolling to its bottom first when it's taller than the window).
//   The entries' head (heading, search, sort and count) stays at the top too, and the day
//   headings stop under it.
//   They all filter the entries, so a pick shows its result right beside it. A tile left over
//   before the entries sits on the left; tiles after them sit on the right, and a tile left over
//   before then takes its own row: on the left with them it would read out of the person's order
//   on a phone, or out of the screen's order for Tab. A column holding the calendar gets 3 of 5,
//   else the entries do. The entries with no tile next to them take the full row.
//   Rows: the same, but the entries always take a row of their own.
//   From Cloudscape's board items, Rubrik's size tiers, Apromore's widget sizes (items have
//   sizes, a grid places them), Material 3's canonical layouts (list-detail, supporting pane),
//   PatternFly's sidebar and Zoho's list sidebar (a sticky panel beside a long list), and Rachel
//   Andrew and CSS WG issue #5675 (masonry's reading order). Not chosen: masonry (order on
//   screen stops matching Customize and Tab), a free drag-and-resize grid (an edit mode, ragged
//   results), fixed zones such as breakdowns always on the left (ignores the person's order), a
//   size per section, Half or Full (more ways to look broken; only if people ask). Later: a
//   small map in Customize of where each section lands.
// - When you spend (2026-11-20), moved here from the Categories work's d: a section of its own,
//   after the calendar, hidden until switched on in Customize, so the default screen stays as
//   approved. By amount over the 3 months up to the shown one: the weekdays as bars, and with
//   its one setting, Part of the month (on), each week of the month's share. A picked category
//   or account narrows it; picked days don't. A section added later starts as the default has
//   it, so saved layouts don't suddenly show it. The 2026-11-12 "no weekday bars on the
//   calendar" still holds: this is its own section. Feature F34.
//
// - Width (2026-11-21): Balanced by default, a column of up to 1,280 px in the middle, as on
//   Categories. "Width on computers" in Customize, for the whole page, under "Same layout on
//   phone and computer": Focused (1,024 px), Balanced or Full (the whole screen, as on Home).
//   Saved with the computers' layout; phones use the whole screen.
//
// - Entries' sort (2026-11-21): the sort menu moved to the right, on its own row under the
//   search, so it sits where By category's and By account's do.
// - Links to the Categories pages (2026-11-21): By category's heading opens Categories, as
//   "By category ›" (tried against a link at the card's end, a preview of the months, a button
//   and a text link by the heading). A picked category's "Open Groceries" opens its own page
//   (before, every one opened Groceries). Home's "Spending ›" heading opens Spending, and its
//   categories open Spending with one picked.
// - Spending's tabs (2026-11-21): "Overview | Categories" under the title, on Spending and
//   Categories, on every screen. A category's page, a level down, has its own way back instead.
//   The sidebar keeps its five places.
//
// - Settled at /prototype-finalize (2026-11-17):
//   - "Usual" stays the name for the average of up to 3 months before.
//   - A failed save in Customize keeps the change on screen, and the status line says "Couldn't
//     save. This layout shows only here until it's saved." with Try again; it retries when back
//     online. The prototype doesn't fake a failed save.
//   - Hidden sections: Customize, in the header and on each section, is enough. No line for them.
//   - Received and moved entries: an account's own screen will list and edit them, later.
//     Spending stays spent-only.
//   - Home: Received isn't a link until that account screen exists, and "See all entries" opens
//     /spending#entries, which scrolls to the list once the page has drawn. Both done.
//   - A picked account gets "Open HBL credit card" beside "See its entries", as categories do,
//     once an Account detail screen exists.
//
// Open questions: None.

import {
  emptySpendingMonths,
  firstSpendingMonth,
  heavySpendingMonths,
  SPENDING_TODAY,
  shaadiSeasonMonths,
  type SpendMonth,
  spendingMonths,
} from "@proto/fixtures/spending";
import type { Scenarios } from "@proto/kit/scenarios";
import type { SpendingLayout } from "./layout";

export interface Spending {
  /** Today. The current month counts up to this day, and so does the month it is compared with. */
  today: { month: string; day: number };
  /** Every month with data, oldest first, ending with this month. */
  months: readonly SpendMonth[];
}

/** What the screen opens narrowed to, as in the URL. */
export interface SpendingFilters {
  category?: string;
  account?: string;
  /** Picked days: "8" for one day, "3-9" for a run. */
  day?: string;
  /** Search words. */
  q?: string;
  /** The entries' order, such as "amount" or "date-reversed". Date, newest first, by default. */
  sort?: string;
  /** What the whole screen compares with: "usual", or a month's key such as "2026-03". */
  compare?: string;
  /** By category's and By account's sort, such as "change", "name" or "entries-reversed". */
  "category-order"?: string;
  "account-order"?: string;
}

/** The View's props. Loading and error are states the View shows, so they are props too. */
export type SpendingViewProps =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      spending: Spending;
      /** Filters the screen opens with while the URL has none. */
      start?: SpendingFilters;
      /** The layout saved to the account. Missing means the default. */
      layout?: SpendingLayout;
    };

const today = { ...SPENDING_TODAY };

export const scenarios = {
  default: { status: "ready", spending: { today, months: spendingMonths() } },
  empty: {
    status: "ready",
    spending: { today, months: emptySpendingMonths() },
  },
  "no-results": {
    status: "ready",
    spending: { today, months: spendingMonths() },
    start: { category: "Groceries", q: "Daraz" },
  },
  "first-month": {
    status: "ready",
    spending: { today, months: firstSpendingMonth() },
  },
  overspent: {
    status: "ready",
    spending: { today, months: shaadiSeasonMonths() },
  },
  many: { status: "ready", spending: { today, months: heavySpendingMonths() } },
  // Every section shown, the pace chart and When you spend too.
  "all-sections": {
    status: "ready",
    spending: { today, months: spendingMonths() },
    layout: {
      order: [
        "pace",
        "categories",
        "accounts",
        "calendar",
        "habits",
        "entries",
      ],
      hidden: [],
    },
  },
  // Someone who customized: the pace chart first, with every extra on; the calendar hidden;
  // entries before categories; By category without its shares or sorting; and By account with
  // its biggest changes tagged.
  customized: {
    status: "ready",
    spending: { today, months: spendingMonths() },
    layout: {
      order: ["pace", "entries", "categories", "calendar"],
      hidden: ["calendar"],
      settings: {
        pace: { dailyBars: true, dailyAverage: true, usualRange: true },
        categories: { share: false, sorting: false },
        accounts: { movers: true },
      },
    },
  },
  // Every section shown and every setting on, the extras too.
  "every-option": {
    status: "ready",
    spending: { today, months: spendingMonths() },
    layout: {
      order: ["pace", "categories", "accounts", "calendar", "entries"],
      hidden: [],
      settings: {
        pace: { dailyBars: true, dailyAverage: true, usualRange: true },
        accounts: { movers: true },
        calendar: { noSpend: true, weekTotals: true },
        entries: { runningTotal: true, compact: true },
      },
    },
  },
  // By category and By account as donut charts, with every section shown.
  charts: {
    status: "ready",
    spending: { today, months: spendingMonths() },
    layout: {
      order: ["pace", "categories", "accounts", "calendar", "entries"],
      hidden: [],
      settings: { categories: { chart: true }, accounts: { chart: true } },
    },
  },
  // Both donut charts with their extras: By category with amounts and change on the labels, By
  // account split by entries, with change, without the summary line.
  "charts-every-option": {
    status: "ready",
    spending: { today, months: spendingMonths() },
    layout: {
      order: ["pace", "categories", "accounts", "calendar", "entries"],
      hidden: [],
      settings: {
        categories: { chart: true, amounts: true, change: true },
        accounts: {
          chart: true,
          byEntries: true,
          change: true,
          summary: false,
        },
      },
    },
  },
  // Phones with a layout of their own: By category as a donut chart, then compact entries, with
  // the pace chart, By account and the calendar hidden. Tablets and computers show everything, as
  // lists.
  "phone-layout": {
    status: "ready",
    spending: { today, months: spendingMonths() },
    layout: {
      order: ["pace", "categories", "accounts", "calendar", "entries"],
      hidden: [],
      phone: {
        order: ["categories", "entries", "pace", "accounts", "calendar"],
        hidden: ["pace", "accounts", "calendar"],
        settings: {
          categories: { chart: true },
          entries: { compact: true },
        },
      },
    },
  },
  // A tile with nothing to pair with before the pace chart: By category on its own row, then the
  // chart, then By account beside the entries. The calendar is hidden.
  "lone-tile": {
    status: "ready",
    spending: { today, months: spendingMonths() },
    layout: {
      order: ["categories", "pace", "accounts", "entries", "calendar"],
      hidden: ["calendar"],
    },
  },
  // Only the entries, which can't be hidden.
  "entries-only": {
    status: "ready",
    spending: { today, months: spendingMonths() },
    layout: {
      order: ["pace", "categories", "accounts", "calendar", "entries"],
      hidden: ["pace", "categories", "accounts", "calendar"],
    },
  },
  // Three days picked: a short list beside the calendar.
  "day-picked": {
    status: "ready",
    spending: { today, months: spendingMonths() },
    start: { day: "8-10" },
  },
  // Rows and Full width picked in Customize: the entries on a row of their own, edge to edge.
  rows: {
    status: "ready",
    spending: { today, months: spendingMonths() },
    layout: {
      order: ["pace", "categories", "accounts", "calendar", "entries"],
      hidden: ["pace"],
      arrangement: "rows",
      width: "full",
    },
  },
  // By category as a donut chart beside By account as a list.
  "mixed-charts": {
    status: "ready",
    spending: { today, months: spendingMonths() },
    layout: {
      order: ["pace", "categories", "accounts", "calendar", "entries"],
      hidden: ["pace"],
      settings: { categories: { chart: true } },
    },
  },
  loading: { status: "loading" },
  error: {
    status: "error",
    message:
      "Your data is safe. Check your connection and try again in a moment.",
  },
} satisfies Scenarios<SpendingViewProps>;
