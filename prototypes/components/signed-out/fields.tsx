"use client";

import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useState } from "react";
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
import { MIN_PASSWORD } from "./rules";

// The fields and buttons the signed-out screens share, such as Sign up and Sign in.

/** The id of a field's input, from a form's `useId()`. */
export const inputId = (form: string, field: string): string =>
  `${form}-${field}`;

/** Moves focus to a field, such as the first one with a problem. */
export function focusField(form: string, field: string) {
  document.getElementById(inputId(form, field))?.focus();
}

export interface FieldProps {
  /** The form's `useId()`. */
  form: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown under the field. Null hides it. */
  error: string | null;
  disabled?: boolean;
  /** Marks the field as wrong when the message sits under another field. */
  invalid?: boolean;
}

/** Ids for `aria-describedby`: the hint, then the error, when there are any. */
export const describedBy = (...ids: (string | false)[]) =>
  ids.filter((id) => id !== false).join(" ") || undefined;

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
  invalid = false,
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
        aria-invalid={shown !== null || invalid}
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

interface PasswordFieldProps extends FieldProps {
  /**
   * "new" makes a password: the browser offers a strong one, and a hint gives the shortest length.
   * "current" is the one they have, for password managers to fill.
   */
  purpose?: "new" | "current";
  label?: string;
  /** Sits at the end of the label's row, such as "Forgot password?". */
  labelEnd?: ReactNode;
  /** Says "Caps Lock is on" while it is, so a password they know isn't typed wrong. */
  warnCapsLock?: boolean;
}

/** A password, with Show so they can check what they typed. No second "confirm" field. */
export function PasswordField({
  form,
  value,
  onChange,
  error,
  disabled = false,
  invalid = false,
  purpose = "new",
  label = "Password",
  labelEnd,
  warnCapsLock = false,
}: PasswordFieldProps) {
  const id = inputId(form, "password");
  const [shown, setShown] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const fresh = purpose === "new";
  const caps = warnCapsLock && capsLock;
  const checkCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    if (warnCapsLock) setCapsLock(event.getModifierState("CapsLock"));
  };
  const labelTag = <FieldLabel htmlFor={id}>{label}</FieldLabel>;
  return (
    <Field>
      {labelEnd === undefined ? (
        labelTag
      ) : (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          {labelTag}
          {labelEnd}
        </div>
      )}
      <InputGroup className="h-12">
        <InputGroupInput
          id={id}
          type={shown ? "text" : "password"}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onKeyDown={checkCapsLock}
          onKeyUp={checkCapsLock}
          onBlur={() => {
            setCapsLock(false);
          }}
          autoComplete={fresh ? "new-password" : "current-password"}
          autoCapitalize="none"
          spellCheck={false}
          maxLength={128}
          disabled={disabled}
          aria-invalid={error !== null || invalid}
          aria-describedby={describedBy(
            fresh && `${id}-hint`,
            caps && `${id}-caps`,
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
      {fresh && (
        <FieldDescription id={`${id}-hint`}>
          {`At least ${String(MIN_PASSWORD)} characters.`}
        </FieldDescription>
      )}
      {caps && (
        <FieldDescription id={`${id}-caps`} className="font-medium">
          Caps Lock is on.
        </FieldDescription>
      )}
      {error !== null && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}

/** Our side failed. What they typed is still in the form. */
export function ServerFailed({ title }: { title: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        Everything you typed is still here. Check your connection and try again.
      </AlertDescription>
    </Alert>
  );
}

interface SubmitButtonProps {
  /** True while it works: a spinner, and the fields are locked. */
  busy: boolean;
  /** The words, such as "Create account", or "Creating your account…" while busy. */
  children: ReactNode;
  className?: string;
}

/** A form's main button: 48 px tall, as wide as the fields at every width, with an arrow. */
export function SubmitButton({ busy, children, className }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={busy}
      // While it works, the button keeps its full colour, so its words stay readable. The spinner
      // says it's busy.
      className={cn(
        BIG,
        "mt-1 w-full",
        busy && "disabled:opacity-100",
        className,
      )}
    >
      {busy && (
        <LoaderCircle
          data-icon="inline-start"
          className="animate-spin motion-reduce:animate-none"
        />
      )}
      {children}
      {!busy && <ArrowRight data-icon="inline-end" />}
    </Button>
  );
}
