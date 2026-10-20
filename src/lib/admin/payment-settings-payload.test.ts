import { describe, expect, it } from "vitest";

import {
  buildPaymentSettingsPayload,
  requestsLiveMode,
  secretIntent,
  type PaymentSettingsFormValues,
} from "@/lib/admin/payment-settings-payload";

/**
 * Contract 8.2: `PUT /admin/settings/payments` treats an OMITTED or empty
 * secret field as "leave unchanged", and an explicit `null` as "clear".
 *
 * The form therefore must not send a key it did not collect - otherwise saving
 * an unrelated toggle would wipe a stored secret.
 */

function values(overrides: Partial<PaymentSettingsFormValues> = {}): PaymentSettingsFormValues {
  return {
    stripe: {
      enabled: true,
      mode: "test",
      publishableKey: "pk_test_123",
      secretKey: { action: "unchanged" },
      webhookSecret: { action: "unchanged" },
    },
    paypal: {
      enabled: false,
      mode: "sandbox",
      clientId: "",
      clientSecret: { action: "unchanged" },
      webhookId: { action: "unchanged" },
    },
    confirmLiveMode: false,
    ...overrides,
  };
}

describe("secretIntent", () => {
  it("reads an untouched field as unchanged", () => {
    expect(secretIntent("", false)).toEqual({ action: "unchanged" });
  });

  it("reads a whitespace-only field as unchanged, never as a clear", () => {
    expect(secretIntent("   ", false)).toEqual({ action: "unchanged" });
  });

  it("reads a typed value as a replacement", () => {
    expect(secretIntent(" sk_test_abc ", false)).toEqual({ action: "set", value: "sk_test_abc" });
  });

  it("reads the explicit clear flag as a clear, even with text present", () => {
    expect(secretIntent("sk_test_abc", true)).toEqual({ action: "clear" });
  });
});

describe("buildPaymentSettingsPayload", () => {
  it("OMITS an untouched secret field entirely", () => {
    const payload = buildPaymentSettingsPayload(values());

    expect(payload.stripe).toBeDefined();
    expect("secretKey" in payload.stripe!).toBe(false);
    expect("webhookSecret" in payload.stripe!).toBe(false);
    expect("clientSecret" in payload.paypal!).toBe(false);
    expect("webhookId" in payload.paypal!).toBe(false);

    // The non-secret fields are still sent, so a toggle can be saved on its own.
    expect(payload.stripe).toMatchObject({
      enabled: true,
      mode: "test",
      publishableKey: "pk_test_123",
    });
  });

  it("serializes to JSON without any secret key at all when untouched", () => {
    const json = JSON.stringify(buildPaymentSettingsPayload(values()));

    expect(json).not.toContain("secretKey");
    expect(json).not.toContain("webhookSecret");
    expect(json).not.toContain("clientSecret");
    expect(json).not.toContain("webhookId");
  });

  it("includes a secret only when one was typed", () => {
    const payload = buildPaymentSettingsPayload(
      values({
        stripe: {
          enabled: true,
          mode: "test",
          publishableKey: "pk_test_123",
          secretKey: { action: "set", value: "sk_test_new" },
          webhookSecret: { action: "unchanged" },
        },
      }),
    );

    expect(payload.stripe!.secretKey).toBe("sk_test_new");
    // The sibling secret is still left alone.
    expect("webhookSecret" in payload.stripe!).toBe(false);
  });

  it("sends null for a cleared secret", () => {
    const payload = buildPaymentSettingsPayload(
      values({
        stripe: {
          enabled: true,
          mode: "test",
          publishableKey: "pk_test_123",
          secretKey: { action: "clear" },
          webhookSecret: { action: "unchanged" },
        },
      }),
    );

    expect("secretKey" in payload.stripe!).toBe(true);
    expect(payload.stripe!.secretKey).toBeNull();
  });

  it("sends an empty public key as null, since a public key is not a secret", () => {
    const payload = buildPaymentSettingsPayload(values());
    expect(payload.paypal!.clientId).toBeNull();
  });

  it("omits confirmLiveMode unless live mode is actually requested and confirmed", () => {
    expect(buildPaymentSettingsPayload(values()).confirmLiveMode).toBeUndefined();

    const liveUnconfirmed = buildPaymentSettingsPayload(
      values({
        stripe: {
          enabled: true,
          mode: "live",
          publishableKey: "pk_live_123",
          secretKey: { action: "unchanged" },
          webhookSecret: { action: "unchanged" },
        },
        confirmLiveMode: false,
      }),
    );
    // Without the confirmation the API answers 423 LIVE_MODE_LOCKED, which is
    // the intended outcome - the flag is never sent on the client's initiative.
    expect(liveUnconfirmed.confirmLiveMode).toBeUndefined();

    const liveConfirmed = buildPaymentSettingsPayload(
      values({
        stripe: {
          enabled: true,
          mode: "live",
          publishableKey: "pk_live_123",
          secretKey: { action: "unchanged" },
          webhookSecret: { action: "unchanged" },
        },
        confirmLiveMode: true,
      }),
    );
    expect(liveConfirmed.confirmLiveMode).toBe(true);
  });
});

describe("requestsLiveMode", () => {
  it("is true when either provider asks for live mode", () => {
    expect(requestsLiveMode(values())).toBe(false);

    expect(
      requestsLiveMode(
        values({
          paypal: {
            enabled: true,
            mode: "live",
            clientId: "client",
            clientSecret: { action: "unchanged" },
            webhookId: { action: "unchanged" },
          },
        }),
      ),
    ).toBe(true);
  });
});
