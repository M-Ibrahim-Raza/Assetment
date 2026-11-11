import { cn } from "@/lib/utils";
import { BLOCK, PAD } from "@proto/components/blocks";

// Sizes the wizard's controls share. They are bigger than the app's defaults, because setup is
// mostly done with a thumb. Production gets a proper large Button size for them (F07).

/** The white card a step sits on. */
export const STEP_CARD = cn(
  "flex flex-col gap-6 bg-card py-8 text-card-foreground",
  BLOCK,
  PAD,
);

/**
 * A main button: 48 px tall, so it's easy to hit on a phone. Button trims the padding on an icon's
 * side to 8 px, which looks lopsided at this size, so the icon side keeps 16 px.
 */
export const BIG =
  "h-12 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4";

/** The bottom of a step card: a hairline, then the button that leaves the step. */
export const STEP_FOOTER = "flex flex-wrap gap-2 border-t pt-6";

/** A text field as tall as the main button. `md:` repeats the size, or Input shrinks the text there. */
export const TALL_FIELD = "h-12 text-base md:text-base";

/** A choice shown as a pill, such as a bank's name. The picked one turns ink, as in the profile panel. */
export const CHIP =
  "h-10 px-4 aria-pressed:bg-foreground aria-pressed:text-background";

/** Small helper text. On a colour or ink field, grey would be too faint, so it takes the field's own text colour. */
export const helpText = (onField: boolean): string =>
  onField ? "text-current opacity-80" : "text-muted-foreground";

/**
 * For an outline button on a colour or ink field. The outline button is a light pill that takes
 * its text colour from around it, which on those fields is white.
 */
export const PILL_TEXT = "text-foreground";

/** A row's hairline, in the text colour of whatever field it sits on. */
export const HAIRLINE = "border-t border-current/15 first:border-t-0";
