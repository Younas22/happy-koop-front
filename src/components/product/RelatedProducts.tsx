import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchRelatedProducts } from "@/lib/catalog/queries";

export interface RelatedProductsProps {
  slug: string;
  limit?: number;
}

/**
 * Related products.
 *
 * The backend never pads this list to reach `limit` (contract 4), so an empty
 * response means there genuinely is nothing related - the section is then
 * omitted rather than filled with unrelated products.
 */
export async function RelatedProducts({ slug, limit = 4 }: RelatedProductsProps) {
  const { data } = await fetchRelatedProducts(slug, limit);

  if (!data || data.length === 0) return null;

  return (
    <section className="border-t border-line pt-8">
      <h2 className="text-lg font-semibold text-ink sm:text-xl">You might also like</h2>
      <ProductGrid products={data} className="mt-4" />
    </section>
  );
}

export function RelatedProductsSkeleton() {
  return (
    <div className="border-t border-line pt-8" aria-hidden="true">
      <Skeleton className="h-6 w-44" />
      <ProductGridSkeleton count={4} className="mt-4" />
    </div>
  );
}
