import type { PaymentStatus } from "@/lib/types/api";

/**
 * How the checkout return pages read an order's payment state.
 *
 * The ONLY input is `paymentStatus` from
 * `GET /orders/by-number/{orderNumber}` - the authoritative server read
 * (contract 5). Redirect query parameters are never consulted: a provider can
 * send the browser back before the webhook has landed, and anyone can edit a
 * URL.
 *
 * `unpaid` is explicitly NOT success. It means the webhook has not confirmed
 * anything yet, so the page shows a "still processing" state with a refresh
 * affordance rather than a receipt.
 */

export type PaymentOutcome = "confirmed" | "authorized" | "processing" | "failed" | "refunded";

export interface PaymentOutcomeView {
  outcome: PaymentOutcome;
  /** Only `confirmed` and `authorized` may be presented as a placed order. */
  isSuccess: boolean;
  /** The local cart may be cleared only once the server left `unpaid`. */
  mayClearCart: boolean;
  /** Offer another payment attempt. */
  canRetry: boolean;
  /** Offer a manual refresh while an async webhook is outstanding. */
  showRefresh: boolean;
  title: string;
  description: string;
}

export function describePaymentStatus(status: PaymentStatus): PaymentOutcomeView {
  switch (status) {
    case "paid":
      return {
        outcome: "confirmed",
        isSuccess: true,
        mayClearCart: true,
        canRetry: false,
        showRefresh: false,
        title: "Payment confirmed",
        description: "Your payment has been confirmed and your order is being prepared.",
      };

    case "authorized":
      return {
        outcome: "authorized",
        isSuccess: true,
        mayClearCart: true,
        canRetry: false,
        showRefresh: true,
        title: "Payment authorized",
        description:
          "Your payment is authorized and will be captured when the order is prepared. Nothing further is needed from you.",
      };

    case "partially_refunded":
      return {
        outcome: "refunded",
        isSuccess: true,
        mayClearCart: true,
        canRetry: false,
        showRefresh: false,
        title: "Partially refunded",
        description: "Part of this order has been refunded. The amounts below are from our records.",
      };

    case "refunded":
      return {
        outcome: "refunded",
        isSuccess: false,
        mayClearCart: true,
        canRetry: false,
        showRefresh: false,
        title: "Refunded",
        description: "This order has been refunded in full.",
      };

    case "failed":
      return {
        outcome: "failed",
        isSuccess: false,
        mayClearCart: false,
        canRetry: true,
        showRefresh: true,
        title: "Payment failed",
        description:
          "The payment did not go through, so the order has not been placed. You can try paying again - nothing has been charged.",
      };

    case "cancelled":
      return {
        outcome: "failed",
        isSuccess: false,
        mayClearCart: false,
        canRetry: true,
        showRefresh: false,
        title: "Payment cancelled",
        description: "The payment was cancelled, so the order has not been placed.",
      };

    case "unpaid":
    default:
      return {
        outcome: "processing",
        isSuccess: false,
        mayClearCart: false,
        canRetry: true,
        showRefresh: true,
        title: "Payment not confirmed yet",
        description:
          "We have not received confirmation from the payment provider. This can take a moment - refresh to check again. Your order is not complete until it is confirmed.",
      };
  }
}

/** Convenience guard used by the success page and its tests. */
export function isPaymentSuccessful(status: PaymentStatus): boolean {
  return describePaymentStatus(status).isSuccess;
}
