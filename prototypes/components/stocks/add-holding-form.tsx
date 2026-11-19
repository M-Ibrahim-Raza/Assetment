"use client";

import { useId, useState } from "react";
import { DoneFooter, SkipButton, TITLE } from "@proto/components/metals/parts";
import type { Holding } from "@proto/fixtures/stocks";
import { AddAnother } from "@proto/screens/setup/rows";
import type { StocksFormProps } from "./form";
import { GROUP_ADD, type HoldingGroup } from "./holding";
import { HoldingPanel } from "./holding-panel";
import { HoldingList, SecuritySearch, Totals } from "./parts";
import { emptyFields, fieldsOf, type HoldingFields } from "./use-holding";

// Variant a, "Add a holding": the gold form's pattern, for one kind at a time. Shares and ETFs, and
// mutual funds, are their own steps, as banks and wallets are. An empty one starts on its search,
// "Which share do you hold?", and a pick opens the panel with it. One panel holds everything about a
// holding: the search, the buys or the average (a fund's at the NAV paid), today's value
// and the profit. Saved holdings are rows with a total, and a row opens in place.

/** The question over an empty step's search. */
const START: Readonly<Record<HoldingGroup, string>> = {
  listed: "Which share do you hold?",
  funds: "Which fund do you hold?",
};

/** Why a fund opened when the user searched for one already added. */
const ALREADY_ADDED =
  "You've added this already. Hold it in more than one account? Add each account's buys here.";

interface Panel {
  /** A new key resets the panel. */
  key: number;
  fields: HoldingFields;
  note: string | null;
}

export function AddHoldingForm({
  group,
  title,
  help,
  holdings,
  prices,
  onSave,
  onRemove,
  draft,
  search,
  heading,
  done,
  skip,
}: StocksFormProps) {
  const id = useId();
  // Most people keep everything at one broker, so a new holding starts where the last one is held.
  const lastPlace =
    [...holdings].reverse().find((holding) => holding.heldAt !== null)
      ?.heldAt ?? "";
  // The panel: on a pick from the empty step's search or on "Add", on a row, on a draft that didn't
  // save, or on a search typed before the form opened.
  const [panel, setPanel] = useState<Panel | null>(() => {
    if (draft !== null) {
      return { key: 0, fields: fieldsOf(draft.holding), note: null };
    }
    return search === ""
      ? null
      : { key: 0, fields: emptyFields(null, lastPlace), note: null };
  });
  const panelTitleId = `${id}-panel-title`;
  const rowId = (holdingId: string) => `${id}-row-${holdingId}`;
  const editingId = panel?.fields.id ?? null;
  const isNew = !holdings.some((holding) => holding.id === editingId);

  /** Opens the panel, with focus on its title. */
  const open = (fields: HoldingFields, note: string | null = null) => {
    setPanel((current) => ({ key: (current?.key ?? 0) + 1, fields, note }));
    requestAnimationFrame(() => {
      document.getElementById(panelTitleId)?.focus();
    });
  };

  /**
   * Opens one already added. A fund picked again opens with a word on why. A share picked again
   * starts a new holding for another place, and opens the saved one only when asked to.
   */
  const openExisting = (holding: Holding) => {
    open(fieldsOf(holding), group === "funds" ? ALREADY_ADDED : null);
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
      <HoldingPanel
        key={panel.key}
        id={`${id}-panel`}
        group={group}
        titleId={panelTitleId}
        initial={panel.fields}
        prices={prices}
        others={holdings}
        draft={
          draft !== null && draft.holding.id === panel.fields.id ? draft : null
        }
        isNew={isNew}
        defaultQuery={panel.key === 0 ? search : ""}
        note={panel.note}
        onSaved={(saved) => {
          // One holding for each place the share is held.
          for (const holding of saved) onSave(holding);
          const [first] = saved;
          close(isNew || first === undefined ? null : rowId(first.id));
        }}
        onExisting={openExisting}
        onCancel={() => {
          close(editingId === null || isNew ? null : rowId(editingId));
        }}
        onRemove={
          isNew
            ? null
            : () => {
                const holding = holdings.find((each) => each.id === editingId);
                if (holding !== undefined) onRemove(holding);
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

      {holdings.length > 0 && (
        <div className="flex flex-col gap-3">
          <HoldingList
            group={group}
            label={title}
            holdings={holdings}
            prices={prices}
            rowId={rowId}
            onOpen={(holding) => {
              open(fieldsOf(holding));
            }}
            // A row being changed opens in place, so the user keeps their place in the list.
            open={
              !isNew && editingId !== null && form !== null
                ? { id: editingId, node: form }
                : null
            }
          />
          <Totals group={group} holdings={holdings} prices={prices} />
        </div>
      )}

      {panel !== null && isNew ? (
        form
      ) : holdings.length === 0 ? (
        // An empty step starts on its search: picking one opens the panel with it.
        <SecuritySearch
          id={`${id}-start`}
          group={group}
          label={START[group]}
          symbol={null}
          onPick={(security) => {
            if (security !== null) {
              open(emptyFields(security.symbol, lastPlace));
            }
          }}
          added={[]}
          prices={prices}
          error={null}
        />
      ) : (
        panel === null && (
          <AddAnother
            label={GROUP_ADD[group]}
            onClick={() => {
              open(emptyFields(null, lastPlace));
            }}
          />
        )
      )}

      {holdings.length === 0 ? (
        <SkipButton skip={skip} />
      ) : (
        panel === null && <DoneFooter done={done} />
      )}
    </>
  );
}
