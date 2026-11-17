"use client";

import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScreenLink } from "@proto/components/screen-link";
import { CARD_HEADING, SignedOutCard } from "@proto/components/signed-out/card";
import { BIG } from "@proto/screens/setup/look";
import { useStepHeading } from "@proto/screens/setup/use-setup";
import { ResetForm } from "./parts";
import type { ResetPasswordViewProps } from "./scenarios";
import { useResetPassword } from "./use-reset-password";

/** A link that looks like the main button, such as Sign in after the password is changed. */
const MAIN_LINK = cn(buttonVariants(), BIG, "w-full");

/**
 * Sign in's quiet card: a new password, then "Password changed" with Sign in as the next step.
 * An old or used link shows "This link has expired", with a way to get a new one.
 */
export function ResetPasswordView(props: ResetPasswordViewProps) {
  const flow = useResetPassword(props);
  const heading = useStepHeading(flow.phase);

  return (
    <SignedOutCard way="sign-in">
      {flow.phase === "done" && (
        <>
          <h1 ref={heading} tabIndex={-1} className={CARD_HEADING}>
            Password changed
          </h1>
          <div className="flex flex-col gap-6">
            <p>
              We signed you out on your other devices. Sign in with your new
              password.
            </p>
            <ScreenLink screen="Sign in" className={MAIN_LINK}>
              Sign in
              <ArrowRight data-icon="inline-end" />
            </ScreenLink>
          </div>
        </>
      )}
      {flow.phase === "expired" && (
        <>
          <h1 ref={heading} tabIndex={-1} className={CARD_HEADING}>
            This link has expired
          </h1>
          <div className="flex flex-col gap-6">
            <p>
              Reset links work for 1 hour and only once, to keep your account
              safe.
            </p>
            <ScreenLink screen="Forgot password" className={MAIN_LINK}>
              Send a new link
            </ScreenLink>
          </div>
        </>
      )}
      {flow.phase === "form" && (
        <>
          <div className="flex flex-col gap-2">
            <h1 ref={heading} tabIndex={-1} className={CARD_HEADING}>
              Pick a new password
            </h1>
            <p>You’ll use it to sign in from now on.</p>
          </div>
          <ResetForm flow={flow} />
        </>
      )}
    </SignedOutCard>
  );
}
