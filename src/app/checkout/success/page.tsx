import { CheckCircle2, Clock, CreditCard, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ClearCartOnConfirmation } from "@/components/checkout/ClearCartOnConfirmation";
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
import { getViewer } from "@/lib/auth/session";
import { resolveOrderToken } from "@/lib/checkout/order-access";
import { describePaymentStatus } from "@/lib/checkout/payment-status";
import { fetchOrderStatus } from "@/lib/checkout/queries";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { formatDateTime } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Order status",
    canonicalPath: "/checkout/success",
    noindex: true,
  });
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

const ICONS = {
  confirmed: CheckCircle2,
  authorized: CheckCircle2,
  processing: Clock,
  failed: TriangleAlert,
  refunded: CreditCard,
} as const;

const TONES = {
  confirmed: "bg-success-tint text-success",
  authorized: "bg-info-tint text-info",
  processing: "bg-warning-tint text-warning",
  failed: "bg-danger-tint text-danger",
  refunded: "bg-warning-tint text-warning",
} as const;

/**
 * Checkout return page.
 *
 * THE PAYMENT STATUS IS READ FROM THE SERVER, ALWAYS. It calls
 * `GET /orders/by-number/{orderNumber}?token=` and renders whatever
 * `paymentStatus` comes back. A redirect query parameter is never treated as
 * evidence of payment: `?redirect_status=succeeded` from a provider is ignored
 * entirely, and `unpaid` is presented as "not confirmed yet" with a refresh
 * affordance, not as a receipt.
 *
 * The cart is cleared only once the server reports a status other than
 * `unpaid`/`failed`.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  const params = await searchParams;
  const orderNumber = first(params.order).trim();
  const queryToken = first(params.token).trim() || null;

  const config = await getRuntimeConfig();
  const viewer = await getViewer();

  if (!orderNumber) {
    return (
      <div className="page-container py-10">
        <div className="mx-auto max-w-xl">
          <ErrorState
            title="We do not know which order to show"
            message="This link is missing the order number, so we cannot look up its status."
            action={
              <Button asChild variant="secondary">
                <Link href={viewer ? "/account/orders" : "/"}>
                  {viewer ? "See your orders" : "Back to the store"}
                </Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  // The guest token comes from the HttpOnly cookie written at initialize; a
  // `?token=` value is honoured as a fallback (the contract defines it).
  const token = await resolveOrderToken(orderNumber, queryToken);
  const { data: order, error } = await fetchOrderStatus(orderNumber, {
    token,
    auth: Boolean(viewer),
  });

  if (!order) {
    return (
      <div className="page-container py-10">
        <div className="mx-auto max-w-xl space-y-4">
          <ErrorState
            title="We could not confirm this order"
            message={
              error?.isNotFound()
                ? "We could not find that order with the details in this link. If you have an account, your orders are listed there."
                : (error?.message ?? null)
            }
            unreachable={error?.isUnreachable() ?? false}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/checkout/success?order=${encodeURIComponent(orderNumber)}`}>
                    Check again
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href={viewer ? "/account/orders" : "/login?next=%2Faccount%2Forders"}>
                    {viewer ? "See your orders" : "Sign in to see your orders"}
                  </Link>
                </Button>
              </div>
            }
          />
          <p className="text-center text-xs text-ink-muted">
            We have not changed your cart, because we could not verify this order&rsquo;s payment
            status.
          </p>
        </div>
      </div>
    );
  }

  const outcome = describePaymentStatus(order.paymentStatus);
  const Icon = ICONS[outcome.outcome];
  const placed = formatDateTime(order.placedAt, {
    locale: config.locale.locale,
    timeZone: config.locale.timezone,
  });

  return (
    <div className="page-container py-8 sm:py-10">
      {/* Only a server-confirmed, non-unpaid status may empty the cart. */}
      <ClearCartOnConfirmation confirmed={outcome.mayClearCart} />

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="surface-card flex flex-col items-center p-6 text-center">
          <span
            className={`mb-4 inline-flex size-12 items-center justify-center rounded-full ${TONES[outcome.outcome]}`}
          >
            <Icon className="size-6" aria-hidden="true" />
          </span>

          <h1 className="text-xl font-semibold text-ink sm:text-2xl">{outcome.title}</h1>
          <p className="mt-2 max-w-md text-sm text-ink-muted">{outcome.description}</p>

          <p className="mt-4 text-sm text-ink">
            Order <span className="font-semibold">{order.orderNumber}</span>
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>

          {placed ? <p className="mt-2 text-xs text-ink-muted">Placed {placed}</p> : null}

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {outcome.showRefresh ? (
              <Button asChild variant="secondary">
                <Link
                  href={`/checkout/success?order=${encodeURIComponent(orderNumber)}${
                    queryToken ? `&token=${encodeURIComponent(queryToken)}` : ""
                  }`}
                >
                  Refresh status
                </Link>
              </Button>
            ) : null}

            {outcome.canRetry ? (
              <Button asChild>
                <Link href="/cart">Review cart and try again</Link>
              </Button>
            ) : null}

            {viewer ? (
              <Button asChild variant="ghost">
                <Link href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}>
                  View in your account
                </Link>
              </Button>
            ) : null}

            <Button asChild variant="ghost">
              <Link href="/shop">Continue shopping</Link>
            </Button>
          </div>
        </div>

        {outcome.outcome === "processing" ? (
          <Alert tone="warning" title="Why does this say not confirmed?">
            Payment confirmations arrive from the payment provider, not from your browser, so we
            only show an order as paid once that confirmation has reached us. If you completed a
            payment, refresh in a moment. Do not pay twice - check your order status first.
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
              <CardTitle>Totals</CardTitle>
            </CardHeader>
            <CardBody>
              <OrderTotalsList totals={order.totals} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <AddressBlock address={order.shippingAddress} locale={config.locale.locale} />
              <TrackingBlock tracking={order.tracking} />
            </CardBody>
          </Card>
        </div>

        {!viewer ? (
          <p className="text-center text-xs text-ink-muted">
            Keep this page&rsquo;s link to check your order again, or{" "}
            <Link
              href="/register"
              className="font-medium text-brand underline-offset-2 hover:underline"
            >
              create an account
            </Link>{" "}
            with this email address to see it in your order history.
          </p>
        ) : null}
      </div>
    </div>
  );
}
