import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { ProductListing } from "@/components/shop/ProductListing";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchCategory } from "@/lib/catalog/queries";
import { parseListingSearchParams } from "@/lib/catalog/search-params";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata({
  params,
}: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [config, { data: category }] = await Promise.all([getRuntimeConfig(), fetchCategory(slug)]);

  if (!category) {
    // Nothing truthful to say about a category we could not load.
    return buildPageMetadata(config, { title: "Category", noindex: true });
  }

  return buildPageMetadata(config, {
    title: category.seo.title ?? category.name,
    description: category.seo.description ?? category.description,
    canonicalPath: `/category/${category.slug}`,
    noindex: category.seo.noindex,
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const config = await getRuntimeConfig();
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
        items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, ...category.ancestors]}
        current={category.name}
      />

      <h1 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">{category.name}</h1>
      {category.description ? (
        <p className="mt-2 max-w-prose text-sm text-ink-muted">{category.description}</p>
      ) : null}

      {category.children.length > 0 ? (
        <nav aria-label="Subcategories" className="mt-4">
          <ul className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <li key={child.id}>
                <a
                  href={`/category/${child.slug}`}
                  className="inline-flex min-h-9 items-center rounded-md border border-line bg-surface px-3 text-sm text-ink transition-colors hover:bg-sunken"
                >
                  {child.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-22 lg:self-start">
          <ShopFilters
            action={`/category/${category.slug}`}
            state={state}
            categories={null}
            showCategory={false}
            currencySymbol={config.locale.currencySymbol}
          />
        </aside>

        <div className="min-w-0">
          <Suspense key={JSON.stringify(search)} fallback={<ProductGridSkeleton count={12} />}>
            <ProductListing
              state={state}
              basePath={`/category/${category.slug}`}
              categoryOverride={category.slug}
              emptyTitle="No products in this category yet"
              emptyDescription="Once products are published here they will appear in this list."
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
