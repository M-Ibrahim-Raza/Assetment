import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { ScreenLink } from "@proto/components/screen-link";
import type { Entry } from "@proto/fixtures/entries";
import { BLOCK, HEADING, PAD } from "./parts";

// Home shows the latest few. The Spending screen has them all.
const SHOWN = 5;

/** The latest entries, newest first, so a just-saved one is easy to spot. */
export function RecentBlock({ entries }: { entries: readonly Entry[] }) {
  const shown = entries.slice(0, SHOWN);

  return (
    <section className={cn("flex flex-col gap-5 bg-card py-8", BLOCK, PAD)}>
      <h2 className={HEADING}>Latest</h2>
      {shown.length === 0 ? (
        <p className="text-sm font-medium">
          Nothing logged yet. Tap Add to log your first expense.
        </p>
      ) : (
        <>
          <ul className="flex flex-col">
            {shown.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-4 border-t border-foreground/15 py-3 first:border-t-0 first:pt-0"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="font-semibold wrap-break-word">{entry.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.category} · {entry.account} · {entry.day}
                  </p>
                </div>
                <EntryAmount entry={entry} />
              </li>
            ))}
          </ul>
          <p className="text-sm">
            <ScreenLink
              screen="Spending"
              className="font-semibold underline underline-offset-4"
            >
              See all entries
            </ScreenLink>
          </p>
        </>
      )}
    </section>
  );
}

/** Money in gets a plus and the gain colour. Money out gets a minus and stays ink. A transfer has no sign. */
function EntryAmount({ entry }: { entry: Entry }) {
  switch (entry.kind) {
    case "income":
      return (
        <Money
          value={entry.amount}
          signed
          className="shrink-0 font-bold text-gain"
        />
      );
    case "expense":
      return (
        <Money value={-entry.amount} signed className="shrink-0 font-bold" />
      );
    case "transfer":
      return (
        <Money
          value={entry.amount}
          className="shrink-0 font-bold text-muted-foreground"
        />
      );
  }
}
