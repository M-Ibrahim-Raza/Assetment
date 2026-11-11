"use client";

import { createContext, use } from "react";
import { cn } from "@/lib/utils";
import { formatPkr, formatSignedPkr } from "@proto/kit/format";

interface Amounts {
  /** True while the user has switched amounts off, e.g. in public. */
  hidden: boolean;
  /** Switches amounts off, or back on. */
  toggle: () => void;
}

/** Whether amounts are hidden, and the switch for it. The app shell provides it. */
export const AmountsContext = createContext<Amounts>({
  hidden: false,
  // Outside the shell there is nothing to switch.
  toggle: () => undefined,
});

interface MoneyProps {
  /** Whole rupees. */
  value: number;
  /** Put + or − in front. */
  signed?: boolean;
  className?: string;
}

/** One rupee amount, in the app's one format. Shows dots while amounts are hidden. */
export function Money({ value, signed = false, className }: MoneyProps) {
  const { hidden } = use(AmountsContext);
  if (hidden) {
    return (
      <span className={className}>
        <span aria-hidden="true">Rs •••••</span>
        <span className="sr-only">Amount hidden</span>
      </span>
    );
  }
  return (
    <span className={cn("tabular-nums", className)}>
      {signed ? formatSignedPkr(value) : formatPkr(value)}
    </span>
  );
}
