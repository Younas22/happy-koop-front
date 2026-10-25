import { BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Rating, RatingDistribution } from "@/components/ui/Rating";
import { Skeleton } from "@/components/ui/Skeleton";
import { LOCALE_INFO } from "@/i18n/config";
import { fmt, plural } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
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
  const { locale, m } = await getI18n();
  const t = m.product.reviews;

  return (
    <section id="reviews" className="border-t border-line pt-8">
      <h2 className="text-title-lg text-ink sm:text-xl">{t.title}</h2>

      <div className="mt-4 grid gap-6 lg:grid-cols-[18rem_1fr] lg:gap-10">
        {summary && summary.count > 0 ? (
          <div className="surface-card space-y-3 p-4 lg:self-start">
            <div className="flex items-baseline gap-2">
              <span className="text-headline-lg text-ink tabular-nums">
                {summary.average.toFixed(1)}
              </span>
              <span className="text-body-md text-ink-muted">{t.outOf5}</span>
            </div>
            <Rating rating={{ average: summary.average, count: summary.count }} showCount={false} />
            <p className="text-body-sm text-ink-muted">
              {plural(locale, summary.count, t.count)}
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
                  <span className="text-label-lg text-ink">{review.authorName}</span>
                  {review.isVerifiedPurchase ? (
                    <Badge tone="success">
                      <BadgeCheck className="size-3" aria-hidden="true" />
                      {t.verified}
                    </Badge>
                  ) : null}
                  {createdValid ? (
                    <time dateTime={review.createdAt} className="text-body-sm text-ink-subtle">
                      {created.toLocaleDateString(LOCALE_INFO[locale].hreflang, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </time>
                  ) : null}
                </div>

                {review.title ? (
                  <h3 className="mt-2 text-title-sm text-ink">{review.title}</h3>
                ) : null}
                <p className="mt-1 text-body-md text-ink-muted">{review.body}</p>

                {review.storeReply ? (
                  <div className="mt-3 rounded-md border border-line bg-surface-container p-3">
                    <p className="text-label-md font-semibold text-ink">{t.storeReply}</p>
                    <p className="mt-1 text-body-md text-ink-muted">{review.storeReply}</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {data.meta.total > data.data.length ? (
        <p className="mt-4 text-body-md text-ink-muted">
          {fmt(t.showing, { shown: data.data.length, total: data.meta.total })}
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
