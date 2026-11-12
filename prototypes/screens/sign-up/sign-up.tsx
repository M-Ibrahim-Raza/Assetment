"use client";

import { cn } from "@/lib/utils";
import { BLOCK, EYEBROW, HEADING, PAD } from "@proto/components/blocks";
import { DISPLAY } from "@proto/components/display";
import { ON_GREEN } from "@proto/screens/setup/setup-frame";
import { useStepHeading } from "@proto/screens/setup/use-setup";
import { FullForm } from "./fields";
import { SignUpFrame, TrustLines } from "./frame";
import { ExpiredNote, SentNote } from "./notes";
import type { SignUpViewProps } from "./scenarios";
import { greet, useSignUp } from "./use-sign-up";

const HEADING_FOCUS = cn(HEADING, "outline-none");

/**
 * The promise beside the form. A green block says what Assetment does, in the biggest type on the
 * page, with why it's safe. The form sits beside it on the plain page, from desktop width. On
 * phones the block is a short band on top, and the trust lines come after the button.
 */
export function SignUpView(props: SignUpViewProps) {
  const flow = useSignUp(props);
  const heading = useStepHeading(flow.phase);
  const sent = flow.phase === "sent";

  return (
    <SignUpFrame>
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

        {/* Under desktop width the green block spans the page, so the form sits in a centred column under it. */}
        <section className="flex flex-col justify-center gap-6 px-1 py-6 max-lg:mx-auto max-lg:w-full max-lg:max-w-md sm:px-4 lg:px-12">
          {flow.phase === "form" && (
            <>
              <h2 ref={heading} tabIndex={-1} className={HEADING_FOCUS}>
                Create your account
              </h2>
              <FullForm flow={flow} className="max-w-md" />
              <TrustLines className="border-t pt-6 lg:hidden" />
            </>
          )}
          {flow.phase === "sent" && (
            <>
              <h2 ref={heading} tabIndex={-1} className={HEADING_FOCUS}>
                Your link is on its way
              </h2>
              <SentNote flow={flow} />
            </>
          )}
          {flow.phase === "expired" && (
            <>
              <h2 ref={heading} tabIndex={-1} className={HEADING_FOCUS}>
                This link has expired
              </h2>
              <ExpiredNote flow={flow} />
            </>
          )}
        </section>
      </div>
    </SignUpFrame>
  );
}
