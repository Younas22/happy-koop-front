import { describe, expect, it } from "vitest";

import {
  availablePaymentMethods,
  isPaymentConfigured,
  isTestMode,
} from "@/lib/checkout/payment-methods";
import type { RuntimePayments } from "@/lib/types/api";

/**
 * Checkout must only offer a provider that runtime config says is enabled AND
 * has supplied its public credential. Otherwise it shows an explicit
 * "payment is not configured" state instead of a dead button that would fail
 * with 422 PAYMENT_NOT_CONFIGURED.
 */

function payments(overrides: Partial<RuntimePayments> = {}): RuntimePayments {
  return {
    stripe: { enabled: false, mode: "test", publishableKey: null },
    paypal: { enabled: false, mode: "sandbox", clientId: null },
    ...overrides,
  };
}

describe("availablePaymentMethods", () => {
  it("offers nothing when neither provider is enabled", () => {
    expect(availablePaymentMethods(payments())).toEqual([]);
    expect(isPaymentConfigured(payments())).toBe(false);
  });

  it("offers Stripe when it is enabled and a publishable key is present", () => {
    const methods = availablePaymentMethods(
      payments({ stripe: { enabled: true, mode: "test", publishableKey: "pk_test_123" } }),
    );

    expect(methods).toHaveLength(1);
    expect(methods[0].provider).toBe("stripe");
    expect(methods[0].publicKey).toBe("pk_test_123");
    expect(isTestMode(methods[0])).toBe(true);
  });

  it("does NOT offer an enabled provider with no public key", () => {
    // The contract returns the publishable key only while enabled; a missing
    // key means the provider cannot actually be used from the browser.
    const config = payments({ stripe: { enabled: true, mode: "test", publishableKey: null } });

    expect(availablePaymentMethods(config)).toEqual([]);
    expect(isPaymentConfigured(config)).toBe(false);
  });

  it("does NOT offer a disabled provider even when a key is somehow present", () => {
    const config = payments({
      paypal: { enabled: false, mode: "sandbox", clientId: "client-123" },
    });

    expect(availablePaymentMethods(config)).toEqual([]);
    expect(isPaymentConfigured(config)).toBe(false);
  });

  it("treats an empty-string key as no key", () => {
    const config = payments({ stripe: { enabled: true, mode: "test", publishableKey: "" } });
    expect(isPaymentConfigured(config)).toBe(false);
  });

  it("offers both providers when both are properly configured", () => {
    const config = payments({
      stripe: { enabled: true, mode: "live", publishableKey: "pk_live_123" },
      paypal: { enabled: true, mode: "live", clientId: "client-123" },
    });

    const methods = availablePaymentMethods(config);

    expect(methods.map((method) => method.provider)).toEqual(["stripe", "paypal"]);
    expect(methods.every((method) => !isTestMode(method))).toBe(true);
    expect(isPaymentConfigured(config)).toBe(true);
  });

  it("flags sandbox PayPal as a test mode so it is labelled in the UI", () => {
    const methods = availablePaymentMethods(
      payments({ paypal: { enabled: true, mode: "sandbox", clientId: "client-123" } }),
    );

    expect(isTestMode(methods[0])).toBe(true);
  });
});
