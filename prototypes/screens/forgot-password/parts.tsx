"use client";

import { type SyntheticEvent, useId } from "react";
import { Button } from "@/components/ui/button";
import { Email } from "@proto/components/signed-out/email";
import {
  EmailField,
  focusField,
  ServerFailed,
  SubmitButton,
} from "@proto/components/signed-out/fields";
import type { ForgotPasswordFlow } from "./use-forgot-password";

/** The button's words while sending, after a failure, and at first. */
const sendLabel = (flow: ForgotPasswordFlow): string =>
  flow.sending ? "Sending…" : flow.failed ? "Try again" : "Send reset link";

/** Their email, then Send reset link. */
export function ForgotForm({ flow }: { flow: ForgotPasswordFlow }) {
  const form = useId();

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (flow.submit()) focusField(form, "email");
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      {flow.failed && <ServerFailed title="We couldn't send the link" />}
      <EmailField
        form={form}
        value={flow.email}
        onChange={flow.update}
        error={flow.shownError}
        disabled={flow.sending}
      />
      <SubmitButton busy={flow.sending}>{sendLabel(flow)}</SubmitButton>
    </form>
  );
}

/** "Check your inbox". The same words whether or not the email has an account. */
export function SentNote({ flow }: { flow: ForgotPasswordFlow }) {
  return (
    <div className="flex flex-col gap-6">
      <p>
        If <Email email={flow.email.trim()} /> has an Assetment account, we sent
        it a link to pick a new password. The link works for 1 hour.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="lg"
          disabled={flow.resend.pending}
          onClick={() => {
            flow.resend.run();
          }}
        >
          {flow.resend.pending ? "Sending…" : "Send it again"}
        </Button>
        <Button variant="ghost" size="lg" onClick={flow.back}>
          Wrong email? Change it
        </Button>
      </div>
    </div>
  );
}
