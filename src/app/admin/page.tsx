import type { Metadata } from "next";
import Link from "next/link";

import { AdminError, AdminPageHeader, MetricTile } from "@/components/admin/AdminParts";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { fetchDashboard } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { formatDate } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, { title: "Admin", canonicalPath: "/admin", noindex: true });
}

/**
 * Admin dashboard.
 *
 * Every figure here is a count or a sum the API measured. There are no
 * projections, no forecasts, no "vs last month" deltas and no invented
 * targets - if the API does not report it, it is not shown.
 */
export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const config = await getRuntimeConfig();
  const { data, error } = await fetchDashboard();

  if (error || !data) {
    return (
      <>
        <AdminPageHeader title="Dashboard" />
        <AdminError
          error={error!}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin">Try again</Link>
            </Button>
          }
        />
      </>
    );
  }

  const dateOptions = {
    locale: config.locale.locale,
    timeZone: config.locale.timezone,
  };

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Measured totals from the store database. No estimates or projections."
      />

      <section aria-labelledby="dashboard-revenue" className="mb-6">
        <h2 id="dashboard-revenue" className="mb-2 text-sm font-semibold text-ink">
          Revenue ({data.currency})
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile
            label="Paid, all time"
            value={formatMoney(data.revenue.allTime)}
            hint="Orders with a paid or partially refunded payment status."
          />
          <MetricTile label="Paid, last 30 days" value={formatMoney(data.revenue.last30Days)} />
          <MetricTile label="Refunded, all time" value={formatMoney(data.revenue.refundedAllTime)} />
        </div>
      </section>

      <section aria-labelledby="dashboard-orders" className="mb-6">
        <h2 id="dashboard-orders" className="mb-2 text-sm font-semibold text-ink">
          Orders
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricTile label="Total" value={String(data.orders.total)} />
          <MetricTile label="Pending" value={String(data.orders.pending)} />
          <MetricTile label="Processing" value={String(data.orders.processing)} />
          <MetricTile label="Shipped" value={String(data.orders.shipped)} />
          <MetricTile label="Last 30 days" value={String(data.orders.last30Days)} />
        </div>
      </section>

      <section aria-labelledby="dashboard-catalog" className="mb-6">
        <h2 id="dashboard-catalog" className="mb-2 text-sm font-semibold text-ink">
          Catalog, customers and reviews
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Products"
            value={String(data.catalog.products)}
            hint={`${data.catalog.published} published · ${data.catalog.drafts} draft`}
          />
          <MetricTile
            label="Out of stock"
            value={String(data.catalog.outOfStock)}
            hint="Tracked products at or below zero."
          />
          <MetricTile
            label="Customers"
            value={String(data.customers.total)}
            hint={`${data.customers.last30Days} joined in the last 30 days`}
          />
          <MetricTile
            label="Reviews awaiting moderation"
            value={String(data.reviews.pending)}
            hint={`${data.reviews.approved} approved`}
          />
        </div>
      </section>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Recent orders</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">All orders</Link>
          </Button>
        </CardHeader>
        <CardBody>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-ink-muted">No orders have been placed yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.recentOrders.map((order) => (
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

      {config.payments.stripe.enabled || config.payments.paypal.enabled ? null : (
        <p className="mt-6 text-sm text-warning">
          No payment provider is enabled, so customers cannot complete an order.{" "}
          <Link
            href="/admin/settings/payments"
            className="font-medium underline underline-offset-2"
          >
            Configure payments
          </Link>
          .
        </p>
      )}
    </>
  );
}
