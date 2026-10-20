import { ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { Badge, resolveBadgeTone } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ProductCard as ProductCardData } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

export interface ProductCardProps {
  product: ProductCardData;
  /** Eager-load the first row of a grid. */
  priority?: boolean;
  /** Passed to next/image so each breakpoint requests a sensible width. */
  sizes?: string;
  className?: string;
}

const DEFAULT_SIZES =
  "(min-width: 1280px) 20rem, (min-width: 1024px) 23vw, (min-width: 640px) 30vw, 45vw";

/**
 * Product card.
 *
 * Every element is conditional on real data: no rating row at zero reviews, no
 * compare-at price unless the backend supplied one, no badge unless an
 * administrator set it, and no placeholder image text pretending to be a photo.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = DEFAULT_SIZES,
  className,
}: ProductCardProps) {
  const soldOut = !product.availability.inStock;

  return (
    <article
      className={cn(
        "group surface-card flex h-full flex-col overflow-hidden transition-shadow duration-200 ease-(--ease-out-soft) hover:shadow-md",
        className,
      )}
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-sunken"
        tabIndex={-1}
        aria-hidden="true"
      >
        {product.primaryImage ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.alt ?? product.name}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover transition-transform duration-300 ease-(--ease-out-soft) group-hover:scale-[1.02]"
          />
        ) : (
          <span className="flex h-full items-center justify-center">
            <ImageOff className="size-7 text-ink-subtle" aria-hidden="true" />
            <span className="sr-only">No image available</span>
          </span>
        )}

        {(product.badges.length > 0 || soldOut) ? (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {soldOut ? <Badge tone="neutral">Sold out</Badge> : null}
            {product.badges.map((badge) => (
              <Badge key={badge.label} tone={resolveBadgeTone(badge.tone)}>
                {badge.label}
              </Badge>
            ))}
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="text-sm font-medium text-ink">
          <Link href={`/product/${product.slug}`} className="rounded-xs hover:underline">
            {product.name}
          </Link>
        </h3>

        {product.shortDescription ? (
          <p className="line-clamp-2 text-xs text-ink-muted">{product.shortDescription}</p>
        ) : null}

        {/* Rating renders nothing when there are no approved reviews. */}
        <Rating rating={product.rating} size="sm" className="mt-0.5" />

        <div className="mt-auto pt-2">
          <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} size="md" />
        </div>
      </div>
    </article>
  );
}

/** Matching skeleton, so a Suspense fallback keeps the grid from shifting. */
export function ProductCardSkeleton() {
  return (
    <div className="surface-card overflow-hidden">
      <Skeleton shape="block" className="aspect-square rounded-none" />
      <div className="space-y-2 p-3 sm:p-4">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}
