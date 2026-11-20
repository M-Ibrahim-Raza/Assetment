"use client";

import Link from "next/link";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { BLOCK, HEADING, PAD } from "@proto/components/blocks";
import { FirstExpenseLink, RetryButton } from "@proto/screens/spending/parts";
import { RANGE_KEYS, RANGES, type RangeKey } from "./math";
import type { CategoriesParams } from "./use-categories-params";

/** What the Categories pages are for, before anything is logged. */
export const FIRST_USE = {
  title: "Your categories, month by month",
  body: "Each category's spending over the months, its average and where it goes. Log what you spend, and it adds up here.",
} as const;

export const ERROR_TITLE = "We couldn't load your categories";

/** Nothing logged yet: what these pages are for, and the way to the first expense. */
export function FirstUseBlock() {
  return (
    <section
      className={cn(
        "flex flex-col items-start gap-4 bg-secondary py-10 text-secondary-foreground",
        BLOCK,
        PAD,
      )}
    >
      <h2 className={HEADING}>{FIRST_USE.title}</h2>
      <p className="max-w-md">{FIRST_USE.body}</p>
      <FirstExpenseLink className="bg-card text-card-foreground" />
    </section>
  );
}

/** Loading failed: what happened, and Try again. */
export function ErrorBlock({ message }: { message: string }) {
  return (
    <section
      role="alert"
      className={cn(
        "flex flex-col items-start gap-4 bg-secondary py-8 text-secondary-foreground",
        BLOCK,
        PAD,
      )}
    >
      <h2 className={HEADING}>{ERROR_TITLE}</h2>
      <p className="max-w-md">{message}</p>
      <RetryButton className="bg-card text-card-foreground" />
    </section>
  );
}

/** An old link to a category that was merged or deleted. */
export function NotFoundBlock({ name }: { name: string }) {
  return (
    <section
      className={cn(
        "flex flex-col items-start gap-4 bg-secondary py-10 text-secondary-foreground",
        BLOCK,
        PAD,
      )}
    >
      <h2 className={HEADING}>We can&apos;t find {name}</h2>
      <p className="max-w-md">
        It may have been merged into another category or deleted. Its entries,
        if it had any, are in the category it went into.
      </p>
      <Link
        href="/spending/categories"
        className="inline-flex h-11 items-center rounded-full bg-card px-5 font-semibold text-card-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        See all categories
      </Link>
    </section>
  );
}

/**
 * The range: 6 months, 12 months or This year, one choice for the page, in the URL. `ink` draws it
 * white on an ink block.
 */
export function RangeChoice({
  params,
  tone = "plain",
  className,
}: {
  params: CategoriesParams;
  tone?: "plain" | "ink";
  className?: string;
}) {
  return (
    <ToggleGroup
      aria-label="Range"
      variant="outline"
      spacing={0}
      value={[params.range]}
      onValueChange={(value: readonly unknown[]) => {
        const next = RANGE_KEYS.find((key) => value.includes(key));
        if (next !== undefined) params.setRange(next);
      }}
      className={className}
    >
      {RANGE_KEYS.map((key: RangeKey) => (
        <ToggleGroupItem
          key={key}
          value={key}
          className={cn(
            "h-11 px-3 text-sm font-semibold",
            tone === "ink"
              ? "border-(--ink-foreground)/40 bg-transparent text-(--ink-foreground) hover:bg-(--ink-foreground)/10 hover:text-(--ink-foreground) aria-pressed:bg-(--ink-foreground) aria-pressed:text-(--ink)"
              : "aria-pressed:bg-foreground aria-pressed:text-background",
          )}
        >
          {RANGES[key].label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
