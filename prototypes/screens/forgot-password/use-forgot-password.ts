"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { emailError } from "@proto/components/signed-out/rules";
import { useProtoAction } from "@proto/kit/use-proto-action";
import {
  carriedEmail,
  clearCarriedEmail,
} from "@proto/screens/sign-in/carry-email";
import type { ForgotPasswordViewProps } from "./scenarios";

/** Where the user is: typing their email, or told to check their inbox. */
export type Phase = ForgotPasswordViewProps["status"];

/**
 * Asking for a reset link, in memory. Every email that looks right gets "Check your inbox",
 * with or without an account. The View holds only what is on screen.
 */
export function useForgotPassword(props: ForgotPasswordViewProps) {
  const [phase, setPhase] = useState<Phase>(props.status);
  // Coming from Sign in, the email they typed there is filled in. A direct visit starts blank.
  const [email, setEmail] = useState(() =>
    props.email === "" ? carriedEmail() : props.email,
  );
  useEffect(() => {
    clearCarriedEmail();
  }, []);
  const [submitted, setSubmitted] = useState(
    props.status === "form" && props.submitted,
  );
  const [failed, setFailed] = useState(props.status === "form" && props.failed);
  // The `loading` scenario shows the link being sent, and stays there.
  const [stuck] = useState(props.status === "form" && props.sending);

  const send = useProtoAction(() => {
    setFailed(false);
    setPhase("sent");
  });

  const resend = useProtoAction(() => {
    toast(`If ${email.trim()} has an account, a new link is on its way.`);
  });

  const error = emailError(email);

  return {
    phase,
    email,
    /** The email's error, shown only once Send reset link was pressed. */
    shownError: submitted ? error : null,
    failed,
    sending: send.pending || stuck,
    update: setEmail,
    /** Presses Send reset link. Returns true when the email needs fixing, for the form to focus it. */
    submit: (): boolean => {
      setSubmitted(true);
      if (error !== null) return true;
      send.run();
      return false;
    },
    resend,
    /** Back to the form from "Check your inbox", with the email kept. */
    back: () => {
      setPhase("form");
    },
  };
}

export type ForgotPasswordFlow = ReturnType<typeof useForgotPassword>;
