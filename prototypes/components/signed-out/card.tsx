"use client";

import { Lock } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HEADING } from "@proto/components/blocks";
import { ScreenLink } from "@proto/components/screen-link";
import { HEADER_LINK, SignedOutFrame } from "./frame";

// "Quiet card": the layout Sign in, Forgot password and Reset password share. Green is only on
// the main button, so nothing competes with the form.

/** A card's heading. It takes focus when the screen's step changes. */
export const CARD_HEADING = cn(HEADING, "outline-none");

/** A link inside text: in the text's colour by day, and the theme's pale accent at night. */
export const TEXT_LINK =
  "font-semibold underline underline-offset-4 dark:text-accent-foreground";

/** A link inside small grey helper text: ink by day, the pale accent at night. */
export const HELP_LINK = cn(TEXT_LINK, "text-foreground");

/** The card's foot: a hairline, then one line of small helper text. */
export const CARD_FOOT = "border-t pt-6 text-sm text-muted-foreground";

/** The links under the card. The pages aren't written yet, so they are stand-ins. */
const FOOTER_LINKS = ["Terms", "Privacy policy", "Help"] as const;

interface SignedOutCardProps {
  /**
   * Where the header's one link goes. Sign in links to Sign up for people without an account.
   * Forgot and Reset password link back to Sign in.
   */
  way: "sign-up" | "sign-in";
  /** The screen's heading and form. */
  children: ReactNode;
}

/**
 * The form on one card, centred on the plain page from tablet width. On phones the page is the
 * card. Under it, a line on privacy and the footer links.
 */
export function SignedOutCard({ way, children }: SignedOutCardProps) {
  const toSignUp = way === "sign-up";
  return (
    <SignedOutFrame
      prompt={toSignUp ? "New here?" : "Remembered it?"}
      link={
        <ScreenLink
          screen={toSignUp ? "Sign up" : "Sign in"}
          className={HEADER_LINK}
        >
          {toSignUp ? "Create account" : "Sign in"}
        </ScreenLink>
      }
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 sm:flex-1 sm:justify-center sm:py-6">
        <section className="flex flex-col gap-6 px-1 pt-4 sm:rounded-(--block-radius) sm:border sm:bg-card sm:p-10 sm:text-card-foreground sm:shadow-sm">
          {children}
        </section>
        <div className="flex flex-col items-center gap-3 px-1 text-center text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Lock aria-hidden="true" className="size-4 shrink-0" />
            Only you can see what you own and owe.
          </p>
          <p className="flex flex-wrap justify-center gap-x-2">
            {FOOTER_LINKS.map((screen, index) => (
              <Fragment key={screen}>
                {index > 0 && <span aria-hidden="true">·</span>}
                <ScreenLink
                  screen={screen}
                  className="underline-offset-4 hover:underline"
                >
                  {screen}
                </ScreenLink>
              </Fragment>
            ))}
          </p>
        </div>
      </div>
    </SignedOutFrame>
  );
}
