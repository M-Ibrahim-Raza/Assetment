"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DISPLAY } from "@proto/components/display";
import type { SecurityKind } from "@proto/fixtures/stocks";
import { formatPkr } from "@proto/kit/format";
import { BIG, TALL_FIELD } from "@proto/screens/setup/look";
import { decimalInput, formatPrice, formatQuantity, isFund } from "./holding";
import { BoxError, buyInputId } from "./parts";
import type { BuyErrors, BuyFields } from "./use-holding";

// A share, ETF or fund bought more than once, buy by buy: the day, how many, and the price a share
// or unit, which for a fund is the NAV it was bought at. The labels
// show once, over columns, and each buy is one row of boxes, like a spreadsheet. On phones, where
// three boxes don't fit across, each buy keeps its labels. Under the buys: a dashed row for the
// next buy, then the total. "Where do I find these numbers?" sits beside "Enter your shares as".

const NO_BUY_ERRORS: BuyErrors = { date: null, quantity: null, price: null };

/** From tablet width: the day is widest, then the price, then how many. */
const COLUMNS = "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)]";
/** The same, with room for the remove button at the end. */
const COLUMNS_REMOVE =
  "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto]";

interface BuyRowsProps {
  /** Ids inside start with it. */
  id: string;
  kind: SecurityKind;
  buys: readonly BuyFields[];
  /** One for each row once the user tried to save, else empty. */
  errors: readonly BuyErrors[];
  /** The latest day a buy can be on: "2026-11-12". */
  today: string;
  /** Today's close, offered when a buy's price isn't known. */
  todayPrice: number | null;
  onBuy: (key: number, patch: Partial<Omit<BuyFields, "key">>) => void;
  /** Adds an empty row and returns its key. */
  onAdd: () => number;
  onRemove: (key: number) => void;
}

export function BuyRows({
  id,
  kind,
  buys,
  errors,
  today,
  todayPrice,
  onBuy,
  onAdd,
  onRemove,
}: BuyRowsProps) {
  const unit = kind === "share" ? "Shares" : "Units";
  const each = kind === "share" ? "a share" : "a unit";
  // A fund's price is the NAV it was bought at, and its units can have decimals.
  const fund = isFund(kind);
  const priceLabel = fund ? "NAV paid" : `Price ${each}`;
  const places = fund ? 4 : 0;
  const removable = buys.length > 1;
  const parsed = buys.map((buy) => ({
    quantity: buy.quantity === "" ? 0 : Number(buy.quantity),
    price: buy.price === "" ? 0 : Number(buy.price),
  }));
  const total = parsed.reduce((sum, buy) => sum + buy.quantity, 0);
  // A row with no shares yet, such as one just added, doesn't hold the average back.
  const priced = parsed
    .filter((buy) => buy.quantity > 0)
    .every((buy) => buy.price > 0);
  const cost = parsed.reduce((sum, buy) => sum + buy.quantity * buy.price, 0);
  const average = priced && total > 0 ? cost / total : null;

  /** Adds a buy, with focus on its day. */
  const add = () => {
    const key = onAdd();
    requestAnimationFrame(() => {
      document.getElementById(buyInputId(id, key, "date"))?.focus();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <ColumnHeads unit={unit} priceLabel={priceLabel} removable={removable} />
      <ol className="flex flex-col">
        {buys.map((buy, index) => {
          const error = errors[index] ?? NO_BUY_ERRORS;
          const name = `Buy ${String(index + 1)}`;
          return (
            <li
              key={buy.key}
              role="group"
              aria-label={name}
              // On phones a hairline parts the buys. From tablet width they're rows under one
              // set of labels, so space alone parts them.
              className="flex flex-col gap-3 border-t border-current/15 py-3 first:border-t-0 first:pt-0 sm:border-t-0 sm:py-1.5"
            >
              <BuyBoxes
                id={id}
                buy={buy}
                error={error}
                name={name}
                today={today}
                unit={unit}
                priceLabel={priceLabel}
                places={places}
                onBuy={onBuy}
                onRemove={
                  removable
                    ? () => {
                        onRemove(buy.key);
                      }
                    : null
                }
              />
              {/* Only the last buy offers today's price, so the rows above stay quiet. */}
              {buy.price === "" &&
                todayPrice !== null &&
                index === buys.length - 1 && (
                  <TodayPriceHint
                    todayPrice={todayPrice}
                    nav={fund}
                    onUse={() => {
                      onBuy(buy.key, {
                        date: today,
                        price: String(todayPrice),
                      });
                    }}
                  />
                )}
            </li>
          );
        })}
      </ol>
      {/* A dashed row where the next buy goes, so it looks unlike the step's own "Add another".
          Then the total under the columns, as a spreadsheet's total row. */}
      <Button
        type="button"
        variant="ghost"
        className={cn(
          BIG,
          "w-full border-dashed border-current/30 hover:border-current/50",
        )}
        onClick={add}
      >
        <Plus data-icon="inline-start" />
        Add another buy
      </Button>
      {total > 0 && (
        <TotalRow
          total={total}
          average={average}
          kind={kind}
          each={each}
          removable={removable}
        />
      )}
    </div>
  );
}

/**
 * The labels, once, over the columns, from tablet width. Each box keeps its own label for screen
 * readers, so these are for the eye only.
 */
function ColumnHeads({
  unit,
  priceLabel,
  removable,
}: {
  unit: string;
  priceLabel: string;
  removable: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "hidden gap-3 text-sm/snug font-medium sm:grid",
        removable ? COLUMNS_REMOVE : COLUMNS,
      )}
    >
      <span>Day bought</span>
      <span>{unit}</span>
      <span>{priceLabel}</span>
      {removable && <span className="w-11" />}
    </div>
  );
}

interface TotalRowProps {
  total: number;
  /** Null until each buy with shares has a price. */
  average: number | null;
  kind: SecurityKind;
  /** "a share" or "a unit". */
  each: string;
  /** True with more than one buy, when the rows end in a remove button. */
  removable: boolean;
}

/**
 * The total as a spreadsheet's last row, in a shaded band so it stands apart from the boxes:
 * "Total", then each figure under its own column, large and in the display face, with a small
 * word under it. From tablet width the figures line up with the typed digits. Phones keep the
 * same three cells, side by side.
 */
function TotalRow({ total, average, kind, each, removable }: TotalRowProps) {
  // "8 shares" becomes the figure, "8", and its word, "shares".
  const [count = "", ...word] = formatQuantity(total, kind).split(" ");
  return (
    <div
      aria-live="polite"
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-baseline gap-3 rounded-xl bg-muted/60 py-3 tabular-nums",
        removable ? COLUMNS_REMOVE : COLUMNS,
      )}
    >
      <span className="px-2.5 text-base font-semibold">Total</span>
      <TotalFigure figure={count} word={`${word.join(" ")} in all`} />
      {average === null ? (
        <span className="px-2.5 text-sm text-muted-foreground">
          The average shows once each buy has a price
        </span>
      ) : (
        <TotalFigure figure={formatPkr(average)} word={`average ${each}`} />
      )}
      {/* Keeps the columns over the remove buttons, from tablet width. */}
      {removable && <span className="hidden w-11 sm:block" />}
    </div>
  );
}

/** One figure in a total row: large, with its word small under it. */
function TotalFigure({ figure, word }: { figure: string; word: string }) {
  return (
    <span className="flex min-w-0 flex-col px-2.5">
      <span className={cn(DISPLAY, "text-xl/tight font-bold")}>{figure}</span>
      <span className="text-sm text-muted-foreground">{word}</span>
    </span>
  );
}

interface BuyBoxesProps {
  id: string;
  buy: BuyFields;
  error: BuyErrors;
  /** "Buy 2". */
  name: string;
  today: string;
  /** "Shares" or "Units". */
  unit: string;
  /** "Price a share", "Price a unit", or a fund's "NAV paid". */
  priceLabel: string;
  /** Decimals in how many: none for shares, 4 for a fund's units. */
  places: number;
  onBuy: (key: number, patch: Partial<Omit<BuyFields, "key">>) => void;
  /** The remove button at the row's end. Null while there's one buy. */
  onRemove: (() => void) | null;
}

/**
 * One buy's three boxes. On phones the day takes a line, with the remove button beside it, and
 * the shares and price share the next, each with its label. From tablet width all of them sit on
 * one line, and the labels are the column heads.
 */
function BuyBoxes({
  id,
  buy,
  error,
  name,
  today,
  unit,
  priceLabel,
  places,
  onBuy,
  onRemove,
}: BuyBoxesProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        onRemove === null
          ? cn("grid-cols-2", COLUMNS)
          : cn("grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]", COLUMNS_REMOVE),
      )}
    >
      <Field
        data-invalid={error.date !== null}
        className="col-span-2 min-w-0 gap-2 sm:col-span-1"
      >
        <FieldLabel
          htmlFor={buyInputId(id, buy.key, "date")}
          className="sm:sr-only"
        >
          Day bought
        </FieldLabel>
        <Input
          id={buyInputId(id, buy.key, "date")}
          type="date"
          max={today}
          value={buy.date}
          onChange={(event) => {
            onBuy(buy.key, { date: event.target.value });
          }}
          aria-invalid={error.date !== null}
          className={TALL_FIELD}
        />
        <BoxError text={error.date} />
      </Field>
      <Field data-invalid={error.quantity !== null} className="min-w-0 gap-2">
        <FieldLabel
          htmlFor={buyInputId(id, buy.key, "quantity")}
          className="sm:sr-only"
        >
          {unit}
        </FieldLabel>
        <Input
          id={buyInputId(id, buy.key, "quantity")}
          inputMode={places === 0 ? "numeric" : "decimal"}
          autoComplete="off"
          value={buy.quantity}
          onChange={(event) => {
            onBuy(buy.key, {
              quantity: decimalInput(event.target.value, places),
            });
          }}
          aria-invalid={error.quantity !== null}
          className={cn(TALL_FIELD, "tabular-nums")}
        />
        <BoxError text={error.quantity} />
      </Field>
      <Field data-invalid={error.price !== null} className="min-w-0 gap-2">
        <FieldLabel
          htmlFor={buyInputId(id, buy.key, "price")}
          className="sm:sr-only"
        >
          {priceLabel}
        </FieldLabel>
        <InputGroup className="h-12">
          <InputGroupAddon>Rs</InputGroupAddon>
          <InputGroupInput
            id={buyInputId(id, buy.key, "price")}
            inputMode="decimal"
            autoComplete="off"
            value={buy.price}
            onChange={(event) => {
              onBuy(buy.key, {
                price: decimalInput(event.target.value, 4),
              });
            }}
            aria-invalid={error.price !== null}
            className="text-base tabular-nums md:text-base"
          />
        </InputGroup>
        <BoxError text={error.price} />
      </Field>
      {/* Last, so it's last by keyboard too. On phones it sits beside the day, level with the box
          under the label. From tablet width it ends the row, level with the boxes. */}
      {onRemove !== null && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Remove ${name.toLowerCase()}`}
          onClick={onRemove}
          className="col-start-3 row-start-1 mt-7.5 size-11 sm:col-start-4 sm:mt-0.5"
        >
          <X />
        </Button>
      )}
    </div>
  );
}

/**
 * While a price is empty, under the last buy or the average: today's price, as a link in the
 * sentence. A fund's is today's NAV.
 */
export function TodayPriceHint({
  todayPrice,
  nav = false,
  onUse,
}: {
  todayPrice: number;
  /** True for a fund: "Use today's NAV". */
  nav?: boolean;
  onUse: () => void;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      {"Don't know what you paid? "}
      <Button
        type="button"
        variant="link"
        // Part of the sentence. A button never splits across lines, so it's one block in the
        // text. The padding gives a 44 px target, and the margin takes it back so the lines don't
        // spread out.
        className="-my-3 inline-block h-auto px-0 py-3 text-left align-baseline text-sm whitespace-normal text-foreground underline"
        onClick={onUse}
      >
        {`Use today's ${nav ? "NAV" : "price"}, ${formatPrice(todayPrice)}`}
      </Button>
      {", and the profit counts from today."}
    </p>
  );
}
