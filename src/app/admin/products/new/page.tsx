import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminParts";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/Button";
import { fetchAdminCategories, fetchAllAdminMedia } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "New product",
    canonicalPath: "/admin/products/new",
    noindex: true,
  });
}

export default async function AdminNewProductPage() {
  await requireAdmin("/admin/products/new");
  const config = await getRuntimeConfig();

  // A failed read here just means fewer attachment choices, not a broken form.
  const [categories, media] = await Promise.all([
    fetchAdminCategories(),
    fetchAllAdminMedia({ type: "image" }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="New product"
        description="Create the product, then add variants, specifications, FAQs and related products."
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/products">Cancel</Link>
          </Button>
        }
      />

      <ProductForm
        product={null}
        categories={categories.data ?? []}
        media={media.data?.assets ?? []}
        currency={config.locale.currency}
        minorUnitExponent={config.locale.minorUnitExponent}
      />
    </>
  );
}
