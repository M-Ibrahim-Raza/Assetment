import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ShellActions } from "@proto/components/app-shell";
import { DISPLAY } from "@proto/components/display";

export { DISPLAY };

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

/**
 * The primary-colour field at the top of the screen. It carries the wordmark and the shell's
 * actions, because this layout has no header row. It is a size container, so the headline can
 * scale with it.
 */
export function HeroBlock({ children }: { children: ReactNode }) {
  return (
    // Focus rings in here are drawn in the text colour: the usual ring colour is the field's own.
    // Secondary buttons take the hero's own button colours, which stay light at night.
    <section
      className={cn(
        "@container bg-primary text-primary-foreground [--ring:var(--primary-foreground)] [--secondary-foreground:var(--hero-action-foreground)] [--secondary:var(--hero-action)]",
        BLOCK,
      )}
    >
      <div
        className={cn("flex flex-col gap-6 pt-4 pb-8 md:pt-6 md:pb-10", PAD)}
      >
        <div className="flex items-center justify-between gap-3 md:justify-end">
          {/* The sidebar shows the name from tablet width up. */}
          <p
            className={cn(
              DISPLAY,
              "text-xl font-extrabold tracking-tight md:hidden",
            )}
          >
            Assetment
          </p>
          <ShellActions />
        </div>
        {children}
      </div>
    </section>
  );
}
