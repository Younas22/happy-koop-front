import Image from "next/image";
import Link from "next/link";

import type { Address, OrderItem, OrderTotals, OrderTracking } from "@/lib/types/api";
import { countryName } from "@/lib/geo/countries";
import { displayOrNotCalculated, formatMoney } from "@/lib/money";

/**
 * Shared order rendering: item snapshots, totals, address and tracking.
 *
 * Item rows show the SNAPSHOT frozen at checkout (name, sku, options, unit
 * price) rather than the product's current data, so an order always reflects
 * what was bought (contract 5).
 *
 * `shipping`/`tax` of `null` mean "not determined" and render as
 * "Calculated at checkout" - never as a zero amount.
 */

export function OrderItemList({ items }: { items: readonly OrderItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">This order has no line items on record.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 py-3 sm:gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-line bg-sunken">
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            {item.slug ? (
              <Link
                href={`/product/${item.slug}`}
                className="text-sm font-medium text-ink hover:underline"
              >
                {item.name}
              </Link>
            ) : (
              <p className="text-sm font-medium text-ink">{item.name}</p>
            )}

            {item.variantLabel ? (
              <p className="mt-0.5 text-xs text-ink-muted">{item.variantLabel}</p>
            ) : null}

            {item.options.length > 0 ? (
              <p className="mt-0.5 text-xs text-ink-muted">{item.options.join(" · ")}</p>
            ) : null}

            {item.sku ? <p className="text-xs text-ink-subtle">SKU {item.sku}</p> : null}

            <p className="mt-1 text-xs text-ink-muted tabular-nums">
              {item.quantity} × {formatMoney(item.unitPrice)}
            </p>
          </div>

          <p className="shrink-0 text-sm font-semibold text-ink tabular-nums">
            {formatMoney(item.lineTotal)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Row({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? "font-semibold text-ink" : "text-ink-muted"}>{label}</dt>
      <dd
        className={
          muted
            ? "text-right text-ink-muted"
            : strong
              ? "text-base font-semibold text-ink tabular-nums"
              : "font-medium text-ink tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}

export function OrderTotalsList({
  totals,
  couponCode,
}: {
  totals: OrderTotals;
  couponCode?: string | null;
}) {
  return (
    <dl className="space-y-2 text-sm">
      <Row label="Subtotal" value={formatMoney(totals.subtotal)} />

      {totals.discount.amount > 0 ? (
        <Row
          label={couponCode ? `Discount (${couponCode})` : "Discount"}
          value={`-${formatMoney(totals.discount)}`}
        />
      ) : null}

      <Row
        label="Shipping"
        value={displayOrNotCalculated(totals.shipping)}
        muted={totals.shipping === null}
      />
      <Row label="Tax" value={displayOrNotCalculated(totals.tax)} muted={totals.tax === null} />

      <div className="border-t border-line pt-2">
        <Row label="Total" value={formatMoney(totals.total)} strong />
      </div>
    </dl>
  );
}

export function AddressBlock({
  address,
  locale = "en-US",
}: {
  address: Address | null;
  locale?: string;
}) {
  if (!address) {
    return <p className="text-sm text-ink-muted">No address on record.</p>;
  }

  const lines = [
    `${address.firstName} ${address.lastName}`.trim(),
    address.company,
    address.line1,
    address.line2,
    [address.city, address.region, address.postalCode].filter(Boolean).join(", "),
    countryName(address.countryCode, locale),
  ].filter((line): line is string => Boolean(line && line.length > 0));

  return (
    <address className="text-sm leading-6 text-ink-muted not-italic">
      {lines.map((line, index) => (
        <span key={`${line}-${index}`} className="block">
          {line}
        </span>
      ))}
      {address.phone ? <span className="block">{address.phone}</span> : null}
    </address>
  );
}

/**
 * Tracking details, shown only when an administrator actually recorded them.
 * No estimated delivery date is ever invented.
 */
export function TrackingBlock({ tracking }: { tracking: OrderTracking | null }) {
  if (!tracking) return null;
  const { carrier, trackingNumber, trackingUrl } = tracking;
  if (!carrier && !trackingNumber && !trackingUrl) return null;

  return (
    <div className="text-sm text-ink-muted">
      {carrier ? (
        <p>
          Carrier: <span className="text-ink">{carrier}</span>
        </p>
      ) : null}
      {trackingNumber ? (
        <p>
          Tracking number: <span className="text-ink tabular-nums">{trackingNumber}</span>
        </p>
      ) : null}
      {trackingUrl ? (
        <p className="mt-1">
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="font-medium text-brand underline-offset-2 hover:underline"
          >
            Track this shipment
          </a>
        </p>
      ) : null}
    </div>
  );
}
