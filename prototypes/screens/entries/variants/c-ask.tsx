"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AppShell } from "@proto/components/app-shell";
import {
  Behind,
  EntriesError,
  EntriesFirstUse,
  EntryFormPanel,
  NoResults,
  NotFoundDetail,
} from "../controls";
import type { EntriesData, EntriesStart, EntriesViewProps } from "../scenarios";
import { useEntriesScreen } from "../use-entries-screen";
import { Story } from "./c-ask-detail";
import { AskList } from "./c-ask-list";
import {
  Answer,
  PickedAnswer,
  Question,
  SavedQuestions,
  Tools,
} from "./c-ask-sentence";

// Ask: search as a sentence. The question and its answer are the biggest things on the page; the
// list below is quiet. An open entry is told as a short story, beside the list from `lg`.

const LARGE = "(min-width: 64rem)";

function Frame({ children }: { children: ReactNode }) {
  return (
    <AppShell current="spending" title="Entries" wide="medium">
      {children}
    </AppShell>
  );
}

/** Ask's shape while loading: the sentence, the answer, the chips, then rows under a rule. */
function AskSkeleton() {
  return (
    <div aria-busy="true" className="flex max-w-4xl flex-col gap-6">
      <p role="status" className="sr-only">
        Loading entries
      </p>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-full bg-foreground/10" />
        <Skeleton className="h-8 w-5/6 bg-foreground/10" />
        <Skeleton className="h-8 w-2/3 bg-foreground/10" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-64 max-w-full bg-foreground/10" />
        <Skeleton className="h-4 w-20 bg-foreground/10" />
        <Skeleton className="h-4 w-72 max-w-full bg-foreground/10" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-44 rounded-full bg-foreground/10" />
        <Skeleton className="h-11 w-36 rounded-full bg-foreground/10" />
        <Skeleton className="h-11 w-32 rounded-full bg-foreground/10" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-3 pt-4 pb-2">
          <Skeleton className="h-3 w-20 bg-foreground/10" />
          <span className="h-px flex-1 bg-foreground/10" />
          <Skeleton className="h-3 w-32 bg-foreground/10" />
        </div>
        {["a", "b", "c", "d", "e", "f", "g"].map((line) => (
          <div key={line} className="flex items-start gap-3 px-2 py-3">
            <Skeleton className="h-4 w-11 bg-foreground/10" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/5 bg-foreground/10" />
              <Skeleton className="h-3 w-2/5 bg-foreground/10" />
            </div>
            <Skeleton className="h-4 w-20 bg-foreground/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AskView(props: EntriesViewProps) {
  if (props.status === "loading") {
    return (
      <Frame>
        <AskSkeleton />
      </Frame>
    );
  }
  if (props.status === "error") {
    return (
      <Frame>
        <EntriesError message={props.message} />
      </Frame>
    );
  }
  return <Ready data={props.data} start={props.start} />;
}

function Ready({
  data,
  start,
}: {
  data: EntriesData;
  start: EntriesStart | undefined;
}) {
  const screen = useEntriesScreen(data, start);
  const headingId = useId();
  const listY = useRef(0);
  const before = useRef<string | null | undefined>(undefined);
  const openId = screen.opened.id;

  // Below `lg` the entry is its own page: open it at the top, with focus on its name, and go back
  // to the same place in the list, on the row that was open.
  useEffect(() => {
    const was = before.current;
    before.current = openId;
    if (was === undefined || was === openId || window.matchMedia(LARGE).matches)
      return;
    if (openId === null) {
      window.scrollTo(0, listY.current);
      if (was !== null)
        document
          .querySelector<HTMLElement>(`[data-entry-row="${CSS.escape(was)}"]`)
          ?.focus({ preventScroll: true });
    } else {
      window.scrollTo(0, 0);
      document.getElementById(headingId)?.focus({ preventScroll: true });
    }
  }, [openId, headingId]);

  const onOpen = (id: string) => {
    if (screen.opened.id === null) listY.current = window.scrollY;
    screen.opened.open(id);
  };

  const { openEntry } = screen;
  const open = openEntry !== null;
  const empty = screen.shown.length === 0;

  return (
    <Frame>
      <Behind screen={screen}>
        {screen.entries.length === 0 ? (
          <EntriesFirstUse />
        ) : (
          <div
            className={cn(
              open &&
                "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]",
            )}
          >
            <div
              className={cn(
                "flex min-w-0 flex-col gap-6",
                open ? "max-lg:hidden" : "max-w-4xl",
              )}
            >
              <Question screen={screen} compact={open} />
              {screen.picked.length > 0 ? (
                <PickedAnswer screen={screen} />
              ) : empty ? (
                <NoResults screen={screen} />
              ) : (
                <Answer screen={screen} />
              )}
              <SavedQuestions screen={screen} />
              {!empty && (
                <div className="flex flex-col gap-2">
                  <Tools screen={screen} />
                  <AskList screen={screen} onOpen={onOpen} />
                </div>
              )}
            </div>
            {open && (
              <aside
                aria-label="Open entry"
                className="min-w-0 lg:sticky lg:top-0 lg:max-h-svh lg:overflow-y-auto lg:border-l lg:border-foreground/10 lg:py-4 lg:pr-1 lg:pl-8"
              >
                {openEntry === undefined ? (
                  <NotFoundDetail screen={screen} />
                ) : (
                  <Story
                    screen={screen}
                    entry={openEntry}
                    headingId={headingId}
                  />
                )}
              </aside>
            )}
          </div>
        )}
      </Behind>
      <EntryFormPanel screen={screen} />
    </Frame>
  );
}
