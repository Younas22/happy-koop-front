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

type PaymentOutcomeFlags = Omit<PaymentOutcomeView, "title" | "description">;

function outcomeFlags(status: PaymentStatus): PaymentOutcomeFlags {
  switch (status) {
    case "paid":
      return {
        outcome: "confirmed",
        isSuccess: true,
        mayClearCart: true,
        canRetry: false,
        showRefresh: false,
      };

    case "authorized":
      return {
        outcome: "authorized",
        isSuccess: true,
        mayClearCart: true,
        canRetry: false,
        showRefresh: true,
      };

    case "partially_refunded":
      return {
        outcome: "refunded",
        isSuccess: true,
        mayClearCart: true,
        canRetry: false,
        showRefresh: false,
      };

    case "refunded":
      return {
        outcome: "refunded",
        isSuccess: false,
        mayClearCart: true,
        canRetry: false,
        showRefresh: false,
      };

    case "failed":
      return {
        outcome: "failed",
        isSuccess: false,
        mayClearCart: false,
        canRetry: true,
        showRefresh: true,
      };

    case "cancelled":
      return {
        outcome: "failed",
        isSuccess: false,
        mayClearCart: false,
        canRetry: true,
        showRefresh: false,
      };

    case "unpaid":
    default:
      return {
        outcome: "processing",
        isSuccess: false,
        mayClearCart: false,
        canRetry: true,
        showRefresh: true,
      };
  }
}

/** The page copy for each status, from the dictionary (`m.paymentStatus`). */
export type PaymentStatusCopy = Record<PaymentStatus, { title: string; description: string }>;

/**
 * The outcome for a status, worded in the page's language.
 *
 * The decision - success or not, clear the cart or not - comes from the
 * status alone and is identical in every language; only the title and
 * description are taken from `copy`. An unknown status reads as `unpaid`,
 * which is the safe reading: never a receipt.
 */
export function describePaymentStatus(
  status: PaymentStatus,
  copy: PaymentStatusCopy,
): PaymentOutcomeView {
  const text = copy[status] ?? copy.unpaid;
  return { ...outcomeFlags(status), title: text.title, description: text.description };
}

/** Convenience guard used by the success page and its tests. */
export function isPaymentSuccessful(status: PaymentStatus): boolean {
  return outcomeFlags(status).isSuccess;
}
