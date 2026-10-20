import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { OrderStatus, PaymentStatus, ReviewModerationStatus } from "@/lib/types/api";

/**
 * Status badges.
 *
 * The label is the server's status, humanized - never a reinterpretation. In
 * particular `unpaid` is shown as "Unpaid", never as a neutral or hopeful
 * wording: payment state comes from the server and is presented as-is
 * (contract 6).
 */

const ORDER_TONES: Record<OrderStatus, BadgeTone> = {
  pending: "neutral",
  processing: "info",
  shipped: "brand",
  delivered: "success",
  cancelled: "danger",
  refunded: "warning",
};

const PAYMENT_TONES: Record<PaymentStatus, BadgeTone> = {
  unpaid: "warning",
  authorized: "info",
  paid: "success",
  partially_refunded: "warning",
  refunded: "warning",
  failed: "danger",
  cancelled: "danger",
};

const REVIEW_TONES: Record<ReviewModerationStatus, BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

/** `partially_refunded` -> `Partially refunded`. */
export function humanizeStatus(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={ORDER_TONES[status] ?? "neutral"}>
      <span className="sr-only">Order status: </span>
      {humanizeStatus(status)}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge tone={PAYMENT_TONES[status] ?? "neutral"}>
      <span className="sr-only">Payment status: </span>
      {humanizeStatus(status)}
    </Badge>
  );
}

export function ReviewStatusBadge({ status }: { status: ReviewModerationStatus }) {
  return (
    <Badge tone={REVIEW_TONES[status] ?? "neutral"}>
      <span className="sr-only">Moderation status: </span>
      {humanizeStatus(status)}
    </Badge>
  );
}
