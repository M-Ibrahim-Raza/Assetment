"use client";

import { ArrowRight, Check } from "lucide-react";
import { type ReactNode, type Ref, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { BLOCK, EYEBROW, HEADING, INK, PAD } from "@proto/components/blocks";
import { DISPLAY } from "@proto/components/display";
import { ScreenLink } from "@proto/components/screen-link";
import type { Account, AccountKind } from "@proto/fixtures/accounts";
import { BIG, STEP_CARD, STEP_FOOTER } from "./look";
import {
  AmountQuestion,
  type Draft,
  NameQuestion,
  StandInQuestion,
  TITLE,
} from "./question-parts";
import { AccountRows, AddAnother } from "./rows";
import {
  GROUPS,
  type ItemKind,
  type Setup,
  type SetupGroup,
  type SetupItem,
  type SetupViewProps,
  type Thing,
} from "./scenarios";
import {
  LOUD,
  ON_GREEN,
  OwnOweTiles,
  ResumedNote,
  Reveal,
  SetupError,
  SetupFrame,
} from "./setup-frame";
import {
  GROUP_HELP,
  GROUP_LABEL,
  isAccountKind,
  ITEM_GROUP,
  KIND_LABEL,
  OWED_THINGS,
  OWNED_THINGS,
  sum,
  THINGS,
} from "./things";
import { StepPath } from "./step-path";
import {
  type SetupState,
  usePlace,
  useSetup,
  useStepHeading,
} from "./use-setup";

/** Every thing on the board, in its order. The questions after the board follow the same order. */
const ALL_THINGS: readonly Thing[] = [...OWNED_THINGS, ...OWED_THINGS];

// The questions inside an account's step: which one, and how much is in it. Cash has no name to ask.
type Asked =
  "bank-name" | "bank-amount" | "wallet-name" | "wallet-amount" | "cash-amount";
const ASKED: Readonly<
  Record<Asked, { kind: AccountKind; ask: "name" | "amount" }>
> = {
  "bank-name": { kind: "bank", ask: "name" },
  "bank-amount": { kind: "bank", ask: "amount" },
  "wallet-name": { kind: "wallet", ask: "name" },
  "wallet-amount": { kind: "wallet", ask: "amount" },
  "cash-amount": { kind: "cash", ask: "amount" },
};
const isAsked = (place: string): place is Asked => Object.hasOwn(ASKED, place);

// The welcome, the board, a step for each thing, the questions inside them, and the finish.
type Place = "welcome" | "start" | Thing | Asked | "done";
const PLACES: readonly Place[] = [
  "welcome",
  "start",
  ...ALL_THINGS,
  ...Object.keys(ASKED).filter(isAsked),
  "done",
];

/** The question that opens a bank or wallet step, and the one for adding another. */
const NAME_QUESTION: Readonly<
  Record<"bank" | "wallet", { first: string; another: string }>
> = {
  bank: {
    first: "Which bank is your account with?",
    another: "Which other bank?",
  },
  wallet: { first: "Which wallet do you use?", another: "Which other wallet?" },
};

/** Above a kind's accounts so far. */
const LIST_QUESTION: Readonly<Record<AccountKind, string>> = {
  bank: "Any other bank account?",
  wallet: "Any other wallet?",
  cash: "Your cash in hand",
};

// The user said they have these, so each asks "which" or "how much", not "any".
const ITEM_QUESTION: Readonly<
  Record<ItemKind, { title: string; help: string }>
> = {
  metals: {
    title: "How much gold and silver do you have?",
    help: GROUP_HELP.metals,
  },
  stocks: {
    title: "Which stocks and funds do you hold?",
    help: GROUP_HELP.stocks,
  },
  property: { title: "What property do you own?", help: GROUP_HELP.property },
  loan: {
    title: "What loans do you have?",
    help: "From a bank, a company or a person.",
  },
  card: {
    title: "Which credit cards have a balance?",
    help: "What you owe on each today.",
  },
  committee: {
    title: "Which committees are you in?",
    help: "The turns you still have to pay.",
  },
};

const PAGE = "mx-auto flex w-full max-w-5xl flex-col gap-3";
// The step card is narrower than the board: one question reads better on a short line.
const STEPS = "mx-auto flex w-full max-w-3xl flex-col gap-3";
// A tile on the board: the name in the display face, a line under it, and a tick that fills.
const TILE =
  "h-auto flex-col items-stretch justify-between gap-1 rounded-2xl p-4 sm:min-h-24 sm:gap-3 text-left whitespace-normal";
// A ticked tile's green fill. A toggle takes it while pressed.
const PRESSED =
  "aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90 aria-pressed:hover:text-primary-foreground";
// A tile with something added keeps the fill. It's a button, so it also beats the outline's dark fill.
const FILLED =
  "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground dark:border-primary dark:bg-primary dark:hover:bg-primary/90";
const TILES = "grid gap-2 sm:grid-cols-2 md:grid-cols-3";

const groupOf = (thing: Thing): SetupGroup =>
  isAccountKind(thing) ? "accounts" : ITEM_GROUP[thing];

interface Entered {
  accounts: readonly Account[];
  items: readonly SetupItem[];
  ticked: readonly Thing[];
}

/** What is added under a tile: how many, and their total in whole rupees. */
interface Added {
  count: number;
  total: number;
}

/**
 * One step for each thing ticked, or already added, in the board's order. `open` is the step on
 * screen, which counts as ticked: after a reload the prototype's ticks reset, and the URL keeps it.
 */
function pathOf(
  { accounts, items, ticked }: Entered,
  open: Thing | null = null,
): Thing[] {
  return ALL_THINGS.filter(
    (thing) =>
      thing === open ||
      ticked.includes(thing) ||
      (isAccountKind(thing)
        ? accounts.some((account) => account.kind === thing)
        : items.some((item) => item.kind === thing)),
  );
}

/**
 * Setup as a personal path. A welcome, then a board of tiles where the user ticks what they have.
 * Then one question at a time about those only, on a white card under a named step bar. The net
 * worth so far sits at the end of the bar, and in full at the end.
 */
export function SetupView(props: SetupViewProps) {
  return (
    <SetupFrame>
      <Body {...props} />
    </SetupFrame>
  );
}

function Body(props: SetupViewProps) {
  if (props.status === "loading") return <Loading />;
  if (props.status === "error") return <SetupError message={props.message} />;
  return <Wizard setup={props.setup} />;
}

/** Where a scenario opens: the welcome, the failed amount, the first step of its group, or the end. */
function openingPlace(setup: Setup): Place {
  if (setup.at === "start") return "welcome";
  if (setup.at === "done") return setup.at;
  if (setup.failedDraft !== null) return `${setup.failedDraft.kind}-amount`;
  return pathOf(setup).find((thing) => groupOf(thing) === setup.at) ?? "start";
}

/** The thing a place belongs to. The welcome, the board and the finish belong to none. */
function thingAt(place: Place): Thing | null {
  if (place === "welcome" || place === "start" || place === "done") {
    return null;
  }
  return isAsked(place) ? ASKED[place].kind : place;
}

/** An amount with no account to ask about (after a reload) falls back to its step. */
function shownPlace(wanted: Place, draft: Draft | null): Place {
  if (!isAsked(wanted)) return wanted;
  const { kind, ask } = ASKED[wanted];
  return ask === "amount" && draft?.kind !== kind ? kind : wanted;
}

function Wizard({ setup }: { setup: Setup }) {
  const state = useSetup(setup);
  const {
    place: wanted,
    go,
    moved,
  } = usePlace<Place>(PLACES, openingPlace(setup));
  const [draft, setDraft] = useState<Draft | null>(
    setup.failedDraft === null ? null : { id: null, ...setup.failedDraft },
  );
  const [failed, setFailed] = useState(setup.failedDraft !== null);
  const path = pathOf(state, thingAt(wanted));
  const place = shownPlace(wanted, draft);
  const rowsOf = (kind: AccountKind) =>
    state.accounts.filter((account) => account.kind === kind);
  // An empty account step asks its first question. Once it has rows, the same step lists them.
  const heading = useStepHeading(
    isAccountKind(place) && rowsOf(place).length === 0
      ? `${place}-first`
      : place,
  );

  // The step bar shows the groups with something on the path, at most five.
  const groups = GROUPS.filter((group) =>
    path.some((thing) => groupOf(thing) === group),
  );
  const index = (thing: Thing) => path.indexOf(thing);
  const backOf = (thing: Thing): Place => path[index(thing) - 1] ?? "start";
  const nextLabel = (thing: Thing) => {
    const after = path[index(thing) + 1];
    return after === undefined
      ? "See my net worth"
      : `Next: ${THINGS[after].plural}`;
  };

  /** Leaves a thing. Leaving the last thing of a group ticks the group on the step bar. */
  const moveOn = (thing: Thing) => {
    const after = path[index(thing) + 1];
    if (after === undefined || groupOf(after) !== groupOf(thing)) {
      state.answer(groupOf(thing));
    }
    go(after ?? "done");
  };

  const askAmount = (next: Draft) => {
    setDraft(next);
    setFailed(false);
    go(`${next.kind}-amount`);
  };

  const saveAmount = (target: Draft, balance: number) => {
    state.saveAccount(
      { kind: target.kind, name: target.name, balance },
      target.id,
    );
    setDraft(null);
    setFailed(false);
    // New cash moves on: there's rarely a second. A bank or wallet shows its list, to add another.
    if (target.kind === "cash" && target.id === null) {
      moveOn("cash");
    } else {
      go(target.kind);
    }
  };

  /** What is added under a tile: how many, and what they add up to. */
  const addedUnder = (thing: Thing): Added => {
    const amounts = isAccountKind(thing)
      ? rowsOf(thing).map((account) => account.balance)
      : state.items
          .filter((item) => item.kind === thing)
          .map((item) => item.amount);
    return { count: amounts.length, total: sum(amounts) };
  };
  const isAdded = (thing: Thing) => addedUnder(thing).count > 0;

  /**
   * A question about one thing, on a white card under the step bar. A step that holds more than
   * one ticked thing lists them as pills under the bar.
   */
  const step = (thing: Thing, onBack: () => void, question: ReactNode) => {
    const group = groupOf(thing);
    const parts = path.filter((each) => groupOf(each) === group);
    return (
      <div className={STEPS}>
        {setup.resumed && !moved && <ResumedNote />}
        <section className={STEP_CARD}>
          <div className="flex flex-col gap-3">
            <StepPath
              steps={groups}
              current={group}
              answered={state.answered}
              onGo={(target) => {
                go(path.find((each) => groupOf(each) === target) ?? "start");
              }}
              onBack={onBack}
              soFar={state.netWorth}
            />
            {parts.length > 1 && (
              <Parts
                group={group}
                parts={parts}
                current={thing}
                isAdded={isAdded}
                onGo={go}
              />
            )}
          </div>
          {question}
        </section>
      </div>
    );
  };

  if (place === "welcome") {
    return (
      <Welcome
        heading={heading}
        onStart={() => {
          go("start");
        }}
      />
    );
  }

  if (place === "start") {
    return (
      <Board
        state={state}
        heading={heading}
        count={pathOf(state).length}
        addedUnder={addedUnder}
        onOpen={go}
        onContinue={() => {
          go(path[0] ?? "start");
        }}
      />
    );
  }

  if (place === "done") {
    return (
      <Finish
        state={state}
        heading={heading}
        animate={moved}
        onChange={() => {
          go("start");
        }}
      />
    );
  }

  if (isAsked(place)) {
    const { kind, ask } = ASKED[place];
    const toStep = () => {
      go(kind);
    };
    if (ask === "amount" && draft !== null) {
      // Back to the name only while adding another: the first name was asked on the step itself.
      const fromName =
        draft.id === null && kind !== "cash" && rowsOf(kind).length > 0;
      return step(
        kind,
        fromName
          ? () => {
              go(`${kind}-name`);
            }
          : toStep,
        <AmountQuestion
          key={draft.id ?? draft.name}
          draft={draft}
          failed={failed}
          heading={heading}
          onSave={(balance) => {
            saveAmount(draft, balance);
          }}
        />,
      );
    }
    return step(
      kind,
      toStep,
      <NameQuestion
        key={kind}
        kind={kind}
        title={NAME_QUESTION[kind === "wallet" ? "wallet" : "bank"].another}
        heading={heading}
        onPick={(name) => {
          askAmount({ id: null, kind, name, balance: null });
        }}
        skip={null}
      />,
    );
  }

  const thing = place;
  const back = () => {
    go(backOf(thing));
  };

  if (!isAccountKind(thing)) {
    return step(
      thing,
      back,
      <StandInQuestion
        key={thing}
        title={ITEM_QUESTION[thing].title}
        help={ITEM_QUESTION[thing].help}
        kinds={[thing]}
        state={state}
        heading={heading}
        labels={{
          yes: "Add a sample",
          no: "Skip for now",
          next: nextLabel(thing),
        }}
        onDone={() => {
          moveOn(thing);
        }}
      />,
    );
  }

  const rows = rowsOf(thing);
  if (rows.length > 0) {
    return step(
      thing,
      back,
      <AccountList
        kind={thing}
        rows={rows}
        heading={heading}
        nextLabel={nextLabel(thing)}
        onAdd={() => {
          go(thing === "wallet" ? "wallet-name" : "bank-name");
        }}
        onEdit={(account) => {
          askAmount({ ...account });
        }}
        onRemove={state.removeAccount}
        onNext={() => {
          moveOn(thing);
        }}
      />,
    );
  }

  const skip = {
    label: "Skip for now",
    onSkip: () => {
      moveOn(thing);
    },
  };
  if (thing === "cash") {
    const cash: Draft = {
      id: null,
      kind: "cash",
      name: THINGS.cash.label,
      balance: null,
    };
    return step(
      thing,
      back,
      <AmountQuestion
        key="cash"
        draft={cash}
        failed={false}
        heading={heading}
        onSave={(balance) => {
          saveAmount(cash, balance);
        }}
        skip={skip}
      />,
    );
  }
  return step(
    thing,
    back,
    <NameQuestion
      key={thing}
      kind={thing}
      title={NAME_QUESTION[thing].first}
      heading={heading}
      onPick={(name) => {
        askAmount({ id: null, kind: thing, name, balance: null });
      }}
      skip={skip}
    />,
  );
}

interface PartsProps {
  group: SetupGroup;
  /** The ticked things inside the step, in the board's order. */
  parts: readonly Thing[];
  current: Thing;
  isAdded: (thing: Thing) => boolean;
  onGo: (thing: Thing) => void;
}

/**
 * The parts of a step, such as Bank, Wallet and Cash in Accounts, as pills. The current one is ink,
 * as a picked chip is, and a part with something added gets a tick. Any part can be opened.
 */
function Parts({ group, parts, current, isAdded, onGo }: PartsProps) {
  return (
    <ol
      aria-label={`Parts of ${GROUP_LABEL[group]}`}
      className="flex flex-wrap gap-2"
    >
      {parts.map((thing) => {
        const isCurrent = thing === current;
        const added = isAdded(thing);
        const name = isAccountKind(thing)
          ? KIND_LABEL[thing]
          : THINGS[thing].label;
        return (
          <li key={thing}>
            <Button
              variant="outline"
              size="lg"
              aria-current={isCurrent ? "step" : undefined}
              // The tick is only a picture, so the name says it too.
              aria-label={added ? `${name}, added` : undefined}
              onClick={() => {
                onGo(thing);
              }}
              // The current part's ink fill: a look still being chosen in the prototype.
              className={cn(
                "px-3.5",
                isCurrent &&
                  "bg-foreground text-background hover:bg-foreground/90 hover:text-background dark:bg-foreground dark:hover:bg-foreground/90",
              )}
            >
              {added && <Check data-icon="inline-start" />}
              {name}
            </Button>
          </li>
        );
      })}
    </ol>
  );
}

interface BoardProps {
  state: SetupState;
  heading: Ref<HTMLHeadingElement>;
  /** How many things are ticked or already have something added. */
  count: number;
  addedUnder: (thing: Thing) => Added;
  /** Opens the step of a tile that has something added. */
  onOpen: (thing: Thing) => void;
  onContinue: () => void;
}

/** The board: what you own on white, what you owe on ink, as on Home. Ticking is the only job. */
function Board({
  state,
  heading,
  count,
  addedUnder,
  onOpen,
  onContinue,
}: BoardProps) {
  const tiles = { state, addedUnder, onOpen };
  return (
    <div className={PAGE}>
      <section
        className={cn(
          "flex flex-col gap-6 bg-card py-8 text-card-foreground",
          BLOCK,
          PAD,
        )}
      >
        <div className="flex flex-col gap-2">
          <h2 ref={heading} tabIndex={-1} className={cn(LOUD, "outline-none")}>
            What do you have?
          </h2>
          <p className="text-lg">
            {"Tick what applies. We'll ask about those, one at a time."}
          </p>
        </div>
        <Tiles label="What you own" things={OWNED_THINGS} {...tiles} />
      </section>

      <section className={cn("flex flex-col gap-6 py-8", INK, BLOCK, PAD)}>
        <h2 className={HEADING}>And what do you owe?</h2>
        <Tiles label="What you owe" things={OWED_THINGS} {...tiles} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 py-2">
        <p className="font-medium">
          {count === 0
            ? "Tick at least one to go on."
            : "You can change this later."}
        </p>
        <Button className={BIG} disabled={count === 0} onClick={onContinue}>
          {count === 0 ? "Continue" : `Continue with ${String(count)}`}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}

interface TilesProps {
  /** Names the group for screen readers. */
  label: string;
  things: readonly Thing[];
  state: SetupState;
  addedUnder: (thing: Thing) => Added;
  onOpen: (thing: Thing) => void;
}

/**
 * The tiles of one side of the board. A tile with something added under it stays ticked, says what
 * is in it, and opens its step: a tap on a tile never removes accounts.
 */
function Tiles({ label, things, state, addedUnder, onOpen }: TilesProps) {
  return (
    <div role="group" aria-label={label} className={TILES}>
      {things.map((thing) => {
        const added = addedUnder(thing);
        if (added.count > 0) {
          const owed = groupOf(thing) === "debts";
          return (
            <Button
              key={thing}
              variant="outline"
              onClick={() => {
                onOpen(thing);
              }}
              // The tile's size and its ticked colour: a look still being chosen in the prototype.
              className={cn(TILE, FILLED)}
            >
              <TileHead label={THINGS[thing].label} ticked />
              <span className="text-sm font-semibold">
                {added.count} added ·{" "}
                <Money
                  value={owed ? -added.total : added.total}
                  signed={owed}
                />
              </span>
            </Button>
          );
        }
        const ticked = state.ticked.includes(thing);
        return (
          <Toggle
            key={thing}
            variant="outline"
            pressed={ticked}
            onPressedChange={() => {
              state.toggleTick(thing);
            }}
            // The tile's size and its ticked colour: a look still being chosen in the prototype.
            className={cn(TILE, PRESSED)}
          >
            <TileHead label={THINGS[thing].label} ticked={ticked} />
            <span className="text-sm font-normal opacity-80">
              {THINGS[thing].hint}
            </span>
          </Toggle>
        );
      })}
    </div>
  );
}

/** A tile's name in the display face, and its tick, which fills when ticked. */
function TileHead({ label, ticked }: { label: string; ticked: boolean }) {
  return (
    <span className="flex items-start justify-between gap-2">
      <span
        className={cn(
          DISPLAY,
          "min-w-0 text-xl/tight font-extrabold wrap-break-word",
        )}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-current",
          ticked && "bg-primary-foreground text-primary",
        )}
      >
        {ticked && <Check className="size-4" />}
      </span>
    </span>
  );
}

/** What setup does, in three lines, as the list on the welcome screen. */
const WELCOME_STEPS = [
  {
    title: "Tick what you have",
    line: "Bank accounts, gold, property, loans. Skip what you don't have.",
  },
  {
    title: "Add rough amounts",
    line: "One question at a time. You can correct them later.",
  },
  {
    title: "See your net worth",
    line: "Everything you own, minus everything you owe.",
  },
] as const;

interface WelcomeProps {
  heading: Ref<HTMLHeadingElement>;
  onStart: () => void;
}

/** The first screen after sign-up: what setup is for, what it asks, and how long it takes. */
function Welcome({ heading, onStart }: WelcomeProps) {
  return (
    <section
      className={cn(
        "mx-auto grid w-full max-w-5xl gap-8 py-8 md:py-12 lg:grid-cols-2 lg:items-center lg:gap-12",
        ON_GREEN,
        BLOCK,
        PAD,
      )}
    >
      <div className="flex flex-col items-start gap-5">
        <p className={EYEBROW}>Welcome to Assetment</p>
        <h2 ref={heading} tabIndex={-1} className={cn(LOUD, "outline-none")}>
          {"Let's find your number."}
        </h2>
        <p className="max-w-md text-lg">
          {
            "Your net worth is everything you own minus everything you owe. Tell us what you have, and we'll add it up."
          }
        </p>
        <Button variant="secondary" className={BIG} onClick={onStart}>
          Start
          <ArrowRight data-icon="inline-end" />
        </Button>
        <p className="text-sm">
          About 5 minutes. Stop any time with Finish later.
        </p>
      </div>
      <ol className="flex flex-col">
        {WELCOME_STEPS.map((item, index) => (
          <li
            key={item.title}
            className="flex gap-4 border-t border-primary-foreground/25 py-4 first:border-t-0"
          >
            <span
              aria-hidden="true"
              className={cn(
                DISPLAY,
                "w-7 shrink-0 text-3xl leading-none font-extrabold",
              )}
            >
              {index + 1}
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-lg font-semibold">{item.title}</span>
              <span>{item.line}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

interface AccountListProps {
  kind: AccountKind;
  rows: readonly Account[];
  heading: Ref<HTMLHeadingElement>;
  nextLabel: string;
  onAdd: () => void;
  onEdit: (account: Account) => void;
  onRemove: (account: Account) => void;
  onNext: () => void;
}

/** A kind's accounts so far, a way to add another, and the way on. */
function AccountList({
  kind,
  rows,
  heading,
  nextLabel,
  onAdd,
  onEdit,
  onRemove,
  onNext,
}: AccountListProps) {
  return (
    <>
      <h2 ref={heading} tabIndex={-1} className={TITLE}>
        {LIST_QUESTION[kind]}
      </h2>
      <div className="flex flex-col gap-2">
        <AccountRows accounts={rows} onEdit={onEdit} onRemove={onRemove} />
        {kind !== "cash" && (
          <AddAnother
            label={
              kind === "wallet" ? "Add another wallet" : "Add another bank"
            }
            onClick={onAdd}
          />
        )}
      </div>
      <div className={STEP_FOOTER}>
        <Button className={BIG} onClick={onNext}>
          {nextLabel}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </>
  );
}

interface FinishProps {
  state: SetupState;
  heading: Ref<HTMLHeadingElement>;
  /** True when the user just got here, so the number counts up. */
  animate: boolean;
  onChange: () => void;
}

/** The number on green, the two parts under it, and a way back to the board. */
function Finish({ state, heading, animate, onChange }: FinishProps) {
  return (
    <div className={PAGE}>
      <section
        className={cn(
          "flex flex-col items-start gap-6 py-8 md:py-12",
          ON_GREEN,
          BLOCK,
          PAD,
        )}
      >
        <Reveal netWorth={state.netWorth} animate={animate} heading={heading} />
        <ScreenLink
          screen="Dashboard"
          className={cn(buttonVariants({ variant: "secondary" }), BIG)}
        >
          Go to Home
          <ArrowRight data-icon="inline-end" />
        </ScreenLink>
      </section>
      <OwnOweTiles owned={state.owned} owed={state.owed} />
      <Button
        variant="ghost"
        className={cn(BIG, "self-start")}
        onClick={onChange}
      >
        Change what I have
      </Button>
    </div>
  );
}

/** Shaped like the board: a heading, then the tiles. */
function Loading() {
  return (
    <div aria-busy="true" className={PAGE}>
      <span className="sr-only">Loading your setup</span>
      <div className={cn("flex flex-col gap-6 bg-card py-8", BLOCK, PAD)}>
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-64 max-w-full" />
        <div className={TILES}>
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
      <div className={cn("flex flex-col gap-6 py-8", INK, BLOCK, PAD)}>
        <Skeleton className="h-8 w-64 max-w-full bg-(--ink-foreground)/20" />
        <div className={TILES}>
          <Skeleton className="h-24 rounded-2xl bg-(--ink-foreground)/20" />
          <Skeleton className="h-24 rounded-2xl bg-(--ink-foreground)/20" />
          <Skeleton className="h-24 rounded-2xl bg-(--ink-foreground)/20" />
        </div>
      </div>
    </div>
  );
}
