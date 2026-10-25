"use client";

import { ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { CartChangeNotices } from "@/components/cart/CartChangeNotices";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/Drawer";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMessages } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { Link } from "@/i18n/Link";
import { displayOrNotCalculated, formatMoney } from "@/lib/money";
import { useCartStore } from "@/lib/cart/store";
import { useCartValidation } from "@/lib/cart/use-cart-validation";

export interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Cart sheet.
 *
 * Every price shown here is a server value from the latest
 * `POST /cart/validate`. Nothing is computed in the browser, and `null`
 * shipping/tax renders as "Calculated at checkout" rather than a zero amount.
 */
export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const m = useMessages();
  const t = m.cartDrawer;
  const lines = useCartStore((state) => state.lines);
  const hydrated = useCartStore((state) => state.hydrated);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const { validation, validating, error } = useCartValidation({ enabled: open });

  const isEmpty = hydrated && lines.length === 0;
  const items = validation?.items ?? [];
  const awaitingFirstLoad = !isEmpty && items.length === 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" aria-describedby={undefined}>
        <DrawerHeader>
          <DrawerTitle className="text-title-md text-ink">{t.title}</DrawerTitle>
        </DrawerHeader>

        <DrawerBody>
          {isEmpty ? (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-surface-container">
                <ShoppingBag className="size-5.5 text-ink-subtle" aria-hidden="true" />
              </span>
              <p className="text-label-lg text-ink">{t.emptyTitle}</p>
              <p className="mt-1 text-body-md text-ink-muted">{t.emptyBody}</p>
              <Button asChild variant="secondary" className="mt-5">
                <Link href="/shop" onClick={() => onOpenChange(false)}>
                  {m.common.browseShop}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {error ? (
                <Alert tone="danger" live>
                  {error}
                </Alert>
              ) : null}

              <CartChangeNotices validation={validation} />

              {awaitingFirstLoad && !error ? (
                <ul className="space-y-3">
                  {lines.map((line) => (
                    <li
                      key={`${line.productId}:${line.variantId ?? ""}`}
                      className="flex gap-3"
                    >
                      <Skeleton shape="block" className="size-18 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {items.length > 0 ? (
                <ul className="divide-y divide-line">
                  {items.map((item) => (
                    <li key={item.key} className="flex gap-3 py-3 first:pt-0">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="relative size-18 shrink-0 overflow-hidden rounded-md border border-line bg-surface-container"
                      >
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            sizes="72px"
                            className="object-cover"
                          />
                        ) : null}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={() => onOpenChange(false)}
                          className="block truncate text-label-lg text-ink hover:underline"
                        >
                          {item.name}
                        </Link>
                        {item.variantLabel ? (
                          <p className="mt-0.5 truncate text-body-sm text-ink-muted">{item.variantLabel}</p>
                        ) : null}

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <QuantityStepper
                            value={item.quantity}
                            max={item.maxQuantity}
                            disabled={validating}
                            label={fmt(t.quantityFor, { name: item.name })}
                            onChange={(next) => updateQuantity(item.productId, item.variantId, next)}
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="state-layer tap-target inline-flex items-center justify-center rounded-full text-ink-muted transition-colors hover:text-danger"
                            aria-label={fmt(t.removeItem, { name: item.name })}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <p className="shrink-0 text-title-sm text-ink tabular-nums">
                        {formatMoney(item.lineTotal)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </DrawerBody>

        {!isEmpty ? (
          <DrawerFooter className="space-y-3">
            {validation ? (
              <dl className="space-y-1.5 text-body-md">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">{t.subtotal}</dt>
                  <dd className="font-medium text-ink tabular-nums">
                    {formatMoney(validation.totals.subtotal)}
                  </dd>
                </div>
                {validation.totals.discount.amount > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">{t.discount}</dt>
                    <dd className="font-medium text-success tabular-nums">
                      &minus;{formatMoney(validation.totals.discount)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt className="text-ink-muted">{t.shipping}</dt>
                  <dd className="text-ink-muted">
                    {displayOrNotCalculated(validation.totals.shipping, m.common.calculatedAtCheckout)}
                  </dd>
                </div>
              </dl>
            ) : null}

            <Button asChild block size="lg" disabled={items.length === 0}>
              <Link href="/cart" onClick={() => onOpenChange(false)}>
                {t.viewCart}
              </Link>
            </Button>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
