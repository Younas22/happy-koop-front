import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { HomeSectionsEditor } from "@/components/admin/HomeSectionsEditor";
import { Button } from "@/components/ui/Button";
import {
  fetchAdminCategories,
  fetchAdminHomeSections,
  fetchAdminMedia,
  fetchAdminProducts,
} from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Home sections",
    canonicalPath: "/admin/home-sections",
    noindex: true,
  });
}

export default async function AdminHomeSectionsPage() {
  await requireAdmin("/admin/home-sections");

  const [sections, categories, products, media] = await Promise.all([
    fetchAdminHomeSections(),
    fetchAdminCategories(),
    fetchAdminProducts({ perPage: 60, status: "published", sort: "name_asc" }),
    fetchAdminMedia({ type: "image" }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Home sections"
        description="Compose the homepage. Sections render in this order; an inactive section is skipped."
        actions={
          <Button asChild variant="ghost">
            <Link href="/">View homepage</Link>
          </Button>
        }
      />

      {sections.error ? (
        <AdminError
          error={sections.error}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/home-sections">Try again</Link>
            </Button>
          }
        />
      ) : (
        <HomeSectionsEditor
          sections={sections.data ?? []}
          categories={categories.data ?? []}
          products={products.data?.data ?? []}
          media={media.data?.data ?? []}
        />
      )}
    </>
  );
}
