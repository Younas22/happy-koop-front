"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  bulkUpdateOrderStatusAction,
  deleteOrderAction,
} from "@/app/admin/actions";
import {
  reportBulkResult,
  useBulkSelection,
} from "@/components/admin/BulkSelection";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import type { OrderStatus } from "@/lib/types/api";

const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

/** What deleting an order does, shared by the single and bulk confirmations. */
export const ORDER_DELETE_DESCRIPTION =
  "It disappears from the admin list and the customer's account. Stock held by a pending or processing order goes back on sale. Payments are not refunded - refund first if money was taken.";

/**
 * Moves the selected orders to one fulfilment status. The API applies each
 * order separately and refuses illegal transitions, so a partial result is
 * normal: the refused orders are named in a toast and stay selected.
 */
export function OrderBulkStatus() {
  const router = useRouter();
  const { selected, toggle } = useBulkSelection();
  const [status, setStatus] = React.useState<OrderStatus | "">("");
  const [busy, setBusy] = React.useState(false);

  async function apply() {
    if (status === "") return;
    setBusy(true);

    const result = await bulkUpdateOrderStatusAction([...selected], status);
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }

    reportBulkResult(result.data, {
      done: (n) => `${n} ${n === 1 ? "order" : "orders"} moved to ${status}.`,
      failed: (n) =>
        `${n} ${n === 1 ? "order" : "orders"} could not move to ${status}.`,
    });
    // Leave only the refused orders selected, so they can be dealt with next.
    for (const id of result.data.succeeded) toggle(id, false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="bulk-order-status" className="sr-only">
        New status for the selected orders
      </label>
      <select
        id="bulk-order-status"
        value={status}
        onChange={(event) => setStatus(event.target.value as OrderStatus | "")}
        className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink"
      >
        <option value="">Change status…</option>
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        variant="secondary"
        disabled={status === ""}
        loading={busy}
        loadingLabel="Updating…"
        onClick={() => void apply()}
      >
        Apply
      </Button>
    </div>
  );
}

/** Deletes one order behind a confirmation that names it. */
export function DeleteOrderButton({
  id,
  orderNumber,
  redirectTo,
  size,
  label = "Delete",
}: {
  id: number;
  orderNumber: string;
  /** Where to go afterwards; omitted, the current page is refreshed. */
  redirectTo?: string;
  size?: "sm";
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);

    const result = await deleteOrderAction(id);
    setBusy(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setOpen(false);
    toast.success("Order deleted.");
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  return (
    <>
      <Button
        size={size}
        variant="ghost"
        className="text-danger"
        aria-label={
          label === "Delete" ? `Delete order ${orderNumber}` : undefined
        }
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        {label}
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this order?"
        recordName={orderNumber}
        description={ORDER_DELETE_DESCRIPTION}
        confirmLabel="Delete order"
        busy={busy}
        error={error}
        onConfirm={() => void confirm()}
      />
    </>
  );
}
