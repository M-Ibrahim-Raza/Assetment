"use client";

import { type SyntheticEvent, useId } from "react";
import {
  focusField,
  PasswordField,
  ServerFailed,
  SubmitButton,
} from "@proto/components/signed-out/fields";
import type { ResetPasswordFlow } from "./use-reset-password";

/** The button's words while saving, after a failure, and at first. */
const saveLabel = (flow: ResetPasswordFlow): string =>
  flow.saving ? "Saving…" : flow.failed ? "Try again" : "Save new password";

/** The new password, with Show and a Caps Lock warning, then Save new password. */
export function ResetForm({ flow }: { flow: ResetPasswordFlow }) {
  const form = useId();

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (flow.submit()) focusField(form, "password");
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      {flow.failed && <ServerFailed title="We couldn't save your password" />}
      <PasswordField
        form={form}
        label="New password"
        warnCapsLock
        value={flow.password}
        onChange={flow.update}
        error={flow.shownError}
        disabled={flow.saving}
      />
      <SubmitButton busy={flow.saving}>{saveLabel(flow)}</SubmitButton>
    </form>
  );
}
