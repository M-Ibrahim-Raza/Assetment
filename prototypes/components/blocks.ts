import { cn } from "@/lib/utils";
import { DISPLAY } from "./display";

// The parts of the "Rounded blocks" look that every screen shares. Colours come from app/theme.css.

/** The small capital label above a block's content. */
export const EYEBROW =
  "text-sm leading-4 font-semibold tracking-widest uppercase";

/** A block's heading: short, heavy and tight. */
export const HEADING = cn(
  DISPLAY,
  "text-3xl leading-none font-extrabold tracking-tight",
);

/** Side padding shared by every block, so their content lines up down the page. */
export const PAD = "px-4 md:px-10";

/** Every block's corners, from theme.css. Blocks sit `gap-3` apart, so each section reads as its own. */
export const BLOCK = "rounded-(--block-radius)";

/** An ink field and its text, from theme.css: the Debts tile and the net worth bar. */
export const INK = "bg-(--ink) text-(--ink-foreground)";
