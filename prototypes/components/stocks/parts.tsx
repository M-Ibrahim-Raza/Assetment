"use client";

import {
  ChevronRight,
  CircleAlert,
  Clock,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { DISPLAY } from "@proto/components/display";
import {
  formatGainShare,
  formatRateDate,
} from "@proto/components/metals/weight";
import {
  brokers,
  CDC_ACCOUNT,
  type Holding,
  ownFundSymbol,
  places,
  type Security,
  securities,
  type StockPrices,
} from "@proto/fixtures/stocks";
import { formatLakhCrore, formatPkr } from "@proto/kit/format";
import { CHIP, HAIRLINE } from "@proto/screens/setup/look";
import {
  costOf,
  decimalInput,
  displayName,
  formatPrice,
  formatQuantity,
  GROUP_OF,
  GROUP_SEARCH,
  type HoldingGroup,
  isFund,
  isOwnFund,
  KIND_NAME,
  matches,
  navOf,
  placeName,
  samePlace,
  profitText,
  securityOf,
  totalsOf,
  valueOf,
} from "./holding";

// The parts of the stocks and funds forms, kept apart so each variant, and later Add trade and
// Portfolio, can share them.

/** The type of a field label (`FieldLabel`), for a heading that labels a group, not one field. */
const FIELD_LABEL = "text-sm leading-snug font-medium";

/** The search's results: at most this many, so the list never runs past a phone's screen. */
const RESULTS = 8;

/** What the search box suggests typing. */
const SEARCH_HINT: Readonly<Record<HoldingGroup, string>> = {
  listed: "Name or symbol, like LUCK",
  funds: "Fund or AMC, like Meezan",
};

/** Under the search: how to find one, and for funds, how to add one that isn't on the list. */
const SEARCH_NOTE: Readonly<Record<HoldingGroup, string>> = {
  listed: "Search the way your broker app names it.",
  funds:
    "Search the way your fund app names it. Not on the list? Type its full name to add it.",
};

/** What to try when nothing matches. */
const NO_MATCH: Readonly<Record<HoldingGroup, string>> = {
  listed:
    "Check the spelling, or try the symbol, like LUCK. Shares and ETFs on PSX are here. Add a mutual fund under Mutual funds.",
  funds:
    "Check the spelling, or try the AMC, like Al Meezan or NBP. Pakistani mutual funds are here. Add a share or ETF under Shares and ETFs.",
};

interface SecuritySearchProps {
  id: string;
  /** Which kind it finds: shares and ETFs, or mutual funds. Each has its own entry. */
  group: HoldingGroup;
  /** The picked holding's symbol, or null before one is picked. */
  symbol: string | null;
  onPick: (security: Security | null) => void;
  /** The holdings already added, which the results mark as added, with where they're held. */
  added: readonly Holding[];
  prices: StockPrices;
  /** What was typed when it opened. A query with no match opens on the no-match message. */
  defaultQuery?: string;
  error: string | null;
  /** The label, such as "Which share do you hold?". Without it, the kind: "Share or ETF". */
  label?: string;
  className?: string;
}

/**
 * A result already added: " · Added", and where it's held, " · Added · AKD Securities", so picking
 * it again for another place is a clear choice. Nothing for one not added.
 */
function addedNote(symbol: string, added: readonly Holding[]): string {
  const found = added.filter((holding) => holding.symbol === symbol);
  if (found.length === 0) return "";
  const names = found.flatMap((holding) =>
    holding.heldAt === null ? [] : [placeName(holding.heldAt)],
  );
  return names.length === 0 ? " · Added" : ` · Added · ${names.join(", ")}`;
}

/** One result: a share, ETF or fund, or the last one, which adds a fund by the name typed. */
interface SearchItem {
  security: Security;
  /** True for the last result, which adds what's typed as the user's own fund. */
  adds: boolean;
}

/**
 * Search by name or by symbol: "Lucky" and "LUCK" both find Lucky Cement. Each result says what
 * it is, who runs it, and today's price, so two Meezans can't be mixed up.
 */
export function SecuritySearch({
  id,
  group,
  symbol,
  onPick,
  added,
  prices,
  defaultQuery = "",
  error,
  label,
  className,
}: SecuritySearchProps) {
  // A holding picked before, such as a draft that didn't save, shows its name in the box.
  const [query, setQuery] = useState(
    defaultQuery !== "" || symbol === null
      ? defaultQuery
      : displayName(securityOf(symbol)),
  );
  const noteId = `${id}-note`;
  const typedName = query.trim();
  // Funds the user added by name, each once: those already added, and this one if it's new.
  const own =
    group === "funds"
      ? [
          ...new Set(
            [...added.map((holding) => holding.symbol), symbol ?? ""].filter(
              isOwnFund,
            ),
          ),
        ].map(securityOf)
      : [];
  const options: SearchItem[] = [
    ...securities.filter((security) => GROUP_OF[security.kind] === group),
    ...own,
  ].map((security) => ({ security, adds: false }));
  // A fund that isn't on the list is added by the name typed, unless that names one already, in
  // any case or spacing.
  const items =
    group !== "funds" ||
    typedName === "" ||
    options.some((option) => samePlace(option.security.name, typedName))
      ? options
      : [
          ...options,
          { security: securityOf(ownFundSymbol(typedName)), adds: true },
        ];
  return (
    <Field data-invalid={error !== null} className={className}>
      <FieldLabel htmlFor={id}>{label ?? GROUP_SEARCH[group]}</FieldLabel>
      <Combobox
        items={items}
        value={
          symbol === null ? null : { security: securityOf(symbol), adds: false }
        }
        onValueChange={(next) => {
          onPick(next?.security ?? null);
        }}
        inputValue={query}
        onInputValueChange={setQuery}
        defaultOpen={defaultQuery !== ""}
        itemToStringLabel={(item) => displayName(item.security)}
        isItemEqualToValue={(item, value) =>
          item.security.symbol === value.security.symbol
        }
        filter={(item, search) => item.adds || matches(item.security, search)}
        limit={RESULTS}
        autoHighlight
      >
        <ComboboxInput
          id={id}
          placeholder={SEARCH_HINT[group]}
          autoComplete="off"
          aria-invalid={error !== null}
          aria-describedby={noteId}
          className="h-12 w-full [&_input]:text-base"
        />
        <ComboboxContent>
          <ComboboxEmpty className="flex-col items-start gap-1 p-3 text-left text-base text-foreground">
            <span className="font-semibold">
              {`Nothing matches “${typedName}”.`}
            </span>
            <span className="text-sm text-muted-foreground">
              {NO_MATCH[group]}
            </span>
          </ComboboxEmpty>
          <ComboboxList>
            {(item: SearchItem) => {
              const { security } = item;
              if (item.adds) {
                return (
                  <ComboboxItem
                    key="add"
                    value={item}
                    className="items-start gap-3 py-2 pr-9 text-base"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2 font-medium wrap-break-word">
                        <Plus aria-hidden="true" className="size-4 shrink-0" />
                        {`Add “${security.name}” as a fund`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {"Not on our list. You'll enter its NAV."}
                      </span>
                    </span>
                  </ComboboxItem>
                );
              }
              // A fund the user added shows the NAV they typed for it.
              const price = navOf(
                added.find((holding) => holding.symbol === security.symbol) ?? {
                  symbol: security.symbol,
                },
                prices,
              );
              return (
                <ComboboxItem
                  key={security.symbol}
                  value={item}
                  className="items-start gap-3 py-2 pr-9 text-base"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium wrap-break-word">
                      {displayName(security)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {KIND_NAME[security.kind]} · {security.by}
                      {/* One added by name is the user's own: "Added by you" says it. */}
                      {!isOwnFund(security.symbol) &&
                        addedNote(security.symbol, added)}
                    </span>
                  </span>
                  {price !== null && (
                    <span className="shrink-0 text-sm tabular-nums">
                      {formatPrice(price)}
                    </span>
                  )}
                </ComboboxItem>
              );
            }}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error === null ? (
        <FieldDescription id={noteId}>{SEARCH_NOTE[group]}</FieldDescription>
      ) : (
        <FieldError id={noteId} className="flex items-center gap-1.5">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </FieldError>
      )}
    </Field>
  );
}

interface HeldAtFieldProps {
  id: string;
  /** A place's id, a broker's name the user added, or "" when not said. */
  value: string;
  /** Brokers the user added for other holdings, offered again by name. */
  typed: readonly string[];
  /** True while it still holds the last holding's place, as it was filled in. */
  prefilled: boolean;
  error: string | null;
  onValue: (heldAt: string) => void;
  /** At the label's right: adding a place, or removing this one. */
  aside?: ReactNode;
}

/** One choice in "Held at": a place on the list, a broker the user added, or the one to add. */
interface PlaceOption {
  /** A place's id, or a broker's name. */
  value: string;
  label: string;
  /** A quiet line under the name. */
  note: string | null;
  /** True for the last choice, which adds what's typed as a new broker. */
  adds: boolean;
}

/** The CDC Investor Account first, as it's not a broker, then the brokers A to Z. */
const LISTED_PLACES: readonly PlaceOption[] = [
  {
    value: CDC_ACCOUNT.id,
    label: CDC_ACCOUNT.name,
    note: "In your own name, outside any broker",
    adds: false,
  },
  ...brokers.map((broker) => ({
    value: broker.id,
    label: broker.name,
    note: null,
    adds: false,
  })),
];

/**
 * Where a share is held: a broker, where most people keep theirs, or the CDC Investor Account. One
 * searchable list: typing finds a place, and a broker that isn't there is added from the list's
 * last choice, then offered by name for the next holding. Clearing it leaves it not set. It's
 * optional: it's for the user's own record, and for anyone who later needs to find the shares.
 */
export function HeldAtField({
  id,
  value,
  typed,
  prefilled,
  error,
  onValue,
  aside,
}: HeldAtFieldProps) {
  // A broker this holding is at that no other holding is, such as a draft's, is offered too.
  const names =
    value === "" ||
    value in places ||
    typed.some((name) => samePlace(name, value))
      ? typed
      : [...typed, value];
  const options: PlaceOption[] = [
    ...LISTED_PLACES,
    ...names.map((name) => ({
      value: name,
      label: name,
      note: "Added by you",
      adds: false,
    })),
  ];
  const selected = options.find((option) => option.value === value) ?? null;
  const [query, setQuery] = useState(selected?.label ?? "");
  const typedName = query.trim();
  // What's typed can be added when it isn't a place already, in any case or spacing.
  const items =
    typedName === "" ||
    options.some((option) => samePlace(option.label, typedName))
      ? options
      : [
          ...options,
          { value: typedName, label: typedName, note: null, adds: true },
        ];
  const hintId = `${id}-hint`;
  return (
    <Field data-invalid={error !== null}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <FieldLabel htmlFor={id}>Held at (optional)</FieldLabel>
        {aside}
      </div>
      <Combobox
        items={items}
        value={selected}
        onValueChange={(next) => {
          onValue(next?.value ?? "");
        }}
        inputValue={query}
        onInputValueChange={setQuery}
        itemToStringLabel={(option) => option.label}
        isItemEqualToValue={(item, current) => item.value === current.value}
        filter={(option, search) =>
          option.adds ||
          option.label.toLowerCase().includes(search.trim().toLowerCase())
        }
        autoHighlight
      >
        <ComboboxInput
          id={id}
          placeholder="Search, or type a broker to add"
          autoComplete="off"
          showClear={selected !== null}
          aria-invalid={error !== null}
          aria-describedby={hintId}
          className="h-12 w-full [&_input]:text-base"
        />
        <ComboboxContent>
          <ComboboxList>
            {(option: PlaceOption) => (
              <ComboboxItem
                key={option.adds ? "add" : option.value}
                value={option}
                className="items-start gap-2 py-2 pr-9 text-base"
              >
                {option.adds ? (
                  <span className="flex items-center gap-2 font-medium">
                    <Plus aria-hidden="true" className="size-4 shrink-0" />
                    {`Add “${option.label}” as your broker`}
                  </span>
                ) : (
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium wrap-break-word">
                      {option.label}
                    </span>
                    {option.note !== null && (
                      <span className="text-sm text-muted-foreground">
                        {option.note}
                      </span>
                    )}
                  </span>
                )}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error === null ? (
        <FieldDescription id={hintId}>
          {prefilled
            ? "Filled in from your last holding. Change it if this one's held elsewhere."
            : "Your broker, or the CDC Investor Account. Not on the list? Type its name to add it."}
        </FieldDescription>
      ) : (
        <FieldError id={hintId} className="flex items-start gap-1.5">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </FieldError>
      )}
    </Field>
  );
}

interface DecimalFieldProps {
  id: string;
  label: string;
  /** What was typed, as digits and one point. */
  text: string;
  onText: (text: string) => void;
  /** How many decimals it takes: 0 for shares, 4 for units and prices. */
  places: number;
  /** "Rs" in front, for a price. */
  rupees?: boolean;
  hint: ReactNode;
  error: string | null;
  className?: string;
  /** At the label's right, such as a help link. */
  aside?: ReactNode;
}

/** A number with decimals, such as units or a price: the decimal keypad, and paste works with commas. */
export function DecimalField({
  id,
  label,
  text,
  onText,
  places,
  rupees = false,
  hint,
  error,
  className,
  aside,
}: DecimalFieldProps) {
  const noteId = `${id}-note`;
  return (
    <Field data-invalid={error !== null} className={className}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {aside}
      </div>
      <InputGroup className="h-12">
        {rupees && <InputGroupAddon>Rs</InputGroupAddon>}
        <InputGroupInput
          id={id}
          inputMode={places === 0 ? "numeric" : "decimal"}
          autoComplete="off"
          enterKeyHint="next"
          placeholder="0"
          value={text}
          onChange={(event) => {
            onText(decimalInput(event.target.value, places));
          }}
          aria-invalid={error !== null}
          aria-describedby={noteId}
          className="text-base tabular-nums md:text-base"
        />
      </InputGroup>
      {error === null ? (
        <FieldDescription id={noteId}>{hint}</FieldDescription>
      ) : (
        <FieldError id={noteId} className="flex items-center gap-1.5">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </FieldError>
      )}
    </Field>
  );
}

interface ChoiceSwitchProps<Value extends string> {
  value: Value;
  onValue: (value: Value) => void;
  options: readonly { value: Value; label: string }[];
  labelId: string;
  label: string;
  /** Beside the label, at its right, such as a help link. */
  aside?: ReactNode;
}

/**
 * Two ways to enter the same thing, as a full-width segmented control under its heading: a share's
 * buys or its average, or a fund's units or its value today. The two halves are equal and 44 px
 * tall, and the picked one is filled. Picking swaps the fields below at once, and keeps what was
 * typed.
 */
export function ChoiceSwitch<Value extends string>({
  value,
  onValue,
  options,
  labelId,
  label,
  aside,
}: ChoiceSwitchProps<Value>) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        {/* Set as a field label is, like "Share or ETF" above it. */}
        <span id={labelId} className={FIELD_LABEL}>
          {label}
        </span>
        {aside}
      </div>
      <ToggleGroup
        variant="outline"
        aria-labelledby={labelId}
        value={[value]}
        onValueChange={(next) => {
          const picked = options.find((option) => option.value === next[0]);
          if (picked !== undefined) onValue(picked.value);
        }}
        spacing={0}
        className="w-full"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            // Equal halves: each grows from nothing, so a longer label doesn't take more room.
            className={cn(CHIP, "h-11 grow basis-0 px-3")}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

/** What the help pop-up is about: a share's buys or its average, from the broker app, or a fund's. */
export type FindTopic = "buys" | "average" | "fundBuys" | "fundAverage";

const WHERE: Readonly<
  Record<FindTopic, { title: string; lead: string; tips: readonly string[] }>
> = {
  buys: {
    title: "Where to find your buys",
    lead: "Your broker keeps a record of every buy.",
    tips: [
      "In your broker app, open Trade history or Orders. Each buy shows its day, how many and the price.",
      "Your broker emails a contract note after every trade, with the same details.",
      "Bought too long ago to find? Switch to One average: the app's Portfolio screen shows it.",
      "Don't know what you paid for a buy? Use today's price: the buy's day becomes today, and its profit counts from today.",
    ],
  },
  average: {
    title: "Where to find your average",
    lead: "Your broker app shows it next to each share.",
    tips: [
      "In your broker app, open Portfolio or Holdings. Each share shows how many you hold and the average price.",
      "CDC Access, or the CDC monthly statement, shows how many you hold, but not the price.",
      "Inherited or gifted? Use today's price, and its profit counts from today.",
    ],
  },
  fundBuys: {
    title: "Where to find your buys",
    lead: "Your fund app and your statement keep a record of every buy.",
    tips: [
      "In your fund app, such as Al Meezan, Mahaana, NBP Funds or UBL Funds, open Transactions. Each buy shows its day, the units and the NAV.",
      "Your account statement lists every buy, with the same details.",
      "Paid a sales load? Enter the price you paid a unit with the load: your statement's offer price. A new fund then shows a small loss at first. That's the load.",
      "Too many to enter? Switch to One average.",
      "Don't know the NAV you paid? Use today's NAV: the buy's day becomes today, and its profit counts from today.",
    ],
  },
  fundAverage: {
    title: "Where to find your average",
    lead: "Your fund app shows your units, and what you paid for them.",
    tips: [
      "In your fund app, the portfolio screen shows the units you hold.",
      "If it shows what you invested rather than an average, divide that by your units.",
      "Paid a sales load? Keep it in: divide all you paid, load included, by your units. A new fund then shows a small loss at first. That's the load.",
      "Gifted or inherited? Use today's NAV, and its profit counts from today.",
    ],
  },
};

interface WhereToFindProps {
  topic: FindTopic;
  /** Where it sits, when that's not on a line of its own. */
  className?: string;
}

/**
 * "Where do I find these numbers?", as a quiet link that opens a pop-up with where each number is
 * kept, like Gold's help for a weight.
 */
export function WhereToFind({ topic, className }: WhereToFindProps) {
  const [open, setOpen] = useState(false);
  // Focus goes back to the link when the pop-up closes.
  const triggerId = useId();
  const help = WHERE[topic];
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => {
      document.getElementById(triggerId)?.focus();
    });
  };
  return (
    <>
      <Button
        id={triggerId}
        type="button"
        variant="link"
        // Its text lines up with the text around it: no side padding, and 44 px tall to tap.
        className={cn(
          "h-11 self-start px-0 text-sm text-foreground underline",
          className,
        )}
        onClick={() => {
          setOpen(true);
        }}
      >
        Where do I find these numbers?
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) setOpen(true);
          else close();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{help.title}</DialogTitle>
            <DialogDescription>{help.lead}</DialogDescription>
          </DialogHeader>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            {help.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button type="button" onClick={close}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** The id of how many are held, so a form can move focus there. */
export const amountInputId = (base: string) => `${base}-amount`;

/** The id of one box in a buy row, so a form can move focus to it. */
export const buyInputId = (
  base: string,
  key: number,
  box: "date" | "quantity" | "price",
) => `${base}-buy-${String(key)}-${box}`;

/** A box's own error, under it. */
export function BoxError({ text }: { text: string | null }) {
  if (text === null) return null;
  return (
    <FieldError className="flex items-start gap-1.5">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {text}
    </FieldError>
  );
}

/** A warning that never blocks saving, such as a price that looks a decimal point out. */
export function Warning({ text }: { text: string | null }) {
  return (
    <div role="status">
      {text !== null && (
        <p className="flex items-start gap-2 rounded-lg border border-current/25 p-3 text-sm font-medium">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          {text}
        </p>
      )}
    </div>
  );
}

/** Where each kind's prices come from: PSX closing prices, or each fund's NAV. */
const PRICED_AT: Readonly<Record<HoldingGroup, string>> = {
  listed: "PSX closing prices",
  funds: "each fund's NAV",
};

/**
 * The day of the prices. Old prices say so calmly: the value still shows. Funds the user added
 * are at the NAVs they typed, which the note says too.
 */
export function PriceNote({
  group,
  prices,
  own = false,
  className,
}: {
  group: HoldingGroup;
  prices: StockPrices;
  /** True when some are funds the user added, at the NAVs they typed. */
  own?: boolean;
  className?: string;
}) {
  // A no-break space keeps "12 Nov" on one line.
  const date = formatRateDate(prices.date).replace(" ", "\u00a0");
  if (!prices.stale) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Based on {PRICED_AT[group]} of {date}
        {own ? ", and the NAVs you entered." : "."}
      </p>
    );
  }
  return (
    <p className={cn("flex items-start gap-2 text-sm", className)}>
      <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="font-semibold">Prices from {date}.</span>{" "}
        {
          "Today's closing prices aren't out yet. We'll update them when they are."
        }
      </span>
    </p>
  );
}

/**
 * Where today's price comes from: "PSX closing price on 12 Nov", or "fund's NAV on 12 Nov" for a
 * fund. A fund the user added is at the NAV they typed.
 */
export function priceSource(security: Security, prices: StockPrices): string {
  if (isOwnFund(security.symbol)) return "NAV you entered";
  // A no-break space, so the day and month never part.
  const date = formatRateDate(prices.date).replace(" ", " ");
  return isFund(security.kind)
    ? `fund's NAV on ${date}`
    : `PSX closing price on ${date}`;
}

/** Each kind's figures, as a broker or fund app shows them: how many, then the average paid. */
const FIGURES: Readonly<
  Record<HoldingGroup, { count: string; paid: string; paidShort: string }>
> = {
  listed: { count: "Shares", paid: "Avg price", paidShort: "avg" },
  funds: { count: "Units", paid: "Avg price", paidShort: "avg" },
};

/** From tablet width, the figures' columns: how many, what was paid, and today's value. */
const COUNT_COLUMN = "sm:w-24 sm:text-right";
const PAID_COLUMN = "sm:w-28 sm:text-right";
const VALUE_COLUMN = "sm:w-40";

/** A row's figures sit in a grid from tablet width, the same as the heads over them. */
const ROW_GRID =
  "sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center sm:gap-4";

interface HoldingListProps {
  /** Which kind: its column heads say "Shares" or "Units", then "Avg price". */
  group: HoldingGroup;
  /** Names the list for screen readers, such as "Your shares and ETFs". */
  label: string;
  holdings: readonly Holding[];
  prices: StockPrices;
  /** The id of a row's button, so focus can come back to it. */
  rowId: (holdingId: string) => string;
  onOpen: (holding: Holding) => void;
  /** A holding open in place: its panel shows where its row was. */
  open: { id: string; node: ReactNode } | null;
}

/**
 * The saved holdings of one kind, as a broker app lists them: from tablet width, column heads
 * once over the rows, and each figure under its own. On phones the figures sit under the name. A
 * row opens in place to change or remove it.
 */
export function HoldingList({
  group,
  label,
  holdings,
  prices,
  rowId,
  onOpen,
  open,
}: HoldingListProps) {
  // Where each is held only tells rows apart when they're held in more than one place.
  const showPlace = new Set(holdings.map((holding) => holding.heldAt)).size > 1;
  const figures = FIGURES[group];
  return (
    <div className="flex flex-col">
      {/* For the eye only: each figure carries its own words for screen readers. */}
      <div
        aria-hidden="true"
        className="hidden items-center gap-3 border-b border-current/15 pb-2 text-sm font-medium text-muted-foreground sm:flex"
      >
        <span className={cn("flex-1", ROW_GRID)}>
          <span />
          <span className={COUNT_COLUMN}>{figures.count}</span>
          <span className={PAID_COLUMN}>{figures.paid}</span>
          <span className={cn(VALUE_COLUMN, "text-right")}>
            {"Today's value"}
          </span>
        </span>
        {/* Over the rows' arrows. */}
        <span className="w-4 shrink-0" />
      </div>
      <ul aria-label={label} className="flex flex-col">
        {holdings.map((holding) =>
          open?.id === holding.id ? (
            <li key={holding.id} className="py-2">
              {open.node}
            </li>
          ) : (
            <HoldingRow
              key={holding.id}
              id={rowId(holding.id)}
              group={group}
              holding={holding}
              prices={prices}
              showPlace={showPlace}
              onOpen={() => {
                onOpen(holding);
              }}
            />
          ),
        )}
      </ul>
    </div>
  );
}

interface HoldingRowProps {
  id: string;
  group: HoldingGroup;
  holding: Holding;
  prices: StockPrices;
  /** True when the list's holdings are held in more than one place. */
  showPlace: boolean;
  onOpen: () => void;
}

/**
 * A saved holding: what it is, how many, what was paid, today's value and its profit. The whole
 * row opens it, in place.
 */
function HoldingRow({
  id,
  group,
  holding,
  prices,
  showPlace,
  onOpen,
}: HoldingRowProps) {
  const security = securityOf(holding.symbol);
  const value = valueOf(holding, prices);
  const cost = costOf(holding, prices);
  const place = holding.heldAt === null ? null : placeName(holding.heldAt);
  const figures = FIGURES[group];
  // "150 shares" is the figure, "150", and its word, "shares".
  const [count = "", ...word] = formatQuantity(
    holding.quantity,
    security.kind,
  ).split(" ");
  const paid = holding.averagePrice;
  return (
    <li className={HAIRLINE}>
      <button
        id={id}
        type="button"
        onClick={onOpen}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-3 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className={cn("flex min-w-0 flex-1 flex-col gap-1", ROW_GRID)}>
          <span className="flex min-w-0 flex-col">
            <span className="font-semibold wrap-break-word">
              {displayName(security)}
            </span>
            {showPlace && place !== null && (
              <span className="text-sm text-muted-foreground">{place}</span>
            )}
          </span>
          {/* On phones the figures sit in a row under the name, with the value at its end. From
              tablet width the wrappers step aside, and each figure is a column of the grid. */}
          <span className="flex items-start justify-between gap-3 sm:contents">
            <span className="flex flex-wrap gap-x-3 text-sm font-medium tabular-nums sm:contents sm:text-base">
              <span className={COUNT_COLUMN}>
                {count}
                <span className="sm:sr-only">{` ${word.join(" ")}`}</span>
              </span>
              <span className={PAID_COLUMN}>
                <span className="sm:sr-only">{`${figures.paidShort} `}</span>
                {paid === null ? (
                  <>
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">not known</span>
                  </>
                ) : (
                  formatPkr(paid)
                )}
              </span>
            </span>
            <span
              className={cn(VALUE_COLUMN, "flex shrink-0 flex-col items-end")}
            >
              <Money value={value} className="font-bold" />
              <span className="text-sm text-muted-foreground tabular-nums">
                {cost.fromToday ? (
                  "counts from today"
                ) : (
                  <span className="text-foreground">
                    {profitText(value - cost.amount, cost.amount)}
                  </span>
                )}
              </span>
            </span>
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
      </button>
    </li>
  );
}

/** Under the rows: today's value of them all, and the profit on those with a price. */
export function Totals({
  group,
  holdings,
  prices,
}: {
  group: HoldingGroup;
  holdings: readonly Holding[];
  prices: StockPrices;
}) {
  const totals = totalsOf(holdings, prices);
  const spoken = formatLakhCrore(totals.value);
  const own = holdings.some((holding) => isOwnFund(holding.symbol));
  const priced = holdings.length - totals.fromToday;
  return (
    <div className="flex flex-col gap-2 border-t-2 border-current/25 pt-3">
      {/* The day of the prices sits under the label, beside the lakh note, not on a line of its
          own. Old prices get their own calm line at the end instead. */}
      <div className="flex flex-wrap items-start justify-between gap-x-3">
        <span className="flex flex-col">
          <span className="font-semibold">{"Today's value"}</span>
          {!prices.stale && (
            <PriceNote group={group} prices={prices} own={own} />
          )}
        </span>
        <span className="ml-auto text-right">
          <Money value={totals.value} className="text-lg font-bold" />
          {spoken !== null && <span className="block text-sm">{spoken}</span>}
        </span>
      </div>
      {/* The profit as a holding's summary shows it: its own row, the figure large in the display
          face, signed and coloured, and its share under it. */}
      {priced > 0 && (
        <p className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 border-t border-current/15 pt-3">
          <span className="flex flex-col">
            <span className="font-semibold">
              {totals.profit < 0 ? "Loss as of today" : "Profit as of today"}
            </span>
            <span className="text-sm text-muted-foreground">
              {priced === 1 ? "On 1 holding" : `On ${String(priced)} holdings`}
            </span>
          </span>
          <span className="ml-auto flex flex-col items-end">
            <Money
              value={totals.profit}
              signed
              className={cn(
                DISPLAY,
                "text-xl/tight font-extrabold tracking-tight",
                totals.profit > 0
                  ? "text-gain"
                  : totals.profit < 0
                    ? "text-loss"
                    : "",
              )}
            />
            {totals.cost > 0 && (
              <span className="text-sm tabular-nums">
                {formatGainShare(totals.profit / totals.cost)}
              </span>
            )}
          </span>
        </p>
      )}
      {totals.fromToday > 0 && (
        <p className="text-sm text-muted-foreground">
          {totals.fromToday === 1
            ? "1 has no price, so its profit counts from today."
            : `${String(totals.fromToday)} have no price, so their profit counts from today.`}
        </p>
      )}
      {prices.stale && <PriceNote group={group} prices={prices} />}
    </div>
  );
}

/** A save that failed. What was typed is still in the form. */
export function SaveFailed({ name }: { name: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{`We couldn't save ${name}`}</AlertTitle>
      <AlertDescription>
        What you typed is still here. Check your connection and try again.
      </AlertDescription>
    </Alert>
  );
}
