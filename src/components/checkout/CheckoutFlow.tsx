"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, ShoppingBag } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { AddressFields } from "@/components/address/AddressFields";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { PaypalPaymentStep } from "@/components/checkout/PaypalPaymentStep";
import { ShippingMethodPicker } from "@/components/checkout/ShippingMethodPicker";
import { StripePaymentStep } from "@/components/checkout/StripePaymentStep";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { RadioCard, RadioGroup } from "@/components/ui/RadioGroup";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { useCartStore } from "@/lib/cart/store";
import { useCartValidation } from "@/lib/cart/use-cart-validation";
import { newIdempotencyKey } from "@/lib/checkout/idempotency";
import type { AvailablePaymentMethod } from "@/lib/checkout/payment-methods";
import { isTestMode } from "@/lib/checkout/payment-methods";
import { applyFieldErrors } from "@/lib/forms/api-errors";
import type { CountryOption } from "@/lib/geo/countries";
import { requestSameOrigin, postSameOrigin } from "@/lib/http/same-origin";
import { addressSchema, emptyAddress, toAddressPayload } from "@/lib/validation/address";
import type {
  CheckoutInitializeResult,
  Order,
  SavedAddress,
  ShippingOption,
  StripeIntentResult,
  User,
} from "@/lib/types/api";

/**
 * Single-page, multi-step checkout: contact -> address -> delivery -> payment.
 *
 * Rules this component exists to enforce:
 *  - the cart is validated on entry and `removedItems` / `adjustments` are
 *    shown PROMINENTLY before anything is paid;
 *  - delivery options are loaded per destination, and an empty list blocks
 *    checkout for that country instead of implying free shipping;
 *  - one idempotency key per attempt, kept in component state, so a retry
 *    reuses it and cannot create a second order;
 *  - a `422 CART_CHANGED` re-validates, states exactly what changed and
 *    demands explicit re-confirmation (with a fresh key, because the body
 *    changed);
 *  - double submission is blocked by an in-flight guard and a disabled button;
 *  - payment is only offered for a provider runtime config says is enabled.
 *
 * No price, total or payment status is ever decided here.
 */

const contactSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  phone: z.string().trim().max(32),
  shippingAddress: addressSchema,
  customerNote: z.string().trim().max(2000),
  acceptsMarketing: z.boolean(),
});

type FormValues = z.infer<typeof contactSchema>;

const KNOWN_FIELDS = [
  "email",
  "phone",
  "customerNote",
  "acceptsMarketing",
  "shippingAddress.firstName",
  "shippingAddress.lastName",
  "shippingAddress.company",
  "shippingAddress.line1",
  "shippingAddress.line2",
  "shippingAddress.city",
  "shippingAddress.region",
  "shippingAddress.postalCode",
  "shippingAddress.countryCode",
  "shippingAddress.phone",
] as const;

export interface CheckoutFlowProps {
  viewer: User | null;
  guestCheckoutEnabled: boolean;
  countries: readonly CountryOption[];
  methods: readonly AvailablePaymentMethod[];
  savedAddresses: readonly SavedAddress[];
  /** Options fetched server-side for a prefilled default address country. */
  initialShippingOptions: readonly ShippingOption[] | null;
  initialCountryCode: string;
  currency: string;
}

function Section({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card p-4 sm:p-5" aria-labelledby={`checkout-step-${step}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-semibold text-ink-muted">
          {step}
        </span>
        <div className="min-w-0">
          <h2 id={`checkout-step-${step}`} className="text-base font-semibold text-ink">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function defaultFormValues(
  viewer: User | null,
  savedAddresses: readonly SavedAddress[],
  initialCountryCode: string,
): FormValues {
  const preferred =
    savedAddresses.find((address) => address.isDefaultShipping) ?? savedAddresses[0] ?? null;

  return {
    email: viewer?.email ?? "",
    phone: preferred?.phone ?? "",
    shippingAddress: preferred
      ? {
          firstName: preferred.firstName,
          lastName: preferred.lastName,
          company: preferred.company ?? "",
          line1: preferred.line1,
          line2: preferred.line2 ?? "",
          city: preferred.city,
          region: preferred.region ?? "",
          postalCode: preferred.postalCode,
          countryCode: preferred.countryCode,
          phone: preferred.phone ?? "",
        }
      : emptyAddress(initialCountryCode),
    customerNote: "",
    acceptsMarketing: false,
  };
}

export function CheckoutFlow({
  viewer,
  guestCheckoutEnabled,
  countries,
  methods,
  savedAddresses,
  initialShippingOptions,
  initialCountryCode,
  currency,
}: CheckoutFlowProps) {
  const lines = useCartStore((state) => state.lines);
  const hydrated = useCartStore((state) => state.hydrated);
  const { validation, validating, error: cartError, revalidate } = useCartValidation();

  /**
   * ONE key per attempt, held in state so re-renders and retries reuse it.
   * Rotated only when the submitted body has deliberately changed, because
   * replaying a key with a different body is a 409.
   */
  const [idempotencyKey, setIdempotencyKey] = React.useState(() => newIdempotencyKey());

  const [shippingOptions, setShippingOptions] = React.useState<readonly ShippingOption[] | null>(
    initialShippingOptions,
  );
  const [optionsLoading, setOptionsLoading] = React.useState(false);
  const [optionsError, setOptionsError] = React.useState<string | null>(null);
  const [optionsCountry, setOptionsCountry] = React.useState(initialCountryCode);

  const [selectedMethodId, setSelectedMethodId] = React.useState<string | null>(null);
  const [provider, setProvider] = React.useState(methods[0]?.provider ?? null);

  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [cartChanged, setCartChanged] = React.useState<string | null>(null);
  const [reconfirmed, setReconfirmed] = React.useState(true);

  const [order, setOrder] = React.useState<Omit<Order, "accessToken"> | null>(null);
  const [stripeIntent, setStripeIntent] = React.useState<StripeIntentResult | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: defaultFormValues(viewer, savedAddresses, initialCountryCode),
  });

  const countryCode = form.watch("shippingAddress.countryCode") ?? "";

  // Derived, never stored: the effective method is the selection when it is
  // still offered, otherwise the server's default, otherwise the first option.
  const options = shippingOptions ?? [];
  const effectiveMethodId =
    selectedMethodId && options.some((option) => option.id === selectedMethodId)
      ? selectedMethodId
      : (options.find((option) => option.isDefault)?.id ?? options[0]?.id ?? null);
  const selectedOption = options.find((option) => option.id === effectiveMethodId) ?? null;

  const subtotalAmount = validation?.totals.subtotal.amount ?? null;

  const loadShippingOptions = React.useCallback(
    async (country: string, postalCode: string | null, subtotal: number | null) => {
      if (!/^[A-Za-z]{2}$/.test(country)) {
        setShippingOptions(null);
        setOptionsError(null);
        setOptionsCountry("");
        return;
      }

      setOptionsLoading(true);
      setOptionsError(null);

      const params = new URLSearchParams({ country_code: country });
      if (postalCode) params.set("postal_code", postalCode);
      if (subtotal !== null) params.set("subtotal_amount", String(subtotal));

      const result = await requestSameOrigin<ShippingOption[]>(
        `/api/checkout/shipping-options?${params.toString()}`,
      );

      setOptionsLoading(false);
      setOptionsCountry(country);

      if (!result.ok) {
        setShippingOptions(null);
        setOptionsError(result.error.message);
        return;
      }

      // `[]` is kept as a real answer so the picker can block this destination.
      setShippingOptions(result.data);
    },
    [],
  );

  /* ---------------------------------------------------------------- *
   * Guards before the form is worth showing
   * ---------------------------------------------------------------- */

  if (!hydrated) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-28" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (lines.length === 0 && !order) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Add something to your cart before checking out."
        action={
          <Button asChild>
            <Link href="/shop">Browse the shop</Link>
          </Button>
        }
      />
    );
  }

  if (!viewer && !guestCheckoutEnabled) {
    return (
      <EmptyState
        icon={Lock}
        title="Sign in to check out"
        description="This store requires an account to place an order."
        action={
          <Button asChild>
            <Link href="/login?next=%2Fcheckout">Sign in</Link>
          </Button>
        }
      />
    );
  }

  /* ---------------------------------------------------------------- *
   * Payment stage
   * ---------------------------------------------------------------- */

  if (order) {
    const method = methods.find((candidate) => candidate.provider === provider) ?? null;

    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:gap-8">
        <div className="min-w-0 space-y-4">
          <Section step={4} title="Payment" description={`Order ${order.orderNumber}`}>
            {formError ? (
              <Alert tone="danger" live title="Payment could not be started" className="mb-4">
                {formError}
              </Alert>
            ) : null}

            {method?.provider === "stripe" && stripeIntent ? (
              <StripePaymentStep
                publishableKey={stripeIntent.publishableKey || method.publicKey}
                clientSecret={stripeIntent.clientSecret}
                orderNumber={order.orderNumber}
                amount={order.totals.total}
                testMode={isTestMode(method)}
              />
            ) : method?.provider === "paypal" ? (
              <PaypalPaymentStep
                clientId={method.publicKey}
                orderNumber={order.orderNumber}
                currency={order.currency || currency}
                amount={order.totals.total}
                testMode={isTestMode(method)}
              />
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-28" />
                <p className="text-sm text-ink-muted" aria-live="polite">
                  Preparing the payment form…
                </p>
              </div>
            )}

            <p className="mt-4 text-xs text-ink-muted">
              Your order is reserved but not complete until the payment is confirmed by the payment
              provider. We never mark an order paid from this page.
            </p>
          </Section>
        </div>

        <CheckoutSummary
          validation={validation}
          validating={validating}
          selectedOption={selectedOption}
        />
      </div>
    );
  }

  /* ---------------------------------------------------------------- *
   * Details stage
   * ---------------------------------------------------------------- */

  const noPaymentConfigured = methods.length === 0;
  const destinationBlocked =
    optionsCountry !== "" && !optionsLoading && !optionsError && options.length === 0;
  const canSubmit =
    !submitting &&
    !validating &&
    !noPaymentConfigured &&
    !destinationBlocked &&
    reconfirmed &&
    effectiveMethodId !== null &&
    provider !== null &&
    (validation?.items.length ?? 0) > 0;

  async function onSubmit(values: FormValues) {
    // In-flight guard: a second submit cannot start another order.
    if (submitting) return;
    if (!validation || !effectiveMethodId || !provider) return;

    setSubmitting(true);
    setFormError(null);
    setCartChanged(null);

    const body = {
      items: validation.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      cartHash: validation.cartHash,
      email: values.email.trim(),
      phone: values.phone.trim() === "" ? null : values.phone.trim(),
      shippingAddress: toAddressPayload(values.shippingAddress),
      // `null` means "same as shipping" (contract 5).
      billingAddress: null,
      shippingMethodId: effectiveMethodId,
      couponCode: validation.coupon?.code ?? null,
      paymentProvider: provider,
      customerNote: values.customerNote.trim() === "" ? null : values.customerNote.trim(),
      acceptsMarketing: values.acceptsMarketing,
    };

    const result = await postSameOrigin<CheckoutInitializeResult>(
      "/api/checkout/initialize",
      body,
      { headers: { "Idempotency-Key": idempotencyKey } },
    );

    if (!result.ok) {
      setSubmitting(false);

      if (result.error.code === "CART_CHANGED") {
        // Re-validate, tell the customer exactly what changed, and require a
        // deliberate re-confirmation with a FRESH key (the body will differ).
        revalidate();
        setIdempotencyKey(newIdempotencyKey());
        setReconfirmed(false);
        setCartChanged(result.error.message);
        return;
      }

      if (result.error.code === "PAYMENT_NOT_CONFIGURED") {
        setFormError(
          "That payment method is no longer available. Reload the page to see the current options.",
        );
        return;
      }

      setFormError(applyFieldErrors(result.error, form.setError, KNOWN_FIELDS));
      return;
    }

    const created = result.data.order;
    setOrder(created);

    // Start the provider flow. Stripe needs a client secret up front; PayPal
    // creates its order from its own button callback.
    if (provider === "stripe") {
      const intent = await postSameOrigin<StripeIntentResult>("/api/payments/stripe/intent", {
        orderNumber: created.orderNumber,
      });

      if (!intent.ok) {
        setFormError(intent.error.message);
      } else {
        setStripeIntent(intent.data);
      }
    }

    setSubmitting(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:gap-8">
      <div className="min-w-0">
        {cartError ? (
          <Alert tone="danger" live title="We could not check your cart" className="mb-4">
            {cartError}{" "}
            <button
              type="button"
              onClick={revalidate}
              className="font-medium text-brand underline hover:no-underline"
            >
              Try again
            </button>
          </Alert>
        ) : null}

        {cartChanged ? (
          <Alert tone="warning" live title="Your cart changed before payment" className="mb-4">
            <p>{cartChanged}</p>
            <p className="mt-1">
              The summary now shows the current prices and availability. Review it, then confirm to
              continue. Nothing has been charged.
            </p>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={() => setReconfirmed(true)}>
                I have reviewed the changes
              </Button>
            </div>
          </Alert>
        ) : null}

        {noPaymentConfigured ? (
          <Alert tone="danger" title="Online payment is not configured" className="mb-4">
            This store has no payment provider enabled, so an order cannot be completed right now.
            Nothing you enter below would be charged. Please contact the store to place your order.
          </Alert>
        ) : null}

        <FormProvider {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Section
              step={1}
              title="Contact"
              description="We use this to send your order confirmation."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="checkout-email"
                  label="Email address"
                  required
                  error={form.formState.errors.email?.message ?? null}
                >
                  {(field) => (
                    <Input
                      {...field}
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      readOnly={Boolean(viewer)}
                      {...form.register("email")}
                    />
                  )}
                </FormField>

                <FormField
                  id="checkout-phone"
                  label="Phone"
                  description="Optional."
                  error={form.formState.errors.phone?.message ?? null}
                >
                  {(field) => (
                    <Input {...field} type="tel" autoComplete="tel" {...form.register("phone")} />
                  )}
                </FormField>
              </div>

              {!viewer ? (
                <p className="mt-3 text-xs text-ink-muted">
                  Checking out as a guest.{" "}
                  <Link
                    href="/login?next=%2Fcheckout"
                    className="font-medium text-brand underline-offset-2 hover:underline"
                  >
                    Sign in
                  </Link>{" "}
                  to use a saved address.
                </p>
              ) : null}
            </Section>

            <Section step={2} title="Delivery address">
              <AddressFields
                idPrefix="checkout-shipping"
                prefix="shippingAddress"
                countries={countries}
                disabled={submitting}
                onCountryChange={(value) =>
                  void loadShippingOptions(
                    value,
                    form.getValues("shippingAddress.postalCode") || null,
                    subtotalAmount,
                  )
                }
              />

              <p className="mt-3 text-xs text-ink-muted">
                Billing address is the same as the delivery address.
              </p>
            </Section>

            <Section
              step={3}
              title="Delivery method"
              description="Rates come from the store's configured shipping zones."
            >
              <ShippingMethodPicker
                countryCode={countryCode}
                options={options}
                loading={optionsLoading}
                error={optionsError}
                selectedId={effectiveMethodId}
                onSelect={setSelectedMethodId}
                onRetry={() =>
                  void loadShippingOptions(
                    countryCode,
                    form.getValues("shippingAddress.postalCode") || null,
                    subtotalAmount,
                  )
                }
                disabled={submitting}
              />

              {countryCode && optionsCountry !== countryCode && !optionsLoading ? (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void loadShippingOptions(
                        countryCode,
                        form.getValues("shippingAddress.postalCode") || null,
                        subtotalAmount,
                      )
                    }
                  >
                    Check delivery options for this country
                  </Button>
                </div>
              ) : null}
            </Section>

            <Section step={4} title="Payment">
              {noPaymentConfigured ? (
                <p className="text-sm text-ink-muted">
                  No payment provider is enabled for this store.
                </p>
              ) : (
                <RadioGroup
                  value={provider ?? ""}
                  onValueChange={(value) => setProvider(value as "stripe" | "paypal")}
                  disabled={submitting}
                  className="space-y-2"
                  aria-label="Payment method"
                >
                  {methods.map((method) => (
                    <RadioCard
                      key={method.provider}
                      id={`payment-${method.provider}`}
                      value={method.provider}
                      title={method.label}
                      description={
                        isTestMode(method) ? (
                          <span className="block">
                            {method.provider === "stripe" ? "Test mode" : "Sandbox mode"} - no real
                            charge
                          </span>
                        ) : undefined
                      }
                      disabled={submitting}
                    />
                  ))}
                </RadioGroup>
              )}

              <div className="mt-4 space-y-4">
                <FormField
                  id="checkout-note"
                  label="Order note"
                  description="Optional. Anything we should know about this order."
                  error={form.formState.errors.customerNote?.message ?? null}
                >
                  {(field) => <Textarea {...field} rows={3} {...form.register("customerNote")} />}
                </FormField>

                <CheckboxField
                  id="checkout-accepts-marketing"
                  label="Email me occasional store updates"
                  checked={form.watch("acceptsMarketing") === true}
                  onCheckedChange={(checked) =>
                    form.setValue("acceptsMarketing", checked === true)
                  }
                />
              </div>
            </Section>

            {formError ? (
              <Alert tone="danger" live title="We could not place your order">
                {formError}
              </Alert>
            ) : null}

            <div className="sticky bottom-0 -mx-4 border-t border-line bg-surface p-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
              <Button
                type="submit"
                block
                size="lg"
                disabled={!canSubmit}
                loading={submitting}
                loadingLabel="Placing your order…"
              >
                Continue to payment
              </Button>

              {destinationBlocked ? (
                <p className="mt-2 text-xs text-warning">
                  Choose a country we can deliver to in order to continue.
                </p>
              ) : null}

              {!reconfirmed ? (
                <p className="mt-2 text-xs text-warning">
                  Confirm the cart changes above before continuing.
                </p>
              ) : null}

              <p className="mt-2 text-xs text-ink-muted">
                You will enter payment details on the next step. Nothing is charged until then.
              </p>
            </div>
          </form>
        </FormProvider>
      </div>

      <CheckoutSummary
        validation={validation}
        validating={validating}
        selectedOption={selectedOption}
      />
    </div>
  );
}
