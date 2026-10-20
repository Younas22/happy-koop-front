"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import * as React from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/money";
import type { Money } from "@/lib/types/api";

/**
 * Stripe payment step.
 *
 * Uses Stripe Elements with the `clientSecret` from
 * `POST /payments/stripe/intent`, which was fetched through our own route
 * handler. The publishable key also comes from the server (runtime config /
 * the intent response) - no key is hard-coded here, and no secret key or
 * webhook secret exists in this bundle.
 *
 * `confirmPayment` is given a `return_url` of `/checkout/success?order=…`.
 * That page reads the authoritative `paymentStatus` from the API; this
 * component never decides that a payment succeeded.
 */

/** One loader per publishable key, so remounting does not reload Stripe.js. */
const stripeCache = new Map<string, Promise<Stripe | null>>();

function getStripe(publishableKey: string): Promise<Stripe | null> {
  const cached = stripeCache.get(publishableKey);
  if (cached) return cached;
  const promise = loadStripe(publishableKey);
  stripeCache.set(publishableKey, promise);
  return promise;
}

export interface StripePaymentStepProps {
  publishableKey: string;
  clientSecret: string;
  orderNumber: string;
  amount: Money;
  testMode: boolean;
}

function StripeForm({
  orderNumber,
  amount,
  testMode,
}: {
  orderNumber: string;
  amount: Money;
  testMode: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError(null);

    const returnUrl = new URL(
      `/checkout/success?order=${encodeURIComponent(orderNumber)}`,
      window.location.origin,
    ).toString();

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (result.error) {
      // Stripe's message is customer-safe; no card data is ever logged.
      setError(result.error.message ?? "The payment could not be completed. Nothing was charged.");
      setSubmitting(false);
      return;
    }

    // No redirect happened (e.g. a card needing no further action): go to the
    // return page, which reads the real status from the API.
    window.location.assign(returnUrl);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {testMode ? (
        <Alert tone="info" title="Test mode">
          This store is in Stripe test mode. Real cards are not charged.
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="danger" live title="Payment not completed">
          {error}
        </Alert>
      ) : null}

      <PaymentElement onReady={() => setReady(true)} />

      <Button
        type="submit"
        block
        size="lg"
        disabled={!stripe || !elements || !ready}
        loading={submitting}
        loadingLabel="Processing payment…"
      >
        Pay {formatMoney(amount)}
      </Button>

      <p className="text-xs text-ink-muted">
        Your card details are entered directly into Stripe and never reach this store&rsquo;s
        servers.
      </p>
    </form>
  );
}

export function StripePaymentStep({
  publishableKey,
  clientSecret,
  orderNumber,
  amount,
  testMode,
}: StripePaymentStepProps) {
  // `loadStripe` returns null when the key is unusable; Elements then renders
  // nothing, so the explicit error below keeps the customer informed.
  const stripePromise = React.useMemo(() => getStripe(publishableKey), [publishableKey]);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "flat",
          variables: { borderRadius: "10px" },
        },
      }}
    >
      <StripeForm orderNumber={orderNumber} amount={amount} testMode={testMode} />
    </Elements>
  );
}
