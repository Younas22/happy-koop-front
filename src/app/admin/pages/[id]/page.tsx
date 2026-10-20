import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { PageEditor } from "@/components/admin/PageEditor";
import { Button } from "@/components/ui/Button";
import { fetchAdminPage } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata({
  params,
}: PageProps<"/admin/pages/[id]">): Promise<Metadata> {
  const { id } = await params;
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: `Page ${id}`,
    canonicalPath: `/admin/pages/${id}`,
    noindex: true,
  });
}

export default async function AdminEditPagePage({ params }: PageProps<"/admin/pages/[id]">) {
  await requireAdmin("/admin/pages");
  const { id } = await params;
  const pageId = Number.parseInt(id, 10);

  if (!Number.isFinite(pageId) || pageId <= 0) {
    notFound();
  }

  const { data: cmsPage, error } = await fetchAdminPage(pageId);

  if (error?.isNotFound()) {
    notFound();
  }

  if (error || !cmsPage) {
    return (
      <>
        <AdminPageHeader title="Edit page" />
        <AdminError
          error={error!}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/pages">Back to pages</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={cmsPage.title}
        description={`/pages/${cmsPage.slug}`}
        actions={
          <>
            {cmsPage.isPublished ? (
              <Button asChild variant="ghost">
                <Link href={`/pages/${cmsPage.slug}`}>View in store</Link>
              </Button>
            ) : null}
            <Button asChild variant="ghost">
              <Link href="/admin/pages">All pages</Link>
            </Button>
          </>
        }
      />
      <PageEditor page={cmsPage} />
    </>
  );
}
