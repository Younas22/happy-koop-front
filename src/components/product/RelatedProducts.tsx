import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Skeleton } from "@/components/ui/Skeleton";
import { getMessages } from "@/i18n/server";
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
  const { product: t } = await getMessages();

  return (
    <section className="border-t border-line pt-8">
      <h2 className="text-title-lg text-ink sm:text-xl">{t.sections.related}</h2>
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
