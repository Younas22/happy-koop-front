import { PackageSearch } from "lucide-react";
import { Link } from "@/i18n/Link";

import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { plural } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
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
  emptyTitle,
  emptyDescription,
}: ProductListingProps) {
  const { locale, m } = await getI18n();
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
            <Link href={basePath}>{m.listing.reload}</Link>
          </Button>
        }
      />
    );
  }

  if (data.data.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title={emptyTitle ?? m.listing.emptyTitle}
        description={emptyDescription ?? m.listing.emptyBody}
        action={
          <Button asChild variant="secondary">
            <Link href={basePath}>{m.listing.clearFilters}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-body-md text-ink-muted" aria-live="polite">
        {plural(locale, data.meta.total, m.listing.count)}
      </p>

      <ProductGrid products={data.data} priorityCount={4} />

      <Pagination
        meta={data.meta}
        buildHref={(page) => buildListingHref(basePath, state, page)}
      />
    </div>
  );
}
