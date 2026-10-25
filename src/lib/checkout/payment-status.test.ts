import { describe, expect, it } from "vitest";

import { describePaymentStatus, isPaymentSuccessful } from "@/lib/checkout/payment-status";
import { messagesFor } from "@/i18n/messages";
import type { PaymentStatus } from "@/lib/types/api";

const EN = messagesFor("en").paymentStatus;

/**
 * The success page reads `paymentStatus` from
 * `GET /orders/by-number/{orderNumber}` and must never infer payment from a
 * redirect query parameter. The single most important rule: `unpaid` is NOT
 * success.
 */

describe("describePaymentStatus", () => {
  it("treats unpaid as NOT success - it is a pending webhook, not a receipt", () => {
    const view = describePaymentStatus("unpaid", EN);

    expect(view.isSuccess).toBe(false);
    expect(isPaymentSuccessful("unpaid")).toBe(false);
    expect(view.outcome).toBe("processing");
    // The cart must survive, so the customer can retry without rebuilding it.
    expect(view.mayClearCart).toBe(false);
    // And there must be a way to re-check and to try again.
    expect(view.showRefresh).toBe(true);
    expect(view.canRetry).toBe(true);
    expect(view.title).not.toMatch(/thank|success|confirmed$/i);
  });

  it("treats paid as success and allows the cart to be cleared", () => {
    const view = describePaymentStatus("paid", EN);

    expect(view.isSuccess).toBe(true);
    expect(view.outcome).toBe("confirmed");
    expect(view.mayClearCart).toBe(true);
    expect(view.canRetry).toBe(false);
  });

  it("treats authorized as success but keeps a refresh affordance", () => {
    const view = describePaymentStatus("authorized", EN);

    expect(view.isSuccess).toBe(true);
    expect(view.mayClearCart).toBe(true);
    expect(view.showRefresh).toBe(true);
  });

  it("treats failed as a failure with a retry path and an intact cart", () => {
    const view = describePaymentStatus("failed", EN);

    expect(view.isSuccess).toBe(false);
    expect(view.outcome).toBe("failed");
    expect(view.canRetry).toBe(true);
    expect(view.mayClearCart).toBe(false);
  });

  it("treats cancelled as a failure with a retry path", () => {
    const view = describePaymentStatus("cancelled", EN);

    expect(view.isSuccess).toBe(false);
    expect(view.canRetry).toBe(true);
    expect(view.mayClearCart).toBe(false);
  });

  it("handles the refund statuses distinctly", () => {
    expect(describePaymentStatus("partially_refunded", EN).outcome).toBe("refunded");
    expect(describePaymentStatus("partially_refunded", EN).isSuccess).toBe(true);

    expect(describePaymentStatus("refunded", EN).outcome).toBe("refunded");
    expect(describePaymentStatus("refunded", EN).isSuccess).toBe(false);
  });

  it("only ever reports success for paid, authorized or partially refunded", () => {
    const statuses: PaymentStatus[] = [
      "unpaid",
      "authorized",
      "paid",
      "partially_refunded",
      "refunded",
      "failed",
      "cancelled",
    ];

    const successful = statuses.filter((status) => isPaymentSuccessful(status));

    expect(successful).toEqual(["authorized", "paid", "partially_refunded"]);
  });

  it("never clears the cart for a status the server has not moved off unpaid/failed", () => {
    expect(describePaymentStatus("unpaid", EN).mayClearCart).toBe(false);
    expect(describePaymentStatus("failed", EN).mayClearCart).toBe(false);
    expect(describePaymentStatus("cancelled", EN).mayClearCart).toBe(false);
  });
});
