"use client";

import { ChevronDown, ChevronRight, TriangleAlert } from "lucide-react";
import { type SyntheticEvent, useId, useState } from "react";
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
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { BoughtDate } from "@proto/components/bought-date";
import { DISPLAY } from "@proto/components/display";
import {
  FIRST_RATE_MONTH,
  type Karat,
  type MetalPiece,
  type MetalRates,
  monthRates,
  type WeightUnit,
} from "@proto/fixtures/metals";
import {
  formatDigits,
  formatLakhCrore,
  formatPkr,
  formatSignedPkr,
} from "@proto/kit/format";
import { BIG, CHIP, HAIRLINE } from "@proto/screens/setup/look";
import { AddAnother } from "@proto/screens/setup/rows";
import { type MetalsFormProps, OTHER_KIND, TYPICAL_WEIGHTS } from "./form";
import {
  DoneFooter,
  KaratChips,
  KindChoice,
  NameField,
  PaidField,
  RateNote,
  SaveFailed,
  saveLabel,
  SkipButton,
  TITLE,
  ValueLine,
  WeightField,
  weightInputId,
} from "./parts";
import {
  boughtError,
  boughtOf,
  cutError,
  defaultName,
  fieldsFor,
  fieldsOf,
  gramsInput,
  type Piece,
  type PieceFields,
  percentText,
  pieceOf,
  usePiece,
  useSavePiece,
  weightError,
} from "./use-piece";
import {
  type Cost,
  costOf,
  describe,
  formatBought,
  formatCut,
  formatGainShare,
  formatWeight,
  rateIn,
  rateOf,
  UNIT_WORD,
  valueOf,
} from "./weight";

// The gold and silver form, "Add a piece". One panel holds everything about a piece, top to
// bottom: its name, gold or silver, jewellery or a bar or coin, the karat and the weight, today's
// value, when it was bought and what was paid, the jeweller's deduction, and a summary with the
// profit as of today. The panel is open for the first piece. Saved pieces are rows above it, with
// a total, and a row opens in place to change it.

/** A small label above a group of fields. */
const GROUP_LABEL = "text-sm font-medium";

export function AddPieceForm({
  title,
  help,
  pieces,
  rates,
  deduction,
  onSave,
  onRemove,
  draft,
  heading,
  done,
  skip,
}: MetalsFormProps) {
  const id = useId();
  const [unit, setUnit] = useState<WeightUnit>(
    draft?.piece.unit ?? pieces.at(-1)?.unit ?? "tola",
  );
  // The deduction typed last, so the same jeweller's cut isn't typed twice.
  const [lastCut, setLastCut] = useState(() =>
    percentText(
      pieces.findLast((piece) => piece.cut !== null)?.cut ?? deduction,
    ),
  );
  const fresh = (): PieceFields => ({
    ...fieldsFor(OTHER_KIND, unit),
    cut: lastCut,
  });
  // The panel: open for the first piece, on "Add a piece", or on a row. A new key resets it.
  const [panel, setPanel] = useState<{
    key: number;
    fields: PieceFields;
  } | null>(() => {
    if (draft !== null) return { key: 0, fields: fieldsOf(draft.piece) };
    return pieces.length === 0 ? { key: 0, fields: fresh() } : null;
  });
  const panelTitleId = `${id}-panel-title`;

  const open = (fields: PieceFields) => {
    setPanel((current) => ({ key: (current?.key ?? 0) + 1, fields }));
    requestAnimationFrame(() => {
      document.getElementById(panelTitleId)?.focus();
    });
  };

  /** A saved piece in the panel. Jewellery priced at the general deduction shows it as its own. */
  const edit = (piece: MetalPiece) => {
    const fields = fieldsOf(piece);
    open(
      piece.form === "jewellery" && piece.cut === null
        ? { ...fields, cut: percentText(deduction) }
        : fields,
    );
  };

  const values = pieces.map((piece) => valueOf(piece, rates, deduction));
  const editingId = panel?.fields.id ?? null;
  const isNew = !pieces.some((piece) => piece.id === editingId);
  const rowId = (pieceId: string) => `${id}-row-${pieceId}`;

  /** Closes the panel. After a change, focus goes back to the row, so the user keeps their place. */
  const close = (focus: string | null) => {
    setPanel(null);
    if (focus === null) return;
    requestAnimationFrame(() => {
      document.getElementById(focus)?.focus();
    });
  };

  const form =
    panel === null ? null : (
      <PiecePanel
        key={panel.key}
        id={`${id}-panel`}
        titleId={panelTitleId}
        initial={panel.fields}
        rates={rates}
        draft={
          draft !== null && draft.piece.id === panel.fields.id ? draft : null
        }
        isNew={isNew}
        onUnit={setUnit}
        onSaved={(saved) => {
          onSave(saved);
          setUnit(saved.unit);
          if (saved.form === "jewellery") {
            setLastCut(saved.cut === null ? "" : percentText(saved.cut));
          }
          close(isNew ? null : rowId(saved.id));
        }}
        onCancel={
          pieces.length === 0
            ? null
            : () => {
                close(editingId === null || isNew ? null : rowId(editingId));
              }
        }
        onRemove={
          isNew
            ? null
            : () => {
                const piece = pieces.find((each) => each.id === editingId);
                if (piece !== undefined) onRemove(piece);
                close(null);
              }
        }
      />
    );

  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 ref={heading} tabIndex={-1} className={TITLE}>
          {title}
        </h2>
        <p>{help}</p>
      </div>

      {pieces.length > 0 && (
        <div className="flex flex-col">
          <ul aria-label="Your pieces" className="flex flex-col">
            {pieces.map((piece, index) =>
              // A row being changed opens in place, so the user keeps their place in the list.
              piece.id === editingId && form !== null ? (
                <li key={piece.id} className="py-2">
                  {form}
                </li>
              ) : (
                <PieceRow
                  key={piece.id}
                  id={rowId(piece.id)}
                  piece={piece}
                  value={values[index] ?? 0}
                  onOpen={() => {
                    edit(piece);
                  }}
                />
              ),
            )}
          </ul>
          <Totals pieces={pieces} values={values} rates={rates} />
        </div>
      )}

      {panel === null ? (
        <AddAnother
          label="Add a piece"
          onClick={() => {
            open(fresh());
          }}
        />
      ) : (
        isNew && form
      )}

      {pieces.length === 0 ? (
        <SkipButton skip={skip} />
      ) : (
        panel === null && <DoneFooter done={done} />
      )}
    </>
  );
}

/**
 * A gain or loss with its share of the cost: "+Rs 85,800 (+20.8%)". ≈ in front when the cost was
 * worked out from the month it was bought, not a price paid.
 */
function profitText(profit: number, cost: number, estimated: boolean): string {
  const share = cost === 0 ? "" : ` (${formatGainShare(profit / cost)})`;
  return `${estimated ? "≈ " : ""}${formatSignedPkr(profit)}${share}`;
}

interface PieceRowProps {
  /** The row's button, so focus can come back to it after a change. */
  id: string;
  piece: MetalPiece;
  value: number;
  onOpen: () => void;
}

/** A saved piece: what it is, today's value and its profit. The whole row opens it, in place. */
function PieceRow({ id, piece, value, onOpen }: PieceRowProps) {
  const cost = costOf(piece, monthRates);
  return (
    <li className={HAIRLINE}>
      <button
        id={id}
        type="button"
        onClick={onOpen}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-3 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {/* On phones the value drops under the name, so a long name has the full width. */}
        <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold wrap-break-word">{piece.name}</span>
            <span className="text-sm text-muted-foreground">
              {formatWeight(piece)} · {describe(piece)}
              {piece.bought !== null && ` · ${formatBought(piece.bought)}`}
            </span>
          </span>
          <span className="flex shrink-0 flex-col sm:items-end">
            <span className="font-bold tabular-nums">
              {piece.estimated && <span aria-hidden="true">≈ </span>}
              <Money value={value} />
            </span>
            {cost !== null && (
              <span className="text-sm tabular-nums">
                {profitText(
                  value - cost.amount,
                  cost.amount,
                  cost.rate !== null,
                )}
              </span>
            )}
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
      </button>
    </li>
  );
}

interface TotalsProps {
  pieces: readonly MetalPiece[];
  values: readonly number[];
  rates: MetalRates;
}

/** Under the rows: today's value of them all, and the profit on those with a known cost. */
function Totals({ pieces, values, rates }: TotalsProps) {
  const total = values.reduce((sum, value) => sum + value, 0);
  const spoken = formatLakhCrore(total);
  const costed = pieces.flatMap((piece, index) => {
    const cost = costOf(piece, monthRates);
    return cost === null ? [] : [{ cost, value: values[index] ?? 0 }];
  });
  const worked = costed.some((each) => each.cost.rate !== null);
  const cost = costed.reduce((sum, each) => sum + each.cost.amount, 0);
  const profit = costed.reduce(
    (sum, each) => sum + each.value - each.cost.amount,
    0,
  );
  return (
    <div className="flex flex-col gap-2 border-t-2 border-current/25 pt-3">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-semibold">{"Today's value"}</span>
        <span className="ml-auto text-right">
          <Money value={total} className="text-lg font-bold" />
          {spoken !== null && <span className="block text-sm">{spoken}</span>}
        </span>
      </p>
      {costed.length > 0 && (
        <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
          <span>
            Profit on{" "}
            {costed.length === 1
              ? "1 piece"
              : `${String(costed.length)} pieces`}
          </span>
          <span className="ml-auto font-semibold tabular-nums">
            {profitText(profit, cost, worked)}
          </span>
        </p>
      )}
      {worked && (
        <p className="text-sm text-muted-foreground">
          ≈ Where there is no price, the cost is worked out from the month it
          was bought.
        </p>
      )}
      <RateNote rates={rates} />
    </div>
  );
}

interface PiecePanelProps {
  id: string;
  titleId: string;
  initial: PieceFields;
  rates: MetalRates;
  draft: MetalsFormProps["draft"];
  isNew: boolean;
  onUnit: (unit: WeightUnit) => void;
  onSaved: (piece: MetalPiece) => void;
  /** Null for the first piece: there's nothing to go back to. */
  onCancel: (() => void) | null;
  /** Null for a new piece, which has nothing to remove yet. */
  onRemove: (() => void) | null;
}

/** Everything about one piece, in the order the user thinks of it. */
function PiecePanel({
  id,
  titleId,
  initial,
  rates,
  draft,
  isNew,
  onUnit,
  onSaved,
  onCancel,
  onRemove,
}: PiecePanelProps) {
  const piece = usePiece(initial, onUnit);
  const { fields, set, setKind } = piece;
  const [tried, setTried] = useState(false);
  const [asking, setAsking] = useState(false);
  const save = useSavePiece(onSaved, draft);
  const jewellery = fields.form === "jewellery";
  // The prototype's today is the day of the rates.
  const thisMonth = rates.date.slice(0, 7);

  const errors = {
    weight: weightError(fields),
    bought: boughtError(fields, thisMonth),
    cut: cutError(fields),
  };
  const shown = tried ? errors : { weight: null, bought: null, cut: null };
  const cut =
    jewellery && errors.cut === null && fields.cut !== ""
      ? Number(fields.cut) / 100
      : 0;
  const full = valueOf({ ...fields, tola: piece.tola, cut: 0 }, rates, 0);
  const value = valueOf({ ...fields, tola: piece.tola, cut }, rates, 0);
  const paid = fields.paid === "" ? null : Number(fields.paid);
  const name = fields.name.trim() === "" ? defaultName(fields) : fields.name;
  const bought = boughtOf(fields);
  const karat = fields.metal === "silver" ? null : fields.karat;
  // A price paid wins. Without one, the cost comes from the month it was bought.
  const cost = costOf(
    { metal: fields.metal, karat, tola: piece.tola, paid, bought },
    monthRates,
  );
  const karatWord: Karat | "silver" = karat ?? "silver";
  // What the weight cost at that month's rate: shown while the price is typed, and checked against it.
  const then = bought === null ? null : monthRates(bought.slice(0, 7));
  const rateThen =
    then === null ? null : rateOf({ metal: fields.metal, karat }, then);
  const estimate =
    rateThen === null || piece.tola <= 0
      ? null
      : Math.round(piece.tola * rateThen);
  const warning = priceWarning({
    paid,
    estimate,
    bought,
    today: full,
    weight: formatWeight({ tola: piece.tola, unit: fields.unit }),
  });
  // Each hint says only what applies to what's filled in.
  const dateHint =
    bought === null
      ? "Just the month and year is fine."
      : rateThen === null
        ? "We don't have the Sarafa rate for that month."
        : paid === null
          ? `We'll use that month's Sarafa rate, Rs ${formatDigits(rateIn(rateThen, fields.unit))} a ${UNIT_WORD[fields.unit]} of ${karatWord}.`
          : "Your profit counts from then.";
  const priceHint =
    estimate === null
      ? paid === null
        ? "Leave it empty if you don't know. Add the month you bought it and we'll work it out."
        : "All you paid, making charges included."
      : paid === null
        ? `That month's rate puts it at about ${formatPkr(estimate)}. Leave it empty to use that.`
        : `That month's rate puts it at about ${formatPkr(estimate)}.`;

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    const first = errors.weight
      ? weightInputId(id)
      : errors.bought
        ? `${id}-day`
        : errors.cut
          ? `${id}-cut`
          : null;
    if (first !== null) {
      document.getElementById(first)?.focus();
      return;
    }
    save.run(pieceOf(fields));
  };

  return (
    <section
      aria-labelledby={titleId}
      // On phones a box inside the step card costs width, so the panel is a rule above it there.
      className="border-t border-current/15 pt-5 sm:rounded-2xl sm:border sm:p-6"
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-6">
        <h3
          id={titleId}
          tabIndex={-1}
          className={cn(
            DISPLAY,
            "text-xl font-extrabold tracking-tight outline-none",
          )}
        >
          {isNew ? "Add a piece" : `Change ${initial.name}`}
        </h3>
        {save.failed && <SaveFailed name={name} />}

        <NameField
          id={`${id}-name`}
          value={fields.name}
          onValue={(next) => {
            set({ name: next });
          }}
        />
        <KindChoice fields={fields} onKind={setKind} />
        {fields.metal === "gold" && (
          <KaratChips
            value={fields.karat}
            onValue={(karat) => {
              set({ karat });
            }}
          />
        )}

        <div className="flex flex-col gap-2">
          <WeightField id={id} piece={piece} error={shown.weight} />
          {fields.estimated ? (
            <RoughNote
              onExact={() => {
                set({ estimated: false });
              }}
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="-ml-4 self-start underline underline-offset-4"
              onClick={() => {
                setAsking(true);
              }}
            >
              {"I don't know the exact weight"}
            </Button>
          )}
        </div>
        <WeightHelp
          open={asking}
          onOpenChange={setAsking}
          piece={piece}
          weightId={weightInputId(id)}
        />

        <div className="flex flex-col gap-2">
          <span className={GROUP_LABEL}>{"Today's value"}</span>
          <ValueLine
            value={full}
            estimated={fields.estimated}
            rates={rates}
            fields={fields}
          />
        </div>

        <div
          role="group"
          aria-labelledby={`${id}-purchase`}
          className="flex flex-col gap-5"
        >
          <p id={`${id}-purchase`} className="font-semibold">
            When you bought it (optional)
          </p>
          <BoughtDate
            id={`${id}-day`}
            parts={fields}
            onChange={set}
            firstYear={Number(FIRST_RATE_MONTH.slice(0, 4))}
            lastYear={Number(thisMonth.slice(0, 4))}
            error={shown.bought}
            hint={dateHint}
          />
          <div className="flex flex-col gap-2">
            <PaidField
              id={`${id}-paid`}
              digits={fields.paid}
              onDigits={(digits) => {
                set({ paid: digits });
              }}
              hint={priceHint}
            />
            {/* A warning, not an error: the price may be right, so saving still works. */}
            <div role="status">
              {warning !== null && (
                <p className="flex items-start gap-2 rounded-lg border border-current/25 p-3 text-sm font-medium">
                  <TriangleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  {warning}
                </p>
              )}
            </div>
          </div>
        </div>
        {jewellery && (
          <CutField
            id={`${id}-cut`}
            text={fields.cut}
            error={shown.cut}
            full={full}
            value={value}
            onText={(text) => {
              set({ cut: text });
            }}
          />
        )}
        <Summary value={value} cut={cut} cost={cost} bought={bought} />

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={save.pending} className={BIG}>
            {saveLabel(save, isNew ? "Add piece" : "Save")}
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

/** Shown once a rough weight is in: it counts, it's marked ≈, and Home will ask to weigh it. */
function RoughNote({ onExact }: { onExact: () => void }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p>
        <span className="font-semibold">≈ A rough weight.</span>{" "}
        {
          "It counts in your net worth, and Things to check will remind you to get it weighed."
        }
      </p>
      <Button
        type="button"
        variant="ghost"
        className="-ml-4 self-start underline underline-offset-4"
        onClick={onExact}
      >
        This is the exact weight
      </Button>
    </div>
  );
}

interface WeightHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  piece: Piece;
  weightId: string;
}

/**
 * The pop-up for someone who doesn't know the weight. It asks for the exact weight first and says
 * how to get it. A rough weight is the quieter way out.
 */
function WeightHelp({ open, onOpenChange, piece, weightId }: WeightHelpProps) {
  const roughId = useId();
  const [rough, setRough] = useState(false);
  const close = () => {
    onOpenChange(false);
    setRough(false);
    requestAnimationFrame(() => {
      document.getElementById(weightId)?.focus();
    });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter the exact weight if you can</DialogTitle>
          <DialogDescription>
            {
              "The value comes from the weight. A small difference can change it by thousands."
            }
          </DialogDescription>
        </DialogHeader>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>Check the receipt. It gives the weight in tola or grams.</li>
          <li>Ask a jeweller to weigh it. Most do it for free.</li>
          <li>Weigh it at home on a kitchen scale, in grams.</li>
        </ul>
        {/* A row that opens in place: the chevron and the line under the name say there's more. */}
        <div className="flex flex-col border-t pt-2">
          <button
            type="button"
            aria-expanded={rough}
            aria-controls={roughId}
            onClick={() => {
              setRough((current) => !current);
            }}
            className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-lg p-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex flex-col">
              <span className="font-semibold">Use a rough weight</span>
              <span className="text-muted-foreground">
                {"Can't check it now? Pick the closest typical piece."}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-5 shrink-0 transition-transform motion-reduce:transition-none",
                rough && "rotate-180",
              )}
            />
          </button>
        </div>
        {rough && (
          <div id={roughId} className="flex flex-col gap-3">
            <ul className="flex flex-wrap gap-2">
              {TYPICAL_WEIGHTS.map((typical) => (
                <li key={typical.label}>
                  <Button
                    type="button"
                    variant="outline"
                    className={CHIP}
                    onClick={() => {
                      piece.guess(typical.tola);
                      close();
                    }}
                  >
                    {`${typical.label} ≈ ${formatWeight({ tola: typical.tola, unit: "tola" })}`}
                  </Button>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">
              {
                "We'll mark it ≈, and remind you in Things to check to get it weighed."
              }
            </p>
            <Button
              type="button"
              variant="ghost"
              className="-ml-4 self-start underline underline-offset-4"
              onClick={() => {
                piece.set({ estimated: true });
                close();
              }}
            >
              {"I'll type my own guess"}
            </Button>
          </div>
        )}
        <DialogFooter>
          <Button type="button" onClick={close}>
            {"I'll find the weight"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CutFieldProps {
  id: string;
  text: string;
  error: string | null;
  /** Today's value at the full rate, and after the deduction. */
  full: number;
  value: number;
  onText: (text: string) => void;
}

/** The jeweller's buy-back deduction on a piece of jewellery, in percent. Optional. */
function CutField({ id, text, error, full, value, onText }: CutFieldProps) {
  const off = full - value;
  return (
    <Field data-invalid={error !== null}>
      <FieldLabel htmlFor={id}>Deduction (optional)</FieldLabel>
      <InputGroup className="h-12 max-w-36">
        <InputGroupInput
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(event) => {
            onText(gramsInput(event.target.value).slice(0, 4));
          }}
          aria-invalid={error !== null}
          aria-describedby={`${id}-note`}
          className="text-base tabular-nums md:text-base"
        />
        <InputGroupAddon align="inline-end">%</InputGroupAddon>
      </InputGroup>
      {error === null ? (
        <FieldDescription id={`${id}-note`}>
          {off > 0 ? (
            <>
              <Money value={off} /> off, so it counts as{" "}
              <Money value={value} className="font-semibold" />.{" "}
            </>
          ) : null}
          What a jeweller takes off when buying it back. Often 5 to 15%.
        </FieldDescription>
      ) : (
        <FieldError id={`${id}-note`}>{error}</FieldError>
      )}
    </Field>
  );
}

const LOW = 0.5;
const HIGH = 3;

interface PriceCheck {
  paid: number | null;
  /** What the weight cost at the rate of the month it was bought. */
  estimate: number | null;
  bought: string | null;
  /** What it's worth today, at the full rate. */
  today: number;
  /** The weight as typed, e.g. "10 tola". */
  weight: string;
}

/**
 * A word of warning when the price is far from what the weight cost then: under half, or over 3
 * times, which leaves room for making charges. With no month, only a price over 3 times today's
 * value is flagged. Most often it's a zero too few or too many.
 */
function priceWarning({
  paid,
  estimate,
  bought,
  today,
  weight,
}: PriceCheck): string | null {
  if (paid === null || paid === 0) return null;
  if (estimate !== null && bought !== null) {
    const then = `what ${weight} cost in ${formatBought(bought.slice(0, 7))}, about ${formatPkr(estimate)}`;
    if (paid < estimate * LOW) {
      return `That's far below ${then}. Check for a missing zero.`;
    }
    if (paid > estimate * HIGH) {
      return `That's far above ${then}. Check for an extra zero.`;
    }
    return null;
  }
  return today > 0 && paid > today * HIGH
    ? "That's more than 3 times what it's worth today. Check for an extra zero."
    : null;
}

/** A lakh or crore note under an amount, when it's that large. */
function Spoken({ value }: { value: number }) {
  const spoken = formatLakhCrore(value);
  return spoken === null ? null : (
    <span className="block text-sm text-muted-foreground">{spoken}</span>
  );
}

interface SummaryProps {
  /** Today's value, after any deduction. */
  value: number;
  /** The deduction it was priced with, as a share. */
  cut: number;
  /** Null with no price and no month it was bought: then it counts from today. */
  cost: Cost | null;
  bought: string | null;
}

/**
 * The sum, not just the answer: today's value, less the cost, is the profit. Today's value shows
 * under the weight too, as it's typed: here it's part of the sum. The cost is the price paid, or the
 * weight at the Sarafa rate of the month it was bought.
 */
function Summary({ value, cut, cost: known, bought }: SummaryProps) {
  // With no price and no date, it counts as bought today: the cost is its value today, after any
  // deduction, so the profit starts at Rs 0 and Portfolio tracks it from here.
  const fromToday = known === null;
  const cost: Cost = known ?? { amount: value, rate: null };
  const profit = value - cost.amount;
  // "48.8 lakh · since September 2022", leaving out what doesn't apply.
  const note = fromToday
    ? "counts from today"
    : [
        formatLakhCrore(profit),
        bought === null ? null : `since ${formatBought(bought)}`,
      ]
        .filter((part) => part !== null)
        .join(" · ");
  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3">
        <dt className="flex flex-col">
          <span>{"Today's value"}</span>
          {cut > 0 && (
            <span className="text-sm text-muted-foreground">
              Less your {formatCut(cut)} deduction
            </span>
          )}
        </dt>
        <dd className="text-right">
          <Money value={value} className="font-semibold" />
          {/* A label with a line under it gets no lakh note: the two would read as one. */}
          {cut === 0 && <Spoken value={value} />}
        </dd>
        <dt className="flex flex-col">
          <span>Cost</span>
          <span className="text-sm text-muted-foreground">
            {fromToday
              ? "Its value today: no price or date"
              : cost.rate === null
                ? "What you paid"
                : bought === null
                  ? "Worked out"
                  : `At the ${formatBought(bought.slice(0, 7))} rate`}
          </span>
        </dt>
        <dd className="text-right font-semibold tabular-nums">
          {cost.rate !== null && "≈ "}
          <Money value={cost.amount} />
        </dd>
      </dl>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t pt-3">
        <span className="font-semibold">
          {profit < 0 ? "Loss as of today" : "Profit as of today"}
        </span>
        <span className="ml-auto text-right">
          <span
            className={cn(
              DISPLAY,
              "block text-2xl leading-none font-extrabold tracking-tight tabular-nums",
            )}
          >
            {profitText(profit, cost.amount, cost.rate !== null)}
          </span>
          {note !== "" && (
            <span className="block pt-1 text-sm text-muted-foreground">
              {note}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
