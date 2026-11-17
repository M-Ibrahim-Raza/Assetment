"use client";

import { cn } from "@/lib/utils";
import { BLOCK, EYEBROW, PAD } from "@proto/components/blocks";
import { DISPLAY } from "@proto/components/display";
import { ScreenLink } from "@proto/components/screen-link";
import {
  CARD,
  CARD_FOOT,
  CARD_HEADING,
  FooterLinks,
  HELP_LINK,
} from "@proto/components/signed-out/card";
import {
  HEADER_LINK,
  SignedOutFrame,
} from "@proto/components/signed-out/frame";
import { ON_GREEN } from "@proto/screens/setup/setup-frame";
import { useStepHeading } from "@proto/screens/setup/use-setup";
import { FullForm } from "./fields";
import { TrustLines } from "./frame";
import { ExpiredNote, SentNote } from "./notes";
import type { SignUpViewProps } from "./scenarios";
import { greet, useSignUp } from "./use-sign-up";

/**
 * The promise beside the form. A green block says what Assetment does, in the biggest type on the
 * page, with why it's safe. The form sits beside it on Sign in's card, from desktop width. On
 * phones the block is a short band on top, and the trust lines come after the card.
 */
export function SignUpView(props: SignUpViewProps) {
  const flow = useSignUp(props);
  const heading = useStepHeading(flow.phase);
  const sent = flow.phase === "sent";

  return (
    <SignedOutFrame
      prompt="Have an account?"
      link={
        <ScreenLink screen="Sign in" className={HEADER_LINK}>
          Sign in
        </ScreenLink>
      }
    >
      <div className="mx-auto grid w-full max-w-6xl gap-3 lg:flex-1 lg:grid-cols-2">
        <section
          className={cn(
            "flex flex-col justify-between gap-10 py-6 sm:py-10 lg:py-14",
            ON_GREEN,
            BLOCK,
            PAD,
          )}
        >
          <div className="flex flex-col gap-4">
            <p className={EYEBROW}>{sent ? "Account made" : "Assetment"}</p>
            <h1
              className={cn(
                DISPLAY,
                "text-4xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl xl:text-7xl",
              )}
            >
              {sent
                ? `Welcome${greet(flow.draft.name)}.`
                : "Your net worth, in one number."}
            </h1>
            <p className="max-w-md text-lg max-sm:hidden">
              {sent
                ? "Your account is ready. Next, note down what you own and owe."
                : "Banks, wallets, gold, stocks, plots and debts. All added up and always up to date."}
            </p>
          </div>
          <TrustLines className="text-lg max-lg:hidden" />
        </section>

        {/* Under desktop width the green block spans the page, so the card sits in a centred column under it. */}
        <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-6 py-6 lg:py-14">
          <section className={CARD}>
            {flow.phase === "form" && (
              <>
                <div className="flex flex-col gap-2">
                  <h2 ref={heading} tabIndex={-1} className={CARD_HEADING}>
                    Create your account
                  </h2>
                  <p>Takes about 5 minutes.</p>
                </div>
                <FullForm flow={flow} />
                <p className={CARD_FOOT}>
                  Have an account?{" "}
                  <ScreenLink screen="Sign in" className={HELP_LINK}>
                    Sign in
                  </ScreenLink>
                </p>
              </>
            )}
            {flow.phase === "sent" && (
              <>
                <h2 ref={heading} tabIndex={-1} className={CARD_HEADING}>
                  Your link is on its way
                </h2>
                <SentNote flow={flow} />
              </>
            )}
            {flow.phase === "expired" && (
              <>
                <h2 ref={heading} tabIndex={-1} className={CARD_HEADING}>
                  This link has expired
                </h2>
                <ExpiredNote flow={flow} />
              </>
            )}
          </section>
          {flow.phase === "form" && <TrustLines className="px-1 lg:hidden" />}
          <FooterLinks />
        </div>
      </div>
    </SignedOutFrame>
  );
}
