"use client";

import { useRouter } from "next/navigation";
import {
  type ComponentType,
  type ReactNode,
  useLayoutEffect,
  useState,
} from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { AddActionContext } from "@proto/components/app-shell";
import { BLOCK, HEADING } from "@proto/components/blocks";
import { FormPanel } from "@proto/components/form-panel";
import { ScreenLink } from "@proto/components/screen-link";
import { DashboardView } from "@proto/screens/dashboard/dashboard";
import {
  type Dashboard,
  scenarios as homeScenarios,
} from "@proto/screens/dashboard/scenarios";
import { BIG } from "@proto/screens/setup/look";
import {
  applyEntry,
  applyToAccounts,
  applyToDebts,
  placeAfter,
  type SavedEntry,
} from "./apply-entry";
import { type BodyProps, PANEL_PAD } from "./fields";
import { type Place, toPlaces } from "./places";
import type { QuickAdd, QuickAddViewProps } from "./scenarios";
import { useEntryForm } from "./use-entry-form";

// A toast with an action stays at least 10 s (docs/ui-ux-rules.md).
const UNDO_MS = 10_000;

// The screen behind the panel. Production shows whichever screen the user tapped Add on.
const HOME = homeScenarios.default.dashboard;

/**
 * On phones the panel and Home take turns being the page, so each starts from the top. Production
 * would put the user back where they had scrolled to.
 */
function toTopOnPhones() {
  if (window.matchMedia("(width < 48rem)").matches) window.scrollTo({ top: 0 });
}

/**
 * Whether the panel is open. Next.js keeps a screen's state after the user leaves it, and
 * arriving at /add means "open Add". So a closed panel is set open again as the screen is hidden.
 */
function usePanel() {
  const [open, setOpen] = useState(true);
  useLayoutEffect(
    () => () => {
      setOpen(true);
    },
    [],
  );
  return [open, setOpen] as const;
}

interface QuickAddFrameProps {
  view: QuickAddViewProps;
  /** The form. */
  Body: ComponentType<BodyProps>;
  /** The skeleton, shaped like the form. */
  Loading: ComponentType;
}

/**
 * Quick add's panel over Home, and the states that aren't the form itself: loading, an error, no
 * accounts yet, and what happens after Save.
 */
export function QuickAddFrame({ view, Body, Loading }: QuickAddFrameProps) {
  if (view.status === "ready" && view.quickAdd.accounts.length > 0) {
    return <ReadyFrame quickAdd={view.quickAdd} Body={Body} />;
  }
  return (
    <PlainFrame>
      {view.status === "loading" ? (
        <Loading />
      ) : view.status === "error" ? (
        <LoadError message={view.message} />
      ) : (
        <NoAccounts />
      )}
    </PlainFrame>
  );
}

interface OverHomeProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  home: Dashboard;
  /** The id of the field that takes focus when the panel opens. */
  focusId: string | null;
  children: ReactNode;
}

/** Home with the panel over it. While the panel is open, Home can't be reached. Add opens it again. */
function OverHome({
  open,
  onOpen,
  onClose,
  home,
  focusId,
  children,
}: OverHomeProps) {
  return (
    <AddActionContext value={onOpen}>
      {/* On phones the panel is the page while it is open, so Home leaves the flow. */}
      <div
        inert={open}
        className={cn("flex flex-1 flex-col", open && "max-md:hidden")}
      >
        <DashboardView status="ready" dashboard={home} />
      </div>
      <FormPanel open={open} title="Add" onClose={onClose} focusId={focusId}>
        {children}
      </FormPanel>
    </AddActionContext>
  );
}

/** The panel with something other than the form in it: loading, an error, or no accounts yet. */
function PlainFrame({ children }: { children: ReactNode }) {
  const [open, setOpen] = usePanel();
  return (
    <OverHome
      open={open}
      onOpen={() => {
        setOpen(true);
        toTopOnPhones();
      }}
      onClose={() => {
        setOpen(false);
        toTopOnPhones();
      }}
      home={HOME}
      focusId={null}
    >
      {children}
    </OverHome>
  );
}

interface ReadyFrameProps {
  quickAdd: QuickAdd;
  Body: ComponentType<BodyProps>;
}

/** The panel with the form. What is saved shows on Home behind it at once, with an Undo toast. */
function ReadyFrame({ quickAdd, Body }: ReadyFrameProps) {
  const [open, setOpen] = usePanel();
  // Newest first.
  const [saved, setSaved] = useState<readonly SavedEntry[]>([]);
  const places = toPlaces(
    applyToAccounts(quickAdd.accounts, saved),
    applyToDebts(quickAdd.debts, saved),
  );

  // Counts openings. Each one draws the form afresh: reopened while it is still fading out, the
  // panel would otherwise keep the old Save button, and the toast hands focus back to it.
  const [opening, setOpening] = useState(0);

  const reopen = () => {
    // A toast can't be used while the panel is open, so it goes.
    toast.dismiss();
    setOpening((count) => count + 1);
    setOpen(true);
    toTopOnPhones();
  };

  const form = useEntryForm(quickAdd, places, (row) => {
    setSaved((current) => [row, ...current]);
    setOpen(false);
    toTopOnPhones();
    toast("Saved", {
      description: <SavedLine row={row} places={places} />,
      duration: UNDO_MS,
      action: {
        label: "Undo",
        onClick: () => {
          setSaved((current) =>
            current.filter((other) => other.entry.id !== row.entry.id),
          );
        },
      },
      cancel: { label: "Add another", onClick: reopen },
    });
  });

  // Oldest first, so the newest ends up on top of Latest.
  const home = saved.reduceRight(
    (dashboard, row) => applyEntry(dashboard, row),
    HOME,
  );

  return (
    <OverHome
      open={open}
      onOpen={reopen}
      onClose={() => {
        form.keep();
        setOpen(false);
        toTopOnPhones();
      }}
      home={home}
      focusId={form.amountId}
    >
      <Body key={opening} form={form} />
    </OverHome>
  );
}

interface SavedLineProps {
  row: SavedEntry;
  /** The accounts and debts as they were just before this entry. */
  places: readonly Place[];
}

/**
 * What was saved, and where it leaves the account or debt it touched. It renders inside the
 * shell, so it hides with amounts.
 */
function SavedLine({ row, places }: SavedLineProps) {
  const { entry } = row;
  // For moved money, where it landed is the one worth naming.
  const id = entry.kind === "transfer" ? row.toAccount : row.account;
  const place = places.find((candidate) => candidate.id === id);
  return (
    <span>
      {entry.title} · <Money value={entry.amount} />
      {place !== undefined &&
        (place.debt === null ? (
          <>
            . {place.name} now has <Money value={placeAfter(place, row)} />
          </>
        ) : (
          <>
            . You now owe <Money value={placeAfter(place, row)} /> on{" "}
            {place.name}
          </>
        ))}
    </span>
  );
}

/** The panel couldn't load what it needs: plain words, and a way to try again. */
function LoadError({ message }: { message: string }) {
  const router = useRouter();
  return (
    <section
      role="alert"
      className={cn(
        "flex flex-col items-start gap-4 bg-card py-8",
        BLOCK,
        PANEL_PAD,
      )}
    >
      <h3 className={HEADING}>{"We couldn't open Add"}</h3>
      <p>{message}</p>
      <Button
        className={BIG}
        onClick={() => {
          router.refresh();
        }}
      >
        Try again
      </Button>
    </section>
  );
}

/**
 * First use: nothing can be logged without an account to log it against. Not the `Empty`
 * component: first-use states here are a block with a loud heading, as on Home.
 */
function NoAccounts() {
  return (
    <section
      className={cn(
        "flex flex-col items-start gap-4 bg-card py-8",
        BLOCK,
        PANEL_PAD,
      )}
    >
      <h3 className={HEADING}>Add an account first</h3>
      <p>
        Every entry moves money in or out of an account: a bank, a wallet or
        your cash. Add one, and logging takes a few seconds.
      </p>
      {/* It wraps at 200% zoom, where the label is wider than the screen. */}
      <ScreenLink
        screen="Setup"
        className={cn(
          buttonVariants(),
          BIG,
          "h-auto min-h-12 py-2 text-center whitespace-normal",
        )}
      >
        Add your first account
      </ScreenLink>
    </section>
  );
}
