"use client";

import { useState } from "react";
import { AppShell } from "@proto/components/app-shell";
import {
  CustomizeButton,
  CustomizeSheet,
  SectionCustomizeButton,
} from "@proto/components/customize-sheet";
import { useProtoAction } from "@proto/kit/use-proto-action";
import { useScreen } from "@proto/screens/spending/use-screen";
import {
  CUSTOMIZE,
  DEFAULT_LAYOUT,
  type CategoriesLayout,
  type ListSettings,
  normalize,
  screenLayout,
  sectionSettings,
} from "../layout";
import { CategoryRows, CategorySort, countNote, groupLines } from "../list";
import { CARD, CARD_HEADING, monthsWord, RowsSkeleton } from "../look";
import { AddCategoryButton, type BookState, useBook } from "../manage";
import { type BookSummary, isEmptyBook, summarizeBook } from "../math";
import { coloursOf } from "../month-chart";
import { ErrorBlock, FirstUseBlock } from "../parts";
import type { CategoriesViewProps, CategoryBook } from "../scenarios";
import {
  type CategoriesParams,
  useCategoriesParams,
} from "../use-categories-params";
import { SpendingByMonth, SpendingByMonthSkeleton } from "./mix-top";

/**
 * Mix (d), the Categories page: "Spending by month" on top (the answer, the figures and the chart
 * in one block), then "Every category" as rows, with a Total column and its count line under the
 * heading. Customize, in the header and on each block, switches each block's extras, as on
 * Spending; saved to the account.
 */
export function Mix(props: CategoriesViewProps) {
  if (props.status === "ready" && !isEmptyBook(props.book)) {
    return (
      <Ready initial={props.book} saved={props.layout ?? DEFAULT_LAYOUT} />
    );
  }
  return (
    <AppShell current="spending" title="Categories">
      {props.status === "loading" ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Loading your categories</span>
          <SpendingByMonthSkeleton />
          <RowsSkeleton />
        </div>
      ) : props.status === "error" ? (
        <ErrorBlock message={props.message} />
      ) : (
        <FirstUseBlock />
      )}
    </AppShell>
  );
}

function Ready({
  initial,
  saved,
}: {
  initial: CategoryBook;
  /** The layout saved to the account. */
  saved: CategoriesLayout;
}) {
  const state = useBook(initial);
  const params = useCategoriesParams(state.book);
  const summary = summarizeBook(state.book, params.range);
  const [layout, setLayout] = useState(() => normalize(saved));
  // A phone shows the phone's own layout, if it has one.
  const screen = useScreen();
  const here = screenLayout(layout, screen);
  // Customize is open: from the header (focus null), or from a block's own button.
  const [customizing, setCustomizing] = useState<{
    focus: string | null;
  } | null>(null);
  const customize = (focus: string | null) => () => {
    setCustomizing({ focus });
  };
  // Saving to the account runs in memory here. `?latency=slow` shows "Saving…".
  const save = useProtoAction(() => undefined);

  return (
    <AppShell
      current="spending"
      title="Categories"
      actions={
        <CustomizeButton
          label="Customize Categories"
          onClick={customize(null)}
        />
      }
    >
      <div className="flex flex-col gap-3">
        <SpendingByMonth
          book={state.book}
          summary={summary}
          colours={coloursOf(state.book)}
          params={params}
          settings={sectionSettings(here, "top")}
          onCustomize={customize("top")}
        />
        <EveryCategory
          state={state}
          summary={summary}
          params={params}
          settings={sectionSettings(here, "list")}
          onCustomize={customize("list")}
        />
      </div>
      <CustomizeSheet
        model={CUSTOMIZE}
        open={customizing !== null}
        onOpenChange={(open) => {
          if (!open) setCustomizing(null);
        }}
        focus={customizing?.focus ?? null}
        layout={layout}
        screen={screen}
        onChange={(next) => {
          setLayout(next);
          save.run();
        }}
        saving={save.pending}
      />
    </AppShell>
  );
}

/**
 * The list: the heading with its count line under it, Add category and Customize beside them,
 * then the sort. Without the sort, the list keeps its usual order: total, high to low.
 */
function EveryCategory({
  state,
  summary,
  params,
  settings,
  onCustomize,
}: {
  state: BookState;
  summary: BookSummary;
  params: CategoriesParams;
  settings: ListSettings;
  onCustomize: () => void;
}) {
  const order = settings.sorting
    ? params.sort
    : { by: "total" as const, reversed: false };
  const groups = groupLines(summary, order);
  const months = summary.months.length;

  return (
    <section aria-labelledby="every-heading" className={CARD}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex flex-col gap-1">
          <h2 id="every-heading" className={CARD_HEADING}>
            Every category
          </h2>
          <p className="text-sm text-muted-foreground">
            {countNote(
              groups.shown.length,
              months,
              settings.bars && !settings.compact,
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <AddCategoryButton state={state} />
          <SectionCustomizeButton
            name="Every category"
            onClick={onCustomize}
            className="-mr-2"
          />
        </div>
      </div>
      {settings.sorting && (
        <CategorySort params={params} className="-mr-2 self-end" />
      )}
      <CategoryRows
        groups={groups}
        params={{ ...params, sort: order }}
        months={months}
        settings={settings}
        spent={summary.total}
        quietNote={`No spending in these ${monthsWord(months)}. Open one to hide, delete or merge it.`}
      />
    </section>
  );
}
