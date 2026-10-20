import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import type { ProductCard as ProductCardData } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

export interface ProductGridProps {
  products: readonly ProductCardData[];
  /** Number of leading cards to mark high-priority. */
  priorityCount?: number;
  className?: string;
}

const gridClasses = "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4";

/** Responsive grid: 2 up at 360px, 3 at laptop, 4 at wide desktop. */
export function ProductGrid({ products, priorityCount = 0, className }: ProductGridProps) {
  if (products.length === 0) return null;

  return (
    <ul className={cn(gridClasses, className)}>
      {products.map((product, index) => (
        <li key={product.id} className="flex">
          <ProductCard product={product} priority={index < priorityCount} className="w-full" />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn(gridClasses, className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
