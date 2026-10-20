import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { ReviewModerationList } from "@/components/admin/ReviewModerationList";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { fetchAdminReviews } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import type { ReviewModerationStatus } from "@/lib/types/api";
import { buildPageMetadata } from "@/lib/utils/seo";
import { buildQuery } from "@/lib/utils/url";
import { cn } from "@/lib/utils/cn";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Reviews",
    canonicalPath: "/admin/reviews",
    noindex: true,
  });
}

const STATUSES: readonly ReviewModerationStatus[] = ["pending", "approved", "rejected"];

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function AdminReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  await requireAdmin("/admin/reviews");
  const config = await getRuntimeConfig();
  const params = await searchParams;

  const statusRaw = one(params.status);
  const status = (STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as ReviewModerationStatus)
    : null;
  const pageParam = Number.parseInt(one(params.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data, error } = await fetchAdminReviews({ status, page });

  return (
    <>
      <AdminPageHeader
        title="Reviews"
        description="A review is only visible in the store once it is approved."
      />

      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-1.5">
        <Link
          href="/admin/reviews"
          aria-current={status === null ? "page" : undefined}
          className={cn(
            "tap-target inline-flex items-center rounded-md border px-3 text-sm font-medium",
            status === null
              ? "border-brand bg-brand-tint text-brand"
              : "border-line bg-surface text-ink hover:bg-sunken",
          )}
        >
          All
        </Link>
        {STATUSES.map((value) => (
          <Link
            key={value}
            href={`/admin/reviews?status=${value}`}
            aria-current={status === value ? "page" : undefined}
            className={cn(
              "tap-target inline-flex items-center rounded-md border px-3 text-sm font-medium capitalize",
              status === value
                ? "border-brand bg-brand-tint text-brand"
                : "border-line bg-surface text-ink hover:bg-sunken",
            )}
          >
            {value}
          </Link>
        ))}
      </nav>

      {error ? (
        <AdminError error={error} />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title={status ? `No ${status} reviews` : "No reviews yet"}
          description={
            status === "pending"
              ? "Nothing is waiting for moderation."
              : "Customer reviews will appear here for moderation."
          }
          action={
            status ? (
              <Button asChild variant="secondary">
                <Link href="/admin/reviews">Show all reviews</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ReviewModerationList
            reviews={data?.data ?? []}
            locale={config.locale.locale}
            timeZone={config.locale.timezone}
          />

          {data ? (
            <Pagination
              className="mt-5"
              meta={data.meta}
              buildHref={(target) =>
                `/admin/reviews${buildQuery({ status, page: target <= 1 ? null : target })}`
              }
            />
          ) : null}
        </>
      )}
    </>
  );
}
