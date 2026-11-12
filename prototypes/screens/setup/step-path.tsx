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
  /** What a step adds up to, in whole rupees. Null while nothing is added to it. */
  totalOf?: (group: SetupGroup) => number | null;
}

/** A step's total. Debts show as a minus. */
function StepTotal({ group, total }: { group: SetupGroup; total: number }) {
  const debt = group === "debts";
  return <Money value={debt ? -total : total} signed={debt} />;
}

/**
 * The steps along the top of a step card: the current one marked, the answered ones ticked, each
 * with its total. Any step can be opened. On phones the bars have no names under them, so the
 * count names the step and gives its total.
 */
export function StepPath({
  steps,
  current,
  answered,
  onGo,
  onBack = null,
  soFar = null,
  totalOf = () => null,
}: StepPathProps) {
  const extras = onBack !== null || soFar !== null;
  const currentTotal = totalOf(current);
  const showSoFar = soFar !== null && soFar !== 0;
  const soFarLine = showSoFar && (
    <>
      So far <Money value={soFar} />
    </>
  );
  return (
    <nav aria-label="Setup steps" className="flex flex-col gap-1">
      <div className="flex items-start gap-x-2">
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
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div
            className={cn(
              "flex flex-wrap items-center gap-x-2 gap-y-1",
              extras && "min-h-9",
            )}
          >
            <p className={EYEBROW}>
              Step {steps.indexOf(current) + 1} of {steps.length}
              <span className="sm:hidden"> · {GROUP_LABEL[current]}</span>
            </p>
            {showSoFar && (
              <p className="ml-auto hidden text-sm font-semibold whitespace-nowrap sm:block">
                {soFarLine}
              </p>
            )}
          </div>
          {/* Phones: the step's total and the net worth so far share one line under the count. */}
          {(currentTotal !== null || showSoFar) && (
            <div className="flex flex-wrap items-baseline gap-x-3 text-sm sm:hidden">
              {currentTotal !== null && (
                <p className="text-muted-foreground">
                  <StepTotal group={current} total={currentTotal} />
                </p>
              )}
              {showSoFar && (
                <p className="ml-auto font-semibold whitespace-nowrap">
                  {soFarLine}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <ol className="flex gap-1.5">
        {steps.map((group) => {
          const isCurrent = group === current;
          const isDone = answered.includes(group) && !isCurrent;
          const total = totalOf(group);
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
                {/* The tick sits in its own column, so the name and the total line up after it. */}
                <span className="hidden grid-cols-[auto_minmax(0,1fr)] items-center gap-y-0.5 text-xs sm:grid">
                  <span className="flex">
                    {isDone && (
                      <Check aria-hidden="true" className="mr-1 size-3.5" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "truncate",
                      isCurrent ? "font-bold" : "font-medium",
                    )}
                  >
                    {GROUP_LABEL[group]}
                  </span>
                  {/* Quieter than the name. It may wrap after "Rs", but is never cut short. */}
                  {total !== null && (
                    <span className="col-start-2 text-muted-foreground">
                      <StepTotal group={group} total={total} />
                    </span>
                  )}
                </span>
                <span className="sr-only">
                  <span className="sm:hidden">
                    {GROUP_LABEL[group]}
                    {total !== null && (
                      <>
                        {", "}
                        <StepTotal group={group} total={total} />
                      </>
                    )}
                  </span>
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
