"use client";

import { type ReactNode, type SyntheticEvent, useId, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { DISPLAY } from "@proto/components/display";
import { saveLabel } from "@proto/components/metals/parts";
import {
  type Holding,
  places,
  type Security,
  type StockPrices,
} from "@proto/fixtures/stocks";
import { BIG, CHIP } from "@proto/screens/setup/look";
import type { HoldingDraft } from "./form";
import {
  costOf,
  displayName,
  GROUP_ADD,
  type HoldingGroup,
  isFund,
  isOwnFund,
  placeName,
  samePlace,
  securityOf,
} from "./holding";
import {
  amountInputId,
  DecimalField,
  HeldAtField,
  SaveFailed,
  SecuritySearch,
  buyInputId,
  ChoiceSwitch,
  WhereToFind,
  Warning,
} from "./parts";
import { BuyRows, TodayPriceHint } from "./buy-rows";
import { HoldingSummary } from "./summary";
import {
  emptyFields,
  errorsOf,
  fieldActions,
  hasErrors,
  type HoldingErrors,
  type HoldingFields,
  type HoldingFieldsState,
  holdingOf,
  NO_ERRORS,
  placeError,
  priceWarning,
  navOfFields,
  quantityOf,
  valueOfFields,
  useSaveHolding,
} from "./use-holding";

// One holding's fields and its panel, which "Add a holding" shows.

/** The id of where a share is held. */
const heldAtId = (base: string) => `${base}-held-at`;

/** The id of today's NAV, for a fund the user added by name. */
const navInputId = (base: string) => `${base}-nav`;

/** Where some holdings are held, by name: "AKD Securities and CDC Investor Account". */
function placesOf(holdings: readonly Holding[]): string {
  const names = holdings.map((holding) =>
    holding.heldAt === null ? "an unnamed place" : placeName(holding.heldAt),
  );
  return names.join(" and ");
}

/** The brokers the user typed for their holdings, not on the list, each once, as first typed. */
function typedBrokers(holdings: readonly Holding[]): string[] {
  const names: string[] = [];
  for (const { heldAt } of holdings) {
    if (heldAt === null || heldAt in places) continue;
    if (!names.some((name) => samePlace(name, heldAt))) names.push(heldAt);
  }
  return names;
}

interface HoldingInputsProps {
  /** Ids inside start with it. */
  id: string;
  security: Security;
  /** The fields, and the ways to change them. */
  holding: HoldingFieldsState;
  prices: StockPrices;
  errors: HoldingErrors;
}

/** How a share, ETF or fund can be entered. Buys come first: the exact days are the fuller record. */
const ENTRIES = [
  { value: "buys", label: "Separate buys" },
  { value: "average", label: "One average" },
] as const;

/**
 * What setup asks about a holding, in the order an app shows it: each buy, with its day, or how
 * many and the average price. A fund's price is the NAV it was bought at, and its help is about
 * the fund app. A fund the user added by name asks for today's NAV first, which the day's prices
 * don't have.
 */
function HoldingInputs({
  id,
  security,
  holding,
  prices,
  errors,
}: HoldingInputsProps) {
  const { fields, set } = holding;
  // Today's close or NAV, or the NAV typed for a fund the user added.
  const price = navOfFields(fields, prices);
  const share = security.kind === "share";
  const fund = isFund(security.kind);

  const ownNav = isOwnFund(security.symbol) ? (
    <DecimalField
      id={navInputId(id)}
      label="Today's NAV"
      text={fields.nav}
      onText={(text) => {
        set({ nav: text });
      }}
      places={4}
      rupees
      hint="As your fund app shows it. It stays at this until you change it."
      error={errors.nav}
    />
  ) : null;

  const switcher = (
    <ChoiceSwitch
      labelId={`${id}-entry`}
      label={share ? "Enter your shares as" : "Enter your units as"}
      options={ENTRIES}
      value={fields.entry}
      onValue={holding.setEntry}
      // The buys' help sits by the question that asks for them. The margin takes back its 44 px
      // target, so the label's line stays its height.
      aside={
        fields.entry === "buys" ? (
          <WhereToFind topic={fund ? "fundBuys" : "buys"} className="-my-3" />
        ) : undefined
      }
    />
  );

  if (fields.entry === "buys") {
    return (
      <>
        {ownNav}
        <div className="flex flex-col gap-4">
          {switcher}
          <BuyRows
            id={id}
            kind={security.kind}
            buys={fields.buys}
            errors={errors.buys}
            today={prices.date}
            todayPrice={price}
            onBuy={holding.setBuy}
            onAdd={holding.addBuy}
            onRemove={holding.removeBuy}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {ownNav}
      <div className="flex flex-col gap-4">
        {switcher}
        <DecimalField
          id={amountInputId(id)}
          label={share ? "Shares you hold" : "Units you hold"}
          text={fields.quantity}
          onText={(text) => {
            set({ quantity: text });
          }}
          places={fund ? 4 : 0}
          hint={
            share
              ? "All of them, in every account, bonus and right shares included."
              : fund
                ? "As your fund app or statement shows them."
                : "All of them, in every account."
          }
          error={errors.quantity}
        />
      </div>
      <div className="flex flex-col gap-2">
        <DecimalField
          id={`${id}-price`}
          label="Average price"
          // The help sits by the number people most often have to look up. The margin takes back
          // its 44 px target, so the label's line stays its height.
          aside={
            <WhereToFind
              topic={fund ? "fundAverage" : "average"}
              className="-my-3"
            />
          }
          text={fields.averagePrice}
          onText={(text) => {
            set({ averagePrice: text });
          }}
          places={4}
          rupees
          hint={
            fund
              ? "The average NAV you paid a unit."
              : "As your broker app shows it."
          }
          error={errors.price}
        />
        {/* As with a buy: the price is needed, and today's is a start for someone without it. */}
        {fields.averagePrice === "" && price !== null && (
          <TodayPriceHint
            todayPrice={price}
            nav={fund}
            onUse={() => {
              set({ averagePrice: String(price) });
            }}
          />
        )}
        <Warning text={priceWarning(fields.averagePrice, price)} />
      </div>
    </>
  );
}

/** The first box with an error, so a failed save can move focus there. */
function firstErrorId(
  id: string,
  fields: HoldingFields,
  errors: HoldingErrors,
): string | null {
  if (errors.symbol !== null) return `${id}-search`;
  if (errors.place !== null) return heldAtId(id);
  if (errors.nav !== null) return navInputId(id);
  if (errors.quantity !== null) return amountInputId(id);
  if (errors.price !== null) return `${id}-price`;
  for (const [index, buy] of fields.buys.entries()) {
    const error = errors.buys[index];
    if (error === undefined) continue;
    if (error.date !== null) return buyInputId(id, buy.key, "date");
    if (error.quantity !== null) return buyInputId(id, buy.key, "quantity");
    if (error.price !== null) return buyInputId(id, buy.key, "price");
  }
  return null;
}

interface HoldingPanelProps {
  id: string;
  /** The kind it adds: its search finds only that kind. */
  group: HoldingGroup;
  titleId: string;
  initial: HoldingFields;
  prices: StockPrices;
  /**
   * This kind's holdings. A fund picked again opens the one added. A share picked again is a new
   * holding for another place, and can't be added twice at the same place.
   */
  others: readonly Holding[];
  draft: HoldingDraft | null;
  isNew: boolean;
  /** What was in the search when the form opened. */
  defaultQuery: string;
  /** A line at the top, such as why this holding opened. */
  note: string | null;
  /** The holdings saved: one for each place the share is held. */
  onSaved: (holdings: readonly Holding[]) => void;
  /** Opens a holding already added: a fund picked again, or a share the user would rather change. */
  onExisting: (holding: Holding) => void;
  /** Null for the first holding: there's nothing to go back to. */
  onCancel: (() => void) | null;
  /** Null for a new holding, which has nothing to remove yet. */
  onRemove: (() => void) | null;
}

/** One place a share is held, among the places entered in one go. Each saves as its own holding. */
interface Part {
  /** New for each place added, for its ids and React key. */
  key: number;
  fields: HoldingFields;
}

/** A place's ids start with the panel's. The first place keeps the panel's own. */
const partId = (base: string, key: number) =>
  key === 0 ? base : `${base}-place-${String(key)}`;

/** A place's name on its tab: where it's held, or its number until that's picked. */
const placeLabel = (part: Part, index: number) =>
  part.fields.heldAt === ""
    ? `Place ${String(index + 1)}`
    : placeName(part.fields.heldAt);

/** Everything about one holding, in the order the user thinks of it: what, how much, what it cost. */
export function HoldingPanel({
  id,
  group,
  titleId,
  initial,
  prices,
  others,
  draft,
  isNew,
  defaultQuery,
  note,
  onSaved,
  onExisting,
  onCancel,
  onRemove,
}: HoldingPanelProps) {
  // A share held in more than one place is entered as places, each saved as its own holding.
  const [parts, setParts] = useState<readonly Part[]>([
    { key: 0, fields: initial },
  ]);
  // The place in view: places are tabs, one in view at a time.
  const [inView, setInView] = useState(0);
  const save = useSaveHolding(onSaved, draft);
  const fallbackId = useId();
  const tried = useTried();
  const lead = parts[0] ?? { key: 0, fields: initial };
  const security =
    lead.fields.symbol === null ? null : securityOf(lead.fields.symbol);
  const name = security === null ? "this holding" : displayName(security);
  // A new share already added elsewhere: this one is for another place.
  const elsewhere =
    isNew && security !== null && !isFund(security.kind)
      ? others.filter((other) => other.symbol === security.symbol)
      : [];

  /** The ways to change one place's fields. */
  const stateOf = (part: Part): HoldingFieldsState =>
    fieldActions(part.fields, (change) => {
      setParts((current) =>
        current.map((each) =>
          each.key === part.key
            ? { ...each, fields: change(each.fields) }
            : each,
        ),
      );
    });

  /** A place as the holding it saves as. */
  const holdingFor = (part: Part) =>
    holdingOf(
      part.fields,
      prices,
      part.fields.id ?? `holding-${fallbackId}-${String(part.key)}`,
    );

  // A place can't be where this share is held already: in another holding, or a place above.
  const errors = parts.map((part): HoldingErrors => ({
    ...errorsOf(part.fields, prices),
    place: placeError(part.fields, [
      ...others,
      ...parts.filter((each) => each.key < part.key).map(holdingFor),
    ]),
  }));
  const shown = (index: number) =>
    tried.value ? (errors[index] ?? NO_ERRORS) : NO_ERRORS;

  const submit = () => {
    tried.set();
    const failing = parts.findIndex((_, index) =>
      hasErrors(errors[index] ?? NO_ERRORS),
    );
    const part = parts[failing];
    if (part !== undefined) {
      // A place out of view comes into view first.
      setInView(part.key);
      const target = firstErrorId(
        partId(id, part.key),
        part.fields,
        errors[failing] ?? NO_ERRORS,
      );
      requestAnimationFrame(() => {
        if (target !== null) document.getElementById(target)?.focus();
      });
      return;
    }
    save.run(parts.map(holdingFor));
  };

  /** Adds another place for the same share, in view, with focus on where it's held. */
  const addPlace = () => {
    const key = parts.reduce((max, each) => Math.max(max, each.key), 0) + 1;
    setParts((current) => [
      ...current,
      {
        key,
        fields: {
          ...emptyFields(lead.fields.symbol),
          entry: lead.fields.entry,
        },
      },
    ]);
    setInView(key);
    requestAnimationFrame(() => {
      document.getElementById(heldAtId(partId(id, key)))?.focus();
    });
  };

  /** Removes a place, and brings the first back into view, with focus on where it's held. */
  const removePlace = (key: number) => {
    setParts((current) => current.filter((each) => each.key !== key));
    setInView(0);
    requestAnimationFrame(() => {
      document.getElementById(heldAtId(partId(id, 0)))?.focus();
    });
  };

  // Today's value, the investment and the profit, of every place together.
  const sums = parts.reduce(
    (sum, part) => {
      const quantity = quantityOf(part.fields);
      const cost =
        security === null
          ? { amount: 0, fromToday: true }
          : costOf(holdingFor(part), prices);
      return {
        quantity: sum.quantity + quantity,
        value: sum.value + valueOfFields(part.fields, prices),
        cost: sum.cost + cost.amount,
        fromToday: sum.fromToday && cost.fromToday,
      };
    },
    { quantity: 0, value: 0, cost: 0, fromToday: true },
  );

  /** One place's fields: where it's held, then its buys or its average. */
  const placeFields = (
    part: Part,
    index: number,
    listed: Security,
    aside?: ReactNode,
  ) => (
    <PlaceFields
      id={partId(id, part.key)}
      security={listed}
      state={stateOf(part)}
      prices={prices}
      errors={shown(index)}
      typed={typedBrokers(others)}
      prefilled={
        isNew &&
        index === 0 &&
        initial.heldAt !== "" &&
        part.fields.heldAt === initial.heldAt
      }
      aside={aside}
    />
  );

  /**
   * The places of a share, as tabs: one place in view, its name on its tab. Each action sits by
   * what it changes. "Add place" ends the row of tabs, or sits by "Held at" while there's one
   * place. "Remove place" sits by an extra place's "Held at".
   */
  const placesOfShare = (listed: Security) => {
    const index = Math.max(
      0,
      parts.findIndex((part) => part.key === inView),
    );
    const part = parts[index] ?? lead;
    return (
      <div className="flex flex-col gap-6">
        {/* Each action sits by what it changes: adding a place ends the row of places. */}
        {parts.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              variant="outline"
              aria-label={`Where ${name} is held`}
              value={[String(part.key)]}
              onValueChange={(next) => {
                const [picked] = next;
                if (picked !== undefined) setInView(Number(picked));
              }}
              spacing={2}
              className="flex-wrap"
            >
              {parts.map((each, eachIndex) => (
                <ToggleGroupItem
                  key={each.key}
                  value={String(each.key)}
                  className={cn(CHIP, "h-11")}
                >
                  {placeLabel(each, eachIndex)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button
              type="button"
              variant="outline"
              className={cn(CHIP, "h-11")}
              onClick={addPlace}
            >
              <Plus data-icon="inline-start" aria-hidden="true" />
              Add place
            </Button>
          </div>
        )}
        {/* The key keeps each place's own search box apart. With one place, adding one sits
              by "Held at"; on another place, removing it does. */}
        <div key={part.key} className="flex flex-col gap-6">
          {placeFields(
            part,
            index,
            listed,
            parts.length === 1 ? (
              <LabelLink onClick={addPlace} adds>
                Add place
              </LabelLink>
            ) : index > 0 ? (
              <LabelLink
                onClick={() => {
                  removePlace(part.key);
                }}
              >
                Remove place
              </LabelLink>
            ) : undefined,
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      aria-labelledby={titleId}
      // On phones a box inside the step card costs width, so the panel is a rule above it there.
      className="border-t border-current/15 pt-5 sm:rounded-2xl sm:border sm:p-6"
    >
      <form
        noValidate
        onSubmit={(event: SyntheticEvent) => {
          event.preventDefault();
          submit();
        }}
        className="flex flex-col gap-6"
      >
        <h3
          id={titleId}
          tabIndex={-1}
          className={cn(
            DISPLAY,
            "text-xl font-extrabold tracking-tight wrap-break-word outline-none",
          )}
        >
          {isNew ? GROUP_ADD[group] : `Change ${name}`}
        </h3>
        {note !== null && <p className="text-sm font-medium">{note}</p>}
        {save.failed && <SaveFailed name={name} />}

        {isNew && (
          <SecuritySearch
            id={`${id}-search`}
            group={group}
            symbol={lead.fields.symbol}
            onPick={(next) => {
              const found =
                next === null
                  ? []
                  : others.filter((other) => other.symbol === next.symbol);
              const [first] = found;
              // A fund picked again opens the one added: its AMC holds it all, in one place.
              if (next !== null && isFund(next.kind) && first !== undefined) {
                onExisting(first);
                return;
              }
              // A fund has no places: it's one holding.
              if (next !== null && isFund(next.kind)) {
                setParts((current) => current.slice(0, 1));
              }
              for (const part of parts) stateOf(part).pick(next);
              // A share picked again is for another place, so it can't start at one it's at.
              if (
                found.some((other) =>
                  samePlace(other.heldAt, lead.fields.heldAt),
                )
              ) {
                stateOf(lead).set({ heldAt: "" });
              }
            }}
            added={others}
            prices={prices}
            defaultQuery={defaultQuery}
            error={shown(0).symbol}
          />
        )}

        {elsewhere.length > 0 && (
          <div className="flex flex-col items-start gap-1">
            <p className="text-sm font-medium">
              {`You have ${name} at ${placesOf(elsewhere)}. This one is for another place.`}
            </p>
            {elsewhere.map((other) => (
              <Button
                key={other.id}
                type="button"
                variant="link"
                className="h-11 px-0 text-sm text-foreground underline"
                onClick={() => {
                  onExisting(other);
                }}
              >
                {other.heldAt === null
                  ? "Change the one you added instead"
                  : `Change the one at ${placeName(other.heldAt)} instead`}
              </Button>
            ))}
          </div>
        )}

        {security !== null && (
          <>
            {/* A fund's AMC holds it, so only shares and ETFs ask where they're held. */}
            {isFund(security.kind) ? (
              <HoldingInputs
                id={id}
                security={security}
                holding={stateOf(lead)}
                prices={prices}
                errors={shown(0)}
              />
            ) : (
              placesOfShare(security)
            )}
            <HoldingSummary
              value={sums.value}
              cost={{ amount: sums.cost, fromToday: sums.fromToday }}
              basis={parts.length > 1 ? "places" : lead.fields.entry}
              quantity={sums.quantity}
              price={navOfFields(lead.fields, prices)}
              security={security}
              prices={prices}
            />
          </>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={save.pending} className={BIG}>
            {saveLabel(save, isNew ? "Add holding" : "Save")}
          </Button>
          {onCancel !== null && (
            <Button
              type="button"
              variant="ghost"
              className={BIG}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          {onRemove !== null && (
            <Button
              type="button"
              variant="ghost"
              className={cn(BIG, "sm:ml-auto")}
              onClick={onRemove}
            >
              Remove
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}

interface PlaceFieldsProps {
  /** Ids inside start with it. */
  id: string;
  security: Security;
  state: HoldingFieldsState;
  prices: StockPrices;
  errors: HoldingErrors;
  /** Brokers the user added for other holdings. */
  typed: readonly string[];
  /** True while it still holds the last holding's place, as it was filled in. */
  prefilled: boolean;
  /** At the right of the "Held at" label: adding a place, or removing this one. */
  aside?: ReactNode;
}

/** One place a share is held: where, then its buys or its average there. */
function PlaceFields({
  id,
  security,
  state,
  prices,
  errors,
  typed,
  prefilled,
  aside,
}: PlaceFieldsProps) {
  return (
    <>
      <HeldAtField
        id={heldAtId(id)}
        value={state.fields.heldAt}
        typed={typed}
        prefilled={prefilled}
        error={errors.place}
        onValue={(heldAt) => {
          state.set({ heldAt });
        }}
        aside={aside}
      />
      <HoldingInputs
        id={id}
        security={security}
        holding={state}
        prices={prices}
        errors={errors}
      />
    </>
  );
}

/**
 * A small link at the right of a field's label, as the help link sits by "Enter your shares as".
 * The margin takes back its 44 px target, so the label's line stays its height.
 */
function LabelLink({
  onClick,
  adds = false,
  children,
}: {
  onClick: () => void;
  /** True for adding: it starts with a plus. */
  adds?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="link"
      className="-my-3 h-11 px-0 text-sm text-foreground underline"
      onClick={onClick}
    >
      {adds && <Plus data-icon="inline-start" aria-hidden="true" />}
      {children}
    </Button>
  );
}

/** Errors show only after the user tried to save, never while they're still typing. */
function useTried() {
  const [value, setValue] = useState(false);
  return {
    value,
    set: () => {
      setValue(true);
    },
  };
}
