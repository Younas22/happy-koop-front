import { Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { fetchAccountOrders } from "@/lib/account/queries";
import { requireViewer } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { formatDate } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Orders",
    canonicalPath: "/account/orders",
    noindex: true,
  });
}

function pageNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AccountOrdersPage({ searchParams }: PageProps<"/account/orders">) {
  await requireViewer("/account/orders");
  const config = await getRuntimeConfig();
  const params = await searchParams;
  const page = pageNumber(params.page);

  const { data, error } = await fetchAccountOrders({ page, perPage: 10 });

  if (error) {
    return (
      <ErrorState
        title="We could not load your orders"
        message={error.message}
        unreachable={error.isUnreachable()}
        action={
          <Button asChild variant="secondary">
            <Link href="/account/orders">Try again</Link>
          </Button>
        }
      />
    );
  }

  const orders = data?.data ?? [];

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={page > 1 ? "No orders on this page" : "No orders yet"}
        description={
          page > 1
            ? "Go back to the first page to see your orders."
            : "Once you place an order it will appear here with its status and totals."
        }
        action={
          <Button asChild>
            <Link href={page > 1 ? "/account/orders" : "/shop"}>
              {page > 1 ? "Back to first page" : "Browse the shop"}
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.orderNumber} className="surface-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                  className="text-sm font-semibold text-ink hover:underline"
                >
                  {order.orderNumber}
                </Link>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {formatDate(order.placedAt ?? order.createdAt, {
                    locale: config.locale.locale,
                    timeZone: config.locale.timezone,
                  }) ?? "Date not recorded"}
                  {" · "}
                  {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                </p>
              </div>

              <p className="text-sm font-semibold text-ink tabular-nums">
                {formatMoney(order.total)}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>

            <div className="mt-3">
              <Button asChild variant="secondary" size="sm">
                <Link href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}>
                  View order
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {data ? (
        <Pagination
          meta={data.meta}
          buildHref={(target) => (target <= 1 ? "/account/orders" : `/account/orders?page=${target}`)}
        />
      ) : null}
    </div>
  );
}
