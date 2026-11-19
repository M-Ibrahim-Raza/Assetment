"use client";

import { ChevronRight } from "lucide-react";
import { type ComponentType, useId, useState } from "react";
import { Money } from "@proto/components/amounts";
import { DoneFooter, SkipButton, TITLE } from "@proto/components/metals/parts";
import type { Property } from "@proto/fixtures/property";
import { formatLakhCrore } from "@proto/kit/format";
import { HAIRLINE } from "@proto/screens/setup/look";
import { AddAnother } from "@proto/screens/setup/rows";
import type { PropertyDraft, PropertyFormProps } from "./form";
import { fieldsOf, freshFields, type PropertyFields } from "./use-property";
import {
  formatMonth,
  KIND_FORM,
  partOf,
  profitOf,
  profitText,
  shareLabel,
  shortPkr,
  UNIT_LABEL,
} from "./value";

// What every property form shares around its panel, as in the gold form: the heading, the saved
// properties as rows with a total, "Add a property", and the way on. The panel is open for the
// first property, and a row opens in place to change or remove it. Each variant brings its panel.

export interface PanelProps {
  /** Ids inside the panel start with it. */
  id: string;
  /** The panel's heading, which takes focus when it opens. */
  titleId: string;
  initial: PropertyFields;
  today: string;
  draft: PropertyDraft | null;
  isNew: boolean;
  onSaved: (property: Property) => void;
  /** Null for the first property: there's nothing to go back to. */
  onCancel: (() => void) | null;
  /** Null for a new property, which has nothing to remove yet. */
  onRemove: (() => void) | null;
}

interface PropertyListProps extends PropertyFormProps {
  Panel: ComponentType<PanelProps>;
}

export function PropertyList({
  title,
  help,
  properties,
  today,
  onSave,
  onRemove,
  draft,
  heading,
  done,
  skip,
  Panel,
}: PropertyListProps) {
  const id = useId();
  const [panel, setPanel] = useState<{
    key: number;
    fields: PropertyFields;
  } | null>(() => {
    if (draft !== null) return { key: 0, fields: fieldsOf(draft.property) };
    return properties.length === 0 ? { key: 0, fields: freshFields() } : null;
  });
  const panelTitleId = `${id}-panel-title`;
  const rowId = (propertyId: string) => `${id}-row-${propertyId}`;
  const editingId = panel?.fields.id ?? null;
  const isNew = !properties.some((property) => property.id === editingId);

  const open = (fields: PropertyFields) => {
    setPanel((current) => ({ key: (current?.key ?? 0) + 1, fields }));
    requestAnimationFrame(() => {
      document.getElementById(panelTitleId)?.focus();
    });
  };

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
      <Panel
        key={panel.key}
        id={`${id}-panel`}
        titleId={panelTitleId}
        initial={panel.fields}
        today={today}
        draft={
          draft !== null && draft.property.id === panel.fields.id ? draft : null
        }
        isNew={isNew}
        onSaved={(saved) => {
          onSave(saved);
          close(isNew ? null : rowId(saved.id));
        }}
        onCancel={
          properties.length === 0
            ? null
            : () => {
                close(editingId === null || isNew ? null : rowId(editingId));
              }
        }
        onRemove={
          isNew
            ? null
            : () => {
                const property = properties.find(
                  (each) => each.id === editingId,
                );
                if (property !== undefined) onRemove(property);
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

      {properties.length > 0 && (
        <div className="flex flex-col">
          <ul aria-label="Your property" className="flex flex-col">
            {properties.map((property) =>
              // A row being changed opens in place, so the user keeps their place in the list.
              property.id === editingId && form !== null ? (
                <li key={property.id} className="py-2">
                  {form}
                </li>
              ) : (
                <PropertyRow
                  key={property.id}
                  id={rowId(property.id)}
                  property={property}
                  onOpen={() => {
                    open(fieldsOf(property));
                  }}
                />
              ),
            )}
          </ul>
          <Totals properties={properties} />
        </div>
      )}

      {panel === null ? (
        <AddAnother
          label="Add a property"
          onClick={() => {
            open(freshFields());
          }}
        />
      ) : (
        isNew && form
      )}

      {properties.length === 0 ? (
        <SkipButton skip={skip} />
      ) : (
        panel === null && <DoneFooter done={done} />
      )}
    </>
  );
}

/** What a row says under its title: the number and block, the share, the rate, the value's month. */
function detailsOf(property: Property): string {
  const { kind, number, block, rate, size, share } = property;
  const label = KIND_FORM[kind].number;
  const where = [
    label === null || number === null ? null : `${label} ${number}`,
    block,
  ]
    .filter((part) => part !== null)
    .join(", ");
  return [
    where === "" ? null : where,
    share < 1 ? shareLabel(share) : null,
    rate === null || size === null
      ? null
      : `${shortPkr(rate)} per ${UNIT_LABEL[size.unit]}`,
    `Value from ${formatMonth(property.valuedOn)}`,
  ]
    .filter((part) => part !== null)
    .join(" · ");
}

interface PropertyRowProps {
  /** The row's button, so focus can come back to it after a change. */
  id: string;
  property: Property;
  onOpen: () => void;
}

/** A saved property: what it is, the user's share of its value, its profit and what's left to pay. */
function PropertyRow({ id, property, onOpen }: PropertyRowProps) {
  const profit = profitOf(property);
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
            <span className="font-semibold wrap-break-word">
              {property.name}
            </span>
            <span className="text-sm text-muted-foreground">
              {detailsOf(property)}
            </span>
          </span>
          <span className="flex shrink-0 flex-col sm:items-end">
            <Money value={partOf(property)} className="font-bold" />
            {profit !== null && property.paid !== null && (
              <span className="text-sm tabular-nums">
                {profitText(profit, property.paid)}
              </span>
            )}
            {property.instalments !== null && (
              <span className="text-sm text-muted-foreground">
                {shortPkr(property.instalments.left)} left · in Debts
              </span>
            )}
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
      </button>
    </li>
  );
}

const sum = (amounts: readonly number[]): number =>
  amounts.reduce((total, amount) => total + amount, 0);

/** Under the rows: the user's share of it all today, the profit where a price is known, and what's owed. */
function Totals({ properties }: { properties: readonly Property[] }) {
  const total = sum(properties.map(partOf));
  const spoken = formatLakhCrore(total);
  const priced = properties.flatMap((property) =>
    property.paid === null
      ? []
      : [{ paid: property.paid, part: partOf(property) }],
  );
  const cost = sum(priced.map((each) => each.paid));
  const profit = sum(priced.map((each) => each.part - each.paid));
  const left = sum(
    properties.map((property) => property.instalments?.left ?? 0),
  );
  const shared = properties.some((property) => property.share < 1);
  return (
    <div className="flex flex-col gap-2 border-t-2 border-current/25 pt-3">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="flex flex-col">
          <span className="font-semibold">{"Today's value"}</span>
          {shared && (
            <span className="text-sm text-muted-foreground">
              Your share only, where you share it
            </span>
          )}
        </span>
        <span className="ml-auto text-right">
          <Money value={total} className="text-lg font-bold" />
          {spoken !== null && <span className="block text-sm">{spoken}</span>}
        </span>
      </p>
      {priced.length > 0 && (
        <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
          <span>
            Profit on{" "}
            {priced.length === 1
              ? "1 property"
              : `${String(priced.length)} properties`}
          </span>
          <span className="ml-auto font-semibold tabular-nums">
            {profitText(profit, cost)}
          </span>
        </p>
      )}
      {left > 0 && (
        <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
          <span>Left to pay, in Debts</span>
          <Money
            value={-left}
            signed
            className="ml-auto font-semibold tabular-nums"
          />
        </p>
      )}
    </div>
  );
}
