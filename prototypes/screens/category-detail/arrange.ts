import type { DetailSectionKey } from "./layout";

/** One row of cards on a computer. Phones and narrow windows show the same rows, stacked. */
export type DetailRow =
  /** A card on its own, or the entries with no card beside them. */
  | { kind: "full"; key: DetailSectionKey }
  /** Two cards, half each, at one height. */
  | { kind: "pair"; keys: readonly [DetailSectionKey, DetailSectionKey] }
  /** The entries, beside a column of cards that stays in view while the list scrolls. */
  | { kind: "list"; side: readonly DetailSectionKey[]; at: "left" | "right" };

/**
 * The shown cards, in the person's order, as rows: left to right, top to bottom, two to a row,
 * as on Spending. With `sideColumn`, the entries take one column and cards next to them the
 * other. The entries run across months, so they're long: every card on their side of the order
 * joins the column, where Spending's takes one. Cards after the entries sit on the right, and
 * the ones before them then pair up above; with none after, the ones before sit on the left.
 * Each row is a run of the person's order, so a phone, and Tab, read in that order.
 */
export function arrange(
  shown: readonly DetailSectionKey[],
  { sideColumn }: { sideColumn: boolean },
): DetailRow[] {
  const at = shown.indexOf("entries");
  if (at === -1) return pairUp(shown);
  const before = shown.slice(0, at);
  const after = shown.slice(at + 1);
  if (!sideColumn) {
    return [
      ...pairUp(before),
      { kind: "full", key: "entries" },
      ...pairUp(after),
    ];
  }
  if (after.length > 0) {
    return [...pairUp(before), { kind: "list", side: after, at: "right" }];
  }
  return before.length > 0
    ? [{ kind: "list", side: before, at: "left" }]
    : [{ kind: "full", key: "entries" }];
}

/** Cards two to a row, and one left over on a row of its own. */
function pairUp(cards: readonly DetailSectionKey[]): DetailRow[] {
  const rows: DetailRow[] = [];
  for (let index = 0; index < cards.length; index += 2) {
    const first = cards[index];
    const second = cards[index + 1];
    if (first === undefined) break;
    rows.push(
      second === undefined
        ? { kind: "full", key: first }
        : { kind: "pair", keys: [first, second] },
    );
  }
  return rows;
}
