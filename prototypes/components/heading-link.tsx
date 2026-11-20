import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A block's heading that opens the page with more of it, with a › after it: "By category ›" opens
 * Categories, Home's "Spending ›" opens Spending. It takes the heading's size; screen readers
 * hear where it goes after the heading's own words.
 */
export function HeadingLink({
  href,
  opens,
  children,
}: {
  href: Route;
  /** Where it goes, for screen readers: "all categories over the months". */
  opens: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="-mx-1 inline-flex items-center gap-0.5 rounded-lg px-1 underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
      <span className="sr-only">: {opens}</span>
      <ChevronRight aria-hidden="true" className="size-[0.8em] shrink-0" />
    </Link>
  );
}
