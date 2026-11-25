"use client";

import { Fragment, type ReactNode, type Ref, useId, useState } from "react";
import { DoneFooter, SkipButton, TITLE } from "@proto/components/metals/parts";
import { AddAnother } from "@proto/screens/setup/rows";

// What every debts and money lent form does, whatever it looks like: the heading, the saved rows
// with a total, one panel that's open for the first item, opens at the end for "Add", and opens in
// place on a row to change or remove it, and the way on. Each variant draws the rows and the panel.

export interface PanelArgs<Fields> {
  /** Ids inside the panel start with it. */
  id: string;
  /** The panel's heading, which takes focus when it opens. */
  titleId: string;
  fields: Fields;
  isNew: boolean;
  /** A scenario's draft: a save that failed or is still going. */
  status: "failed" | "saving" | null;
  /** Called once the item is saved, with its id, so focus can go back to its row. */
  onSaved: (id: string) => void;
  /** Null for the first item: there's nothing to go back to. */
  onCancel: (() => void) | null;
  /** Null for a new item, which has nothing to remove yet. */
  onRemove: (() => void) | null;
}

interface ShellProps<
  Row extends { id: string },
  Fields extends { id: string | null },
> {
  title: string;
  help: string;
  heading: Ref<HTMLHeadingElement>;
  done: { label: string; onDone: () => void };
  skip: { label: string; onSkip: () => void } | null;
  rows: readonly Row[];
  /** Names the list for screen readers. */
  listLabel: string;
  /** "Add a loan". */
  addLabel: string;
  fresh: () => Fields;
  /** A row's fields. Null when it's changed somewhere else, such as a property's instalments. */
  fieldsOfRow: (row: Row) => Fields | null;
  onElsewhere?: (row: Row) => void;
  onRemove: (row: Row) => void;
  /** A failed or saving new item, or a saved one opened in place. */
  draft: { fields: Fields; status: "failed" | "saving" | "open" } | null;
  /** One saved row, as an `li`. Its button has the given id and opens it. */
  renderRow: (row: Row, args: { id: string; onOpen: () => void }) => ReactNode;
  renderPanel: (args: PanelArgs<Fields>) => ReactNode;
  /** Under the rows. */
  totals: ReactNode;
}

export function FormShell<
  Row extends { id: string },
  Fields extends { id: string | null },
>({
  title,
  help,
  heading,
  done,
  skip,
  rows,
  listLabel,
  addLabel,
  fresh,
  fieldsOfRow,
  onElsewhere,
  onRemove,
  draft,
  renderRow,
  renderPanel,
  totals,
}: ShellProps<Row, Fields>) {
  const id = useId();
  const [panel, setPanel] = useState<{ key: number; fields: Fields } | null>(
    () => {
      if (draft !== null) return { key: 0, fields: draft.fields };
      return rows.length === 0 ? { key: 0, fields: fresh() } : null;
    },
  );
  const titleId = `${id}-panel-title`;
  const rowId = (rowKey: string) => `${id}-row-${rowKey}`;
  const editingId = panel?.fields.id ?? null;
  const isNew = !rows.some((row) => row.id === editingId);

  const open = (fields: Fields) => {
    setPanel((current) => ({ key: (current?.key ?? 0) + 1, fields }));
    requestAnimationFrame(() => {
      document.getElementById(titleId)?.focus();
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

  const status =
    draft !== null && draft.fields.id === editingId && draft.status !== "open"
      ? draft.status
      : null;

  const form =
    panel === null ? null : (
      <Fragment key={panel.key}>
        {renderPanel({
          id: `${id}-panel`,
          titleId,
          fields: panel.fields,
          isNew,
          status,
          onSaved: (saved) => {
            close(isNew ? null : rowId(saved));
          },
          onCancel:
            rows.length === 0
              ? null
              : () => {
                  close(editingId === null || isNew ? null : rowId(editingId));
                },
          onRemove: isNew
            ? null
            : () => {
                const row = rows.find((each) => each.id === editingId);
                if (row !== undefined) onRemove(row);
                close(null);
              },
        })}
      </Fragment>
    );

  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 ref={heading} tabIndex={-1} className={TITLE}>
          {title}
        </h2>
        <p>{help}</p>
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-3">
          <ul aria-label={listLabel} className="flex flex-col">
            {rows.map((row) =>
              // A row being changed opens in place, so the user keeps their place in the list.
              row.id === editingId && form !== null ? (
                <li key={row.id} className="py-2">
                  {form}
                </li>
              ) : (
                <Fragment key={row.id}>
                  {renderRow(row, {
                    id: rowId(row.id),
                    onOpen: () => {
                      const fields = fieldsOfRow(row);
                      if (fields === null) onElsewhere?.(row);
                      else open(fields);
                    },
                  })}
                </Fragment>
              ),
            )}
          </ul>
          {totals}
        </div>
      )}

      {panel === null ? (
        <AddAnother
          label={addLabel}
          onClick={() => {
            open(fresh());
          }}
        />
      ) : (
        isNew && form
      )}

      {rows.length === 0 ? (
        <SkipButton skip={skip} />
      ) : (
        panel === null && <DoneFooter done={done} />
      )}
    </>
  );
}
