import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader, AdminTableWrap, Td, Th } from "@/components/admin/AdminParts";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { fetchAdminPages } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { formatDate } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Pages",
    canonicalPath: "/admin/pages",
    noindex: true,
  });
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function AdminPagesPage({ searchParams }: PageProps<"/admin/pages">) {
  await requireAdmin("/admin/pages");
  const config = await getRuntimeConfig();
  const params = await searchParams;
  const pageParam = Number.parseInt(one(params.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data, error } = await fetchAdminPages({ page });
  const dateOptions = { locale: config.locale.locale, timeZone: config.locale.timezone };

  return (
    <>
      <AdminPageHeader
        title="Pages"
        description="Content pages served at /pages/{slug}. A published page is listed on the storefront automatically - in the footer and at /pages - and is added to sitemap.xml."
        actions={
          <Button asChild>
            <Link href="/admin/pages/new">
              <Plus className="size-4" aria-hidden="true" />
              New page
            </Link>
          </Button>
        }
      />

      {error ? (
        <AdminError error={error} />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title="No pages yet"
          description="Create pages such as shipping, returns or about."
          action={
            <Button asChild>
              <Link href="/admin/pages/new">New page</Link>
            </Button>
          }
        />
      ) : (
        <>
          <AdminTableWrap>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Published</Th>
                <Th>Updated</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((cmsPage) => (
                <tr key={cmsPage.id}>
                  <Td>
                    <Link
                      href={`/admin/pages/${cmsPage.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {cmsPage.title}
                    </Link>
                    <span className="block text-xs text-ink-muted">/pages/{cmsPage.slug}</span>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={cmsPage.isPublished ? "success" : "warning"}>
                        {cmsPage.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {cmsPage.seo.noindex ? <Badge tone="neutral">noindex</Badge> : null}
                    </div>
                  </Td>
                  <Td>{formatDate(cmsPage.publishedAt, dateOptions) ?? "-"}</Td>
                  <Td>{formatDate(cmsPage.updatedAt, dateOptions) ?? "-"}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {cmsPage.isPublished ? (
                        <Button asChild size="sm" variant="ghost">
                          {/* A new tab, so reviewing the live page does not
                              lose the admin's place in the list. */}
                          <Link
                            href={`/pages/${cmsPage.slug}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </Link>
                        </Button>
                      ) : null}
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/pages/${cmsPage.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>

          {data ? (
            <Pagination
              className="mt-5"
              meta={data.meta}
              buildHref={(target) =>
                target <= 1 ? "/admin/pages" : `/admin/pages?page=${target}`
              }
            />
          ) : null}
        </>
      )}
    </>
  );
}
