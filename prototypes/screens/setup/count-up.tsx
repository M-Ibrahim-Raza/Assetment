"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { formatPkr } from "@proto/kit/format";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const DURATION_MS = 700;

function subscribeToMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => {
    query.removeEventListener("change", onChange);
  };
}

/**
 * A number that moves to its new value over a moment. It starts at `from`, which defaults to the
 * value itself, so nothing moves until the value changes. With reduced motion it never moves.
 */
function useCountUp(value: number, from: number): number {
  const [shown, setShown] = useState(from);
  const current = useRef(from);
  const reduced = useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    // The server can't tell, so it renders the final value.
    () => true,
  );

  useEffect(() => {
    if (reduced) {
      current.current = value;
      return;
    }
    const start = current.current;
    if (start === value) return;

    const began = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min(1, (now - began) / DURATION_MS);
      // Fast at first, then it settles.
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(start + (value - start) * eased);
      current.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [value, reduced]);

  return reduced ? value : shown;
}

interface CountUpProps {
  /** Whole rupees. */
  value: number;
  /** Where the count starts when it first shows. Leave it out to show the value at once. */
  from?: number;
  className?: string;
}

/**
 * A rupee amount that counts to its new value. Screen readers get only the final amount, and hear
 * it when it changes.
 */
export function CountUp({ value, from = value, className }: CountUpProps) {
  const shown = useCountUp(value, from);
  return (
    <span className={cn("tabular-nums", className)}>
      <span aria-hidden="true">{formatPkr(shown)}</span>
      <span aria-live="polite" className="sr-only">
        {formatPkr(value)}
      </span>
    </span>
  );
}
