import type { Metadata } from "next";

import { CartView } from "@/components/cart/CartView";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Cart",
    canonicalPath: "/cart",
    // A personal page with no indexable content.
    noindex: true,
  });
}

export default async function CartPage() {
  const config = await getRuntimeConfig();

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }]} current="Cart" />
      <h1 className="mt-3 mb-6 text-2xl font-semibold text-ink sm:text-3xl">Your cart</h1>
      <CartView guestCheckoutEnabled={config.features.guestCheckout} />
    </div>
  );
}
