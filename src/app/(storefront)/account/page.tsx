import { MapPin, Package } from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/i18n/Link";

import { AddressBlock } from "@/components/orders/OrderParts";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchAccountOrders, fetchAddresses, fetchProfile } from "@/lib/account/queries";
import { requireViewer } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { formatDate } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, { title: "Account", canonicalPath: "/account", noindex: true });
}

/**
 * Account overview.
 *
 * Three real reads, each degrading on its own: if orders are unavailable the
 * address card still renders. Nothing is filled in with sample data - an empty
 * section says it is empty.
 */
export default async function AccountOverviewPage() {
  const viewer = await requireViewer("/account");
  const config = await getRuntimeConfig();

  const [orders, addresses, profile] = await Promise.all([
    fetchAccountOrders({ perPage: 3 }),
    fetchAddresses(),
    fetchProfile(),
  ]);

  const recent = orders.data?.data ?? [];
  const defaultShipping =
    addresses.data?.find((address) => address.isDefaultShipping) ?? addresses.data?.[0] ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Recent orders</CardTitle>
          {recent.length > 0 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/account/orders">View all</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardBody>
          {orders.error ? (
            <ErrorState
              message={orders.error.message}
              unreachable={orders.error.isUnreachable()}
              className="border-0 px-0 py-6"
            />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Orders you place will appear here."
              action={
                <Button asChild>
                  <Link href="/shop">Browse the shop</Link>
                </Button>
              }
              className="border-0 px-0 py-6"
            />
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((order) => (
                <li key={order.orderNumber} className="flex flex-wrap gap-3 py-3 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                      className="text-label-lg text-ink hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="mt-0.5 text-body-sm text-ink-muted">
                      {formatDate(order.placedAt ?? order.createdAt, {
                        locale: config.locale.locale,
                        timeZone: config.locale.timezone,
                      }) ?? "Date not recorded"}
                      {" · "}
                      {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <OrderStatusBadge status={order.status} />
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                  </div>
                  <p className="text-title-sm text-ink tabular-nums">
                    {formatMoney(order.total)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Default address</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/account/addresses">Manage</Link>
            </Button>
          </CardHeader>
          <CardBody>
            {addresses.error ? (
              <p className="text-body-md text-ink-muted">{addresses.error.message}</p>
            ) : defaultShipping ? (
              <AddressBlock address={defaultShipping} locale={config.locale.locale} />
            ) : (
              <EmptyState
                icon={MapPin}
                title="No saved address"
                description="Save an address to speed up checkout."
                action={
                  <Button asChild size="sm">
                    <Link href="/account/addresses">Add an address</Link>
                  </Button>
                }
                className="border-0 px-0 py-4"
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Profile</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/account/profile">Edit</Link>
            </Button>
          </CardHeader>
          <CardBody>
            <dl className="space-y-2 text-body-md">
              <div>
                <dt className="text-body-sm text-ink-subtle">Name</dt>
                <dd className="text-ink">{profile.data?.name ?? viewer.name}</dd>
              </div>
              <div>
                <dt className="text-body-sm text-ink-subtle">Email</dt>
                <dd className="break-words text-ink">{profile.data?.email ?? viewer.email}</dd>
              </div>
              {profile.data ? (
                <>
                  <div>
                    <dt className="text-body-sm text-ink-subtle">Phone</dt>
                    <dd className="text-ink">{profile.data.phone ?? "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-body-sm text-ink-subtle">Store updates</dt>
                    <dd className="text-ink">
                      {profile.data.acceptsMarketing ? "Subscribed" : "Not subscribed"}
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
            {profile.error ? (
              <p className="mt-3 text-body-sm text-ink-muted">
                Some profile details could not be loaded: {profile.error.message}
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
