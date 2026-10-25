"use client";

import Image from "next/image";
import { Link } from "@/i18n/Link";

import type { Address, OrderItem, OrderTotals, OrderTracking } from "@/lib/types/api";
import { countryName } from "@/lib/geo/countries";
import { useMessages } from "@/i18n/client";
import { fmt } from "@/i18n/format";
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
  const t = useMessages().orders;
  if (items.length === 0) {
    return <p className="text-body-md text-ink-muted">{t.noItems}</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 py-3 sm:gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-line bg-surface-container">
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            {item.slug ? (
              <Link
                href={`/product/${item.slug}`}
                className="text-label-lg text-ink hover:underline"
              >
                {item.name}
              </Link>
            ) : (
              <p className="text-label-lg text-ink">{item.name}</p>
            )}

            {item.variantLabel ? (
              <p className="mt-0.5 text-body-sm text-ink-muted">{item.variantLabel}</p>
            ) : null}

            {item.options.length > 0 ? (
              <p className="mt-0.5 text-body-sm text-ink-muted">{item.options.join(" · ")}</p>
            ) : null}

            {item.sku ? <p className="text-body-sm text-ink-subtle">{fmt(t.sku, { sku: item.sku })}</p> : null}

            <p className="mt-1 text-body-sm text-ink-muted tabular-nums">
              {item.quantity} × {formatMoney(item.unitPrice)}
            </p>
          </div>

          <p className="shrink-0 text-title-sm text-ink tabular-nums">
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
              ? "text-title-md text-ink tabular-nums"
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
  const m = useMessages();
  const t = m.orders;
  return (
    <dl className="space-y-2 text-body-md">
      <Row label={t.subtotal} value={formatMoney(totals.subtotal)} />

      {totals.discount.amount > 0 ? (
        <Row
          label={couponCode ? fmt(t.discountWith, { code: couponCode }) : t.discount}
          value={`-${formatMoney(totals.discount)}`}
        />
      ) : null}

      <Row
        label={t.shipping}
        value={displayOrNotCalculated(totals.shipping, m.common.calculatedAtCheckout)}
        muted={totals.shipping === null}
      />
      <Row
        label={t.tax}
        value={displayOrNotCalculated(totals.tax, m.common.calculatedAtCheckout)}
        muted={totals.tax === null}
      />

      <div className="border-t border-line pt-2">
        <Row label={t.total} value={formatMoney(totals.total)} strong />
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
    return <p className="text-body-md text-ink-muted">No address on record.</p>;
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
    <address className="text-body-md leading-6 text-ink-muted not-italic">
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
  const t = useMessages().orders;
  if (!tracking) return null;
  const { carrier, trackingNumber, trackingUrl } = tracking;
  if (!carrier && !trackingNumber && !trackingUrl) return null;

  return (
    <div className="text-body-md text-ink-muted">
      {carrier ? (
        <p>
          {t.carrier} <span className="text-ink">{carrier}</span>
        </p>
      ) : null}
      {trackingNumber ? (
        <p>
          {t.trackingNumber} <span className="text-ink tabular-nums">{trackingNumber}</span>
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
            {t.track}
          </a>
        </p>
      ) : null}
    </div>
  );
}
