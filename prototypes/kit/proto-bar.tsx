"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useOptimistic, useTransition } from "react";

interface ProtoBarProps {
  variants: readonly { key: string; name: string }[];
  scenarios: readonly string[];
  currentVariant: string;
  currentScenario: string;
}

/** Floating controls for the prototype. Styled apart from the screen so it's never mistaken for the design. */
export function ProtoBar({
  variants,
  scenarios,
  currentVariant,
  currentScenario,
}: ProtoBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  // The controls show the new value at once, before the URL change finishes.
  const [scenario, setOptimisticScenario] = useOptimistic(currentScenario);
  const [slow, setOptimisticSlow] = useOptimistic(
    searchParams.get("latency") === "slow",
  );

  // Keeps the other params, so a link always reproduces what's on screen.
  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(name, value);
    router.replace(`${pathname}?${next.toString()}` as Route, {
      scroll: false,
    });
  };

  const index = variants.findIndex(({ key }) => key === currentVariant);
  const current = variants[index];
  const stepVariant = (by: number) => {
    const next = variants[(index + by + variants.length) % variants.length];
    if (next) setParam("variant", next.key);
  };

  // ← and → switch variants, but only when nothing is focused, so tabs, menus and fields keep their keys.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.target !== document.body || event.altKey || event.metaKey) {
      return;
    }
    if (event.key === "ArrowLeft") stepVariant(-1);
    if (event.key === "ArrowRight") stepVariant(1);
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <nav
      aria-label="Prototype controls"
      className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-wrap items-center gap-x-4 gap-y-2 rounded-3xl bg-foreground px-4 py-2 text-sm text-background shadow-lg"
    >
      <Link href="/" className="underline underline-offset-4">
        Index
      </Link>

      {variants.length > 1 && current && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous variant"
            className="size-8 rounded-full hover:bg-background/20"
            onClick={() => {
              stepVariant(-1);
            }}
          >
            ←
          </button>
          <span aria-live="polite">
            {current.key.toUpperCase()} · {current.name}
          </span>
          <button
            type="button"
            aria-label="Next variant"
            className="size-8 rounded-full hover:bg-background/20"
            onClick={() => {
              stepVariant(1);
            }}
          >
            →
          </button>
        </div>
      )}

      <label className="flex items-center gap-2">
        Scenario
        <select
          value={scenario}
          className="rounded-md bg-background px-2 py-1 text-foreground"
          onChange={(event) => {
            const { value } = event.target;
            startTransition(() => {
              setOptimisticScenario(value);
              setParam("scenario", value);
            });
          }}
        >
          {scenarios.map((scenario) => (
            <option key={scenario} value={scenario}>
              {scenario}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={slow}
          onChange={(event) => {
            const { checked } = event.target;
            startTransition(() => {
              setOptimisticSlow(checked);
              setParam("latency", checked ? "slow" : "normal");
            });
          }}
        />
        Slow actions
      </label>
    </nav>
  );
}
