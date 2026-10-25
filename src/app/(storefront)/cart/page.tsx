import type { Metadata } from "next";

import { CartView } from "@/components/cart/CartView";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getI18n } from "@/i18n/server";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  const { locale, m } = await getI18n();
  return buildPageMetadata(config, {
    title: m.cart.metaTitle,
    canonicalPath: "/cart",
    locale,
    // A personal page with no indexable content.
    noindex: true,
  });
}

export default async function CartPage() {
  const config = await getRuntimeConfig();
  const { m } = await getI18n();

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs items={[{ label: m.breadcrumb.home, href: "/" }]} current={m.cart.metaTitle} />
      <h1 className="mt-3 mb-6 text-headline-sm text-ink sm:text-headline-md">{m.cart.title}</h1>
      <CartView guestCheckoutEnabled={config.features.guestCheckout} />
    </div>
  );
}
