import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Suspense } from "react";

import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { ProductListing } from "@/components/shop/ProductListing";
import { FilterSheet } from "@/components/shop/FilterSheet";
import { countActiveFilters, ShopFilters } from "@/components/shop/ShopFilters";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmt } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { fetchCategories } from "@/lib/catalog/queries";
import { parseListingSearchParams } from "@/lib/catalog/search-params";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const config = await getRuntimeConfig();
  const params = await searchParams;
  const term = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const { locale, m } = await getI18n();

  return buildPageMetadata(config, {
    title: term ? fmt(m.listing.searchMeta, { term }) : m.listing.searchTitle,
    locale,
    // Result pages carry no stable content, so they stay out of the index.
    noindex: true,
  });
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const config = await getRuntimeConfig();
  const params = await searchParams;
  const state = parseListingSearchParams(params, config.locale.minorUnitExponent);
  const { data: categories } = await fetchCategories();
  const { m } = await getI18n();

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs items={[{ label: m.breadcrumb.home, href: "/" }]} current={m.listing.searchTitle} />

      <h1 className="mt-3 text-headline-md text-ink sm:text-headline-lg">
        {state.q ? (
          <>
            {m.listing.resultsFor} <span className="text-brand">{state.q}</span>
          </>
        ) : (
          m.listing.searchTitle
        )}
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
        <aside className="hidden lg:sticky lg:top-22 lg:block lg:self-start">
          <ShopFilters
            action="/search"
            state={state}
            categories={categories}
            currencySymbol={config.locale.currencySymbol}
          />
        </aside>

        <div className="min-w-0">
          {/* Phones get the same panel, in an M3 bottom sheet. */}
          <FilterSheet activeCount={countActiveFilters(state)} className="mb-4 lg:hidden">
            <ShopFilters
              action="/search"
              state={state}
              categories={categories}
              currencySymbol={config.locale.currencySymbol}
              idPrefix="sheet"
              bare
            />
          </FilterSheet>

          {state.q ? (
            <Suspense key={JSON.stringify(params)} fallback={<ProductGridSkeleton count={12} />}>
              <ProductListing
                state={state}
                basePath="/search"
                emptyTitle={fmt(m.listing.searchEmptyTitle, { term: state.q })}
                emptyDescription={m.listing.searchEmptyBody}
              />
            </Suspense>
          ) : (
            <EmptyState
              icon={Search}
              title={m.listing.searchPromptTitle}
              description={m.listing.searchPromptBody}
            />
          )}
        </div>
      </div>
    </div>
  );
}
