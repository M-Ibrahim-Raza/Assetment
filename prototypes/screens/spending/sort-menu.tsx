"use client";

import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ArrowUpZA,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** A field to sort by: its name, what its usual and reversed ways are called, and its kind. */
export interface SortField {
  name: string;
  ways: readonly [string, string];
  /** Sorts words, A to Z, rather than amounts, counts or dates. */
  words?: boolean;
}

/** How a list is sorted: by which field, and whether the other way round. */
export interface SortOrder<Key extends string> {
  by: Key;
  reversed: boolean;
}

/**
 * The icon that shows a sort's way, its arrow pointing down for the usual way and up for the
 * reverse: down with bars from wide to narrow for high to low (newest first, rises first, most
 * first), up with bars from narrow to wide for the reverse; down with A–Z, up with Z–A for words.
 * Words say the same to screen readers.
 */
function WayIcon({
  words,
  reversed,
  className,
}: {
  words: boolean;
  reversed: boolean;
  className?: string;
}) {
  if (words) {
    return reversed ? (
      <ArrowUpZA aria-hidden="true" className={className} />
    ) : (
      <ArrowDownAZ aria-hidden="true" className={className} />
    );
  }
  return reversed ? (
    <ArrowUpNarrowWide aria-hidden="true" className={className} />
  ) : (
    <ArrowDownWideNarrow aria-hidden="true" className={className} />
  );
}

/**
 * One quiet trigger that says how a list is sorted: the field, "Amount", after an icon for the way.
 * It opens one menu in two groups: what to sort by and which way, each way with its icon and
 * words that fit the field. The menu stays open after a pick, so both can be set; Esc or a tap
 * outside closes it. A new field starts its natural way.
 */
export function SortMenu<Key extends string>({
  fields,
  keys,
  order,
  onOrder,
  label,
  className,
}: {
  fields: Readonly<Record<Key, SortField>>;
  /** The fields offered, in the menu's order. */
  keys: readonly Key[];
  order: SortOrder<Key>;
  onOrder: (order: SortOrder<Key>) => void;
  /** "Sort categories", which screen readers hear with the field and way. */
  label: string;
  className?: string;
}) {
  const { name, ways, words = false } = fields[order.by];
  const way = order.reversed ? ways[1] : ways[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${label}: ${name}, ${way.toLowerCase()}`}
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "h-11 gap-1.5 px-2 text-sm font-medium",
          className,
        )}
      >
        <WayIcon words={words} reversed={order.reversed} className="size-4" />
        {name}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={order.by}
            onValueChange={(value: unknown) => {
              onOrder({
                by: keys.find((key) => key === value) ?? order.by,
                reversed: false,
              });
            }}
          >
            {keys.map((key) => (
              <DropdownMenuRadioItem
                key={key}
                value={key}
                className="min-h-11 text-base"
              >
                {fields[key].name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Order</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={order.reversed ? "reversed" : "usual"}
            onValueChange={(value: unknown) => {
              onOrder({ ...order, reversed: value === "reversed" });
            }}
          >
            <DropdownMenuRadioItem
              value="usual"
              className="min-h-11 gap-2 text-base"
            >
              <WayIcon words={words} reversed={false} />
              {ways[0]}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="reversed"
              className="min-h-11 gap-2 text-base"
            >
              <WayIcon words={words} reversed />
              {ways[1]}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
