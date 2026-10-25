import type { Metadata } from "next";

import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { Alert } from "@/components/ui/Alert";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { fetchAddresses } from "@/lib/account/queries";
import { getViewer } from "@/lib/auth/session";
import { availablePaymentMethods } from "@/lib/checkout/payment-methods";
import { fetchShippingOptions } from "@/lib/checkout/queries";
import { countryOptions } from "@/lib/geo/countries";
import { LOCALE_INFO } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { getRuntimeConfig } from "@/lib/runtime-config";
import type { SavedAddress, ShippingOption } from "@/lib/types/api";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  const { locale, m } = await getI18n();
  return buildPageMetadata(config, {
    title: m.checkout.metaTitle,
    locale,
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
  const { locale, m } = await getI18n();
  const viewer = await getViewer();

  const methods = availablePaymentMethods(config.payments);
  const countries = countryOptions(LOCALE_INFO[locale].hreflang);

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
          { label: m.breadcrumb.home, href: "/" },
          { label: m.cart.metaTitle, href: "/cart" },
        ]}
        current={m.checkout.metaTitle}
      />

      <h1 className="mt-3 mb-6 text-headline-sm text-ink sm:text-headline-md">Checkout</h1>

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
