import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { ProductListing } from "@/components/shop/ProductListing";
import { FilterSheet } from "@/components/shop/FilterSheet";
import { countActiveFilters, ShopFilters } from "@/components/shop/ShopFilters";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ErrorState } from "@/components/ui/ErrorState";
import { Link } from "@/i18n/Link";
import { getI18n } from "@/i18n/server";
import { fetchCategory } from "@/lib/catalog/queries";
import { parseListingSearchParams } from "@/lib/catalog/search-params";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata({
  params,
}: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [config, { data: category }, { locale, m }] = await Promise.all([
    getRuntimeConfig(),
    fetchCategory(slug),
    getI18n(),
  ]);

  if (!category) {
    // Nothing truthful to say about a category we could not load.
    return buildPageMetadata(config, { title: m.listing.categoryFallbackTitle, noindex: true, locale });
  }

  return buildPageMetadata(config, {
    locale,
    title: category.seo.title ?? category.name,
    description: category.seo.description ?? category.description,
    canonicalPath: `/category/${category.slug}`,
    noindex: category.seo.noindex,
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const config = await getRuntimeConfig();
  const { m } = await getI18n();
  const search = await searchParams;
  const state = parseListingSearchParams(search, config.locale.minorUnitExponent);

  const { data: category, error } = await fetchCategory(slug);

  if (error?.isNotFound()) {
    notFound();
  }

  if (!category) {
    return (
      <div className="page-container py-10">
        <ErrorState message={error?.message} unreachable={error?.isUnreachable()} />
      </div>
    );
  }

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: m.breadcrumb.home, href: "/" },
          { label: m.breadcrumb.shop, href: "/shop" },
          ...category.ancestors,
        ]}
        current={category.name}
      />

      <h1 className="mt-3 text-headline-md text-ink sm:text-headline-lg">{category.name}</h1>
      {category.description ? (
        <p className="mt-2 max-w-prose text-body-lg text-ink-muted">{category.description}</p>
      ) : null}

      {category.children.length > 0 ? (
        <nav aria-label={m.listing.subcategories} className="mt-4">
          <ul className="chip-rail">
            {category.children.map((child) => (
              <li key={child.id}>
                <Link href={`/category/${child.slug}`} className="chip state-layer">
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
        <aside className="hidden lg:sticky lg:top-22 lg:block lg:self-start">
          <ShopFilters
            action={`/category/${category.slug}`}
            state={state}
            categories={null}
            showCategory={false}
            currencySymbol={config.locale.currencySymbol}
          />
        </aside>

        <div className="min-w-0">
          {/* Phones get the same panel, in an M3 bottom sheet. */}
          <FilterSheet activeCount={countActiveFilters(state)} className="mb-4 lg:hidden">
            <ShopFilters
              action={`/category/${category.slug}`}
              state={state}
              categories={null}
              showCategory={false}
              currencySymbol={config.locale.currencySymbol}
              idPrefix="sheet"
              bare
            />
          </FilterSheet>

          <Suspense key={JSON.stringify(search)} fallback={<ProductGridSkeleton count={12} />}>
            <ProductListing
              state={state}
              basePath={`/category/${category.slug}`}
              categoryOverride={category.slug}
              emptyTitle={m.listing.categoryEmptyTitle}
              emptyDescription={m.listing.categoryEmptyBody}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
