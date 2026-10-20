import { BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Rating, RatingDistribution } from "@/components/ui/Rating";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchProductReviews } from "@/lib/catalog/queries";

export interface ProductReviewsProps {
  slug: string;
  /** `features.reviews`. When false nothing is fetched or rendered. */
  enabled: boolean;
}

/**
 * Reviews section.
 *
 * Only approved reviews reach this endpoint, `summary` is null at zero count,
 * and the section renders NOTHING when there are no reviews - no "Be the first
 * to review" prompt presented as content, and no seeded or supplier reviews.
 *
 * "Verified purchase" is shown only when `isVerifiedPurchase` is true, which
 * the backend computes from a paid order.
 */
export async function ProductReviews({ slug, enabled }: ProductReviewsProps) {
  if (!enabled) return null;

  const { data } = await fetchProductReviews(slug, { perPage: 10, sort: "helpful" });

  // A failed fetch is not an empty review list, so nothing is asserted here.
  if (!data || data.data.length === 0) return null;

  const summary = data.summary;

  return (
    <section id="reviews" className="border-t border-line pt-8">
      <h2 className="text-lg font-semibold text-ink sm:text-xl">Reviews</h2>

      <div className="mt-4 grid gap-6 lg:grid-cols-[18rem_1fr] lg:gap-10">
        {summary && summary.count > 0 ? (
          <div className="surface-card space-y-3 p-4 lg:self-start">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-ink tabular-nums">
                {summary.average.toFixed(1)}
              </span>
              <span className="text-sm text-ink-muted">out of 5</span>
            </div>
            <Rating rating={{ average: summary.average, count: summary.count }} showCount={false} />
            <p className="text-xs text-ink-muted">
              {summary.count} {summary.count === 1 ? "review" : "reviews"}
            </p>
            <RatingDistribution distribution={summary.distribution} total={summary.count} />
          </div>
        ) : null}

        <ul className="min-w-0 divide-y divide-line">
          {data.data.map((review) => {
            const created = new Date(review.createdAt);
            const createdValid = !Number.isNaN(created.getTime());

            return (
              <li key={review.id} className="py-4 first:pt-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <Rating
                    rating={{ average: review.rating, count: 1 }}
                    size="sm"
                    showCount={false}
                  />
                  <span className="text-sm font-medium text-ink">{review.authorName}</span>
                  {review.isVerifiedPurchase ? (
                    <Badge tone="success">
                      <BadgeCheck className="size-3" aria-hidden="true" />
                      Verified purchase
                    </Badge>
                  ) : null}
                  {createdValid ? (
                    <time dateTime={review.createdAt} className="text-xs text-ink-subtle">
                      {created.toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </time>
                  ) : null}
                </div>

                {review.title ? (
                  <h3 className="mt-2 text-sm font-semibold text-ink">{review.title}</h3>
                ) : null}
                <p className="mt-1 text-sm text-ink-muted">{review.body}</p>

                {review.storeReply ? (
                  <div className="mt-3 rounded-md border border-line bg-sunken p-3">
                    <p className="text-xs font-semibold text-ink">Store reply</p>
                    <p className="mt-1 text-sm text-ink-muted">{review.storeReply.body}</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {data.meta.total > data.data.length ? (
        <p className="mt-4 text-sm text-ink-muted">
          Showing {data.data.length} of {data.meta.total} reviews.
        </p>
      ) : null}
    </section>
  );
}

export function ProductReviewsSkeleton() {
  return (
    <div className="border-t border-line pt-8" aria-hidden="true">
      <Skeleton className="h-6 w-28" />
      <div className="mt-4 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Skeleton shape="block" className="h-44" />
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    </div>
  );
}
