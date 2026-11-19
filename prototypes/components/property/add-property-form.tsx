"use client";

import type { ReactNode } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import { DISPLAY } from "@proto/components/display";
import {
  formatPkr,
  formatSignedPercent,
  formatSignedPkr,
} from "@proto/kit/format";
import { AmountField } from "@proto/screens/setup/amount-field";
import { CHIP, TALL_FIELD } from "@proto/screens/setup/look";
import type { PropertyFormProps } from "./form";
import { type PanelProps, PropertyList } from "./list";
import {
  BoughtField,
  ErrorLine,
  InstalmentsField,
  KindChips,
  PANEL_BOX,
  PANEL_TITLE,
  PanelActions,
  SaveFailed,
  ShareField,
  ZameenLink,
} from "./parts";
import {
  boughtOf,
  ELSEWHERE,
  paysInstalments,
  type PropertyPanelState,
  sizeInput,
  titleFor,
  usePropertyPanel,
  usesRate,
} from "./use-property";
import {
  formatBought,
  formatSize,
  KIND_FORM,
  shortPkr,
  UNIT_LABEL,
} from "./value";

// The property form, in the order people describe a property: what it is, where it is, its size
// and the user's share, when it was bought (with any instalments), then what it would sell for
// today and the profit. The value is typed as a whole: a building isn't priced per marla. Plots,
// files and land can work it out from a rate.

export function AddPropertyForm(props: PropertyFormProps) {
  return <PropertyList {...props} Panel={PropertyPanel} />;
}

const CITIES = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Gujranwala",
  "Sialkot",
  "Hyderabad",
  "Quetta",
] as const;

const SELECT = "[&_select]:h-12 [&_select]:text-base";

function PropertyPanel({
  id,
  titleId,
  initial,
  today,
  draft,
  isNew,
  onSaved,
  onCancel,
  onRemove,
}: PanelProps) {
  const panel = usePropertyPanel({ id, initial, today, draft, onSaved });
  const { fields, set, setPlace, errors, ids, name, value, share, part } =
    panel;
  // What this kind asks for: its labels, address lines, units, rate helper and instalments.
  const asked = KIND_FORM[fields.kind];
  const unit = UNIT_LABEL[fields.unit];
  // "per marla", "per acre": how people quote a rate.
  const perUnit = `per ${unit}`;
  const byRate = usesRate(fields);

  return (
    <section aria-labelledby={titleId} className={PANEL_BOX}>
      <form noValidate onSubmit={panel.submit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <h3 id={titleId} tabIndex={-1} className={PANEL_TITLE}>
            {isNew ? "Add a property" : `Change ${titleFor(initial)}`}
          </h3>
          {panel.save.failed && <SaveFailed name={name} />}
        </div>

        <Section id={`${id}-what`} title="What it is">
          <KindChips
            labelledBy={`${id}-what`}
            value={fields.kind}
            onValue={(kind) => {
              setPlace({ kind });
            }}
          />
        </Section>

        <Section id={`${id}-where`} title="Where it is">
          <CitySelect
            id={ids.city}
            label={asked.city}
            error={errors.city}
            value={fields.city}
            onValue={(city) => {
              setPlace({ city });
            }}
          />
          <TextField
            id={ids.area}
            label={asked.area.label}
            value={fields.area}
            onValue={(area) => {
              set({ area });
            }}
            hint={asked.area.hint}
            error={errors.area}
          />
          {asked.building !== null && (
            <TextField
              id={`${id}-building`}
              label={`${asked.building.label} (optional)`}
              value={fields.building}
              onValue={(building) => {
                set({ building });
              }}
              hint={asked.building.hint}
              error={null}
            />
          )}
          <div className="grid gap-6 sm:grid-cols-2">
            {asked.block !== null && (
              <TextField
                id={`${id}-block`}
                label={`${asked.block.label} (optional)`}
                value={fields.block}
                onValue={(block) => {
                  set({ block });
                }}
                hint={asked.block.hint}
                error={null}
              />
            )}
            {asked.number === null ? (
              <p className="text-sm text-muted-foreground sm:pt-8">
                A file has no plot number until balloting.
              </p>
            ) : (
              <TextField
                id={`${id}-number`}
                label={`${asked.number} (optional)`}
                value={fields.number}
                onValue={(number) => {
                  set({ number });
                }}
                hint={null}
                error={null}
              />
            )}
          </div>
        </Section>

        <Section id={`${id}-size`} title="Size and share">
          <Field data-invalid={errors.size !== null}>
            <FieldLabel htmlFor={ids.size}>Size</FieldLabel>
            <div className="flex gap-2">
              <Input
                id={ids.size}
                inputMode="decimal"
                autoComplete="off"
                value={fields.size}
                onChange={(event) => {
                  set({ size: sizeInput(event.target.value) });
                }}
                aria-invalid={errors.size !== null}
                aria-describedby={`${ids.size}-note`}
                className={cn(TALL_FIELD, "w-32 tabular-nums")}
              />
              <NativeSelect
                aria-label="Unit"
                value={fields.unit}
                onChange={(event) => {
                  const picked = asked.units.find(
                    (candidate) => candidate === event.target.value,
                  );
                  if (picked !== undefined) set({ unit: picked });
                }}
                className={cn(SELECT, "w-32")}
              >
                {asked.units.map((each) => (
                  <NativeSelectOption key={each} value={each}>
                    {UNIT_LABEL[each]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            {errors.size === null ? (
              <FieldDescription id={`${ids.size}-note`}>
                {"In your unit. A marla isn't the same size everywhere."}
              </FieldDescription>
            ) : (
              <ErrorLine id={`${ids.size}-note`}>{errors.size}</ErrorLine>
            )}
          </Field>
          <ShareField panel={panel} showPart={false} />
        </Section>

        <Section id={`${id}-bought`} title="When you bought it (optional)">
          <div className="grid items-start gap-5 md:grid-cols-2">
            <BoughtField panel={panel} today={today} />
            <PaidField id={`${id}-paid`} panel={panel} />
          </div>
          {asked.instalments && <InstalmentsField id={id} panel={panel} />}
        </Section>

        <Section
          id={`${id}-worth`}
          title="What it would sell for today"
          aside={
            asked.byRate && (
              <ToggleGroup
                variant="outline"
                aria-label="Enter it as"
                spacing={0}
                value={[byRate ? "rate" : "total"]}
                onValueChange={(next) => {
                  if (next[0] === "rate") set({ byRate: true });
                  if (next[0] === "total") {
                    set({
                      byRate: false,
                      value: value > 0 ? String(value) : fields.value,
                    });
                  }
                }}
              >
                <ToggleGroupItem value="total" className={cn(CHIP, "h-9 px-3")}>
                  Total
                </ToggleGroupItem>
                <ToggleGroupItem value="rate" className={cn(CHIP, "h-9 px-3")}>
                  {`Per ${unit}`}
                </ToggleGroupItem>
              </ToggleGroup>
            )
          }
        >
          {byRate ? (
            <>
              <AmountField
                id={ids.rate}
                label={`Rate ${perUnit}`}
                digits={fields.rate}
                onDigits={(digits) => {
                  set({ rate: digits });
                }}
                hint={
                  fields.kind === "file" ? "The file rate dealers quote." : ""
                }
                error={errors.value}
              />
              <RateResult panel={panel} perUnit={perUnit} />
            </>
          ) : (
            <AmountField
              id={ids.value}
              label="What it would sell for today"
              labelHidden
              digits={fields.value}
              onDigits={(digits) => {
                set({ value: digits });
              }}
              hint={
                share === 1
                  ? ""
                  : value > 0
                    ? `Your share: ${formatPkr(part)}.`
                    : "For the whole property, not just your share."
              }
              error={errors.value}
            />
          )}
          <p className="text-sm text-muted-foreground">
            Not sure? See <ZameenLink />.
          </p>
        </Section>

        <Result panel={panel} />
        <PanelActions
          panel={panel}
          isNew={isNew}
          onCancel={onCancel}
          onRemove={onRemove}
        />
      </form>
    </section>
  );
}

/** A titled part of the form, such as "Where it is", with an optional control by its title. */
function Section({
  id,
  title,
  aside,
  children,
}: {
  id: string;
  title: string;
  /** A small control on the title's right, such as Total | Per marla. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={id} className="font-semibold">
          {title}
        </p>
        {aside}
      </div>
      {children}
    </div>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onValue: (typed: string) => void;
  hint: string | null;
  error: string | null;
}

/** A line of the address, such as the area or the block. */
function TextField({ id, label, value, onValue, hint, error }: TextFieldProps) {
  const noteId = `${id}-note`;
  return (
    <Field data-invalid={error !== null}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(event) => {
          onValue(event.target.value);
        }}
        autoComplete="off"
        autoCapitalize="words"
        maxLength={80}
        aria-invalid={error !== null}
        aria-describedby={hint === null && error === null ? undefined : noteId}
        className={TALL_FIELD}
      />
      {error !== null ? (
        <ErrorLine id={noteId}>{error}</ErrorLine>
      ) : (
        hint !== null && <FieldDescription id={noteId}>{hint}</FieldDescription>
      )}
    </Field>
  );
}

/**
 * Where it is, which every property needs. A city picks the usual unit: square yards in Karachi
 * and Hyderabad, marla elsewhere. A town that isn't in the list is "Somewhere else".
 */
function CitySelect({
  id,
  label,
  error,
  value,
  onValue,
}: {
  id: string;
  /** "City", or "Nearest city" for land. */
  label: string;
  error: string | null;
  value: string;
  onValue: (city: string) => void;
}) {
  return (
    <Field data-invalid={error !== null}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div>
        <NativeSelect
          id={id}
          value={value}
          onChange={(event) => {
            onValue(event.target.value);
          }}
          aria-invalid={error !== null}
          aria-describedby={`${id}-note`}
          className={cn(SELECT, "w-full sm:w-64")}
        >
          <NativeSelectOption value="">Pick one</NativeSelectOption>
          {CITIES.map((city) => (
            <NativeSelectOption key={city} value={city}>
              {city}
            </NativeSelectOption>
          ))}
          <NativeSelectOption value={ELSEWHERE}>
            Somewhere else
          </NativeSelectOption>
        </NativeSelect>
      </div>
      {error === null ? (
        <FieldDescription id={`${id}-note`}>
          It picks the usual unit: marla in Lahore, square yards in Karachi.
        </FieldDescription>
      ) : (
        <ErrorLine id={`${id}-note`}>{error}</ErrorLine>
      )}
    </Field>
  );
}

/** The value a rate works out to, large, with the sum and any share under it. */
function RateResult({
  panel,
  perUnit,
}: {
  panel: PropertyPanelState;
  perUnit: string;
}) {
  const { fields, value, share, part } = panel;
  const size = Number(fields.size);
  const rate = Number(fields.rate);
  const sum =
    size > 0 && rate > 0
      ? `${formatSize({ amount: size, unit: fields.unit })} × ${shortPkr(rate)} ${perUnit}`
      : `The size times the rate ${perUnit}.`;
  return (
    <div className="flex flex-col gap-1">
      <p
        className={cn(
          DISPLAY,
          "text-3xl leading-none font-extrabold tracking-tight tabular-nums",
        )}
      >
        <Money value={value} />
      </p>
      <p className="text-sm text-muted-foreground">
        {share < 1 && value > 0
          ? `${sum} · Your share: ${formatPkr(part)}`
          : sum}
      </p>
    </div>
  );
}

/**
 * What the user paid. For a plot on instalments, the full price on the plan. The line under it
 * only speaks up when it matters: a shared property, or a payment plan.
 */
function PaidField({ id, panel }: { id: string; panel: PropertyPanelState }) {
  const { fields, set, share, paid, left } = panel;
  const soFar = paid === null ? 0 : paid - left;
  const paying = paysInstalments(fields);
  const hint = paying
    ? soFar > 0 && left > 0
      ? `${formatPkr(soFar)} paid so far.`
      : "With every instalment."
    : share < 1
      ? "Your part only."
      : "";
  return (
    <AmountField
      id={id}
      label={paying ? "Full price" : "Price paid"}
      digits={fields.paid}
      onDigits={(digits) => {
        set({ paid: digits });
      }}
      hint={hint}
      error={null}
    />
  );
}

/**
 * Once a price is in, the profit on the user's share, large, with its % and since when. While
 * instalments are left, what the property adds to net worth after them.
 */
function Result({ panel }: { panel: PropertyPanelState }) {
  const { fields, part, paid, left } = panel;
  if (paid === null && left === 0) return null;
  const bought = boughtOf(fields);
  return (
    <div className="flex flex-col gap-4">
      {paid !== null && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="font-semibold">
            {part - paid < 0 ? "Loss as of today" : "Profit as of today"}
          </span>
          <span className="ml-auto text-right">
            <span
              className={cn(
                DISPLAY,
                "block text-2xl leading-none font-extrabold tracking-tight tabular-nums",
              )}
            >
              {formatSignedPkr(part - paid)}
            </span>
            <span className="block pt-1 text-sm text-muted-foreground">
              {[
                paid === 0 ? null : formatSignedPercent((part - paid) / paid),
                bought === null ? null : `since ${formatBought(bought)}`,
              ]
                .filter((piece) => piece !== null)
                .join(" · ")}
            </span>
          </span>
        </div>
      )}
      {left > 0 && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span>Adds to your net worth, after what’s left to pay</span>
          <Money
            value={part - left}
            signed
            className="ml-auto font-semibold tabular-nums"
          />
        </div>
      )}
    </div>
  );
}
