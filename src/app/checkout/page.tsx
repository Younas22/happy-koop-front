import type { Metadata } from "next";

import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { Alert } from "@/components/ui/Alert";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { fetchAddresses } from "@/lib/account/queries";
import { getViewer } from "@/lib/auth/session";
import { availablePaymentMethods } from "@/lib/checkout/payment-methods";
import { fetchShippingOptions } from "@/lib/checkout/queries";
import { countryOptions } from "@/lib/geo/countries";
import { getRuntimeConfig } from "@/lib/runtime-config";
import type { SavedAddress, ShippingOption } from "@/lib/types/api";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Checkout",
    canonicalPath: "/checkout",
    // Never indexed: personal, and nothing here is public content.
    noindex: true,
  });
}

/**
 * Checkout entry point.
 *
 * Everything the client needs that depends on server state is resolved here:
 * the viewer, saved addresses, enabled payment providers and - when a default
 * address prefills a country - that destination's delivery options. Loading
 * those on the server means the client never has to fetch on mount.
 *
 * Payment providers come from runtime config. If none is enabled the flow
 * renders an explicit "payment is not configured" state rather than a button
 * that would fail.
 */
export default async function CheckoutPage() {
  const config = await getRuntimeConfig();
  const viewer = await getViewer();

  const methods = availablePaymentMethods(config.payments);
  const countries = countryOptions(config.locale.locale);

  // Saved addresses are only available to a signed-in customer; a failed read
  // simply means no prefill.
  let savedAddresses: SavedAddress[] = [];
  if (viewer) {
    const { data } = await fetchAddresses();
    savedAddresses = data ?? [];
  }

  const preferred =
    savedAddresses.find((address) => address.isDefaultShipping) ?? savedAddresses[0] ?? null;
  const initialCountryCode = preferred?.countryCode ?? "";

  let initialShippingOptions: ShippingOption[] | null = null;
  if (initialCountryCode) {
    const { data } = await fetchShippingOptions({
      countryCode: initialCountryCode,
      postalCode: preferred?.postalCode ?? null,
    });
    // `[]` is kept: it means this destination has no configured rate.
    initialShippingOptions = data;
  }

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
        ]}
        current="Checkout"
      />

      <h1 className="mt-3 mb-6 text-2xl font-semibold text-ink sm:text-3xl">Checkout</h1>

      {config.degraded ? (
        <Alert tone="warning" title="Store settings are unavailable" className="mb-4">
          We could not load the store configuration, so payment options may be incomplete. Please
          try again shortly rather than placing an order you cannot pay for.
        </Alert>
      ) : null}

      <CheckoutFlow
        viewer={viewer}
        guestCheckoutEnabled={config.features.guestCheckout}
        countries={countries}
        methods={methods}
        savedAddresses={savedAddresses}
        initialShippingOptions={initialShippingOptions}
        initialCountryCode={initialCountryCode}
        currency={config.locale.currency}
      />
    </div>
  );
}
