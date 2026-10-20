import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { MediaManager } from "@/components/admin/MediaManager";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { fetchAdminMedia } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Media",
    canonicalPath: "/admin/media",
    noindex: true,
  });
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function AdminMediaPage({ searchParams }: PageProps<"/admin/media">) {
  await requireAdmin("/admin/media");
  const config = await getRuntimeConfig();
  const params = await searchParams;
  const pageParam = Number.parseInt(one(params.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data, error } = await fetchAdminMedia({ page });

  return (
    <>
      <AdminPageHeader
        title="Media"
        description="Images and video used across the catalog and homepage."
      />

      {error ? (
        <AdminError
          error={error}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/media">Try again</Link>
            </Button>
          }
        />
      ) : (
        <>
          <MediaManager
            assets={data?.data ?? []}
            locale={config.locale.locale}
            timeZone={config.locale.timezone}
          />

          {data ? (
            <Pagination
              className="mt-5"
              meta={data.meta}
              buildHref={(target) => (target <= 1 ? "/admin/media" : `/admin/media?page=${target}`)}
            />
          ) : null}
        </>
      )}
    </>
  );
}
