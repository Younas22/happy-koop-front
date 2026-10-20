import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminError, AdminPageHeader } from "@/components/admin/AdminParts";
import { OrderAdminControls } from "@/components/admin/OrderAdminControls";
import {
  AddressBlock,
  OrderItemList,
  OrderTotalsList,
  TrackingBlock,
} from "@/components/orders/OrderParts";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { fetchAdminOrder } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { formatDateTime } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata({
  params,
}: PageProps<"/admin/orders/[id]">): Promise<Metadata> {
  const { id } = await params;
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: `Order ${id}`,
    canonicalPath: `/admin/orders/${id}`,
    noindex: true,
  });
}

export default async function AdminOrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin("/admin/orders");
  const { id } = await params;
  const orderId = Number.parseInt(id, 10);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    notFound();
  }

  const config = await getRuntimeConfig();
  const { data: order, error } = await fetchAdminOrder(orderId);

  if (error?.isNotFound()) {
    notFound();
  }

  if (error || !order) {
    return (
      <>
        <AdminPageHeader title="Order" />
        <AdminError
          error={error!}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/orders">Back to orders</Link>
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
        title={order.orderNumber}
        description={
          <>
            {order.email ?? "No email on record"}
            {order.phone ? ` · ${order.phone}` : ""}
            {order.paymentProvider ? ` · ${order.paymentProvider}` : ""}
          </>
        }
        actions={
          <>
            {order.userId ? (
              <Button asChild variant="ghost">
                <Link href={`/admin/customers/${order.userId}`}>Customer</Link>
              </Button>
            ) : null}
            <Button asChild variant="ghost">
              <Link href="/admin/orders">All orders</Link>
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardBody>
              <OrderItemList items={order.items} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Totals</CardTitle>
            </CardHeader>
            <CardBody>
              <OrderTotalsList totals={order.totals} couponCode={order.couponCode} />
              {order.shippingMethod ? (
                <p className="mt-3 text-xs text-ink-muted">
                  Shipping method: {order.shippingMethod.label ?? order.shippingMethod.id}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <OrderAdminControls
            order={order}
            minorUnitExponent={config.locale.minorUnitExponent}
          />
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                  Shipping
                </p>
                <AddressBlock address={order.shippingAddress} locale={config.locale.locale} />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                  Billing
                </p>
                {order.billingAddress ? (
                  <AddressBlock address={order.billingAddress} locale={config.locale.locale} />
                ) : (
                  <p className="text-sm text-ink-muted">Same as shipping.</p>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="space-y-2 text-sm">
                {[
                  ["Created", order.createdAt],
                  ["Placed", order.placedAt],
                  ["Paid", order.paidAt],
                  ["Inventory committed", order.inventoryCommittedAt],
                  ["Cancelled", order.cancelledAt],
                  ["Expires", order.expiresAt],
                  ["Last updated", order.updatedAt],
                ].map(([label, value]) =>
                  value ? (
                    <div key={label as string}>
                      <dt className="text-xs text-ink-subtle">{label}</dt>
                      <dd className="text-ink">
                        {formatDateTime(value as string, dateOptions) ?? "-"}
                      </dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </CardBody>
          </Card>

          {order.tracking ? (
            <Card>
              <CardHeader>
                <CardTitle>Tracking</CardTitle>
              </CardHeader>
              <CardBody>
                <TrackingBlock tracking={order.tracking} />
              </CardBody>
            </Card>
          ) : null}

          {order.customerNote ? (
            <Card>
              <CardHeader>
                <CardTitle>Customer note</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm whitespace-pre-line text-ink-muted">{order.customerNote}</p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
