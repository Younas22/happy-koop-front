"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { moderateReviewAction } from "@/app/admin/actions";
import { ReviewStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Rating } from "@/components/ui/Rating";
import { Textarea } from "@/components/ui/Textarea";
import { flattenFieldErrors } from "@/lib/forms/api-errors";
import type { AdminReview, ReviewModerationStatus } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/datetime";

/**
 * Review moderation.
 *
 * The verified-purchase label comes from the API, which sets it only when the
 * review is linked to a paid order item for that product by that customer. It
 * is displayed, never toggled - there is no control here that could mark an
 * unverified review as verified.
 *
 * Approving a review is what makes it public, so the storefront caches are
 * revalidated by the action.
 */
export function ReviewModerationList({
  reviews,
  locale,
  timeZone,
}: {
  reviews: readonly AdminReview[];
  locale: string;
  timeZone: string;
}) {
  const router = useRouter();
  const [replies, setReplies] = React.useState<Record<number, string>>(() =>
    Object.fromEntries(reviews.map((review) => [review.id, review.storeReply ?? ""])),
  );
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [errors, setErrors] = React.useState<Record<number, string | null>>({});

  async function moderate(
    review: AdminReview,
    body: { status?: ReviewModerationStatus; storeReply?: string | null },
  ) {
    setBusyId(review.id);
    setErrors((current) => ({ ...current, [review.id]: null }));

    const result = await moderateReviewAction(review.id, body);
    setBusyId(null);

    if (!result.ok) {
      const details = flattenFieldErrors(result.error.errors);
      setErrors((current) => ({
        ...current,
        [review.id]: details.length > 0 ? details.join(" ") : result.error.message,
      }));
      toast.error("The review was not updated.");
      return;
    }

    toast.success("Review updated.");
    router.refresh();
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li key={review.id} className="surface-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Rating rating={{ average: review.rating, count: 1 }} showCount={false} />
                <ReviewStatusBadge status={review.status} />
                {review.isVerifiedPurchase ? (
                  <Badge tone="success">Verified purchase</Badge>
                ) : (
                  <Badge tone="neutral">Not a verified purchase</Badge>
                )}
              </div>

              <p className="mt-2 text-sm font-medium text-ink">
                {review.title ?? "(no title)"}
              </p>
              <p className="mt-1 text-sm whitespace-pre-line text-ink-muted">{review.body}</p>

              <p className="mt-2 text-xs text-ink-subtle">
                {review.authorName}
                {" · "}
                {formatDate(review.createdAt, { locale, timeZone }) ?? "Date not recorded"}
                {review.product ? ` · ${review.product.name}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {review.status !== "approved" ? (
                <Button
                  size="sm"
                  disabled={busyId === review.id}
                  onClick={() => void moderate(review, { status: "approved" })}
                >
                  Approve
                </Button>
              ) : null}
              {review.status !== "rejected" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId === review.id}
                  onClick={() => void moderate(review, { status: "rejected" })}
                >
                  Reject
                </Button>
              ) : null}
            </div>
          </div>

          {errors[review.id] ? (
            <Alert tone="danger" live title="That did not save" className="mt-3">
              {errors[review.id]}
            </Alert>
          ) : null}

          <div className="mt-3">
            <label
              htmlFor={`review-reply-${review.id}`}
              className="mb-1 block text-xs font-medium text-ink-muted"
            >
              Public store reply
            </label>
            <Textarea
              id={`review-reply-${review.id}`}
              rows={2}
              value={replies[review.id] ?? ""}
              onChange={(event) =>
                setReplies((current) => ({ ...current, [review.id]: event.target.value }))
              }
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                disabled={busyId === review.id}
                onClick={() =>
                  void moderate(review, {
                    storeReply: (replies[review.id] ?? "").trim() || null,
                  })
                }
              >
                Save reply
              </Button>
              {review.storeReply ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === review.id}
                  onClick={() => {
                    setReplies((current) => ({ ...current, [review.id]: "" }));
                    void moderate(review, { storeReply: null });
                  }}
                >
                  Remove reply
                </Button>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
