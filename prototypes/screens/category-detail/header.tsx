"use client";

import { Check, ChevronDown, ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PAGE_TITLE } from "@proto/components/app-shell";
import { categoryPath } from "@proto/screens/categories/math";

// A category's page: where it sits and the way back, over its name, and the name as a way to
// another category. Picked on 2026-11-21 over a breadcrumb, a one-line path and a round back
// button.

type Query = Readonly<Record<string, string>>;

const FOCUS = "outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function categoriesHref(rangeQuery: Query) {
  return { pathname: "/spending/categories", query: rangeQuery } as const;
}

/** "‹ Categories", over the name: one step back, keeping the range. */
function BackLink({ rangeQuery }: { rangeQuery: Query }) {
  return (
    <Link
      href={categoriesHref(rangeQuery)}
      className={cn(
        "-ml-1 inline-flex min-h-6 items-center gap-0.5 self-start rounded-md pr-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline dark:text-accent-foreground",
        FOCUS,
      )}
    >
      <ChevronLeft aria-hidden="true" className="size-4" />
      Categories
    </Link>
  );
}

/** The name opens a list of the categories, to go straight to another, the current one ticked. */
function SwitcherHeading({
  name,
  categories,
  rangeQuery,
}: {
  name: string;
  categories: readonly string[];
  rangeQuery: Query;
}) {
  return (
    <h1 className={PAGE_TITLE}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "group -mx-1 inline-flex max-w-full items-center gap-1 rounded-lg px-1 text-left hover:bg-foreground/4",
            FOCUS,
          )}
        >
          <span className="wrap-break-word">{name}</span>
          <span className="sr-only">, open another category</span>
          <ChevronDown
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground transition-transform group-data-popup-open:rotate-180"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-80 w-auto min-w-64 overflow-y-auto">
          {categories.map((category) => {
            const here = category === name;
            return (
              <DropdownMenuItem
                key={category}
                className="min-h-11 justify-between gap-4 text-base"
                render={
                  <Link
                    href={{
                      pathname: categoryPath(category),
                      query: rangeQuery,
                    }}
                    aria-current={here ? "page" : undefined}
                  />
                }
              >
                <span className="min-w-0 wrap-break-word">{category}</span>
                {here && <Check aria-hidden="true" className="size-4" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </h1>
  );
}

/**
 * What the app shell shows for a category's page: "‹ Categories" over the name, and the name
 * opening the list of categories. Without `categories`, as while loading or when the category is
 * gone, just the back link. Spending's tabs, on the pages above it, already say it's in Spending.
 */
export function headerOf({
  name,
  rangeQuery,
  categories,
}: {
  name: string;
  rangeQuery: Query;
  categories?: readonly string[];
}): { above: ReactNode; heading?: ReactNode } {
  const above = <BackLink rangeQuery={rangeQuery} />;
  return categories === undefined
    ? { above }
    : {
        above,
        heading: (
          <SwitcherHeading
            name={name}
            categories={categories}
            rangeQuery={rangeQuery}
          />
        ),
      };
}
