"use client";

import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { type SyntheticEvent, useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { ScreenLink } from "@proto/components/screen-link";
import { BIG, TALL_FIELD } from "@proto/screens/setup/look";
import { type FieldName, MIN_PASSWORD, type SignUpFlow } from "./use-sign-up";

/** The id of a field's input, from a form's `useId()`. */
export const inputId = (form: string, field: FieldName): string =>
  `${form}-${field}`;

/** Moves focus to a field, such as the first one with a problem. */
export function focusField(form: string, field: FieldName) {
  document.getElementById(inputId(form, field))?.focus();
}

interface FieldProps {
  /** The form's `useId()`. */
  form: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown under the field. Null hides it. */
  error: string | null;
  disabled?: boolean;
}

/** Ids for `aria-describedby`: the hint, then the error, when there are any. */
const describedBy = (...ids: (string | false)[]) =>
  ids.filter((id) => id !== false).join(" ") || undefined;

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

interface EmailFieldProps extends FieldProps {
  /** The email already has an account: say so, with Sign in. */
  taken?: boolean;
  label?: string;
}

/** Their email, for signing in and for the link that confirms it. */
export function EmailField({
  form,
  value,
  onChange,
  error,
  disabled = false,
  taken = false,
  label = "Email",
}: EmailFieldProps) {
  const id = inputId(form, "email");
  const shown = taken ? "An account with this email already exists." : error;
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="email"
        inputMode="email"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={254}
        disabled={disabled}
        aria-invalid={shown !== null}
        aria-describedby={describedBy(shown !== null && `${id}-error`)}
        className={TALL_FIELD}
      />
      {shown !== null && (
        <FieldError id={`${id}-error`}>
          {shown}
          {taken && (
            <>
              {" "}
              <ScreenLink
                screen="Sign in"
                className="font-semibold underline underline-offset-4"
              >
                Sign in instead
              </ScreenLink>
            </>
          )}
        </FieldError>
      )}
    </Field>
  );
}

/** A new password, with Show so they can check what they typed. No second "confirm" field. */
export function PasswordField({
  form,
  value,
  onChange,
  error,
  disabled = false,
}: FieldProps) {
  const id = inputId(form, "password");
  const [shown, setShown] = useState(false);
  return (
    <Field>
      <FieldLabel htmlFor={id}>Password</FieldLabel>
      <InputGroup className="h-12">
        <InputGroupInput
          id={id}
          type={shown ? "text" : "password"}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          autoComplete="new-password"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={128}
          disabled={disabled}
          aria-invalid={error !== null}
          aria-describedby={describedBy(
            `${id}-hint`,
            error !== null && `${id}-error`,
          )}
          className="text-base md:text-base"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="sm"
            aria-pressed={shown}
            aria-label={shown ? "Hide password" : "Show password"}
            disabled={disabled}
            onClick={() => {
              setShown(!shown);
            }}
            className="h-9 px-3"
          >
            {shown ? <EyeOff /> : <Eye />}
            {shown ? "Hide" : "Show"}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription id={`${id}-hint`}>
        {`At least ${String(MIN_PASSWORD)} characters.`}
      </FieldDescription>
      {error !== null && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}

/** Our side failed. What they typed is still in the form. */
export function ServerFailed() {
  return (
    <Alert variant="destructive">
      <AlertTitle>{"We couldn't create your account"}</AlertTitle>
      <AlertDescription>
        Everything you typed is still here. Check your connection and try again.
      </AlertDescription>
    </Alert>
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
      {flow.serverFailed && <ServerFailed />}
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
      <Button
        type="submit"
        disabled={flow.creating}
        // While it works, the button keeps its full colour, so "Creating your account…" stays
        // readable. The spinner says it's busy.
        className={cn(
          BIG,
          "mt-1 w-full sm:w-auto sm:self-start",
          flow.creating && "disabled:opacity-100",
        )}
      >
        {flow.creating && (
          <LoaderCircle
            data-icon="inline-start"
            className="animate-spin motion-reduce:animate-none"
          />
        )}
        {createLabel(flow)}
        {!flow.creating && <ArrowRight data-icon="inline-end" />}
      </Button>
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
