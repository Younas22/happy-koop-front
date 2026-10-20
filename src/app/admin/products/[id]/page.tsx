import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductRelationsEditor } from "@/components/admin/ProductRelationsEditor";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  fetchAdminCategories,
  fetchAdminMedia,
  fetchAdminProduct,
  fetchAdminProducts,
} from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata({
  params,
}: PageProps<"/admin/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: `Product ${id}`,
    canonicalPath: `/admin/products/${id}`,
    noindex: true,
  });
}

export default async function AdminEditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin("/admin/products");
  const { id } = await params;
  const productId = Number.parseInt(id, 10);

  if (!Number.isFinite(productId) || productId <= 0) {
    notFound();
  }

  const config = await getRuntimeConfig();

  const [product, categories, media, candidates] = await Promise.all([
    fetchAdminProduct(productId),
    fetchAdminCategories(),
    fetchAdminMedia({ type: "image" }),
    fetchAdminProducts({ perPage: 60, sort: "name_asc" }),
  ]);

  if (product.error?.isNotFound()) {
    notFound();
  }

  if (product.error || !product.data) {
    return (
      <>
        <AdminPageHeader title="Edit product" />
        <AdminError
          error={product.error!}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/products">Back to products</Link>
            </Button>
          }
        />
      </>
    );
  }

  const detail = product.data;

  return (
    <>
      <AdminPageHeader
        title={detail.name}
        description={
          <>
            /{detail.slug} · {detail.status}
            {detail.deletedAt ? " · deleted" : ""}
          </>
        }
        actions={
          <>
            {detail.status === "published" ? (
              <Button asChild variant="ghost">
                <Link href={`/product/${detail.slug}`}>View in store</Link>
              </Button>
            ) : null}
            <Button asChild variant="ghost">
              <Link href="/admin/products">All products</Link>
            </Button>
            <DeleteProductButton id={detail.id} name={detail.name} />
          </>
        }
      />

      {detail.deletedAt ? (
        <Alert tone="warning" title="This product is deleted" className="mb-4">
          It is hidden from the storefront. Existing orders keep their own item snapshots.
        </Alert>
      ) : null}

      <div className="space-y-6">
        <ProductForm
          product={detail}
          categories={categories.data ?? []}
          media={media.data?.data ?? []}
          currency={config.locale.currency}
          minorUnitExponent={config.locale.minorUnitExponent}
        />

        <Card>
          <CardHeader>
            <CardTitle>Variants, specifications, FAQs and related products</CardTitle>
          </CardHeader>
          <CardBody>
            <ProductRelationsEditor
              product={detail}
              relatedCandidates={candidates.data?.data ?? []}
              minorUnitExponent={config.locale.minorUnitExponent}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
