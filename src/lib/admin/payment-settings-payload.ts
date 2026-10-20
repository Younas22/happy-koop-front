import type {
  AdminPaymentSettingsUpdate,
  AdminPaypalSettingsUpdate,
  AdminStripeSettingsUpdate,
  PaypalMode,
  StripeMode,
} from "@/lib/types/api";

/**
 * Builds the `PUT /admin/settings/payments` body (contract 8.2).
 *
 * Secret handling, which the contract pins down exactly:
 *  - an OMITTED or empty secret field means "leave unchanged", so an untouched
 *    input must not appear in the payload at all;
 *  - an explicit `null` CLEARS the stored secret - that is what the "Clear"
 *    control sends;
 *  - a non-empty value replaces it.
 *
 * Secret inputs therefore always start empty and are never populated from the
 * API response (which only ever returns `{configured, maskedSuffix,
 * updatedAt}`). Nothing here writes a secret to storage, a URL or a log.
 *
 * `confirmLiveMode` is required when switching a provider to live mode;
 * without it the API answers `423 LIVE_MODE_LOCKED`.
 */

/** Either leave a secret alone, set it, or clear it. */
export type SecretIntent =
  | { action: "unchanged" }
  | { action: "set"; value: string }
  | { action: "clear" };

export interface StripeFormValues {
  enabled: boolean;
  mode: StripeMode;
  publishableKey: string;
  secretKey: SecretIntent;
  webhookSecret: SecretIntent;
}

export interface PaypalFormValues {
  enabled: boolean;
  mode: PaypalMode;
  clientId: string;
  clientSecret: SecretIntent;
  webhookId: SecretIntent;
}

export interface PaymentSettingsFormValues {
  stripe: StripeFormValues;
  paypal: PaypalFormValues;
  /** Ticked by the admin to authorize a switch to live mode. */
  confirmLiveMode: boolean;
}

/**
 * Turns a raw text input plus its "clear" flag into an intent.
 * An empty, whitespace-only input is "unchanged" - never an accidental clear.
 */
export function secretIntent(rawValue: string, clear: boolean): SecretIntent {
  if (clear) return { action: "clear" };
  const value = rawValue.trim();
  if (value === "") return { action: "unchanged" };
  return { action: "set", value };
}

/** Adds a secret field to the payload only when it must change. */
function applySecret<T extends object, K extends keyof T>(
  target: T,
  key: K,
  intent: SecretIntent,
): void {
  if (intent.action === "unchanged") return;
  // `null` clears; a string replaces.
  (target as Record<string, unknown>)[key as string] =
    intent.action === "clear" ? null : intent.value;
}

export function buildPaymentSettingsPayload(
  values: PaymentSettingsFormValues,
): AdminPaymentSettingsUpdate {
  const stripe: AdminStripeSettingsUpdate = {
    enabled: values.stripe.enabled,
    mode: values.stripe.mode,
    // A public key is not a secret: it round-trips normally. An empty box
    // clears it, since the API treats an empty public key as "no key".
    publishableKey: values.stripe.publishableKey.trim() || null,
  };
  applySecret(stripe, "secretKey", values.stripe.secretKey);
  applySecret(stripe, "webhookSecret", values.stripe.webhookSecret);

  const paypal: AdminPaypalSettingsUpdate = {
    enabled: values.paypal.enabled,
    mode: values.paypal.mode,
    clientId: values.paypal.clientId.trim() || null,
  };
  applySecret(paypal, "clientSecret", values.paypal.clientSecret);
  applySecret(paypal, "webhookId", values.paypal.webhookId);

  const payload: AdminPaymentSettingsUpdate = { stripe, paypal };

  // Only sent when live mode is actually requested, and only when the admin
  // ticked the confirmation.
  const wantsLive = values.stripe.mode === "live" || values.paypal.mode === "live";
  if (wantsLive && values.confirmLiveMode) {
    payload.confirmLiveMode = true;
  }

  return payload;
}

/** True when the form is asking for live mode on either provider. */
export function requestsLiveMode(values: PaymentSettingsFormValues): boolean {
  return values.stripe.mode === "live" || values.paypal.mode === "live";
}
