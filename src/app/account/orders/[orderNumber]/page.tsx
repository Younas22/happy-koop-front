import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AddressBlock,
  OrderItemList,
  OrderTotalsList,
  TrackingBlock,
} from "@/components/orders/OrderParts";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchAccountOrder } from "@/lib/account/queries";
import { requireViewer } from "@/lib/auth/session";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { formatDateTime } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";

/**
 * A single order, addressed by its `orderNumber` (contract 7) rather than a
 * database id, which is also what the API path takes.
 *
 * The order is read from `/account/orders/{orderNumber}`, which is scoped to
 * the authenticated user server-side: another customer's order number returns
 * 404, so there is no IDOR here even though the number is guessable.
 */
export async function generateMetadata({
  params,
}: PageProps<"/account/orders/[orderNumber]">): Promise<Metadata> {
  const { orderNumber } = await params;
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: `Order ${orderNumber}`,
    canonicalPath: `/account/orders/${orderNumber}`,
    noindex: true,
  });
}

export default async function AccountOrderPage({
  params,
}: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  await requireViewer(`/account/orders/${orderNumber}`);
  const config = await getRuntimeConfig();

  const { data: order, error } = await fetchAccountOrder(orderNumber);

  if (error?.isNotFound()) {
    notFound();
  }

  if (error || !order) {
    return (
      <ErrorState
        title="We could not load this order"
        message={error?.message ?? null}
        unreachable={error?.isUnreachable() ?? false}
        action={
          <Button asChild variant="secondary">
            <Link href="/account/orders">Back to orders</Link>
          </Button>
        }
      />
    );
  }

  const placed = formatDateTime(order.placedAt ?? order.createdAt, {
    locale: config.locale.locale,
    timeZone: config.locale.timezone,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All orders
        </Link>

        <h2 className="mt-2 text-xl font-semibold text-ink sm:text-2xl">{order.orderNumber}</h2>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>

        {placed ? <p className="mt-2 text-sm text-ink-muted">Placed {placed}</p> : null}
      </div>

      {order.paymentStatus === "unpaid" ? (
        <Alert tone="warning" title="This order has not been paid">
          We have not received a payment confirmation for this order yet. If you have just paid, the
          confirmation can take a moment to arrive.
        </Alert>
      ) : null}

      {order.paymentStatus === "failed" ? (
        <Alert tone="danger" title="The payment for this order failed">
          Nothing has been charged. You can place the order again from your cart.
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardBody>
          <OrderItemList items={order.items} />
        </CardBody>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                Shipping address
              </p>
              <AddressBlock address={order.shippingAddress} locale={config.locale.locale} />
            </div>

            {order.billingAddress ? (
              <div>
                <p className="mb-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                  Billing address
                </p>
                <AddressBlock address={order.billingAddress} locale={config.locale.locale} />
              </div>
            ) : null}

            <TrackingBlock tracking={order.tracking} />
          </CardBody>
        </Card>
      </div>

      {order.customerNote ? (
        <Card>
          <CardHeader>
            <CardTitle>Your note</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm whitespace-pre-line text-ink-muted">{order.customerNote}</p>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
