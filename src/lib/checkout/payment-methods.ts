import type { PaymentProvider, RuntimePayments } from "@/lib/types/api";

/**
 * Which payment providers may be offered.
 *
 * A provider is offered ONLY when runtime config says it is enabled and the
 * public credential it needs is actually present (contract 3: the publishable
 * key / client id are returned only while the provider is enabled). If nothing
 * qualifies, the checkout shows an explicit "payment is not configured" state
 * instead of a button that would fail with 422 PAYMENT_NOT_CONFIGURED.
 *
 * This is a presentation guard only. The backend re-checks provider
 * enablement on `checkout/initialize` and on every payment call.
 */

export interface AvailablePaymentMethod {
  provider: PaymentProvider;
  label: string;
  mode: string;
  /** Publishable key (Stripe) or client id (PayPal). Never a secret. */
  publicKey: string;
}

export function availablePaymentMethods(payments: RuntimePayments): AvailablePaymentMethod[] {
  const methods: AvailablePaymentMethod[] = [];

  const stripeKey = payments.stripe.publishableKey;
  if (payments.stripe.enabled && typeof stripeKey === "string" && stripeKey.length > 0) {
    methods.push({
      provider: "stripe",
      label: "Card",
      mode: payments.stripe.mode,
      publicKey: stripeKey,
    });
  }

  const paypalClientId = payments.paypal.clientId;
  if (payments.paypal.enabled && typeof paypalClientId === "string" && paypalClientId.length > 0) {
    methods.push({
      provider: "paypal",
      label: "PayPal",
      mode: payments.paypal.mode,
      publicKey: paypalClientId,
    });
  }

  return methods;
}

/** True when no provider can be offered, so checkout must say so plainly. */
export function isPaymentConfigured(payments: RuntimePayments): boolean {
  return availablePaymentMethods(payments).length > 0;
}

/** Non-production modes are labelled so a test payment is never mistaken for a real one. */
export function isTestMode(method: AvailablePaymentMethod): boolean {
  return method.mode === "test" || method.mode === "sandbox";
}
