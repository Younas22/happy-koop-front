"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import * as React from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useLocale, useLocalizedHref, useMessages } from "@/i18n/client";
import { LOCALE_INFO } from "@/i18n/config";
import { fmt } from "@/i18n/format";
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
  const localize = useLocalizedHref();
  const t = useMessages().checkout.stripe;
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError(null);

    // The provider sends the customer back here, so it must be the success
    // page in the language they were paying in.
    const returnUrl = new URL(
      localize(`/checkout/success?order=${encodeURIComponent(orderNumber)}`),
      window.location.origin,
    ).toString();

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (result.error) {
      // Stripe's message is customer-safe; no card data is ever logged.
      setError(result.error.message ?? t.failed);
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
        <Alert tone="info" title={t.testTitle}>
          {t.testBody}
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="danger" live title={t.failedTitle}>
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
        loadingLabel={t.processing}
      >
        {fmt(t.pay, { amount: formatMoney(amount) })}
      </Button>

      <p className="text-body-sm text-ink-muted">
        {t.secure}
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
  const locale = useLocale();
  // `loadStripe` returns null when the key is unusable; Elements then renders
  // nothing, so the explicit error below keeps the customer informed.
  const stripePromise = React.useMemo(() => getStripe(publishableKey), [publishableKey]);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: LOCALE_INFO[locale].hreflang as "en" | "nl",
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
