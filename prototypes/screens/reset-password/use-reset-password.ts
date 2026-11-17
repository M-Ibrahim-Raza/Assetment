"use client";

import { useState } from "react";
import { newPasswordError } from "@proto/components/signed-out/rules";
import { useProtoAction } from "@proto/kit/use-proto-action";
import type { ResetPasswordViewProps } from "./scenarios";

/** Where the user is: picking a password, done, or on an expired link. */
export type Phase = ResetPasswordViewProps["status"];

/** Picking a new password, in memory. Any password that passes the rules is saved. */
export function useResetPassword(props: ResetPasswordViewProps) {
  const [phase, setPhase] = useState<Phase>(props.status);
  const [password, setPassword] = useState(
    props.status === "form" ? props.password : "",
  );
  const [submitted, setSubmitted] = useState(
    props.status === "form" && props.submitted,
  );
  const [failed, setFailed] = useState(props.status === "form" && props.failed);
  // The `loading` scenario shows the password being saved, and stays there.
  const [stuck] = useState(props.status === "form" && props.saving);

  const save = useProtoAction(() => {
    setFailed(false);
    setPhase("done");
  });

  const error = newPasswordError(password);

  return {
    phase,
    password,
    /** The password's error, shown only once Save new password was pressed. */
    shownError: submitted ? error : null,
    failed,
    saving: save.pending || stuck,
    update: setPassword,
    /** Presses Save new password. Returns true when the password needs fixing, for the form to focus it. */
    submit: (): boolean => {
      setSubmitted(true);
      if (error !== null) return true;
      save.run();
      return false;
    },
  };
}

export type ResetPasswordFlow = ReturnType<typeof useResetPassword>;
