"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  refundOrderAction,
  updateFulfilmentAction,
  updateOrderStatusAction,
} from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { flattenFieldErrors } from "@/lib/forms/api-errors";
import { formatMoney, parseMajorUnitsToMinor, toMajorUnitString } from "@/lib/money";
import type { AdminOrderDetail, OrderStatus, PaymentStatus } from "@/lib/types/api";

/**
 * Order admin controls: status, fulfilment and refund.
 *
 * The API enforces which transitions are legal and returns 409 for an invalid
 * one, so this UI offers the full list and reports the refusal rather than
 * pretending to know the state machine. Payment status is shown as the server
 * reports it and is only changed deliberately.
 *
 * A refund is destructive and irreversible, so it goes through a confirmation
 * naming the order and the amount, and the amount is capped at the server's
 * `refundableAmount`.
 */

const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "unpaid",
  "authorized",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
  "cancelled",
];

const selectClass =
  "h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink";

export function OrderAdminControls({
  order,
  minorUnitExponent,
}: {
  order: AdminOrderDetail;
  minorUnitExponent: number;
}) {
  const router = useRouter();

  const [status, setStatus] = React.useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>(order.paymentStatus);
  const [adminNote, setAdminNote] = React.useState(order.adminNote ?? "");
  const [statusBusy, setStatusBusy] = React.useState(false);
  const [statusError, setStatusError] = React.useState<string | null>(null);

  const [carrier, setCarrier] = React.useState(order.tracking?.carrier ?? "");
  const [trackingNumber, setTrackingNumber] = React.useState(order.tracking?.trackingNumber ?? "");
  const [trackingUrl, setTrackingUrl] = React.useState(order.tracking?.trackingUrl ?? "");
  const [fulfilBusy, setFulfilBusy] = React.useState(false);
  const [fulfilError, setFulfilError] = React.useState<string | null>(null);

  const refundable = order.refundableAmount;
  const [refundAmount, setRefundAmount] = React.useState(
    refundable.amount > 0 ? toMajorUnitString(refundable, minorUnitExponent) : "",
  );
  const [refundReason, setRefundReason] = React.useState("");
  const [refundOpen, setRefundOpen] = React.useState(false);
  const [refundBusy, setRefundBusy] = React.useState(false);
  const [refundError, setRefundError] = React.useState<string | null>(null);

  function describe(error: { message: string; errors: Record<string, string[]> | null }): string {
    const details = flattenFieldErrors(error.errors);
    return details.length > 0 ? details.join(" ") : error.message;
  }

  async function saveStatus() {
    setStatusBusy(true);
    setStatusError(null);

    const body: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      adminNote?: string | null;
    } = { adminNote: adminNote.trim() === "" ? null : adminNote.trim() };

    if (status !== order.status) body.status = status;
    if (paymentStatus !== order.paymentStatus) body.paymentStatus = paymentStatus;

    const result = await updateOrderStatusAction(order.id, body);
    setStatusBusy(false);

    if (!result.ok) {
      setStatusError(describe(result.error));
      toast.error("The order was not updated.");
      return;
    }

    toast.success("Order updated.");
    router.refresh();
  }

  async function saveFulfilment() {
    setFulfilBusy(true);
    setFulfilError(null);

    const result = await updateFulfilmentAction(order.id, {
      carrier: carrier.trim() || null,
      trackingNumber: trackingNumber.trim() || null,
      trackingUrl: trackingUrl.trim() || null,
    });

    setFulfilBusy(false);

    if (!result.ok) {
      setFulfilError(describe(result.error));
      toast.error("Tracking was not saved.");
      return;
    }

    toast.success("Tracking saved.");
    router.refresh();
  }

  async function doRefund() {
    const amount = parseMajorUnitsToMinor(refundAmount, minorUnitExponent);

    if (amount === null || amount <= 0) {
      setRefundError("Enter a refund amount greater than zero.");
      return;
    }

    if (amount > refundable.amount) {
      setRefundError(
        `The refundable balance for this order is ${formatMoney(refundable)}. Enter that amount or less.`,
      );
      return;
    }

    setRefundBusy(true);
    setRefundError(null);

    const result = await refundOrderAction(order.id, {
      amount,
      reason: refundReason.trim() || null,
    });

    setRefundBusy(false);

    if (!result.ok) {
      setRefundError(describe(result.error));
      return;
    }

    setRefundOpen(false);
    toast.success("Refund recorded.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {statusError ? (
            <Alert tone="danger" live title="The order was not updated">
              {statusError}
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="order-status-select"
              label="Fulfilment status"
              description="Invalid transitions are refused by the API."
            >
              {(field) => (
                <select
                  {...field}
                  className={selectClass}
                  value={status}
                  onChange={(event) => setStatus(event.target.value as OrderStatus)}
                >
                  {ORDER_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            <FormField
              id="order-payment-select"
              label="Payment status"
              description="Change this only to correct a record. Payment confirmations normally arrive from the provider's webhook."
            >
              {(field) => (
                <select
                  {...field}
                  className={selectClass}
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
                >
                  {PAYMENT_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </div>

          <FormField
            id="order-admin-note"
            label="Internal note"
            description="Visible to admins only. Never shown to the customer."
          >
            {(field) => (
              <Textarea
                {...field}
                rows={3}
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
              />
            )}
          </FormField>

          <Button loading={statusBusy} loadingLabel="Saving…" onClick={() => void saveStatus()}>
            Save status
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fulfilment</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {fulfilError ? (
            <Alert tone="danger" live title="Tracking was not saved">
              {fulfilError}
            </Alert>
          ) : null}

          <p className="text-xs text-ink-muted">
            Leave these blank until there is a real shipment. The storefront shows tracking only
            when it exists, and never invents a delivery date.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="order-carrier" label="Carrier">
              {(field) => (
                <Input
                  {...field}
                  value={carrier}
                  onChange={(event) => setCarrier(event.target.value)}
                />
              )}
            </FormField>

            <FormField id="order-tracking-number" label="Tracking number">
              {(field) => (
                <Input
                  {...field}
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                />
              )}
            </FormField>

            <FormField
              id="order-tracking-url"
              label="Tracking URL"
              description="Must be an absolute http(s) URL."
              className="sm:col-span-2"
            >
              {(field) => (
                <Input
                  {...field}
                  type="url"
                  value={trackingUrl}
                  onChange={(event) => setTrackingUrl(event.target.value)}
                />
              )}
            </FormField>
          </div>

          <Button
            variant="secondary"
            loading={fulfilBusy}
            loadingLabel="Saving…"
            onClick={() => void saveFulfilment()}
          >
            Save tracking
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Refund</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-subtle">Already refunded</dt>
              <dd className="text-ink tabular-nums">{formatMoney(order.refundedAmount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-subtle">Refundable now</dt>
              <dd className="text-ink tabular-nums">{formatMoney(refundable)}</dd>
            </div>
          </dl>

          {refundable.amount <= 0 ? (
            <p className="text-sm text-ink-muted">
              There is nothing left to refund on this order.
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="refund-amount"
                  label={`Amount to refund (${refundable.currency})`}
                  description={`Maximum ${formatMoney(refundable)}.`}
                >
                  {(field) => (
                    <Input
                      {...field}
                      inputMode="decimal"
                      value={refundAmount}
                      onChange={(event) => setRefundAmount(event.target.value)}
                    />
                  )}
                </FormField>

                <FormField id="refund-reason" label="Reason">
                  {(field) => (
                    <Input
                      {...field}
                      value={refundReason}
                      onChange={(event) => setRefundReason(event.target.value)}
                    />
                  )}
                </FormField>
              </div>

              <Button
                variant="danger"
                onClick={() => {
                  setRefundError(null);
                  setRefundOpen(true);
                }}
              >
                Refund this order
              </Button>
            </>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        title="Refund this order?"
        recordName={`${order.orderNumber} - ${refundAmount || "0"} ${refundable.currency}`}
        description="The refund is sent to the payment provider and cannot be undone from here. The payment status is updated from the provider's response."
        confirmLabel="Refund"
        busy={refundBusy}
        error={refundError}
        onConfirm={() => void doRefund()}
      />
    </div>
  );
}
