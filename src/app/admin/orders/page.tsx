import type { Metadata } from "next";
import Link from "next/link";

import { bulkDeleteOrdersAction } from "@/app/admin/actions";
import {
  AdminError,
  AdminPageHeader,
  AdminTableWrap,
  Td,
  Th,
} from "@/components/admin/AdminParts";
import {
  BulkActionBar,
  BulkDeleteButton,
  BulkSelectAll,
  BulkSelection,
  BulkSelectRow,
} from "@/components/admin/BulkSelection";
import {
  DeleteOrderButton,
  ORDER_DELETE_DESCRIPTION,
  OrderBulkStatus,
} from "@/components/admin/OrderBulkActions";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { fetchAdminOrders } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { getRuntimeConfig } from "@/lib/runtime-config";
import type { OrderStatus, PaymentStatus } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/datetime";
import { buildPageMetadata } from "@/lib/utils/seo";
import { buildQuery } from "@/lib/utils/url";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Orders",
    canonicalPath: "/admin/orders",
    noindex: true,
  });
}

const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "unpaid",
  "authorized",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
  "cancelled",
];

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

const selectClass =
  "h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink";

export default async function AdminOrdersPage({
  searchParams,
}: PageProps<"/admin/orders">) {
  await requireAdmin("/admin/orders");
  const config = await getRuntimeConfig();
  const params = await searchParams;

  const q = one(params.q).trim();
  const statusRaw = one(params.status);
  const status = (ORDER_STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as OrderStatus)
    : null;
  const paymentRaw = one(params.payment_status);
  const paymentStatus = (PAYMENT_STATUSES as readonly string[]).includes(
    paymentRaw,
  )
    ? (paymentRaw as PaymentStatus)
    : null;
  const from = one(params.from).trim() || null;
  const to = one(params.to).trim() || null;
  const pageParam = Number.parseInt(one(params.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data, error } = await fetchAdminOrders({
    q: q || null,
    status,
    paymentStatus,
    from,
    to,
    page,
    perPage: 25,
  });

  const buildHref = (overrides: Record<string, string | number | null>) =>
    `/admin/orders${buildQuery({
      q: q || null,
      status,
      payment_status: paymentStatus,
      from,
      to,
      ...overrides,
    })}`;

  const dateOptions = {
    locale: config.locale.locale,
    timeZone: config.locale.timezone,
  };

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Every order, with its authoritative status."
      />

      <form
        method="get"
        action="/admin/orders"
        className="surface-card mb-4 grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <label
            htmlFor="order-q"
            className="mb-1 block text-xs font-medium text-ink-muted"
          >
            Search order number, email or name
          </label>
          <Input
            id="order-q"
            name="q"
            defaultValue={q}
            placeholder="Search orders"
          />
        </div>

        <div>
          <label
            htmlFor="order-status"
            className="mb-1 block text-xs font-medium text-ink-muted"
          >
            Fulfilment status
          </label>
          <select
            id="order-status"
            name="status"
            defaultValue={status ?? ""}
            className={selectClass}
          >
            <option value="">Any</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="order-payment"
            className="mb-1 block text-xs font-medium text-ink-muted"
          >
            Payment status
          </label>
          <select
            id="order-payment"
            name="payment_status"
            defaultValue={paymentStatus ?? ""}
            className={selectClass}
          >
            <option value="">Any</option>
            {PAYMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="order-from"
              className="mb-1 block text-xs font-medium text-ink-muted"
            >
              From
            </label>
            <Input
              id="order-from"
              name="from"
              type="date"
              defaultValue={from ?? ""}
            />
          </div>
          <div>
            <label
              htmlFor="order-to"
              className="mb-1 block text-xs font-medium text-ink-muted"
            >
              To
            </label>
            <Input
              id="order-to"
              name="to"
              type="date"
              defaultValue={to ?? ""}
            />
          </div>
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/orders">Clear</Link>
          </Button>
        </div>
      </form>

      {error ? (
        <AdminError error={error} />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title="No orders match"
          description={
            q || status || paymentStatus || from || to
              ? "Try widening the filters."
              : "Orders will appear here once customers start checking out."
          }
        />
      ) : (
        <BulkSelection ids={(data?.data ?? []).map((order) => order.id)}>
          <BulkActionBar>
            <OrderBulkStatus />
            <BulkDeleteButton
              action={bulkDeleteOrdersAction}
              singular="order"
              plural="orders"
              description={ORDER_DELETE_DESCRIPTION}
            />
          </BulkActionBar>
          <AdminTableWrap>
            <thead>
              <tr>
                <Th className="w-10">
                  <BulkSelectAll />
                </Th>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Placed</Th>
                <Th>Status</Th>
                <Th>Payment</Th>
                <Th className="text-right">Total</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((order) => (
                <tr key={order.id}>
                  <Td>
                    <BulkSelectRow
                      id={order.id}
                      label={`Select order ${order.orderNumber}`}
                    />
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <span className="block text-xs text-ink-muted">
                      {order.itemCount}{" "}
                      {order.itemCount === 1 ? "item" : "items"}
                      {order.paymentProvider
                        ? ` · ${order.paymentProvider}`
                        : ""}
                    </span>
                  </Td>
                  <Td className="break-words">{order.email ?? "-"}</Td>
                  <Td>
                    {formatDate(
                      order.placedAt ?? order.createdAt,
                      dateOptions,
                    ) ?? "Not recorded"}
                  </Td>
                  <Td>
                    <OrderStatusBadge status={order.status} />
                  </Td>
                  <Td>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </Td>
                  <Td className="text-right tabular-nums">
                    {formatMoney(order.total)}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/orders/${order.id}`}>Open</Link>
                      </Button>
                      <DeleteOrderButton
                        id={order.id}
                        orderNumber={order.orderNumber}
                        size="sm"
                      />
                    </div>
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
                buildHref({ page: target <= 1 ? null : target })
              }
            />
          ) : null}
        </BulkSelection>
      )}
    </>
  );
}
