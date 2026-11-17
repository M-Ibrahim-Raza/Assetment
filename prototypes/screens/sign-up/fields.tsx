"use client";

import { type SyntheticEvent, useId } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ScreenLink } from "@proto/components/screen-link";
import {
  describedBy,
  EmailField,
  type FieldProps,
  focusField,
  inputId,
  PasswordField,
  ServerFailed,
  SubmitButton,
} from "@proto/components/signed-out/fields";
import { TALL_FIELD } from "@proto/screens/setup/look";
import type { SignUpFlow } from "./use-sign-up";

/**
 * What to call them. Not "First name": many Pakistani men's first name is Muhammad, and they go
 * by the next one.
 */
export function NameField({
  form,
  value,
  onChange,
  error,
  disabled = false,
}: FieldProps) {
  const id = inputId(form, "name");
  return (
    <Field>
      <FieldLabel htmlFor={id}>What should we call you?</FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        autoComplete="given-name"
        autoCapitalize="words"
        maxLength={40}
        disabled={disabled}
        aria-invalid={error !== null}
        aria-describedby={describedBy(error !== null && `${id}-error`)}
        className={TALL_FIELD}
      />
      {error !== null && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}

/** The main button's words while creating, after a failure, and at first. */
export const createLabel = (flow: SignUpFlow): string =>
  flow.creating
    ? "Creating your account…"
    : flow.serverFailed
      ? "Try again"
      : "Create account";

interface FullFormProps {
  flow: SignUpFlow;
  className?: string;
}

/**
 * All three fields at once, then Create account. Errors show only after it's pressed.
 */
export function FullForm({ flow, className }: FullFormProps) {
  const form = useId();
  const errors = flow.shownErrors;

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    const wrong = flow.submit();
    if (wrong !== null) focusField(form, wrong);
  };

  return (
    <form
      noValidate
      onSubmit={submit}
      className={cn("flex flex-col gap-5", className)}
    >
      {flow.serverFailed && (
        <ServerFailed title="We couldn't create your account" />
      )}
      <NameField
        form={form}
        value={flow.draft.name}
        onChange={(value) => {
          flow.update("name", value);
        }}
        error={errors?.name ?? null}
        disabled={flow.creating}
      />
      <EmailField
        form={form}
        value={flow.draft.email}
        onChange={(value) => {
          flow.update("email", value);
        }}
        error={errors?.email ?? null}
        taken={flow.taken}
        disabled={flow.creating}
      />
      <PasswordField
        form={form}
        value={flow.draft.password}
        onChange={(value) => {
          flow.update("password", value);
        }}
        error={errors?.password ?? null}
        disabled={flow.creating}
      />
      <SubmitButton busy={flow.creating}>{createLabel(flow)}</SubmitButton>
      {/* Terms and Privacy policy aren't written yet, so their links are stand-ins. */}
      <p className="text-sm text-muted-foreground">
        By creating an account, you agree to our{" "}
        <ScreenLink screen="Terms" className="underline underline-offset-4">
          Terms
        </ScreenLink>{" "}
        and{" "}
        <ScreenLink
          screen="Privacy policy"
          className="underline underline-offset-4"
        >
          Privacy policy
        </ScreenLink>
        .
      </p>
    </form>
  );
}
