import { XCircle } from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/i18n/Link";

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
import { fmt } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  const { locale, m } = await getI18n();
  return buildPageMetadata(config, {
    title: m.returnPages.cancelMetaTitle,
    locale,
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
  const { m } = await getI18n();
  const t = m.returnPages;

  const token = orderNumber ? await resolveOrderToken(orderNumber, queryToken) : null;
  const { data: order } = orderNumber
    ? await fetchOrderStatus(orderNumber, { token, auth: Boolean(viewer) })
    : { data: null };

  const outcome = order ? describePaymentStatus(order.paymentStatus, m.paymentStatus) : null;

  // The provider sent the customer to the cancel URL but the server says the
  // payment went through: trust the server and redirect attention there.
  if (order && outcome?.isSuccess) {
    return (
      <div className="page-container py-8 sm:py-10">
        <ClearCartOnConfirmation confirmed={outcome.mayClearCart} />
        <div className="mx-auto max-w-2xl space-y-6">
          <Alert tone="success" title={t.wentThroughTitle}>
            {fmt(t.wentThroughBody, {
              status: (m.status.payment[order.paymentStatus] ?? order.paymentStatus).toLowerCase(),
            })}
          </Alert>

          <div className="surface-card p-6 text-center">
            <p className="text-body-md text-ink">
              {m.orders.orderN} <span className="font-semibold">{order.orderNumber}</span>
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href={`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`}>
                  {t.seeStatus}
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/shop">{t.continueShopping}</Link>
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
          <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-surface-container">
            <XCircle className="size-6 text-ink-muted" aria-hidden="true" />
          </span>

          <h1 className="text-title-lg text-ink sm:text-headline-sm">{t.notCompletedTitle}</h1>
          <p className="mt-2 max-w-md text-body-md text-ink-muted">
            {order ? t.notPaidWithOrder : t.notPaidNoOrder}
          </p>

          {order ? (
            <>
              <p className="mt-4 text-body-md text-ink">
                {m.orders.orderN} <span className="font-semibold">{order.orderNumber}</span>
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/checkout">{t.tryAgain}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/cart">{t.reviewCart}</Link>
            </Button>
            {orderNumber ? (
              <Button asChild variant="ghost">
                <Link href={`/checkout/success?order=${encodeURIComponent(orderNumber)}`}>
                  {t.checkStatus}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {order ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{m.orders.itemsOnOrder}</CardTitle>
              </CardHeader>
              <CardBody>
                <OrderItemList items={order.items} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{m.orders.totals}</CardTitle>
              </CardHeader>
              <CardBody>
                <OrderTotalsList totals={order.totals} />
              </CardBody>
            </Card>
          </div>
        ) : null}

        <p className="text-center text-body-sm text-ink-muted">
          {fmt(t.currencyNote, { currency: config.locale.currency })}
        </p>
      </div>
    </div>
  );
}
