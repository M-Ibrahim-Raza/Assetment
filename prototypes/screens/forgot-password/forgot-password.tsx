"use client";

import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScreenLink } from "@proto/components/screen-link";
import {
  CARD_FOOT,
  CARD_HEADING,
  HELP_LINK,
  SignedOutCard,
} from "@proto/components/signed-out/card";
import { useStepHeading } from "@proto/screens/setup/use-setup";
import { ForgotForm, SentNote } from "./parts";
import type { ForgotPasswordViewProps } from "./scenarios";
import { useForgotPassword } from "./use-forgot-password";

/**
 * Sign in's quiet card: their email, then Send reset link, or "Check your inbox" once it's sent.
 * The card's foot goes back to Sign in.
 */
export function ForgotPasswordView(props: ForgotPasswordViewProps) {
  const flow = useForgotPassword(props);
  const heading = useStepHeading(flow.phase);

  return (
    <SignedOutCard way="sign-in">
      {flow.phase === "form" ? (
        <>
          <div className="flex flex-col gap-2">
            <h1 ref={heading} tabIndex={-1} className={CARD_HEADING}>
              Forgot your password?
            </h1>
            <p>
              Type the email you sign in with. We’ll send you a link to pick a
              new password.
            </p>
          </div>
          <ForgotForm flow={flow} />
        </>
      ) : (
        <>
          <h1 ref={heading} tabIndex={-1} className={CARD_HEADING}>
            Check your inbox
          </h1>
          <SentNote flow={flow} />
        </>
      )}
      <p className={CARD_FOOT}>
        <ScreenLink
          screen="Sign in"
          className={cn(HELP_LINK, "inline-flex items-center gap-1.5")}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to sign in
        </ScreenLink>
      </p>
    </SignedOutCard>
  );
}
