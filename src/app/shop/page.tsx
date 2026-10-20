import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { ProductListing } from "@/components/shop/ProductListing";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { fetchCategories } from "@/lib/catalog/queries";
import { parseListingSearchParams } from "@/lib/catalog/search-params";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Shop",
    description: config.seo.defaultDescription,
    canonicalPath: "/shop",
  });
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const config = await getRuntimeConfig();
  const params = await searchParams;
  const state = parseListingSearchParams(params, config.locale.minorUnitExponent);

  // The category list is a filter affordance: if it cannot be loaded the
  // control is simply not rendered.
  const { data: categories } = await fetchCategories();

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }]} current="Shop" />

      <h1 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">Shop</h1>
      {config.store.tagline ? (
        <p className="mt-1.5 text-sm text-ink-muted">{config.store.tagline}</p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-22 lg:self-start">
          <ShopFilters
            action="/shop"
            state={state}
            categories={categories}
            currencySymbol={config.locale.currencySymbol}
          />
        </aside>

        <div className="min-w-0">
          <Suspense
            key={JSON.stringify(params)}
            fallback={<ProductGridSkeleton count={state.perPage > 12 ? 12 : state.perPage} />}
          >
            <ProductListing state={state} basePath="/shop" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
