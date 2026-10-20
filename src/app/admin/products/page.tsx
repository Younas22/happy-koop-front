import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AdminError, AdminPageHeader, AdminTableWrap, Td, Th } from "@/components/admin/AdminParts";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { fetchAdminCategories, fetchAdminProducts, isAdminProductSort } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildQuery } from "@/lib/utils/url";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Products",
    canonicalPath: "/admin/products",
    noindex: true,
  });
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

const STATUSES = ["draft", "published", "archived"] as const;

/**
 * Product list.
 *
 * Filters are a plain GET form, so the list is server-rendered, shareable and
 * works without client JavaScript. `costPrice` is intentionally not shown in
 * this table - it exists on the admin payload but belongs on the edit screen,
 * not in a list that may be glanced at on a shared screen.
 */
export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin("/admin/products");
  const params = await searchParams;

  const q = one(params.q).trim();
  const status = (STATUSES as readonly string[]).includes(one(params.status))
    ? one(params.status)
    : "";
  const categoryId = Number.parseInt(one(params.category), 10);
  const sortParam = one(params.sort);
  const sort = isAdminProductSort(sortParam) ? sortParam : null;
  const trashed = one(params.trashed) === "1";
  const pageParam = Number.parseInt(one(params.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [products, categories] = await Promise.all([
    fetchAdminProducts({
      q: q || null,
      status: status || null,
      category: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : null,
      trashed,
      sort,
      page,
      perPage: 25,
    }),
    fetchAdminCategories(),
  ]);

  const buildHref = (overrides: Record<string, string | number | null>) =>
    `/admin/products${buildQuery({
      q: q || null,
      status: status || null,
      category: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : null,
      trashed: trashed ? "1" : null,
      sort,
      ...overrides,
    })}`;

  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Everything in the catalog, including drafts."
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="size-4" aria-hidden="true" />
              New product
            </Link>
          </Button>
        }
      />

      <form
        method="get"
        action="/admin/products"
        className="surface-card mb-4 grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <label htmlFor="product-q" className="mb-1 block text-xs font-medium text-ink-muted">
            Search name, SKU or brand
          </label>
          <Input id="product-q" name="q" defaultValue={q} placeholder="Search products" />
        </div>

        <div>
          <label htmlFor="product-status" className="mb-1 block text-xs font-medium text-ink-muted">
            Status
          </label>
          <select
            id="product-status"
            name="status"
            defaultValue={status}
            className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink"
          >
            <option value="">Any status</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="product-category"
            className="mb-1 block text-xs font-medium text-ink-muted"
          >
            Category
          </label>
          <select
            id="product-category"
            name="category"
            defaultValue={Number.isFinite(categoryId) && categoryId > 0 ? String(categoryId) : ""}
            className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink"
          >
            <option value="">Any category</option>
            {(categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="product-sort" className="mb-1 block text-xs font-medium text-ink-muted">
            Sort
          </label>
          <select
            id="product-sort"
            name="sort"
            defaultValue={sort ?? "newest"}
            className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="price_asc">Price low to high</option>
            <option value="price_desc">Price high to low</option>
            <option value="stock_asc">Stock low to high</option>
          </select>
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/products">Clear</Link>
          </Button>
          <Button asChild variant="ghost" className="ml-auto">
            <Link href={buildHref({ trashed: trashed ? null : "1", page: null })}>
              {trashed ? "Show active products" : "Show deleted products"}
            </Link>
          </Button>
        </div>
      </form>

      {products.error ? (
        <AdminError error={products.error} />
      ) : (products.data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title={q || status ? "No products match these filters" : "No products yet"}
          description={
            q || status
              ? "Try a different search or clear the filters."
              : "Create your first product to start building the catalog."
          }
          action={
            <Button asChild>
              <Link href="/admin/products/new">New product</Link>
            </Button>
          }
        />
      ) : (
        <>
          <AdminTableWrap>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Status</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Stock</Th>
                <Th className="text-right">Variants</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {(products.data?.data ?? []).map((product) => (
                <tr key={product.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-line bg-sunken">
                        {product.primaryImage ? (
                          <Image
                            src={product.primaryImage.url}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium text-ink hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-ink-muted">
                          {product.sku ? `SKU ${product.sku}` : "No SKU"} · /{product.slug}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        product.status === "published"
                          ? "success"
                          : product.status === "draft"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {product.status}
                    </Badge>
                  </Td>
                  <Td className="text-right tabular-nums">{formatMoney(product.price)}</Td>
                  <Td className="text-right tabular-nums">
                    {product.inventoryPolicy === "track" ? product.stockQuantity : "Not tracked"}
                  </Td>
                  <Td className="text-right tabular-nums">{product.variantCount}</Td>
                  <Td className="text-right">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/admin/products/${product.id}`}>Edit</Link>
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>

          {products.data ? (
            <Pagination
              className="mt-5"
              meta={products.data.meta}
              buildHref={(target) => buildHref({ page: target <= 1 ? null : target })}
            />
          ) : null}
        </>
      )}
    </>
  );
}
