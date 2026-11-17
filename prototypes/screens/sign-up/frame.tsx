"use client";

import { Clock, Gauge, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const TRUST = [
  {
    Icon: Gauge,
    line: "Assess all your assets in one place, and measure how you're doing.",
  },
  { Icon: Lock, line: "Only you can see what you own and owe." },
  { Icon: Clock, line: "See your net worth in about 5 minutes." },
] as const;

/** Why it's safe to type in their wealth: the persona's main worry before signing up. */
export function TrustLines({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {TRUST.map(({ Icon, line }) => (
        <li key={line} className="flex items-start gap-3">
          <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}
