import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Money } from "@proto/components/amounts";
import type { Account } from "@proto/fixtures/accounts";
import { BIG, HAIRLINE } from "./look";
import type { SetupItem } from "./scenarios";
import { isDebt, KIND_LABEL, THINGS } from "./things";

// Rows match Home's: flat, with hairlines between them. On phones the amount and the buttons drop
// under the name, so a long name has the full width.
const ROW = cn(
  "flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-3",
  HAIRLINE,
);
const ROW_END = "flex shrink-0 items-center justify-between gap-2";

interface AccountRowsProps {
  accounts: readonly Account[];
  onEdit: (account: Account) => void;
  onRemove: (account: Account) => void;
}

/** The accounts added so far, each with its balance and its Edit and Remove buttons. */
export function AccountRows({ accounts, onEdit, onRemove }: AccountRowsProps) {
  return (
    <ul className="flex flex-col">
      {accounts.map((account) => (
        <li key={account.id} className={ROW}>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold wrap-break-word">
              {account.name}
            </span>
            <span className="text-sm text-muted-foreground">
              {KIND_LABEL[account.kind]}
            </span>
          </div>
          <div className={ROW_END}>
            <Money value={account.balance} className="font-bold" />
            <div className="flex">
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={`Edit ${account.name}`}
                onClick={() => {
                  onEdit(account);
                }}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={`Remove ${account.name}`}
                onClick={() => {
                  onRemove(account);
                }}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

interface ItemRowsProps {
  items: readonly SetupItem[];
  onRemove: (item: SetupItem) => void;
  /** False where a heading above the rows already says what kind of thing they are. */
  kinds?: boolean;
}

/** Gold, stocks, property and debts added by a stand-in step. A debt shows as a minus. */
export function ItemRows({ items, onRemove, kinds = true }: ItemRowsProps) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.id} className={ROW}>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold wrap-break-word">{item.name}</span>
            {kinds && (
              <span className="text-sm text-muted-foreground">
                {THINGS[item.kind].label}
              </span>
            )}
          </div>
          <div className={ROW_END}>
            <Money
              value={isDebt(item) ? -item.amount : item.amount}
              signed={isDebt(item)}
              className="font-bold"
            />
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={`Remove ${item.name}`}
              onClick={() => {
                onRemove(item);
              }}
            >
              <Trash2 />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

interface AddAnotherProps {
  label: string;
  onClick: () => void;
}

/**
 * Adds one more row to the list above it. A quiet text button, so the button that leaves the step
 * stays the only strong one. It sits flush with the rows' text.
 */
export function AddAnother({ label, onClick }: AddAnotherProps) {
  return (
    <Button
      variant="ghost"
      className={cn(BIG, "-ml-4 self-start")}
      onClick={onClick}
    >
      <Plus data-icon="inline-start" />
      {label}
    </Button>
  );
}

/** Marks a step whose real form isn't designed yet, so nobody judges it as the design. */
export function StandInNote() {
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Badge variant="outline">Not built yet</Badge>
      This step gets its own form later. For now it adds a sample.
    </p>
  );
}
