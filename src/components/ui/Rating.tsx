"use client";

import { Star } from "lucide-react";

import { useI18n } from "@/i18n/client";
import { fmt, plural } from "@/i18n/format";
import type { Rating as RatingValue } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

export interface RatingProps {
  /** `null` when the product has zero approved reviews (contract 4). */
  rating: RatingValue | null;
  size?: "sm" | "md";
  /** Shows "(23)" next to the stars. */
  showCount?: boolean;
  /** Links the count to the reviews section. */
  href?: string;
  className?: string;
}

const sizeClasses = {
  sm: "size-3.5",
  md: "size-4",
} as const;

/**
 * Star rating.
 *
 * Renders NOTHING when there is no rating or when `count` is 0. An empty
 * five-star row implies "rated zero" and a "0 reviews" label is clutter, so
 * neither is shown - the section simply does not exist until real approved
 * reviews do.
 */
export function Rating({ rating, size = "md", showCount = true, href, className }: RatingProps) {
  const { locale, m } = useI18n();
  if (rating === null || rating.count <= 0) return null;

  const average = Math.max(0, Math.min(5, rating.average));
  const label = plural(locale, rating.count, m.ui.rated, { average: average.toFixed(1) });

  const stars = (
    <span className="relative inline-flex shrink-0" aria-hidden="true">
      <span className="inline-flex">
        {[0, 1, 2, 3, 4].map((index) => (
          <Star key={index} className={cn(sizeClasses[size], "text-line-strong")} />
        ))}
      </span>
      <span
        className="absolute inset-0 inline-flex overflow-hidden"
        style={{ width: `${(average / 5) * 100}%` }}
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <Star
            key={index}
            className={cn(sizeClasses[size], "shrink-0 fill-warning text-warning")}
          />
        ))}
      </span>
    </span>
  );

  const content = (
    <>
      {stars}
      <span className="sr-only">{label}</span>
      {showCount ? (
        <span aria-hidden="true" className="text-body-sm text-ink-muted">
          {average.toFixed(1)} ({rating.count})
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xs transition-colors hover:text-ink",
          className,
        )}
      >
        {content}
      </a>
    );
  }

  return <span className={cn("inline-flex items-center gap-1.5", className)}>{content}</span>;
}

export interface RatingDistributionProps {
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  total: number;
  className?: string;
}

/** Distribution bars, built only from real counts. */
export function RatingDistribution({ distribution, total, className }: RatingDistributionProps) {
  const { m } = useI18n();
  if (total <= 0) return null;

  return (
    <ul className={cn("space-y-1.5", className)}>
      {(["5", "4", "3", "2", "1"] as const).map((bucket) => {
        const count = distribution[bucket] ?? 0;
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <li key={bucket} className="flex items-center gap-2 text-body-sm text-ink-muted">
            <span className="w-8 shrink-0 tabular-nums">{bucket} ★</span>
            <span
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container"
              role="img"
              aria-label={fmt(m.ui.starBucket, { bucket, count, total })}
            >
              <span className="block h-full rounded-full bg-warning" style={{ width: `${percent}%` }} />
            </span>
            <span className="w-8 shrink-0 text-right tabular-nums">{count}</span>
          </li>
        );
      })}
    </ul>
  );
}
