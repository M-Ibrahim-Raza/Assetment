import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { ScreenLink } from "@proto/components/screen-link";
import type { CategorySpend } from "@proto/fixtures/entries";
import { BLOCK, DISPLAY, HEADING, PAD } from "./parts";

// Home shows the biggest few. The Spending screen has them all.
const SHOWN = 5;

/** This month's biggest spending categories as solid ink bars, each against the same point last month. */
export function SpendingBlock({
  categories,
}: {
  categories: readonly CategorySpend[];
}) {
  const ranked = categories.toSorted((one, two) => two.spent - one.spent);
  const top = ranked.slice(0, SHOWN);
  const more = ranked.length - top.length;
  const largest = top[0]?.spent ?? 0;
  const total = categories.reduce((sum, category) => sum + category.spent, 0);
  const lastTotal = categories.reduce(
    (sum, category) => sum + category.lastMonth,
    0,
  );

  return (
    <section className={cn("flex flex-col gap-6 bg-card py-8", BLOCK, PAD)}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className={HEADING}>Spending</h2>
          {top.length > 0 && (
            <Money
              value={total}
              className={cn(DISPLAY, "text-3xl leading-none font-extrabold")}
            />
          )}
        </div>
        <p className="text-sm font-medium">
          {top.length === 0 ? (
            "Nothing logged yet this month. Tap Add to log your first expense."
          ) : (
            <>
              <Difference now={total} before={lastTotal} /> this time last month
            </>
          )}
        </p>
      </div>

      {top.length > 0 && (
        <>
          <ul className="flex flex-col gap-5">
            {top.map((category) => (
              <li key={category.name} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 font-semibold wrap-break-word">
                    {category.name}
                  </span>
                  <Money
                    value={category.spent}
                    className="shrink-0 font-bold"
                  />
                </div>
                {/* The longest bar is the biggest category. The amount beside it carries the number. */}
                <div
                  aria-hidden="true"
                  className={cn("h-3 overflow-hidden bg-muted", BLOCK)}
                >
                  <div
                    className={cn("h-full bg-primary", BLOCK)}
                    style={{
                      width: `${String((category.spent / largest) * 100)}%`,
                    }}
                  />
                </div>
                <Against category={category} />
              </li>
            ))}
          </ul>
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>
              {more > 0 &&
                `And ${String(more)} more ${more === 1 ? "category" : "categories"}`}
            </span>
            <ScreenLink
              screen="Spending"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              See all spending
            </ScreenLink>
          </p>
        </>
      )}
    </section>
  );
}

/** "Rs 9,300 more than", "Rs 3,600 less than" or "The same as". */
function Difference({ now, before }: { now: number; before: number }) {
  if (now === before) return <>The same as</>;
  return (
    <>
      <Money value={Math.abs(now - before)} />{" "}
      {now > before ? "more than" : "less than"}
    </>
  );
}

/** One category against last month. An arrow and words say which way, not a colour: spending more isn't an error. */
function Against({ category }: { category: CategorySpend }) {
  const change = category.spent - category.lastMonth;
  const Icon = change > 0 ? ArrowUp : change < 0 ? ArrowDown : Minus;
  return (
    <p className="flex items-center gap-1 text-sm text-muted-foreground">
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {category.lastMonth === 0 ? (
        "New this month"
      ) : change === 0 ? (
        "Same as last month"
      ) : (
        <span>
          <Money value={Math.abs(change)} /> {change > 0 ? "more" : "less"} than
          last month
        </span>
      )}
    </p>
  );
}
