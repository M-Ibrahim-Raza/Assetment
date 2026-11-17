"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { emailError } from "@proto/components/signed-out/rules";
import { GOOD_PASSWORD } from "@proto/fixtures/people";
import {
  ACCOUNT_EMAILS,
  MAX_TRIES,
  PAUSE_SECONDS,
  UNCONFIRMED_EMAIL,
} from "@proto/fixtures/sign-in";
import { useProtoAction } from "@proto/kit/use-proto-action";
import type { SignInDraft, SignInFailure, SignInViewProps } from "./scenarios";

/** Where the user is: filling the form, or asked to confirm their email first. */
export type Phase = SignInViewProps["status"];

/** The fields, in the order the form asks them. */
export const FIELDS = ["email", "password"] as const;
export type FieldName = (typeof FIELDS)[number];

const HOME = "/dashboard";

/**
 * Where to go after signing in: `next` when it's one of Assetment's own paths, else Home. A path
 * starting `//` or `/\` would open another site, so it goes Home too.
 */
export function landingPath(next: string | null): string {
  if (!next?.startsWith("/")) return HOME;
  if (next.startsWith("//") || next.startsWith("/\\")) return HOME;
  return next;
}

/** "4:59": the time left in a pause, in minutes and seconds. */
export const countdown = (seconds: number): string =>
  `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, "0")}`;

/** What is wrong with each field, in plain words. Null when it's fine. */
function fieldErrors(draft: SignInDraft): Record<FieldName, string | null> {
  return {
    email: emailError(draft.email),
    password: draft.password === "" ? "Type your password." : null,
  };
}

/**
 * Sign-in in memory. See scenarios.ts for which emails and passwords work. The View holds only
 * what is on screen.
 */
export function useSignIn(props: SignInViewProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(props.status);
  const [draft, setDraft] = useState<SignInDraft>(
    props.status === "form"
      ? props.draft
      : { email: props.email, password: "", keepSignedIn: true },
  );
  const [submitted, setSubmitted] = useState(
    props.status === "form" && props.submitted,
  );
  const [failure, setFailure] = useState<SignInFailure | null>(
    props.status === "form" ? props.failure : null,
  );
  const [wrongTries, setWrongTries] = useState(0);
  // The `loading` scenario shows signing in, and stays there.
  const [stuck] = useState(props.status === "form" && props.signingIn);

  const pausedFor = failure?.kind === "paused" ? failure.seconds : null;
  const paused = pausedFor !== null;

  // While paused, count down each second. At zero, they can try again.
  useEffect(() => {
    if (!paused) return;
    const timer = setInterval(() => {
      setFailure((before) => {
        if (before?.kind !== "paused") return before;
        return before.seconds <= 1
          ? null
          : { kind: "paused", seconds: before.seconds - 1 };
      });
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [paused]);

  const signIn = useProtoAction(() => {
    const email = draft.email.trim().toLowerCase();
    const matches =
      ACCOUNT_EMAILS.includes(email) && draft.password === GOOD_PASSWORD;
    if (!matches) {
      const tries = wrongTries + 1;
      const pause = tries >= MAX_TRIES;
      // A pause starts the count again, so after it they get 5 more tries.
      setWrongTries(pause ? 0 : tries);
      setFailure(
        pause
          ? { kind: "paused", seconds: PAUSE_SECONDS }
          : { kind: "wrong-details" },
      );
      return;
    }
    setFailure(null);
    setWrongTries(0);
    if (email === UNCONFIRMED_EMAIL) {
      setPhase("unconfirmed");
      return;
    }
    router.push(landingPath(props.next) as Route);
  });

  const resend = useProtoAction(() => {
    toast(`We sent a new link to ${draft.email.trim()}.`);
  });

  const errors = fieldErrors(draft);

  return {
    phase,
    draft,
    /** Field errors, shown only once Sign in was pressed. */
    shownErrors: submitted ? errors : null,
    /** No account has this email and password. Shown until either changes. */
    wrongDetails: failure?.kind === "wrong-details",
    serverFailed: failure?.kind === "server",
    /** Seconds until they can try again, while signing in is paused. */
    pausedFor,
    signingIn: signIn.pending || stuck,
    update: (field: FieldName, value: string) => {
      setDraft((before) => ({ ...before, [field]: value }));
      if (failure?.kind === "wrong-details") setFailure(null);
    },
    setKeepSignedIn: (keep: boolean) => {
      setDraft((before) => ({ ...before, keepSignedIn: keep }));
    },
    /**
     * Presses Sign in. Returns the first field with a problem, for the form to focus. Null
     * otherwise.
     */
    submit: (): FieldName | null => {
      setSubmitted(true);
      const wrong = FIELDS.find((field) => errors[field] !== null);
      if (wrong !== undefined) return wrong;
      // While paused, Sign in waits: the alert counts down.
      if (paused) return null;
      signIn.run();
      return null;
    },
    /** Back to the form from the unconfirmed note, with the email kept. */
    back: () => {
      setPhase("form");
    },
    resend,
  };
}

export type SignInFlow = ReturnType<typeof useSignIn>;
