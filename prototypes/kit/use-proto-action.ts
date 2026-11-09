"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

const SLOW_MS = 1500;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps an in-memory action so it runs after the delay set by `?latency=slow`.
 * Use `pending` to design the button and list states while it waits.
 */
export function useProtoAction<Args extends unknown[]>(
  action: (...args: Args) => void,
) {
  const slow = useSearchParams().get("latency") === "slow";
  const [pending, setPending] = useState(false);

  const run = (...args: Args) => {
    setPending(true);
    void delay(slow ? SLOW_MS : 0).then(() => {
      action(...args);
      setPending(false);
    });
  };

  return { run, pending };
}
