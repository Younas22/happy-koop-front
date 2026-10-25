"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { CartChangeNotices } from "@/components/cart/CartChangeNotices";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMessages } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { displayOrNotCalculated, formatMoney } from "@/lib/money";
import type { CartTotals, CartValidation, Money, ShippingOption } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

/**
 * Order summary.
 *
 * Sticky beside the form on desktop; a collapsible panel on mobile so the
 * actual checkout fields stay above the fold. Open by default on desktop and
 * collapsed on mobile via CSS, with a real `<details>`-style disclosure button
 * so it works without JavaScript layout measurement.
 *
 * Every amount shown is the server's. `shipping`/`tax` of `null` render as
 * "Calculated at checkout" - never as $0.00 - and the chosen method's price is
 * displayed from the shipping option, which is also server-provided.
 */

export interface CheckoutSummaryProps {
  validation: CartValidation | null;
  validating: boolean;
  /** The method the customer selected, for the shipping line. */
  selectedOption: ShippingOption | null;
}

function Line({
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
        className={cn(
          muted ? "text-right text-ink-muted" : "tabular-nums",
          strong ? "text-title-md text-ink" : !muted && "font-medium text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Shipping line.
 *
 * Before a method is chosen the server's `null` is honoured. Once a method is
 * chosen its own server-provided price is shown, labelled with the method, and
 * the authoritative total is still whatever the order says after initialize.
 */
function ShippingLine({
  totals,
  selectedOption,
}: {
  totals: CartTotals;
  selectedOption: ShippingOption | null;
}) {
  const m = useMessages();
  if (selectedOption) {
    return (
      <Line
        label={fmt(m.checkout.summary.shippingWith, { method: selectedOption.label })}
        value={formatMoney(selectedOption.price)}
      />
    );
  }
  return (
    <Line
      label={m.cart.shipping}
      value={displayOrNotCalculated(totals.shipping, m.common.calculatedAtCheckout)}
      muted={totals.shipping === null}
    />
  );
}

function SummaryBody({ validation, validating, selectedOption }: CheckoutSummaryProps) {
  const m = useMessages();
  const t = m.checkout.summary;
  if (!validation) {
    return (
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  const { items, totals } = validation;

  // The order total the server will charge is recomputed at initialize; until
  // then the cart total plus the selected method's price is the honest
  // estimate, so the two parts are shown separately instead of being summed
  // into a figure the server has not confirmed.
  const estimatedWithShipping: Money | null =
    selectedOption && totals.shipping === null
      ? {
          amount: totals.total.amount + selectedOption.price.amount,
          currency: totals.total.currency,
          formatted: "",
        }
      : null;

  return (
    <div className="space-y-4">
      <CartChangeNotices validation={validation} />

      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.key} className="flex gap-3 py-3 first:pt-0">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-line bg-surface-container">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-label-lg text-ink">{item.name}</p>
              {item.variantLabel ? (
                <p className="text-body-sm text-ink-muted">{item.variantLabel}</p>
              ) : null}
              <p className="mt-0.5 text-body-sm text-ink-muted tabular-nums">
                {item.quantity} × {formatMoney(item.unitPrice)}
              </p>
            </div>
            <p className="shrink-0 text-label-lg text-ink tabular-nums">
              {formatMoney(item.lineTotal)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 border-t border-line pt-3 text-body-md">
        <Line label={m.cart.subtotal} value={formatMoney(totals.subtotal)} />

        {totals.discount.amount > 0 ? (
          <Line
            label={
              validation.coupon ? fmt(t.discountWith, { code: validation.coupon.code }) : m.cart.discount
            }
            value={`-${formatMoney(totals.discount)}`}
          />
        ) : null}

        <ShippingLine totals={totals} selectedOption={selectedOption} />

        <Line
          label={m.cart.tax}
          value={displayOrNotCalculated(totals.tax, m.common.calculatedAtCheckout)}
          muted={totals.tax === null}
        />

        <div className="border-t border-line pt-2">
          <Line
            label={estimatedWithShipping ? t.totalWithShipping : m.cart.total}
            value={
              estimatedWithShipping && selectedOption
                ? `${formatMoney(totals.total)} + ${formatMoney(selectedOption.price)}`
                : formatMoney(totals.total)
            }
            strong
          />
        </div>
      </dl>

      {totals.tax === null ? (
        <p className="text-body-sm text-ink-subtle">
          {fmt(t.taxHint, { label: m.common.calculatedAtCheckout })}
        </p>
      ) : null}

      {validating ? (
        <p className="text-body-sm text-ink-muted" aria-live="polite">
          {t.checking}
        </p>
      ) : null}
    </div>
  );
}

export function CheckoutSummary(props: CheckoutSummaryProps) {
  const t = useMessages().checkout.summary;
  const [openOnMobile, setOpenOnMobile] = React.useState(false);
  const total = props.validation?.totals.total ?? null;

  return (
    <aside className="lg:sticky lg:top-22 lg:self-start" aria-label={t.label}>
      <div className="surface-card overflow-hidden">
        {/* Mobile disclosure */}
        <button
          type="button"
          onClick={() => setOpenOnMobile((open) => !open)}
          aria-expanded={openOnMobile}
          aria-controls="checkout-summary-body"
          className="tap-target flex w-full items-center justify-between gap-3 px-4 text-left lg:hidden"
        >
          <span className="text-title-sm text-ink">
            {openOnMobile ? t.hide : t.show}
          </span>
          <span className="flex items-center gap-2">
            {total ? (
              <span className="text-title-sm text-ink tabular-nums">
                {formatMoney(total)}
              </span>
            ) : null}
            <ChevronDown
              className={cn("size-4 text-ink-muted transition-transform", openOnMobile && "rotate-180")}
              aria-hidden="true"
            />
          </span>
        </button>

        <h2 className="hidden px-4 pt-4 text-title-md text-ink lg:block">{t.label}</h2>

        <div
          id="checkout-summary-body"
          className={cn("px-4 pb-4 lg:block", openOnMobile ? "block" : "hidden")}
        >
          <div className="pt-2">
            <SummaryBody {...props} />
          </div>
        </div>
      </div>
    </aside>
  );
}
