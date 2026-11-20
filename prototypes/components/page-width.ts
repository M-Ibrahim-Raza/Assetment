import {
  FoldHorizontal,
  GalleryHorizontal,
  UnfoldHorizontal,
} from "lucide-react";
import type { CustomizeChoice, ScreenKind } from "./customize-sheet";

// A page's width on tablets and computers: "Width on computers" in its Customize, for the whole
// page, the same on every page that offers it. Each page picks its own default. Phones always use
// the whole screen.

/**
 * Full: the whole screen, as on Home. Balanced: a column up to 1,280 px, in the middle. Focused:
 * one up to 1,024 px.
 */
export type PageWidth = "full" | "balanced" | "focused";

/** The widths in Customize, narrowest first so Full sits at the right. */
const WIDTHS: readonly PageWidth[] = ["focused", "balanced", "full"];

const WIDTH_NAMES: Readonly<Record<PageWidth, string>> = {
  focused: "Focused",
  balanced: "Balanced",
  full: "Full",
};

const WIDTH_ABOUT: Readonly<Record<PageWidth, string>> = {
  full: "The blocks use the whole screen.",
  balanced:
    "The blocks sit in a column in the middle, with space on each side.",
  focused: "A narrower column in the middle, so your eyes travel less.",
};

/** The widths' icons, for a Customize model's `wayIcons`. */
export const WIDTH_ICONS = {
  Full: UnfoldHorizontal,
  Balanced: GalleryHorizontal,
  Focused: FoldHorizontal,
};

/** The page's width as a choice in Customize. `fallback` is the page's default. */
export function widthChoice<Screen extends { width?: PageWidth }>(
  layout: Screen,
  fallback: PageWidth,
): CustomizeChoice<Screen> {
  const width = layout.width ?? fallback;
  return {
    name: "Width on computers",
    about: WIDTH_ABOUT[width],
    ways: WIDTHS.map((way) => WIDTH_NAMES[way]),
    picked: WIDTHS.indexOf(width),
    chosen: (index) => ({ ...layout, width: WIDTHS[index] ?? fallback }),
    said: (index) => WIDTH_NAMES[WIDTHS[index] ?? fallback],
  };
}

/** How the app shell takes each width: the whole screen, 1,280 px or 1,024 px. */
const SHELL_WIDTH: Readonly<Record<PageWidth, boolean | "medium">> = {
  full: true,
  balanced: "medium",
  focused: false,
};

/** The shell's `wide` for a page's width. Phones always use the whole screen. */
export function shellWidth(
  width: PageWidth,
  screen: ScreenKind,
): boolean | "medium" {
  return screen === "phone" ? true : SHELL_WIDTH[width];
}
