"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { isOnOff, optionParam, type ProtoOption } from "./options";

interface ProtoBarProps {
  variants: readonly { key: string; name: string }[];
  scenarios: readonly string[];
  currentVariant: string;
  currentScenario: string;
  /** The screen's design choices, if any. */
  options: readonly ProtoOption[];
}

/**
 * `auto` shows the bar from tablet width up and the pill on phones, where the bar would cover a
 * bottom tab bar. The hidden one stays in the DOM, because kit/screenshots.mts reads the bar.
 */
type BarMode = "auto" | "open" | "closed";

const BAR_DISPLAY = {
  auto: "hidden sm:flex",
  open: "flex",
  closed: "hidden",
} as const satisfies Record<BarMode, string>;

const PILL_DISPLAY = {
  auto: "flex sm:hidden",
  open: "hidden",
  closed: "flex",
} as const satisfies Record<BarMode, string>;

/** The params the kit owns, including the `opt-` ones. Any other belongs to the screen. */
const KIT_PARAMS = ["variant", "scenario", "latency"];
const isKitParam = (name: string) =>
  KIT_PARAMS.includes(name) || name.startsWith("opt-");

/** Floating controls for the prototype. Styled apart from the screen so it's never mistaken for the design. */
export function ProtoBar({
  variants,
  scenarios,
  currentVariant,
  currentScenario,
  options,
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
  const [mode, setMode] = useState<BarMode>("auto");
  const [showOptions, setShowOptions] = useState(false);

  // Keeps the kit's other params, so a link always reproduces what's on screen.
  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    // A screen's own params, such as a wizard's `step`, belong to the variant and scenario they
    // were set in. A new one starts where its scenario says. Options keep them.
    if (name === "variant" || name === "scenario") {
      for (const key of [...next.keys()]) {
        if (!isKitParam(key)) next.delete(key);
      }
    }
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
    <nav aria-label="Prototype controls">
      <button
        type="button"
        className={`${PILL_DISPLAY[mode]} fixed top-2 left-1/2 z-50 -translate-x-1/2 items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs text-background shadow-lg`}
        onClick={() => {
          setMode("open");
        }}
      >
        <span className="sr-only">Show prototype controls.</span>
        Proto{current ? ` · ${current.key.toUpperCase()}` : ""}
      </button>

      <div
        className={`${BAR_DISPLAY[mode]} fixed inset-x-0 bottom-4 z-50 mx-auto w-fit max-w-[calc(100%-2rem)] flex-wrap items-center gap-x-4 gap-y-2 rounded-3xl bg-foreground px-4 py-2 text-sm text-background shadow-lg`}
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

        {options.length > 0 && (
          <button
            type="button"
            aria-expanded={showOptions}
            aria-controls="proto-options"
            className="rounded-full px-2 py-1 underline underline-offset-4 hover:bg-background/20"
            onClick={() => {
              setShowOptions(!showOptions);
            }}
          >
            Options
          </button>
        )}

        <button
          type="button"
          aria-label="Hide prototype controls"
          className="size-8 rounded-full hover:bg-background/20"
          onClick={() => {
            setMode("closed");
          }}
        >
          ×
        </button>

        {/* No select or live region here: kit/screenshots.mts finds the scenario picker and the
            variant name by those. */}
        {showOptions && (
          <div
            id="proto-options"
            className="flex basis-full flex-col gap-2 border-t border-background/20 pt-2"
          >
            {options.map((option) => {
              const value =
                searchParams.get(optionParam(option.key)) ?? option.default;
              if (isOnOff(option)) {
                return (
                  <label key={option.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={value === "on"}
                      onChange={(event) => {
                        setParam(
                          optionParam(option.key),
                          event.target.checked ? "on" : "off",
                        );
                      }}
                    />
                    {option.label}
                  </label>
                );
              }
              return (
                <fieldset
                  key={option.key}
                  className="flex flex-wrap items-center gap-1"
                >
                  <legend className="float-left mr-2">{option.label}</legend>
                  {option.choices.map((choice) => (
                    <button
                      key={choice.value}
                      type="button"
                      aria-pressed={value === choice.value}
                      className="rounded-full px-2 py-0.5 hover:bg-background/20 aria-pressed:bg-background aria-pressed:text-foreground"
                      onClick={() => {
                        setParam(optionParam(option.key), choice.value);
                      }}
                    >
                      {choice.label}
                    </button>
                  ))}
                </fieldset>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
