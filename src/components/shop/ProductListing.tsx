import { PackageSearch } from "lucide-react";
import Link from "next/link";

import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { fetchProducts } from "@/lib/catalog/queries";
import {
  buildListingHref,
  toProductListParams,
  type ListingState,
} from "@/lib/catalog/search-params";

export interface ProductListingProps {
  state: ListingState;
  /** Path used to rebuild pagination links, e.g. `/shop`. */
  basePath: string;
  /** Overrides the category filter on a category page. */
  categoryOverride?: string | null;
  /** Shown above the grid, e.g. the search term summary. */
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Fetches and renders a product page.
 *
 * Suspense-friendly: it awaits its own data so a parent can stream a skeleton.
 * A failed fetch renders a real error state - never substitute content.
 */
export async function ProductListing({
  state,
  basePath,
  categoryOverride = null,
  emptyTitle = "No products match these filters",
  emptyDescription = "Try removing a filter or widening the price range.",
}: ProductListingProps) {
  const params = toProductListParams(state);
  if (categoryOverride !== null) {
    params.category = categoryOverride;
  }

  const { data, error } = await fetchProducts(params);

  if (!data) {
    return (
      <ErrorState
        message={error?.message}
        unreachable={error?.isUnreachable()}
        action={
          <Button asChild variant="secondary">
            <Link href={basePath}>Reload</Link>
          </Button>
        }
      />
    );
  }

  if (data.data.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Button asChild variant="secondary">
            <Link href={basePath}>Clear filters</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted" aria-live="polite">
        {data.meta.total} {data.meta.total === 1 ? "product" : "products"}
      </p>

      <ProductGrid products={data.data} priorityCount={4} />

      <Pagination
        meta={data.meta}
        buildHref={(page) => buildListingHref(basePath, state, page)}
      />
    </div>
  );
}
