import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Suspense } from "react";

import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { ProductListing } from "@/components/shop/ProductListing";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchCategories } from "@/lib/catalog/queries";
import { parseListingSearchParams } from "@/lib/catalog/search-params";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const config = await getRuntimeConfig();
  const params = await searchParams;
  const term = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";

  return buildPageMetadata(config, {
    title: term ? `Search: ${term}` : "Search",
    // Result pages carry no stable content, so they stay out of the index.
    noindex: true,
  });
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const config = await getRuntimeConfig();
  const params = await searchParams;
  const state = parseListingSearchParams(params, config.locale.minorUnitExponent);
  const { data: categories } = await fetchCategories();

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }]} current="Search" />

      <h1 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">
        {state.q ? (
          <>
            Results for <span className="text-brand">{state.q}</span>
          </>
        ) : (
          "Search"
        )}
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-22 lg:self-start">
          <ShopFilters
            action="/search"
            state={state}
            categories={categories}
            currencySymbol={config.locale.currencySymbol}
          />
        </aside>

        <div className="min-w-0">
          {state.q ? (
            <Suspense key={JSON.stringify(params)} fallback={<ProductGridSkeleton count={12} />}>
              <ProductListing
                state={state}
                basePath="/search"
                emptyTitle={`Nothing found for "${state.q}"`}
                emptyDescription="Check the spelling, or try a shorter or more general term."
              />
            </Suspense>
          ) : (
            <EmptyState
              icon={Search}
              title="Enter a search term"
              description="Search by product name, SKU or description."
            />
          )}
        </div>
      </div>
    </div>
  );
}
