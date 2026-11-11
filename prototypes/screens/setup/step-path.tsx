"use client";

import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { EYEBROW } from "@proto/components/blocks";
import type { SetupGroup } from "./scenarios";
import { GROUP_LABEL } from "./things";

interface StepPathProps {
  /** The steps on this user's path, in order. */
  steps: readonly SetupGroup[];
  current: SetupGroup;
  answered: readonly SetupGroup[];
  onGo: (group: SetupGroup) => void;
  /** A Back button before the count, for steps that ask one question at a time. */
  onBack?: (() => void) | null;
  /** The net worth so far, in whole rupees, at the end of the count. Hidden while it's zero. */
  soFar?: number | null;
}

/**
 * The steps along the top of a step card: the current one marked, the answered ones ticked. Any
 * step can be opened. On phones the bars have no names under them, so the count names the step.
 */
export function StepPath({
  steps,
  current,
  answered,
  onGo,
  onBack = null,
  soFar = null,
}: StepPathProps) {
  const extras = onBack !== null || soFar !== null;
  return (
    <nav aria-label="Setup steps" className="flex flex-col gap-1">
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1",
          extras && "min-h-9",
        )}
      >
        {onBack !== null && (
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Back"
            onClick={onBack}
            className="-ml-2.5"
          >
            <ArrowLeft />
          </Button>
        )}
        <p className={EYEBROW}>
          Step {steps.indexOf(current) + 1} of {steps.length}
          <span className="sm:hidden"> · {GROUP_LABEL[current]}</span>
        </p>
        {soFar !== null && soFar !== 0 && (
          <p className="ml-auto text-sm font-semibold whitespace-nowrap">
            So far <Money value={soFar} />
          </p>
        )}
      </div>
      <ol className="flex gap-1.5">
        {steps.map((group) => {
          const isCurrent = group === current;
          const isDone = answered.includes(group) && !isCurrent;
          return (
            <li key={group} className="min-w-0 flex-1">
              <button
                type="button"
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => {
                  onGo(group);
                }}
                // The padding makes the thin bar a 26 px target on phones, where it has no name under it.
                className="flex w-full flex-col gap-1.5 rounded-md py-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span
                  className={cn(
                    "h-1.5 rounded-full",
                    isCurrent || isDone ? "bg-primary" : "bg-foreground/15",
                  )}
                />
                <span
                  className={cn(
                    "hidden items-center gap-1 text-xs sm:flex",
                    isCurrent ? "font-bold" : "font-medium",
                  )}
                >
                  {isDone && (
                    <Check aria-hidden="true" className="size-3.5 shrink-0" />
                  )}
                  <span className="truncate">{GROUP_LABEL[group]}</span>
                </span>
                <span className="sr-only">
                  <span className="sm:hidden">{GROUP_LABEL[group]}</span>
                  {isDone && ", done"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
