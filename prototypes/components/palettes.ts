/**
 * The colour themes (F22), in the order the profile panel shows them. Green is the default. Each
 * has a day block and a night block in app/theme.css, checked by `node prototypes/kit/contrast.mts`.
 */
export const PALETTES = [
  { value: "green", label: "Green" },
  { value: "ocean", label: "Ocean" },
  { value: "indigo", label: "Indigo" },
  { value: "plum", label: "Plum" },
  { value: "rose", label: "Rose" },
  { value: "clay", label: "Clay" },
  { value: "slate", label: "Slate" },
] as const;

export type Palette = (typeof PALETTES)[number]["value"];

export const DEFAULT_PALETTE: Palette = "green";

/** Where the browser keeps the choice. The same naming as the theme's `assetment:theme`. */
export const PALETTE_KEY = "assetment:palette";

export function isPalette(value: unknown): value is Palette {
  return PALETTES.some((palette) => palette.value === value);
}
