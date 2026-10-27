"use client";

import { Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import type { AdminActionResult } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import type { AdminBulkResult } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

/**
 * Row selection for admin lists, plus the bar that acts on the selection.
 *
 * `BulkSelection` wraps a list and knows which ids are on the current page;
 * the checkboxes and the action bar inside it share that state. It works the
 * same inside a server-rendered table (the pieces are client islands) and
 * inside a client manager component. Selection is per page: ids that leave
 * the list after a refresh are dropped from it.
 */

interface BulkSelectionState {
  ids: readonly number[];
  selected: ReadonlySet<number>;
  toggle: (id: number, checked: boolean) => void;
  setAll: (checked: boolean) => void;
  clear: () => void;
}

const BulkSelectionContext = React.createContext<BulkSelectionState | null>(
  null,
);

export function useBulkSelection(): BulkSelectionState {
  const context = React.useContext(BulkSelectionContext);
  if (!context)
    throw new Error("useBulkSelection must be used inside <BulkSelection>.");
  return context;
}

export function BulkSelection({
  ids,
  children,
}: {
  ids: readonly number[];
  children: React.ReactNode;
}) {
  const [picked, setPicked] = React.useState<ReadonlySet<number>>(
    () => new Set(),
  );

  // Only ids still listed count, e.g. after a delete and refresh.
  const selected = React.useMemo<ReadonlySet<number>>(
    () => new Set(ids.filter((id) => picked.has(id))),
    [ids, picked],
  );

  const value = React.useMemo<BulkSelectionState>(
    () => ({
      ids,
      selected,
      toggle: (id, checked) =>
        setPicked((current) => {
          const next = new Set(current);
          if (checked) next.add(id);
          else next.delete(id);
          return next;
        }),
      setAll: (checked) => setPicked(checked ? new Set(ids) : new Set()),
      clear: () => setPicked(new Set()),
    }),
    [ids, selected],
  );

  return (
    <BulkSelectionContext.Provider value={value}>
      {children}
    </BulkSelectionContext.Provider>
  );
}

/** Header checkbox: selects or clears every row on the page. */
export function BulkSelectAll({
  label = "Select all on this page",
}: {
  label?: string;
}) {
  const { ids, selected, setAll } = useBulkSelection();
  const all = ids.length > 0 && selected.size === ids.length;

  return (
    <Checkbox
      aria-label={label}
      checked={all ? true : selected.size > 0 ? "indeterminate" : false}
      disabled={ids.length === 0}
      onCheckedChange={() => setAll(!all)}
    />
  );
}

export function BulkSelectRow({
  id,
  label,
  className,
}: {
  id: number;
  /** Names the row for screen readers, e.g. "Select Bamboo tray". */
  label: string;
  className?: string;
}) {
  const { selected, toggle } = useBulkSelection();

  return (
    <Checkbox
      aria-label={label}
      className={className}
      checked={selected.has(id)}
      onCheckedChange={(checked) => toggle(id, checked === true)}
    />
  );
}

/**
 * Sticky bar shown while anything is selected. Put the actions in `children`;
 * `BulkDeleteButton` is the common one.
 */
export function BulkActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { selected, clear } = useBulkSelection();

  if (selected.size === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className={cn(
        "surface-card sticky top-2 z-10 mb-3 flex flex-wrap items-center gap-2 p-2.5",
        className,
      )}
    >
      <span className="px-1 text-sm font-medium text-ink tabular-nums">
        {selected.size} selected
      </span>
      <Button size="sm" variant="ghost" onClick={clear}>
        <X className="size-4" aria-hidden="true" />
        Clear
      </Button>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  );
}

/**
 * Reports a bulk result as toasts. Returns true when every selected id went
 * through, so the caller can decide whether to keep the selection.
 */
export function reportBulkResult(
  result: AdminBulkResult,
  messages: {
    done: (count: number) => string;
    failed: (count: number) => string;
  },
): boolean {
  if (result.succeeded.length > 0)
    toast.success(messages.done(result.succeeded.length));

  if (result.failed.length > 0) {
    toast.error(messages.failed(result.failed.length), {
      description: result.failed
        .slice(0, 3)
        .map((failure) => failure.message)
        .join(" "),
    });
    return false;
  }

  return true;
}

/** Deletes the selection behind a confirmation that states the count. */
export function BulkDeleteButton({
  action,
  singular,
  plural,
  description,
}: {
  action: (ids: number[]) => Promise<AdminActionResult<AdminBulkResult>>;
  /** Lower-case nouns, e.g. "product" / "products". */
  singular: string;
  plural: string;
  description?: React.ReactNode;
}) {
  const router = useRouter();
  const { selected, clear } = useBulkSelection();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const count = selected.size;
  const noun = count === 1 ? singular : plural;

  async function confirm() {
    setBusy(true);
    setError(null);

    const result = await action([...selected]);
    setBusy(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setOpen(false);
    reportBulkResult(result.data, {
      done: (n) => `${n} ${n === 1 ? singular : plural} deleted.`,
      failed: (n) =>
        `${n} ${n === 1 ? singular : plural} could not be deleted.`,
    });
    clear();
    router.refresh();
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="text-danger"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete selected
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${count} ${noun}?`}
        recordName={`${count} selected ${noun}`}
        description={description}
        confirmLabel={`Delete ${count} ${noun}`}
        busy={busy}
        error={error}
        onConfirm={() => void confirm()}
      />
    </>
  );
}
