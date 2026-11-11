import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { useProtoAction } from "@proto/kit/use-proto-action";
import type { Check } from "./scenarios";
import { BLOCK, HEADING, PAD } from "./parts";

// The screens that update a balance or a value aren't in the prototype yet.
const NOT_BUILT = "Not built yet";

// Home shows the first few, so a long list doesn't push spending off the screen.
const SHOWN = 3;

// A toast with an action stays at least 10 s (docs/ui-ux-rules.md).
const UNDO_MS = 10_000;

/**
 * Values that may no longer be true, as a short to-do list with one clear button each. A confirmed
 * balance leaves the list at once, with an Undo toast. Shows nothing when there was nothing to check.
 */
export function ChecksBlock({ checks }: { checks: readonly Check[] }) {
  const [showAll, setShowAll] = useState(false);
  const [cleared, setCleared] = useState<ReadonlySet<string>>(new Set());
  // The confirmed row's button disappears, so focus moves to the heading instead of being lost.
  const heading = useRef<HTMLHeadingElement>(null);
  if (checks.length === 0) return null;

  const open = checks.filter((check) => !cleared.has(check.id));
  const shown = showAll ? open : open.slice(0, SHOWN);
  const more = open.length - shown.length;

  const setOne = (id: string, done: boolean) => {
    setCleared((current) => {
      const next = new Set(current);
      if (done) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const clear = (check: Check) => {
    setOne(check.id, true);
    heading.current?.focus();
    toast(`${check.name} balance confirmed`, {
      duration: UNDO_MS,
      action: {
        label: "Undo",
        onClick: () => {
          setOne(check.id, false);
        },
      },
    });
  };

  return (
    <section className={cn("flex flex-col gap-5 bg-card py-8", BLOCK, PAD)}>
      <h2 ref={heading} tabIndex={-1} className={cn(HEADING, "outline-none")}>
        {open.length === 0
          ? "All checked"
          : `${String(open.length)} ${open.length === 1 ? "thing" : "things"} to check`}
      </h2>
      {open.length === 0 ? (
        <p className="text-sm font-medium">
          Your balances and values are up to date.
        </p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((check) => (
            <CheckRow key={check.id} check={check} onConfirmed={clear} />
          ))}
        </ul>
      )}
      {more > 0 && (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => {
            setShowAll(true);
          }}
        >
          Show {more} more
        </Button>
      )}
    </section>
  );
}

interface CheckRowProps {
  check: Check;
  /** Called once the balance is saved as still right. */
  onConfirmed: (check: Check) => void;
}

function CheckRow({ check, onConfirmed }: CheckRowProps) {
  const confirm = useProtoAction(() => {
    onConfirmed(check);
  });

  return (
    <li className="flex flex-col gap-3 border-t border-foreground/15 py-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-semibold wrap-break-word">
          {check.kind === "balance" ? (
            <>
              {check.name}: still <Money value={check.amount} />?
            </>
          ) : (
            check.name
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          <CheckNote check={check} />
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <CheckActions
          check={check}
          pending={confirm.pending}
          onConfirm={() => {
            confirm.run();
          }}
        />
      </div>
    </li>
  );
}

function CheckNote({ check }: { check: Check }) {
  if (check.kind === "balance") return <>Last checked {check.age}</>;
  return (
    <>
      <Money value={check.amount} />, last updated {check.age}
    </>
  );
}

interface CheckActionsProps {
  check: Check;
  pending: boolean;
  onConfirm: () => void;
}

function CheckActions({ check, pending, onConfirm }: CheckActionsProps) {
  if (check.kind === "stale") {
    return (
      <Button variant="outline" aria-disabled="true" title={NOT_BUILT}>
        Update value
      </Button>
    );
  }
  // The yes is outlined, not filled: Add stays the screen's one primary button.
  return (
    <>
      <Button variant="outline" disabled={pending} onClick={onConfirm}>
        {pending ? "Saving…" : "Still right"}
      </Button>
      <Button variant="ghost" aria-disabled="true" title={NOT_BUILT}>
        Update
      </Button>
    </>
  );
}
