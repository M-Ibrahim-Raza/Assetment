"use client";

import { Clock } from "lucide-react";
import { type SyntheticEvent, useEffect, useId } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { ScreenLink } from "@proto/components/screen-link";
import { TEXT_LINK } from "@proto/components/signed-out/card";
import { Email } from "@proto/components/signed-out/email";
import {
  EmailField,
  focusField,
  PasswordField,
  ServerFailed,
  SubmitButton,
} from "@proto/components/signed-out/fields";
import { BIG } from "@proto/screens/setup/look";
import { carryEmail } from "./carry-email";
import { countdown, type SignInFlow } from "./use-sign-in";

/** Tablets and wider, where focusing a field doesn't pop a keyboard up over the page. */
const WIDE = "(min-width: 40rem)";

interface PausedProps {
  seconds: number;
  /** Runs as "Reset your password" opens, to carry the typed email over. */
  onReset: () => void;
}

/** Signing in is paused after too many tries: a countdown, and the way out. */
function Paused({ seconds, onReset }: PausedProps) {
  return (
    <Alert>
      <Clock />
      <AlertTitle>Too many tries</AlertTitle>
      {/* Not grey: it's the message itself, and text on the night page is white. */}
      <AlertDescription className="text-card-foreground">
        <p>
          To keep your account safe, signing in is paused. Try again in{" "}
          <span role="timer" className="font-semibold tabular-nums">
            {countdown(seconds)}
          </span>
          .
        </p>
        <ScreenLink
          screen="Forgot password"
          className={TEXT_LINK}
          onClick={onReset}
        >
          Reset your password
        </ScreenLink>
      </AlertDescription>
    </Alert>
  );
}

/** Ticked by default. Unticked, the session ends when the browser closes: for shared phones. */
function KeepSignedIn({ form, flow }: { form: string; flow: SignInFlow }) {
  const id = `${form}-keep`;
  return (
    <Field orientation="horizontal">
      <Checkbox
        id={id}
        checked={flow.draft.keepSignedIn}
        onCheckedChange={(checked) => {
          flow.setKeepSignedIn(checked);
        }}
        disabled={flow.signingIn}
      />
      <FieldLabel htmlFor={id} className="font-normal">
        Keep me signed in
      </FieldLabel>
    </Field>
  );
}

/** The button's words while signing in, after a failure, and at first. */
const signInLabel = (flow: SignInFlow): string =>
  flow.signingIn ? "Signing in…" : flow.serverFailed ? "Try again" : "Sign in";

/** Email and password, then Sign in. A real form, so password managers can fill it. */
export function SignInForm({ flow }: { flow: SignInFlow }) {
  const form = useId();
  const errors = flow.shownErrors;
  const passwordError =
    errors?.password ??
    (flow.wrongDetails ? "That email and password don't match." : null);

  /** Forgot password opens with the email they typed here, carried in memory only. */
  const carryTypedEmail = () => {
    carryEmail(flow.draft.email);
  };

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    const wrong = flow.submit();
    if (wrong !== null) focusField(form, wrong);
  };

  // On tablets and wider, the email field takes focus when the form first shows.
  useEffect(() => {
    if (window.matchMedia(WIDE).matches) focusField(form, "email");
  }, [form]);

  // After a wrong try, the password gets focus, so they can type it again.
  useEffect(() => {
    if (flow.wrongDetails) focusField(form, "password");
  }, [flow.wrongDetails, form]);

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      {flow.serverFailed && <ServerFailed title="We couldn't sign you in" />}
      {flow.pausedFor !== null && (
        <Paused seconds={flow.pausedFor} onReset={carryTypedEmail} />
      )}
      <EmailField
        form={form}
        value={flow.draft.email}
        onChange={(value) => {
          flow.update("email", value);
        }}
        error={errors?.email ?? null}
        invalid={flow.wrongDetails}
        disabled={flow.signingIn}
      />
      <PasswordField
        form={form}
        purpose="current"
        warnCapsLock
        value={flow.draft.password}
        onChange={(value) => {
          flow.update("password", value);
        }}
        error={passwordError}
        disabled={flow.signingIn}
        labelEnd={
          <ScreenLink
            screen="Forgot password"
            className={cn(TEXT_LINK, "text-sm")}
            onClick={carryTypedEmail}
          >
            Forgot password?
          </ScreenLink>
        }
      />
      <KeepSignedIn form={form} flow={flow} />
      <SubmitButton busy={flow.signingIn}>{signInLabel(flow)}</SubmitButton>
    </form>
  );
}

/** The email and password match, but the email isn't confirmed yet (F19). */
export function UnconfirmedNote({ flow }: { flow: SignInFlow }) {
  return (
    <div className="flex flex-col gap-6">
      <p>
        We sent a link to <Email email={flow.draft.email.trim()} /> when you
        made your account. Open it to confirm your email, then sign in.
      </p>
      <Button
        disabled={flow.resend.pending}
        onClick={() => {
          flow.resend.run();
        }}
        className={cn(BIG, "w-full")}
      >
        {flow.resend.pending ? "Sending…" : "Send the link again"}
      </Button>
      <Button variant="ghost" size="lg" onClick={flow.back} className="w-full">
        Back to sign in
      </Button>
    </div>
  );
}
