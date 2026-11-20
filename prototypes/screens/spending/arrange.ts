import type { SectionKey } from "./layout";

/**
 * How a section sits on a computer. Wide: the pace chart, on a row of its own. Tile: By category,
 * By account, the calendar and When you spend, two to a row. List: the entries, which grow with
 * the data.
 */
export type Shape = "wide" | "tile" | "list";

export function shapeOf(key: SectionKey): Shape {
  if (key === "pace") return "wide";
  if (key === "entries") return "list";
  return "tile";
}

/** One row of sections on a computer. Phones and narrow windows show the same rows, stacked. */
export type Row =
  | { kind: "wide"; key: SectionKey }
  /** A section on its own: a tile with nothing beside it, or the entries. */
  | { kind: "full"; key: SectionKey }
  /** Two tiles. The wider one, the calendar, gets 3 of 5; two breakdowns get half each. */
  | {
      kind: "pair";
      keys: readonly [SectionKey, SectionKey];
      wider: 0 | 1 | null;
    }
  /** The entries, beside a column of tiles that stays in view while the list scrolls. */
  | {
      kind: "list";
      key: SectionKey;
      side: readonly SectionKey[];
      at: "left" | "right";
      /** The side column gets 3 of 5 when it holds the calendar, else the entries do. */
      wider: "side" | "entries";
    };

/**
 * The shown sections, in the person's order, as rows: left to right, top to bottom, two to a row.
 * A wide section takes its own row. With `sideColumn`, the entries take one column and tiles next
 * to them the other. Each row is a run of the person's order, so the rows stacked on a phone, and
 * Tab, read in that order.
 */
export function arrange(
  shown: readonly SectionKey[],
  options: { sideColumn: boolean },
): Row[] {
  const rows: Row[] = [];
  let run: SectionKey[] = [];
  for (const key of shown) {
    if (shapeOf(key) === "wide") {
      rows.push(...arrangeRun(run, options), { kind: "wide", key });
      run = [];
    } else {
      run.push(key);
    }
  }
  rows.push(...arrangeRun(run, options));
  return rows;
}

/** A run between wide sections: tiles, and the entries if they're in it. */
function arrangeRun(
  run: readonly SectionKey[],
  { sideColumn }: { sideColumn: boolean },
): Row[] {
  const at = run.findIndex((key) => shapeOf(key) === "list");
  const list = run[at];
  if (list === undefined) return pairUp(run);
  const before = run.slice(0, at);
  const after = run.slice(at + 1);
  if (!sideColumn) {
    return [...pairUp(before), { kind: "full", key: list }, ...pairUp(after)];
  }
  // Tiles after the entries make the side column, on the right. A tile left over before them
  // then takes its own row: in the side column too, it would read out of the person's order.
  if (after.length > 0) {
    return [...pairUp(before), sideRow(list, after, "right")];
  }
  const lone = before.length % 2 === 1 ? before.at(-1) : undefined;
  if (lone !== undefined) {
    return [...pairUp(before.slice(0, -1)), sideRow(list, [lone], "left")];
  }
  return [...pairUp(before), { kind: "full", key: list }];
}

/** Tiles two to a row, and one left over on a row of its own. */
function pairUp(tiles: readonly SectionKey[]): Row[] {
  const rows: Row[] = [];
  for (let index = 0; index < tiles.length; index += 2) {
    const first = tiles[index];
    const second = tiles[index + 1];
    if (first === undefined) break;
    rows.push(
      second === undefined
        ? { kind: "full", key: first }
        : {
            kind: "pair",
            keys: [first, second],
            wider: first === "calendar" ? 0 : second === "calendar" ? 1 : null,
          },
    );
  }
  return rows;
}

function sideRow(
  key: SectionKey,
  side: readonly SectionKey[],
  at: "left" | "right",
): Row {
  return {
    kind: "list",
    key,
    side,
    at,
    wider: side.includes("calendar") ? "side" : "entries",
  };
}
