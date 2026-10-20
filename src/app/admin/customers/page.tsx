import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader, AdminTableWrap, Td, Th } from "@/components/admin/AdminParts";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { fetchAdminCustomers } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { formatDate } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";
import { buildQuery } from "@/lib/utils/url";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Customers",
    canonicalPath: "/admin/customers",
    noindex: true,
  });
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Customer list.
 *
 * The API never returns password hashes or payment data, and nothing extra is
 * derived here: no "lifetime value", no segment, no score. Only what the store
 * actually recorded.
 */
export default async function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin("/admin/customers");
  const config = await getRuntimeConfig();
  const params = await searchParams;

  const q = one(params.q).trim();
  const pageParam = Number.parseInt(one(params.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data, error } = await fetchAdminCustomers({ q: q || null, page });
  const dateOptions = { locale: config.locale.locale, timeZone: config.locale.timezone };

  return (
    <>
      <AdminPageHeader title="Customers" description="Accounts registered with this store." />

      <form
        method="get"
        action="/admin/customers"
        className="surface-card mb-4 flex flex-wrap items-end gap-3 p-3"
      >
        <div className="min-w-56 flex-1">
          <label htmlFor="customer-q" className="mb-1 block text-xs font-medium text-ink-muted">
            Search name, email or phone
          </label>
          <Input id="customer-q" name="q" defaultValue={q} placeholder="Search customers" />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
        <Button asChild variant="ghost">
          <Link href="/admin/customers">Clear</Link>
        </Button>
      </form>

      {error ? (
        <AdminError error={error} />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title={q ? "No customers match that search" : "No customers yet"}
          description={q ? "Try a different search term." : "Registered accounts will appear here."}
        />
      ) : (
        <>
          <AdminTableWrap>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Phone</Th>
                <Th className="text-right">Orders</Th>
                <Th>Verified</Th>
                <Th>Joined</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((customer) => (
                <tr key={customer.id}>
                  <Td>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {customer.name}
                    </Link>
                    <span className="block break-words text-xs text-ink-muted">
                      {customer.email}
                    </span>
                    {customer.isAdmin ? (
                      <Badge tone="brand" className="mt-1">
                        Admin
                      </Badge>
                    ) : null}
                  </Td>
                  <Td>{customer.phone ?? "-"}</Td>
                  <Td className="text-right tabular-nums">{customer.ordersCount}</Td>
                  <Td>
                    {customer.emailVerifiedAt ? (
                      <Badge tone="success">Verified</Badge>
                    ) : (
                      <Badge tone="neutral">Not verified</Badge>
                    )}
                  </Td>
                  <Td>{formatDate(customer.createdAt, dateOptions) ?? "-"}</Td>
                  <Td className="text-right">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/admin/customers/${customer.id}`}>Open</Link>
                    </Button>
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
                `/admin/customers${buildQuery({ q: q || null, page: target <= 1 ? null : target })}`
              }
            />
          ) : null}
        </>
      )}
    </>
  );
}
