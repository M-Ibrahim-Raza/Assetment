"use client";

import { ArrowRight } from "lucide-react";
import { type Ref, type SyntheticEvent, useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { HEADING } from "@proto/components/blocks";
import type { AccountKind } from "@proto/fixtures/accounts";
import { ACCOUNT_NAMES } from "@proto/fixtures/banks";
import { useProtoAction } from "@proto/kit/use-proto-action";
import { AmountField } from "./amount-field";
import { BIG, STEP_FOOTER, TALL_FIELD } from "./look";
import { ItemRows, StandInNote } from "./rows";
import type { ItemKind } from "./scenarios";
import type { SetupState } from "./use-setup";

// The questions setup asks, one on screen at a time, on the white step card.

/** The account being asked about: a new one, or one being changed (`id`). */
export interface Draft {
  id: string | null;
  kind: AccountKind;
  name: string;
  /** Whole rupees, when the account already has a balance. */
  balance: number | null;
}

/** A question's heading: a block heading, with no outline when focus moves to it. */
export const TITLE = cn(HEADING, "outline-none");

// A choice the user taps to answer, such as a bank's name: as big as a main button.
const CHOICE = BIG;

/** A one-tap way past a question, such as "Skip for now". */
export interface Skip {
  label: string;
  onSkip: () => void;
}

function SkipButton({ skip }: { skip: Skip }) {
  return (
    <Button
      variant="ghost"
      className="self-start underline underline-offset-4"
      onClick={skip.onSkip}
    >
      {skip.label}
    </Button>
  );
}

interface NameQuestionProps {
  kind: AccountKind;
  title: string;
  heading: Ref<HTMLHeadingElement>;
  onPick: (name: string) => void;
  skip: Skip | null;
}

/** Which bank or wallet: a tap on a common name, or a typed one. */
export function NameQuestion({
  kind,
  title,
  heading,
  onPick,
  skip,
}: NameQuestionProps) {
  const id = useId();
  const [typing, setTyping] = useState(false);
  const [name, setName] = useState("");
  const [tried, setTried] = useState(false);
  const noun = kind === "wallet" ? "wallet" : "bank";
  const error = tried && name.trim() === "";

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (name.trim() !== "") onPick(name.trim());
  };

  return (
    <>
      <h2 ref={heading} tabIndex={-1} className={TITLE}>
        {title}
      </h2>
      {typing ? (
        <form noValidate onSubmit={submit} className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor={id}>{`Name of the ${noun}`}</FieldLabel>
            <Input
              id={id}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              autoComplete="off"
              autoCapitalize="words"
              maxLength={60}
              aria-invalid={error}
              aria-describedby={error ? `${id}-error` : undefined}
              className={TALL_FIELD}
            />
            {error && (
              <FieldError id={`${id}-error`}>
                {`Type the ${noun}'s name.`}
              </FieldError>
            )}
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className={BIG}>
              Next
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={BIG}
              onClick={() => {
                setTyping(false);
              }}
            >
              Back to the list
            </Button>
          </div>
        </form>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {ACCOUNT_NAMES[kind].map((option) => (
              <li key={option}>
                <Button
                  variant="outline"
                  className={CHOICE}
                  onClick={() => {
                    onPick(option);
                  }}
                >
                  {option}
                </Button>
              </li>
            ))}
            <li>
              <Button
                variant="outline"
                className={CHOICE}
                onClick={() => {
                  setTyping(true);
                }}
              >
                {`Another ${noun}`}
              </Button>
            </li>
          </ul>
          {skip !== null && <SkipButton skip={skip} />}
        </>
      )}
    </>
  );
}

interface AmountQuestionProps {
  draft: Draft;
  /** True when saving this amount just failed. */
  failed: boolean;
  heading: Ref<HTMLHeadingElement>;
  /** Called with the balance, in whole rupees, once it is saved. */
  onSave: (balance: number) => void;
  skip?: Skip | null;
}

/** How much is in it: one amount field and nothing else. The heading asks the question. */
export function AmountQuestion({
  draft,
  failed,
  heading,
  onSave,
  skip = null,
}: AmountQuestionProps) {
  const id = useId();
  const [digits, setDigits] = useState(
    draft.balance === null ? "" : String(draft.balance),
  );
  const [tried, setTried] = useState(false);
  const [saveFailed, setSaveFailed] = useState(failed);
  const save = useProtoAction(onSave);
  const cash = draft.kind === "cash";

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (digits === "") {
      document.getElementById(id)?.focus();
      return;
    }
    setSaveFailed(false);
    save.run(Number(digits));
  };

  return (
    <>
      <h2 ref={heading} tabIndex={-1} className={TITLE}>
        {cash
          ? "How much cash do you have?"
          : `How much is in ${draft.name} today?`}
      </h2>
      <form noValidate onSubmit={submit} className="flex flex-col gap-6">
        {saveFailed && (
          <Alert variant="destructive">
            <AlertTitle>{`We couldn't save ${draft.name}`}</AlertTitle>
            <AlertDescription>
              Your amount is still here. Check your connection and try again.
            </AlertDescription>
          </Alert>
        )}
        <AmountField
          id={id}
          label={
            cash ? "Cash you have today" : `Balance in ${draft.name} today`
          }
          digits={digits}
          onDigits={setDigits}
          hint="Roughly is fine. You can correct it later."
          error={
            tried && digits === ""
              ? "Enter the balance. Use 0 if it's empty."
              : null
          }
          labelHidden
        />
        <Button
          type="submit"
          disabled={save.pending}
          className={cn(BIG, "self-start")}
        >
          {save.pending
            ? "Saving…"
            : saveFailed
              ? "Try again"
              : draft.id === null
                ? "Next"
                : "Save"}
          {!save.pending && <ArrowRight data-icon="inline-end" />}
        </Button>
      </form>
      {skip !== null && <SkipButton skip={skip} />}
    </>
  );
}

interface StandInQuestionProps {
  title: string;
  /** One line under the question, saying what counts. */
  help: string;
  /** The kinds of item this question covers. "Add a sample" adds their samples. */
  kinds: readonly ItemKind[];
  state: SetupState;
  heading: Ref<HTMLHeadingElement>;
  /** The two answers while nothing is added, and the button once something is. */
  labels: { yes: string; no: string; next: string };
  onDone: () => void;
}

/** A question whose form isn't designed yet: yes adds a sample, no moves on. */
export function StandInQuestion({
  title,
  help,
  kinds,
  state,
  heading,
  labels,
  onDone,
}: StandInQuestionProps) {
  const rows = state.items.filter((item) => kinds.includes(item.kind));
  const add = useProtoAction(() => {
    state.addSamples(kinds);
  });

  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 ref={heading} tabIndex={-1} className={TITLE}>
          {title}
        </h2>
        <p>{help}</p>
      </div>
      <StandInNote />
      {rows.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className={CHOICE}
            disabled={add.pending}
            onClick={() => {
              add.run();
            }}
          >
            {add.pending ? "Adding…" : labels.yes}
          </Button>
          <Button variant="outline" className={CHOICE} onClick={onDone}>
            {labels.no}
          </Button>
        </div>
      ) : (
        <>
          <ItemRows
            items={rows}
            onRemove={state.removeItem}
            // A question about one kind already names it, so the rows don't repeat it.
            kinds={kinds.length > 1}
          />
          {/* Leaving the step sits in a footer, under a hairline. */}
          <div className={STEP_FOOTER}>
            <Button className={BIG} onClick={onDone}>
              {labels.next}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </>
      )}
    </>
  );
}
