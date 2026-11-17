"use client";

import { ScreenLink } from "@proto/components/screen-link";
import {
  CARD_FOOT,
  CARD_HEADING,
  HELP_LINK,
  SignedOutCard,
} from "@proto/components/signed-out/card";
import { useStepHeading } from "@proto/screens/setup/use-setup";
import { SignInForm, UnconfirmedNote } from "./parts";
import type { SignInViewProps } from "./scenarios";
import { useSignIn } from "./use-sign-in";

/**
 * "Welcome back" and the sign-in form on one quiet card, with a way to Sign up at its foot. An
 * unconfirmed email swaps the form for "Confirm your email first".
 */
export function SignInView(props: SignInViewProps) {
  const flow = useSignIn(props);
  const heading = useStepHeading(flow.phase);

  return (
    <SignedOutCard way="sign-up">
      {flow.phase === "unconfirmed" ? (
        <>
          <h1 ref={heading} tabIndex={-1} className={CARD_HEADING}>
            Confirm your email first
          </h1>
          <UnconfirmedNote flow={flow} />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <h1 ref={heading} tabIndex={-1} className={CARD_HEADING}>
              Welcome back
            </h1>
            <p>Sign in to your Assetment account.</p>
          </div>
          <SignInForm flow={flow} />
          <p className={CARD_FOOT}>
            New to Assetment?{" "}
            <ScreenLink screen="Sign up" className={HELP_LINK}>
              Create account
            </ScreenLink>
          </p>
        </>
      )}
    </SignedOutCard>
  );
}
