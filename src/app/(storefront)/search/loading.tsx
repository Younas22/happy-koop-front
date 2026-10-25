import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ShopLoading() {
  return (
    <div className="page-container py-6 sm:py-8" aria-busy="true">
      <span className="sr-only">Loading products</span>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-8 w-40" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
        <Skeleton shape="block" className="h-96" />
        <ProductGridSkeleton count={12} />
      </div>
    </div>
  );
}
