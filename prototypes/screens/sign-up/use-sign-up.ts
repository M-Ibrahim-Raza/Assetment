"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  emailError,
  newPasswordError,
} from "@proto/components/signed-out/rules";
import { TAKEN_EMAIL } from "@proto/fixtures/people";
import { useProtoAction } from "@proto/kit/use-proto-action";
import type { Failure, SignUpDraft, SignUpViewProps } from "./scenarios";

/** Where the user is: filling the form, told the link is sent, or on an expired link. */
export type Phase = SignUpViewProps["status"];

/** The fields, in the order the form asks them. */
export const FIELDS = ["name", "email", "password"] as const;
export type FieldName = (typeof FIELDS)[number];

export type FieldErrors = Readonly<Record<FieldName, string | null>>;

/** What is wrong with each field, in plain words. Null when it's fine. */
export function fieldErrors(draft: SignUpDraft): FieldErrors {
  return {
    name: draft.name.trim() === "" ? "Type what we should call you." : null,
    email: emailError(draft.email),
    password: newPasswordError(draft.password),
  };
}

/** ", Ayesha" for a greeting, or nothing when there's no name. */
export const greet = (name: string): string =>
  name.trim() === "" ? "" : `, ${name.trim()}`;

/**
 * Sign-up in memory. Create account fails only for the taken email in fixtures/people.ts.
 * The View holds only what is on screen.
 */
export function useSignUp(props: SignUpViewProps) {
  const [phase, setPhase] = useState<Phase>(props.status);
  const [draft, setDraft] = useState<SignUpDraft>(
    props.status === "form"
      ? props.draft
      : { name: props.name, email: props.email, password: "" },
  );
  const [submitted, setSubmitted] = useState(
    props.status === "form" && props.submitted,
  );
  const [failure, setFailure] = useState<Failure | null>(
    props.status === "form" ? props.failure : null,
  );
  // The `loading` scenario shows the account being created, and stays there.
  const [stuck] = useState(props.status === "form" && props.creating);

  const create = useProtoAction(() => {
    if (draft.email.trim().toLowerCase() === TAKEN_EMAIL) {
      setFailure("email-taken");
      return;
    }
    setFailure(null);
    setPhase("sent");
  });

  const resend = useProtoAction(() => {
    toast(`We sent a new link to ${draft.email.trim()}.`);
  });

  const changeEmail = useProtoAction((email: string) => {
    setDraft((before) => ({ ...before, email }));
    toast(`We sent a link to ${email}.`);
  });

  const sendNew = useProtoAction(() => {
    setPhase("sent");
    toast(`We sent a new link to ${draft.email.trim()}.`);
  });

  const taken = failure === "email-taken";
  const errors = fieldErrors(draft);

  return {
    phase,
    draft,
    /** Field errors, shown only once Create account was pressed. */
    shownErrors: submitted ? errors : null,
    errors,
    /** The email already has an account. Shown until the email changes. */
    taken,
    serverFailed: failure === "server",
    creating: create.pending || stuck,
    update: (field: FieldName, value: string) => {
      setDraft((before) => ({ ...before, [field]: value }));
      if (field === "email" && taken) setFailure(null);
    },
    /**
     * Presses Create account. Returns the first field with a problem, for the form to focus, or
     * null when the account is on its way.
     */
    submit: (): FieldName | null => {
      setSubmitted(true);
      const wrong = FIELDS.find((field) => errors[field] !== null);
      if (wrong !== undefined) return wrong;
      if (taken) return "email";
      create.run();
      return null;
    },
    resend,
    changeEmail,
    sendNew,
  };
}

export type SignUpFlow = ReturnType<typeof useSignUp>;
