import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { AddressBlock } from "@/components/orders/OrderParts";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { fetchAdminCustomer } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { formatDate, formatDateTime } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata({
  params,
}: PageProps<"/admin/customers/[id]">): Promise<Metadata> {
  const { id } = await params;
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: `Customer ${id}`,
    canonicalPath: `/admin/customers/${id}`,
    noindex: true,
  });
}

export default async function AdminCustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  await requireAdmin("/admin/customers");
  const { id } = await params;
  const customerId = Number.parseInt(id, 10);

  if (!Number.isFinite(customerId) || customerId <= 0) {
    notFound();
  }

  const config = await getRuntimeConfig();
  const { data: customer, error } = await fetchAdminCustomer(customerId);

  if (error?.isNotFound()) {
    notFound();
  }

  if (error || !customer) {
    return (
      <>
        <AdminPageHeader title="Customer" />
        <AdminError
          error={error!}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/customers">Back to customers</Link>
            </Button>
          }
        />
      </>
    );
  }

  const dateOptions = { locale: config.locale.locale, timeZone: config.locale.timezone };

  return (
    <>
      <AdminPageHeader
        title={customer.name}
        description={customer.email}
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/customers">All customers</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders ({customer.orders.length})</CardTitle>
            </CardHeader>
            <CardBody>
              {customer.orders.length === 0 ? (
                <p className="text-sm text-ink-muted">This customer has not placed an order.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {customer.orders.map((order) => (
                    <li key={order.orderNumber} className="flex flex-wrap gap-3 py-2.5 first:pt-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{order.orderNumber}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {formatDate(order.placedAt ?? order.createdAt, dateOptions) ??
                            "Date not recorded"}
                          {" · "}
                          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.paymentStatus} />
                        <span className="text-sm font-semibold text-ink tabular-nums">
                          {formatMoney(order.total)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Addresses ({customer.addresses.length})</CardTitle>
            </CardHeader>
            <CardBody>
              {customer.addresses.length === 0 ? (
                <p className="text-sm text-ink-muted">No saved addresses.</p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {customer.addresses.map((address) => (
                    <li key={address.id} className="rounded-md border border-line p-3">
                      <div className="mb-1.5 flex flex-wrap gap-1.5">
                        {address.isDefaultShipping ? (
                          <Badge tone="brand">Default shipping</Badge>
                        ) : null}
                        {address.isDefaultBilling ? (
                          <Badge tone="info">Default billing</Badge>
                        ) : null}
                      </div>
                      <AddressBlock address={address} locale={config.locale.locale} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardBody>
            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-xs text-ink-subtle">Email</dt>
                <dd className="break-words text-ink">{customer.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-subtle">Phone</dt>
                <dd className="text-ink">{customer.phone ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-subtle">Email verified</dt>
                <dd className="text-ink">
                  {customer.emailVerifiedAt
                    ? (formatDateTime(customer.emailVerifiedAt, dateOptions) ?? "Yes")
                    : "Not verified"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-subtle">Marketing emails</dt>
                <dd className="text-ink">
                  {customer.acceptsMarketing ? "Subscribed" : "Not subscribed"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-subtle">Roles</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {customer.roles.length === 0 ? (
                    <span className="text-ink">Customer</span>
                  ) : (
                    customer.roles.map((role) => (
                      <Badge key={role.id} tone="neutral">
                        {role.name}
                      </Badge>
                    ))
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-subtle">Last sign-in</dt>
                <dd className="text-ink">
                  {formatDateTime(customer.lastLoginAt, dateOptions) ?? "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-subtle">Joined</dt>
                <dd className="text-ink">{formatDate(customer.createdAt, dateOptions) ?? "-"}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
