"use client";

import { Ellipsis, Plus } from "lucide-react";
import Link from "next/link";
import { type ReactNode, type SyntheticEvent, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { ScreenLink } from "@proto/components/screen-link";
import { useProtoAction } from "@proto/kit/use-proto-action";
import { screenRoutes } from "@proto/screens";
import { SHEET, SHEET_TITLE } from "@proto/screens/spending/customize-sheet";
import type { CategoryBook } from "./scenarios";

/** A toast with an action stays at least 10 s. */
const UNDO_MS = 10_000;

/** How many entries a category has, in all the data. */
export function entryCount(book: CategoryBook, name: string): number {
  return book.months.reduce(
    (all, month) =>
      all + month.entries.filter((entry) => entry.category === name).length,
    0,
  );
}

/** "1 entry", "42 entries". */
export function entriesWord(count: number): string {
  return `${String(count)} ${count === 1 ? "entry" : "entries"}`;
}

function renameIn(book: CategoryBook, from: string, to: string): CategoryBook {
  const swap = (name: string) => (name === from ? to : name);
  return {
    ...book,
    categories: book.categories.map(swap),
    hidden: book.hidden.map(swap),
    months: book.months.map((month) => ({
      ...month,
      entries: month.entries.map((entry) =>
        entry.category === from ? { ...entry, category: to } : entry,
      ),
    })),
  };
}

/**
 * The book, held in memory, with the ways to look after its categories. Rename, hide and deleting
 * an unused category happen at once, with Undo. Merge is confirmed first, so it has no Undo.
 */
export function useBook(initial: CategoryBook) {
  const [book, setBook] = useState(initial);

  const undoable = (message: string, undo: () => void) => {
    toast(message, {
      duration: UNDO_MS,
      action: { label: "Undo", onClick: undo },
    });
  };

  return {
    book,
    add: (name: string) => {
      setBook((now) => ({ ...now, categories: [...now.categories, name] }));
      undoable(`${name} added`, () => {
        setBook((now) => ({
          ...now,
          categories: now.categories.filter((one) => one !== name),
        }));
      });
    },
    rename: (from: string, to: string) => {
      setBook((now) => renameIn(now, from, to));
      undoable(`${from} renamed to ${to}`, () => {
        setBook((now) => renameIn(now, to, from));
      });
    },
    hide: (name: string) => {
      setBook((now) => ({ ...now, hidden: [...now.hidden, name] }));
      undoable(`${name} hidden. It won't show when you add an entry.`, () => {
        setBook((now) => ({
          ...now,
          hidden: now.hidden.filter((one) => one !== name),
        }));
      });
    },
    unhide: (name: string) => {
      setBook((now) => ({
        ...now,
        hidden: now.hidden.filter((one) => one !== name),
      }));
      undoable(`${name} is back in the pickers`, () => {
        setBook((now) => ({ ...now, hidden: [...now.hidden, name] }));
      });
    },
    /** Moves every entry into another category. The first is gone. */
    merge: (from: string, into: string) => {
      setBook((now) => {
        const moved = renameIn(now, from, into);
        return {
          ...moved,
          categories: now.categories.filter((one) => one !== from),
          hidden: now.hidden.filter((one) => one !== from),
        };
      });
      toast(`${from} merged into ${into}`);
    },
    /** Only for a category with no entries. */
    remove: (name: string) => {
      const index = book.categories.indexOf(name);
      const wasHidden = book.hidden.includes(name);
      setBook((now) => ({
        ...now,
        categories: now.categories.filter((one) => one !== name),
        hidden: now.hidden.filter((one) => one !== name),
      }));
      undoable(`${name} deleted`, () => {
        setBook((now) => ({
          ...now,
          categories: now.categories.toSpliced(index, 0, name),
          hidden: wasHidden ? [...now.hidden, name] : now.hidden,
        }));
      });
    },
  };
}

export type BookState = ReturnType<typeof useBook>;

/** What's wrong with a name, or null: empty, too long, or one the person already has. */
function nameProblem(
  name: string,
  taken: readonly string[],
  keep?: string,
): string | null {
  const clean = name.trim();
  if (clean === "") return "Give it a name.";
  if (clean.length > 60) return "Keep it under 60 letters.";
  const same = taken.find(
    (one) => one !== keep && one.toLowerCase() === clean.toLowerCase(),
  );
  return same === undefined ? null : `You already have ${same}.`;
}

/** A name in a sheet: Add category, or Rename. The error shows after the first try, and the text stays. */
function NameDialog({
  open,
  onOpenChange,
  title,
  description,
  initial,
  submit,
  taken,
  keep,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initial: string;
  /** The button's words, "Add category" or "Rename". */
  submit: string;
  /** Names already used. */
  taken: readonly string[];
  /** The category's own name, which may stay. */
  keep?: string;
  onSubmit: (name: string) => void;
}) {
  const id = useId();
  const [name, setName] = useState(initial);
  const [tried, setTried] = useState(false);
  const problem = nameProblem(name, taken, keep);

  const send = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (problem !== null) return;
    onSubmit(name.trim());
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setName(initial);
          setTried(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className={SHEET}>
        <form onSubmit={send} className="flex flex-col gap-5">
          <DialogHeader className="pr-10">
            <DialogTitle className={SHEET_TITLE}>{title}</DialogTitle>
            <DialogDescription className="text-base">
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-name`} className="text-sm font-medium">
              Name
            </Label>
            <Input
              id={`${id}-name`}
              value={name}
              autoComplete="off"
              autoCapitalize="sentences"
              enterKeyHint="done"
              aria-invalid={tried && problem !== null}
              aria-describedby={
                tried && problem !== null ? `${id}-problem` : undefined
              }
              onChange={(event) => {
                setName(event.target.value);
              }}
              className="h-11 text-base"
            />
            {tried && problem !== null && (
              <p
                id={`${id}-problem`}
                className="text-sm font-medium text-destructive"
              >
                {problem}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" size="lg" className="h-11">
              {submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** "Add category", which opens a sheet for its name. A secondary button: Add, in the nav, is the one primary. */
export function AddCategoryButton({
  state,
  className,
}: {
  state: BookState;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className={cn("h-11", className)}
        onClick={() => {
          setOpen(true);
        }}
      >
        <Plus aria-hidden="true" />
        Add category
      </Button>
      <NameDialog
        open={open}
        onOpenChange={setOpen}
        title="Add a category"
        description="It shows when you add an entry, and here once something is spent in it."
        initial=""
        submit="Add category"
        taken={state.book.categories}
        onSubmit={state.add}
      />
    </>
  );
}

/** Picks the category to merge into, then confirms, naming both and how many entries move. */
function MergeDialog({
  open,
  onOpenChange,
  state,
  name,
  onMerged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: BookState;
  name: string;
  onMerged?: ((into: string) => void) | undefined;
}) {
  const id = useId();
  const [into, setInto] = useState<string | null>(null);
  const others = state.book.categories.filter((one) => one !== name);
  const count = entryCount(state.book, name);
  const merge = useProtoAction((target: string) => {
    state.merge(name, target);
    onOpenChange(false);
    onMerged?.(target);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setInto(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className={SHEET}>
        <DialogHeader className="pr-10">
          <DialogTitle className={SHEET_TITLE}>Merge {name} into…</DialogTitle>
          <DialogDescription className="text-base">
            {count === 0
              ? `${name} has no entries. Merging just removes it.`
              : `Its ${entriesWord(count)} move to the category you pick, and ${name} is gone. This can't be undone.`}
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          aria-label={`Merge ${name} into`}
          value={into ?? ""}
          onValueChange={(value: unknown) => {
            setInto(others.find((one) => one === value) ?? null);
          }}
          className="-mx-1 flex max-h-[45svh] flex-col gap-0 overflow-y-auto p-1"
        >
          {others.map((other, index) => (
            <Label
              key={other}
              htmlFor={`${id}-${String(index)}`}
              className="flex min-h-11 items-center gap-3 rounded-xl p-2 text-base font-normal hover:bg-muted"
            >
              <RadioGroupItem id={`${id}-${String(index)}`} value={other} />
              <span className="min-w-0 wrap-break-word">{other}</span>
              {state.book.hidden.includes(other) && (
                <span className="ml-auto text-sm text-muted-foreground">
                  Hidden
                </span>
              )}
            </Label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button
            size="lg"
            className="h-11"
            disabled={into === null || merge.pending}
            onClick={() => {
              if (into !== null) merge.run(into);
            }}
          >
            {merge.pending
              ? "Merging…"
              : into === null
                ? "Pick a category"
                : `Merge into ${into}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A category with entries can't be deleted: this says why and offers Merge. */
function DeleteBlockedDialog({
  open,
  onOpenChange,
  name,
  count,
  onMerge,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  count: number;
  onMerge: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SHEET}>
        <DialogHeader className="pr-10">
          <DialogTitle className={SHEET_TITLE}>
            {name} has {entriesWord(count)}
          </DialogTitle>
          <DialogDescription className="text-base">
            To delete it, merge it into another category, so its entries keep a
            home. Or hide it: it keeps its history and leaves the pickers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            size="lg"
            className="h-11"
            onClick={() => {
              onOpenChange(false);
              onMerge();
            }}
          >
            Merge instead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The ⋯ menu on a category's page: Rename, Hide (or Unhide), Merge into… and Delete. Delete
 * happens at once for a category with no entries; with entries, it leads to Merge.
 */
export function CategoryMenu({
  state,
  name,
  onMerged,
  onDeleted,
  more = [],
  className,
}: {
  state: BookState;
  name: string;
  /** After a merge, with the category it went into. */
  onMerged?: (into: string) => void;
  onDeleted?: () => void;
  /** More items, after Merge into… and before Delete, such as "Auto-file places…". */
  more?: readonly { label: string; onSelect: () => void }[];
  /** The trigger's colours, such as white on ink. */
  className?: string;
}) {
  const [open, setOpen] = useState<"rename" | "merge" | "blocked" | null>(null);
  const hidden = state.book.hidden.includes(name);
  const count = entryCount(state.book, name);
  const close = (next: boolean) => {
    if (!next) setOpen(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`More for ${name}`}
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
            className,
          )}
        >
          <Ellipsis aria-hidden="true" className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-52">
          <DropdownMenuItem
            className="min-h-11 text-base"
            onClick={() => {
              setOpen("rename");
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11 text-base"
            onClick={() => {
              if (hidden) state.unhide(name);
              else state.hide(name);
            }}
          >
            {hidden ? "Unhide" : "Hide"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11 text-base"
            onClick={() => {
              setOpen("merge");
            }}
          >
            Merge into…
          </DropdownMenuItem>
          {more.map((item) => (
            <DropdownMenuItem
              key={item.label}
              className="min-h-11 text-base"
              onClick={item.onSelect}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="min-h-11 text-base"
            onClick={() => {
              if (count > 0) {
                setOpen("blocked");
                return;
              }
              state.remove(name);
              onDeleted?.();
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NameDialog
        open={open === "rename"}
        onOpenChange={close}
        title={`Rename ${name}`}
        description="Its entries, past and future, go with it."
        initial={name}
        submit="Rename"
        taken={state.book.categories}
        keep={name}
        onSubmit={(next) => {
          if (next !== name) state.rename(name, next);
        }}
      />
      <MergeDialog
        open={open === "merge"}
        onOpenChange={close}
        state={state}
        name={name}
        onMerged={onMerged}
      />
      <DeleteBlockedDialog
        open={open === "blocked"}
        onOpenChange={close}
        name={name}
        count={count}
        onMerge={() => {
          setOpen("merge");
        }}
      />
    </>
  );
}

/** "Hidden · 2": the label for the row that holds hidden categories. */
export function hiddenLabel(count: number): string {
  return `Hidden · ${String(count)}`;
}

/** The Entries page's screen, from the other session. Until it's built, links to it are stand-ins. */
const ENTRIES_SCREEN = "Entries";

/**
 * A link to the Entries page, narrowed: a category, and a place and a month when given, as
 * `?category=Groceries&q=Imtiaz&month=2026-03`. Until that page is built, it looks the same but
 * goes nowhere.
 */
export function EntriesLink({
  category,
  place,
  month,
  className,
  children,
}: {
  category: string;
  place?: string | undefined;
  month?: string | undefined;
  className?: string;
  children: ReactNode;
}) {
  const route = screenRoutes[ENTRIES_SCREEN];
  if (route === undefined) {
    return (
      <ScreenLink screen={ENTRIES_SCREEN} className={className}>
        {children}
      </ScreenLink>
    );
  }
  const query: Record<string, string> = { category };
  if (place !== undefined) query.q = place;
  if (month !== undefined) query.month = month;
  return (
    <Link href={{ pathname: route, query }} className={className}>
      {children}
    </Link>
  );
}
