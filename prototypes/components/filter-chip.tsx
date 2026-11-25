"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A filter that is on, such as a category or the words searched, with its own ✕ to clear it. */
export function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-accent py-1 pr-1 pl-3 text-sm font-medium text-accent-foreground">
      <span className="min-w-0 truncate">{label}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Remove filter: ${label}`}
        onClick={onRemove}
        className="rounded-full"
      >
        <X />
      </Button>
    </span>
  );
}
