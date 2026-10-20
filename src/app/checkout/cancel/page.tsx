import { XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ClearCartOnConfirmation } from "@/components/checkout/ClearCartOnConfirmation";
import { OrderItemList, OrderTotalsList } from "@/components/orders/OrderParts";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { getViewer } from "@/lib/auth/session";
import { resolveOrderToken } from "@/lib/checkout/order-access";
import { describePaymentStatus } from "@/lib/checkout/payment-status";
import { fetchOrderStatus } from "@/lib/checkout/queries";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Payment cancelled",
    canonicalPath: "/checkout/cancel",
    noindex: true,
  });
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Cancel / abandoned-payment return page.
 *
 * Even here the status is read from the server: a provider can redirect to a
 * cancel URL after a payment has in fact been taken, so the page must not
 * assert "nothing was charged" on the strength of the URL. When the order
 * turns out to be paid or authorized, this page says so and links to the
 * order; only a genuinely unpaid order is presented as cancelled.
 */
export default async function CheckoutCancelPage({ searchParams }: PageProps<"/checkout/cancel">) {
  const params = await searchParams;
  const orderNumber = first(params.order).trim();
  const queryToken = first(params.token).trim() || null;

  const config = await getRuntimeConfig();
  const viewer = await getViewer();

  const token = orderNumber ? await resolveOrderToken(orderNumber, queryToken) : null;
  const { data: order } = orderNumber
    ? await fetchOrderStatus(orderNumber, { token, auth: Boolean(viewer) })
    : { data: null };

  const outcome = order ? describePaymentStatus(order.paymentStatus) : null;

  // The provider sent the customer to the cancel URL but the server says the
  // payment went through: trust the server and redirect attention there.
  if (order && outcome?.isSuccess) {
    return (
      <div className="page-container py-8 sm:py-10">
        <ClearCartOnConfirmation confirmed={outcome.mayClearCart} />
        <div className="mx-auto max-w-2xl space-y-6">
          <Alert tone="success" title="This payment actually went through">
            You arrived on the cancelled-payment page, but our records show this order&rsquo;s
            payment as {order.paymentStatus}. Nothing further is needed.
          </Alert>

          <div className="surface-card p-6 text-center">
            <p className="text-sm text-ink">
              Order <span className="font-semibold">{order.orderNumber}</span>
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href={`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`}>
                  See order status
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/shop">Continue shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-8 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="surface-card flex flex-col items-center p-6 text-center">
          <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-sunken">
            <XCircle className="size-6 text-ink-muted" aria-hidden="true" />
          </span>

          <h1 className="text-xl font-semibold text-ink sm:text-2xl">Payment not completed</h1>
          <p className="mt-2 max-w-md text-sm text-ink-muted">
            {order
              ? "This order has not been paid, so it has not been placed. Your cart is still here and nothing has been charged."
              : "The payment was not completed, so no order has been placed. Your cart is still here and nothing has been charged."}
          </p>

          {order ? (
            <>
              <p className="mt-4 text-sm text-ink">
                Order <span className="font-semibold">{order.orderNumber}</span>
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/checkout">Try payment again</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/cart">Review your cart</Link>
            </Button>
            {orderNumber ? (
              <Button asChild variant="ghost">
                <Link href={`/checkout/success?order=${encodeURIComponent(orderNumber)}`}>
                  Check this order&rsquo;s status
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {order ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Items on this order</CardTitle>
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
                <OrderTotalsList totals={order.totals} />
              </CardBody>
            </Card>
          </div>
        ) : null}

        <p className="text-center text-xs text-ink-muted">
          Store currency: {config.locale.currency}. If you believe you were charged, check the order
          status above before paying again.
        </p>
      </div>
    </div>
  );
}
