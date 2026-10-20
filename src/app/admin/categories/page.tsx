import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { Button } from "@/components/ui/Button";
import { fetchAdminCategories } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Categories",
    canonicalPath: "/admin/categories",
    noindex: true,
  });
}

export default async function AdminCategoriesPage() {
  await requireAdmin("/admin/categories");
  const { data, error } = await fetchAdminCategories();

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="Group products and build the shop navigation."
      />

      {error ? (
        <AdminError
          error={error}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/categories">Try again</Link>
            </Button>
          }
        />
      ) : (
        <CategoryManager categories={data ?? []} />
      )}
    </>
  );
}
