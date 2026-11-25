import { Skeleton } from "@/components/ui/skeleton";

// Ledger while loading: the toolbar, the table's head, a month band and rows, and the footer.
// The same container query as the table turns the rows into two lines on narrow lists.

const ROWS = ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9"] as const;

export function LedgerSkeleton() {
  return (
    <div aria-busy="true" className="@container/ledger flex flex-col gap-3">
      <span className="sr-only">Loading your entries</span>
      <div className="rounded-2xl bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-3 @min-[40rem]/ledger:px-4 @min-[40rem]/ledger:pt-4">
          <Skeleton className="h-4 w-28" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-11 flex-1 basis-full @min-[40rem]/ledger:basis-64" />
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-20" />
          </div>
          <div className="hidden gap-2 @min-[40rem]/ledger:flex">
            {["p", "k", "c", "a", "t"].map((key) => (
              <Skeleton key={key} className="h-11 w-24 rounded-full" />
            ))}
          </div>
        </div>
        <div className="hidden h-11 items-center gap-4 border-b border-foreground/20 px-3.5 @min-[40rem]/ledger:flex">
          <Skeleton className="size-4" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
        <div className="bg-secondary px-3 py-2.5">
          <Skeleton className="h-3.5 w-48 bg-foreground/10" />
        </div>
        {ROWS.map((row) => (
          <div
            key={row}
            className="flex items-start justify-between gap-3 border-b border-border p-3 @min-[40rem]/ledger:items-center @min-[40rem]/ledger:px-3.5"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 @min-[40rem]/ledger:flex-row @min-[40rem]/ledger:items-center @min-[40rem]/ledger:gap-4">
              <Skeleton className="hidden size-4 @min-[40rem]/ledger:block" />
              <Skeleton className="hidden h-3 w-12 @min-[40rem]/ledger:block" />
              <Skeleton className="h-4 w-2/5 @min-[40rem]/ledger:w-1/4" />
              <Skeleton className="h-3 w-3/5 @min-[40rem]/ledger:hidden" />
              <Skeleton className="hidden h-3.5 w-1/6 @min-[40rem]/ledger:ml-auto @min-[40rem]/ledger:block" />
              <Skeleton className="hidden h-3.5 w-1/6 @min-[40rem]/ledger:block" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}
