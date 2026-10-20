"use client";

import { ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CartChangeNotices } from "@/components/cart/CartChangeNotices";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCartStore } from "@/lib/cart/store";
import { useCartValidation } from "@/lib/cart/use-cart-validation";
import { NOT_CALCULATED_LABEL, displayOrNotCalculated, formatMoney } from "@/lib/money";

/**
 * Editable cart.
 *
 * On mount it calls `POST /cart/validate` and REPLACES local state with the
 * server response, so the displayed cart is always the server's cart.
 * `removedItems` and `adjustments` are surfaced explicitly, and `null`
 * shipping/tax render as "Calculated at checkout" - never as $0.00.
 *
 * The summary button points at `/checkout`, which is implemented: it
 * re-validates the cart on entry, loads real shipping options per destination
 * and only offers a payment provider that runtime config says is enabled.
 */
export function CartView({ guestCheckoutEnabled }: { guestCheckoutEnabled: boolean }) {
  const lines = useCartStore((state) => state.lines);
  const hydrated = useCartStore((state) => state.hydrated);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);

  const { validation, validating, error, revalidate } = useCartValidation();

  if (!hydrated) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Items you add will be saved here while you browse."
        action={
          <Button asChild>
            <Link href="/shop">Browse the shop</Link>
          </Button>
        }
      />
    );
  }

  const items = validation?.items ?? [];
  const totals = validation?.totals ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
      <div className="min-w-0 space-y-4">
        {error ? (
          <Alert
            tone="danger"
            live
            title="We could not check your cart"
          >
            {error}{" "}
            <button
              type="button"
              onClick={revalidate}
              className="font-medium text-brand underline hover:no-underline"
            >
              Try again
            </button>
          </Alert>
        ) : null}

        <CartChangeNotices validation={validation} />

        {items.length === 0 && !error ? (
          <div className="space-y-3" aria-hidden="true">
            {lines.map((line) => (
              <Skeleton key={`${line.productId}:${line.variantId ?? ""}`} className="h-28" />
            ))}
          </div>
        ) : null}

        {items.length > 0 ? (
          <ul className="surface-card divide-y divide-line">
            {items.map((item) => (
              <li key={item.key} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                <Link
                  href={`/product/${item.slug}`}
                  className="relative size-20 shrink-0 overflow-hidden rounded-md border border-line bg-sunken sm:size-24"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : null}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.slug}`}
                    className="text-sm font-medium text-ink hover:underline"
                  >
                    {item.name}
                  </Link>
                  {item.variantLabel ? (
                    <p className="mt-0.5 text-xs text-ink-muted">{item.variantLabel}</p>
                  ) : null}
                  {item.sku ? <p className="text-xs text-ink-subtle">SKU {item.sku}</p> : null}

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <QuantityStepper
                      value={item.quantity}
                      max={item.maxQuantity}
                      disabled={validating}
                      label={`Quantity for ${item.name}`}
                      onChange={(next) => updateQuantity(item.productId, item.variantId, next)}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="tap-target inline-flex items-center gap-1.5 rounded-md px-2 text-sm text-ink-muted transition-colors hover:bg-sunken hover:text-danger"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  </div>

                  {item.issues.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {item.issues.map((issue) => (
                        <li key={issue.code} className="text-xs text-warning">
                          {issue.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-ink tabular-nums">
                    {formatMoney(item.lineTotal)}
                  </p>
                  {item.quantity > 1 ? (
                    <p className="mt-0.5 text-xs text-ink-muted tabular-nums">
                      {formatMoney(item.unitPrice)} each
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/shop">Continue shopping</Link>
            </Button>
            <Button variant="ghost" onClick={clear}>
              Clear cart
            </Button>
          </div>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-22 lg:self-start">
        <div className="surface-card p-4">
          <h2 className="text-base font-semibold text-ink">Order summary</h2>

          {totals ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="font-medium text-ink tabular-nums">
                  {formatMoney(totals.subtotal)}
                </dd>
              </div>

              {totals.discount.amount > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">
                    Discount
                    {validation?.coupon ? (
                      <span className="ml-1 text-xs text-ink-subtle">
                        ({validation.coupon.code})
                      </span>
                    ) : null}
                  </dt>
                  <dd className="font-medium text-success tabular-nums">
                    &minus;{formatMoney(totals.discount)}
                  </dd>
                </div>
              ) : null}

              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Shipping</dt>
                <dd
                  className={
                    totals.shipping === null
                      ? "text-right text-ink-muted"
                      : "font-medium text-ink tabular-nums"
                  }
                >
                  {displayOrNotCalculated(totals.shipping)}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Tax</dt>
                <dd
                  className={
                    totals.tax === null
                      ? "text-right text-ink-muted"
                      : "font-medium text-ink tabular-nums"
                  }
                >
                  {displayOrNotCalculated(totals.tax)}
                </dd>
              </div>

              <div className="flex justify-between gap-4 border-t border-line pt-2">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="text-base font-semibold text-ink tabular-nums">
                  {formatMoney(totals.total)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">
              {error ? "Totals are unavailable right now." : "Checking prices…"}
            </p>
          )}

          {totals && (totals.shipping === null || totals.tax === null) ? (
            <p className="mt-3 text-xs text-ink-subtle">
              Shipping and tax show as &ldquo;{NOT_CALCULATED_LABEL}&rdquo; until a delivery
              address and method are chosen.
            </p>
          ) : null}

          <Button asChild block size="lg" className="mt-4" disabled={items.length === 0}>
            <Link href="/checkout">Checkout</Link>
          </Button>

          {!guestCheckoutEnabled ? (
            <p className="mt-2 text-xs text-ink-muted">
              You will need to sign in to complete your order.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
