import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { ProductListing } from "@/components/shop/ProductListing";
import { FilterSheet } from "@/components/shop/FilterSheet";
import { countActiveFilters, ShopFilters } from "@/components/shop/ShopFilters";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getI18n } from "@/i18n/server";
import { fetchCategories } from "@/lib/catalog/queries";
import { parseListingSearchParams } from "@/lib/catalog/search-params";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  const { locale, m } = await getI18n();
  return buildPageMetadata(config, {
    title: m.listing.shopTitle,
    description: config.seo.defaultDescription,
    canonicalPath: "/shop",
    locale,
  });
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const config = await getRuntimeConfig();
  const { m } = await getI18n();
  const params = await searchParams;
  const state = parseListingSearchParams(params, config.locale.minorUnitExponent);

  // The category list is a filter affordance: if it cannot be loaded the
  // control is simply not rendered.
  const { data: categories } = await fetchCategories();

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs items={[{ label: m.breadcrumb.home, href: "/" }]} current={m.listing.shopTitle} />

      <h1 className="mt-3 text-headline-md text-ink sm:text-headline-lg">{m.listing.shopTitle}</h1>
      {config.store.tagline ? (
        <p className="mt-2 text-body-lg text-ink-muted">{config.store.tagline}</p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
        <aside className="hidden lg:sticky lg:top-22 lg:block lg:self-start">
          <ShopFilters
            action="/shop"
            state={state}
            categories={categories}
            currencySymbol={config.locale.currencySymbol}
          />
        </aside>

        <div className="min-w-0">
          {/* Phones get the same panel, in an M3 bottom sheet. */}
          <FilterSheet activeCount={countActiveFilters(state)} className="mb-4 lg:hidden">
            <ShopFilters
              action="/shop"
              state={state}
              categories={categories}
              currencySymbol={config.locale.currencySymbol}
              idPrefix="sheet"
              bare
            />
          </FilterSheet>

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
