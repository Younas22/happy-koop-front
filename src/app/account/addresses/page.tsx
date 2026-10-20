import type { Metadata } from "next";
import Link from "next/link";

import { AddressManager } from "@/components/account/AddressManager";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchAddresses } from "@/lib/account/queries";
import { requireViewer } from "@/lib/auth/session";
import { countryOptions } from "@/lib/geo/countries";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Addresses",
    canonicalPath: "/account/addresses",
    noindex: true,
  });
}

export default async function AccountAddressesPage() {
  await requireViewer("/account/addresses");
  const config = await getRuntimeConfig();

  const { data: addresses, error } = await fetchAddresses();

  if (error) {
    return (
      <ErrorState
        title="We could not load your addresses"
        message={error.message}
        unreachable={error.isUnreachable()}
        action={
          <Button asChild variant="secondary">
            <Link href="/account/addresses">Try again</Link>
          </Button>
        }
      />
    );
  }

  // Country names are localized with the store locale; the list itself is the
  // ISO-3166 standard, not a claim about where the store ships.
  const countries = countryOptions(config.locale.locale);

  return <AddressManager addresses={addresses ?? []} countries={countries} defaultCountry="" />;
}
