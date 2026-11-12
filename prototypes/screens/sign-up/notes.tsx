"use client";

import { ArrowRight } from "lucide-react";
import { type SyntheticEvent, useEffect, useId, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScreenLink } from "@proto/components/screen-link";
import { BIG } from "@proto/screens/setup/look";
import { EmailField, focusField } from "./fields";
import { emailError, type SignUpFlow } from "./use-sign-up";

/** An email inside a sentence. A long one breaks anywhere, so a 320 px phone never scrolls sideways. */
function Email({ email }: { email: string }) {
  return <strong className="font-semibold wrap-anywhere">{email}</strong>;
}

/**
 * "Account made": the link is sent, and they can start Setup now. Under a hairline, a way to
 * get the link again and a way to fix a mistyped email. The View gives the heading.
 */
export function SentNote({ flow }: { flow: SignUpFlow }) {
  const [changing, setChanging] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <p className="text-lg">
        We sent a link to <Email email={flow.draft.email.trim()} />. Open it any
        time to confirm your email. You can start now.
      </p>
      <ScreenLink
        screen="Setup"
        className={cn(buttonVariants(), BIG, "self-start")}
      >
        Start setup
        <ArrowRight data-icon="inline-end" />
      </ScreenLink>
      <div className="flex flex-col gap-3 border-t pt-5">
        {changing ? (
          <ChangeEmail
            flow={flow}
            onDone={() => {
              setChanging(false);
            }}
          />
        ) : (
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
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                setChanging(true);
              }}
            >
              Wrong email? Change it
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Fixes a mistyped email on the account just made, and sends the link there. */
function ChangeEmail({
  flow,
  onDone,
}: {
  flow: SignUpFlow;
  onDone: () => void;
}) {
  const form = useId();
  const [email, setEmail] = useState(flow.draft.email);
  const [tried, setTried] = useState(false);
  const error = tried ? emailError(email) : null;

  // The field opens with focus, so they can fix the typo at once.
  useEffect(() => {
    focusField(form, "email");
  }, [form]);

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (emailError(email) !== null) {
      focusField(form, "email");
      return;
    }
    flow.changeEmail.run(email.trim());
    onDone();
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <EmailField
        form={form}
        label="Your email"
        value={email}
        onChange={setEmail}
        error={error}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary" size="lg">
          Send the link there
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** They opened an old link. It says why, and sends a new one. The View gives the heading. */
export function ExpiredNote({ flow }: { flow: SignUpFlow }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-lg">
        Links stop working after a while, to keep your account safe. We’ll send
        a new one to <Email email={flow.draft.email.trim()} />.
      </p>
      <Button
        disabled={flow.sendNew.pending}
        onClick={() => {
          flow.sendNew.run();
        }}
        className={cn(BIG, "self-start")}
      >
        {flow.sendNew.pending ? "Sending…" : "Send a new link"}
      </Button>
      <ScreenLink
        screen="Setup"
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "self-start",
        )}
      >
        Carry on with setup
      </ScreenLink>
    </div>
  );
}
