// Checks every colour theme in app/theme.css, in light and dark, against WCAG 2.2 AA: 4.5:1 for
// text, 3:1 for focus rings, chart marks and controls. A new theme is held to Green's bar: where
// Green misses a pair too, the miss is listed for the user to judge instead of failing. It also
// checks that each theme sets every colour token, and lists colours outside sRGB. Exits with 1 if
// a check fails. From the repo root:
//   node prototypes/kit/contrast.mts
// PAIRS are the colour pairs the screens use. When a screen puts text or a mark on a new colour,
// add its pair.
import { readFile } from "node:fs/promises";

const THEME_CSS = new URL("../app/theme.css", import.meta.url);
const DEFAULT_PALETTE = "green";
/** Colours that mean the same in every theme. Only Green's blocks set them. */
const FIXED = new Set(["destructive", "gain", "loss"]);
const MODES = ["light", "dark"] as const;
type Mode = (typeof MODES)[number];
/** Browsers clip a colour this close to the sRGB edge with no visible change. */
const GAMUT_SLACK = 0.001;

/** Gamma-encoded sRGB from 0 to 1, as the browser paints it. */
type Rgb = readonly [number, number, number];

interface Colour {
  rgb: Rgb;
  alpha: number;
  inGamut: boolean;
}

interface Pair {
  /** Token names without the leading `--`. */
  fg: string;
  bg: string;
  /** The foreground's opacity, as in `text-primary-foreground/80`. */
  opacity?: number;
  /** 4.5 for text, 3 for focus rings, chart marks and controls. */
  min: 4.5 | 3;
  where: string;
}

const PAIRS: readonly Pair[] = [
  { fg: "foreground", bg: "background", min: 4.5, where: "page text" },
  { fg: "card-foreground", bg: "card", min: 4.5, where: "text on blocks" },
  { fg: "popover-foreground", bg: "popover", min: 4.5, where: "menus" },
  { fg: "muted-foreground", bg: "background", min: 4.5, where: "helper text" },
  { fg: "muted-foreground", bg: "card", min: 4.5, where: "helper text" },
  { fg: "muted-foreground", bg: "muted", min: 4.5, where: "helper text" },
  { fg: "primary-foreground", bg: "primary", min: 4.5, where: "hero text" },
  {
    fg: "primary-foreground",
    bg: "primary",
    opacity: 0.8,
    min: 4.5,
    where: "hero's lakh note and price date",
  },
  {
    fg: "primary-foreground",
    bg: "primary",
    opacity: 0.7,
    min: 3,
    where: "hero's sparkline",
  },
  {
    fg: "secondary-foreground",
    bg: "secondary",
    min: 4.5,
    where: "month block",
  },
  { fg: "accent-foreground", bg: "accent", min: 4.5, where: "accent text" },
  {
    fg: "accent-foreground",
    bg: "card",
    min: 4.5,
    where: "links at night, and accent text",
  },
  { fg: "ink-foreground", bg: "ink", min: 4.5, where: "Debts tile" },
  {
    fg: "ink-foreground",
    bg: "ink",
    opacity: 0.8,
    min: 4.5,
    where: "Debts tile labels",
  },
  {
    fg: "hero-action-foreground",
    bg: "hero-action",
    min: 4.5,
    where: "hero's button",
  },
  {
    fg: "hero-action",
    bg: "primary",
    min: 3,
    where: "hero's button on the hero",
  },
  { fg: "sidebar-foreground", bg: "sidebar", min: 4.5, where: "sidebar" },
  {
    fg: "sidebar-foreground",
    bg: "sidebar",
    opacity: 0.7,
    min: 4.5,
    where: "rail names",
  },
  {
    fg: "sidebar-accent-foreground",
    bg: "sidebar-accent",
    min: 4.5,
    where: "current place in the sidebar",
  },
  {
    fg: "sidebar-primary-foreground",
    bg: "sidebar-primary",
    min: 4.5,
    where: "Add in the sidebar",
  },
  { fg: "sidebar-ring", bg: "sidebar", min: 3, where: "sidebar focus ring" },
  { fg: "primary", bg: "card", min: 4.5, where: "primary text on blocks" },
  {
    fg: "primary",
    bg: "background",
    min: 4.5,
    where: "primary text on page, and the hero against it",
  },
  { fg: "ring", bg: "background", min: 3, where: "focus ring" },
  { fg: "ring", bg: "card", min: 3, where: "focus ring" },
  { fg: "chart-1", bg: "card", min: 3, where: "charts" },
  { fg: "gain", bg: "card", min: 4.5, where: "gains" },
  { fg: "gain", bg: "background", min: 4.5, where: "gains" },
  { fg: "loss", bg: "card", min: 4.5, where: "losses" },
  { fg: "loss", bg: "background", min: 4.5, where: "losses" },
  { fg: "destructive", bg: "card", min: 4.5, where: "errors" },
  { fg: "destructive", bg: "background", min: 4.5, where: "errors" },
  {
    fg: "primary",
    bg: "primary-foreground",
    min: 3,
    where: "Setup's tick on a picked tile",
  },
  { fg: "input", bg: "card", min: 3, where: "field borders" },
  { fg: "chart-3", bg: "card", min: 3, where: "charts" },
];

// --- Colour maths ---------------------------------------------------------------------------

const encode = (linear: number) =>
  linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;

const decode = (encoded: number) =>
  encoded <= 0.04045 ? encoded / 12.92 : ((encoded + 0.055) / 1.055) ** 2.4;

const clip = (value: number) => Math.min(1, Math.max(0, value));

/** OKLCH → OKLab → linear sRGB (Björn Ottosson's matrices), then clipped and encoded. */
function fromOklch(l: number, c: number, h: number, alpha: number): Colour {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const lms = [
    (l + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    (l - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    (l - 0.0894841775 * a - 1.291485548 * b) ** 3,
  ] as const;
  const linear = [
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
  ] as const;
  return {
    rgb: [
      encode(clip(linear[0])),
      encode(clip(linear[1])),
      encode(clip(linear[2])),
    ],
    alpha,
    inGamut: linear.every(
      (channel) => channel >= -GAMUT_SLACK && channel <= 1 + GAMUT_SLACK,
    ),
  };
}

const OKLCH =
  /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?)\s*)?\)$/;

/** A theme value such as `oklch(0.43 0.1 158)` or `oklch(1 0 0 / 10%)`. Undefined if it isn't a colour. */
function parseColour(value: string): Colour | undefined {
  const match = OKLCH.exec(value.trim());
  if (!match) return undefined;
  const [, l = "", lPercent, c = "", h = "", alpha, alphaPercent] = match;
  return fromOklch(
    Number(l) / (lPercent === "%" ? 100 : 1),
    Number(c),
    Number(h),
    alpha === undefined ? 1 : Number(alpha) / (alphaPercent === "%" ? 100 : 1),
  );
}

/** Paints `top` over an opaque `under`, the way the browser blends encoded sRGB. */
function over(top: Colour, under: Rgb, opacity = 1): Rgb {
  const alpha = top.alpha * opacity;
  return [
    top.rgb[0] * alpha + under[0] * (1 - alpha),
    top.rgb[1] * alpha + under[1] * (1 - alpha),
    top.rgb[2] * alpha + under[2] * (1 - alpha),
  ];
}

const luminance = ([r, g, b]: Rgb) =>
  0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b);

/** The WCAG 2 contrast ratio, unrounded: 4.499 is not 4.5. */
function contrast(one: Rgb, two: Rgb): number {
  const [light, dark] = [luminance(one), luminance(two)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

function selfTest() {
  const near = (actual: number, expected: number, label: string) => {
    if (Math.abs(actual - expected) > 0.01) {
      throw new Error(
        `Self-test failed: ${label} is ${actual.toFixed(3)}, not ${String(expected)}`,
      );
    }
  };
  const white: Rgb = [1, 1, 1];
  const grey = 0x76 / 255;
  near(contrast(white, [0, 0, 0]), 21, "white on black");
  near(contrast([grey, grey, grey], white), 4.54, "#767676 on white");
  near(
    contrast(parseColour("oklch(1 0 0)")?.rgb ?? [0, 0, 0], white),
    1,
    "oklch white",
  );
}

// --- Reading theme.css ----------------------------------------------------------------------

/** Each theme's colour tokens, by mode. */
type Themes = Map<string, Record<Mode, Map<string, Colour>>>;

/** The theme and mode a selector sets: `:root`, `.dark`, `[data-palette="x"]` or `.dark[data-palette="x"]`. */
function themeOf(part: string): { palette: string; mode: Mode } {
  if (part === ":root") return { palette: DEFAULT_PALETTE, mode: "light" };
  if (part === ".dark") return { palette: DEFAULT_PALETTE, mode: "dark" };
  // `.dark[data-palette]` sets <html>, and `.dark [data-palette]` sets a swatch inside it.
  const match = /^(\.dark\s*)?\[data-palette="([a-z]+)"\]$/.exec(part);
  if (match?.[2] === undefined) {
    throw new Error(`theme.css: unknown selector "${part}"`);
  }
  return {
    palette: match[2],
    mode: match[1] === undefined ? "light" : "dark",
  };
}

function readThemes(css: string): Themes {
  const themes: Themes = new Map();
  const blocks = css
    .replaceAll(/\/\*[\s\S]*?\*\//g, "")
    .matchAll(/([^{}]+)\{([^{}]*)\}/g);
  for (const [, selector = "", body = ""] of blocks) {
    const parts = selector.split(",").map((part) => themeOf(part.trim()));
    const [first] = parts;
    if (
      first === undefined ||
      parts.some(
        ({ palette, mode }) => palette !== first.palette || mode !== first.mode,
      )
    ) {
      throw new Error(`theme.css: "${selector.trim()}" mixes themes or modes`);
    }
    const theme = themes.get(first.palette) ?? {
      light: new Map(),
      dark: new Map(),
    };
    themes.set(first.palette, theme);
    for (const [, name = "", value = ""] of body.matchAll(
      /--([\w-]+)\s*:\s*([^;]+);/g,
    )) {
      const colour = parseColour(value);
      if (colour) theme[first.mode].set(name, colour);
    }
  }
  return themes;
}

// --- Checks ---------------------------------------------------------------------------------

selfTest();
const themes = readThemes(await readFile(THEME_CSS, "utf8"));
const green = themes.get(DEFAULT_PALETTE);
if (green === undefined) throw new Error("theme.css: no Green (:root) block");

const failures: string[] = [];
/** Misses Green shares, by pair and mode, with each theme's ratio. */
const reported = new Map<string, string[]>();
const outOfGamut: string[] = [];

// Every theme sets the same colours as Green, minus the fixed ones, in both modes. A colour set by
// day but not at night would show its day value in the dark.
const required = [...green.light.keys()];
for (const [palette, theme] of themes) {
  for (const mode of MODES) {
    const set = theme[mode];
    for (const name of required) {
      const expected = palette === DEFAULT_PALETTE || !FIXED.has(name);
      if (expected && !set.has(name)) {
        failures.push(`${palette} ${mode}: doesn't set --${name}`);
      }
      if (!expected && set.has(name)) {
        failures.push(
          `${palette} ${mode}: sets --${name}, which stays the same in every theme`,
        );
      }
    }
    for (const [name, colour] of set) {
      if (!colour.inGamut) outOfGamut.push(`${palette} ${mode}: --${name}`);
    }
  }
}

/** A theme's colour, falling back to Green's for the fixed ones. */
function token(palette: string, mode: Mode, name: string): Colour {
  const colour =
    themes.get(palette)?.[mode].get(name) ?? green?.[mode].get(name);
  if (colour === undefined)
    throw new Error(`No --${name} in ${palette} ${mode}`);
  return colour;
}

/** The pair's ratio in one theme and mode, with alpha colours painted over what they sit on. */
function ratioOf(pair: Pair, palette: string, mode: Mode): number {
  const page = token(palette, mode, "background").rgb;
  const bg = over(token(palette, mode, pair.bg), page);
  const fg = over(token(palette, mode, pair.fg), bg, pair.opacity);
  return contrast(fg, bg);
}

const names = [...themes.keys()];
const LABEL_WIDTH = 46;
const CELL_WIDTH = 9;

for (const mode of MODES) {
  console.log(
    `\n${mode.toUpperCase().padEnd(LABEL_WIDTH)}${"needs".padStart(CELL_WIDTH)}${names.map((name) => name.padStart(CELL_WIDTH)).join("")}`,
  );
  for (const pair of PAIRS) {
    const label = `${pair.fg}${pair.opacity === undefined ? "" : `/${String(pair.opacity * 100)}`} on ${pair.bg}`;
    const greenMisses = ratioOf(pair, DEFAULT_PALETTE, mode) < pair.min;
    const cells = names.map((palette) => {
      const ratio = ratioOf(pair, palette, mode);
      let mark = " ";
      if (ratio < pair.min) {
        if (greenMisses) {
          const key = `${mode}: ${label}, needs ${String(pair.min)}:1 (${pair.where})`;
          reported.set(key, [
            ...(reported.get(key) ?? []),
            `${palette} ${ratio.toFixed(2)}`,
          ]);
          mark = "·";
        } else {
          failures.push(
            `${palette} ${mode}: ${label} is ${ratio.toFixed(2)}:1, needs ${String(pair.min)}:1 (${pair.where})`,
          );
          mark = "✗";
        }
      }
      return `${ratio.toFixed(2)}${mark}`.padStart(CELL_WIDTH);
    });
    console.log(
      `${label.padEnd(LABEL_WIDTH)}${String(pair.min).padStart(CELL_WIDTH - 1)} ${cells.join("")}`,
    );
  }
}

console.log(
  "\n✗ fails   · misses, but Green misses it too, so it's listed for you to judge",
);
for (const [title, lines] of [
  [
    "Listed, not failing",
    [...reported].map(([key, ratios]) => `${key}\n    ${ratios.join(", ")}`),
  ],
  [
    "Outside sRGB (browsers clip these; the ratios above use the clipped colour)",
    outOfGamut,
  ],
  ["Failures", failures],
] as const) {
  if (lines.length > 0) console.log(`\n${title}:\n  ${lines.join("\n  ")}`);
}

if (failures.length > 0) process.exit(1);
console.log(`\nAll ${String(names.length)} themes pass.`);
