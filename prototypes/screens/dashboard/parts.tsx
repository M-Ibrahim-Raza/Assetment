import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ShellActions } from "@proto/components/app-shell";
import { BLOCK, PAD } from "@proto/components/blocks";
import { DISPLAY } from "@proto/components/display";

// The look's shared parts live in components/blocks.ts, so other screens use them too.
export { BLOCK, EYEBROW, HEADING, INK, PAD } from "@proto/components/blocks";
export { DISPLAY };

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
          {/* The sidebar shows the logo from tablet width up. */}
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
