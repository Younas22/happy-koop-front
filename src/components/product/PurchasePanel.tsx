"use client";

import { Check, ShoppingBag } from "lucide-react";
import { Link } from "@/i18n/Link";
import * as React from "react";

import { AvailabilityPill } from "@/components/product/AvailabilityPill";
import { ProductGallery } from "@/components/product/ProductGallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Rating } from "@/components/ui/Rating";
import { useMessages } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { useCartStore } from "@/lib/cart/store";
import {
  defaultSelection,
  maxSelectableQuantity,
  resolvePurchaseState,
  type VariantSelection,
} from "@/lib/product/variants";
import type { ProductDetail } from "@/lib/types/api";

export interface PurchasePanelProps {
  product: ProductDetail;
  /** `features.publicStockCounts` from runtime config. */
  showStockCounts: boolean;
  /** Short delivery/returns reassurance, assembled from configured text only. */
  reassurance: string[];
}

/**
 * Above-the-fold purchase experience: gallery, title, price, availability,
 * variant selection, quantity and Add to Cart - plus a compact sticky mobile
 * bar.
 *
 * Variant resolution follows the contract exactly: the selected variant is the
 * one whose `optionValueIds` SET matches the selection. When a complete
 * selection matches no variant, Add to Cart is disabled with an explicit
 * message instead of silently using another variant's price.
 */
export function PurchasePanel({ product, showStockCounts, reassurance }: PurchasePanelProps) {
  const t = useMessages().product;
  const [selection, setSelection] = React.useState<VariantSelection>(() =>
    defaultSelection(product),
  );
  const [requestedQuantity, setRequestedQuantity] = React.useState(1);
  const [justAdded, setJustAdded] = React.useState(false);

  const addItem = useCartStore((state) => state.addItem);

  const purchase = React.useMemo(
    () => resolvePurchaseState(product, selection),
    [product, selection],
  );

  const maxQuantity = maxSelectableQuantity(purchase.availability);

  /**
   * The effective quantity, clamped to the variant's real tracked stock. This
   * is derived rather than written back into state, so switching to a variant
   * with less stock cannot leave a stale higher number in the stepper.
   */
  const quantity =
    maxQuantity !== null && maxQuantity > 0
      ? Math.min(requestedQuantity, maxQuantity)
      : requestedQuantity;

  function chooseValue(optionId: number, valueId: number) {
    setJustAdded(false);
    setSelection((current) => ({ ...current, [optionId]: valueId }));
  }

  function addToCart() {
    if (!purchase.canAddToCart) return;
    addItem(product.id, purchase.variant?.id ?? null, quantity);
    setJustAdded(true);
  }

  const outOfStock = purchase.selectionComplete && !purchase.availability.inStock;

  const disabledReason = (() => {
    if (purchase.combinationUnavailable) {
      return t.combinationUnavailable;
    }
    if (!purchase.selectionComplete) {
      return t.chooseOption;
    }
    if (outOfStock) {
      return purchase.availability.state === "unavailable" ? t.notAvailable : t.outOfStock;
    }
    return null;
  })();

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <ProductGallery
          media={product.media}
          productName={product.name}
          activeMediaId={purchase.mediaId}
        />

        <div className="space-y-5">
          <div className="space-y-2">
            {product.brand ? (
              <p className="label-eyebrow">
                {product.brand}
              </p>
            ) : null}
            <h1 className="text-headline-md text-ink sm:text-headline-lg">{product.name}</h1>
            {product.shortDescription ? (
              <p className="text-body-lg text-ink-muted">{product.shortDescription}</p>
            ) : null}
            {/* Nothing is rendered when there are no approved reviews. */}
            <Rating rating={product.rating} href="#reviews" />
          </div>

          <div className="space-y-2">
            <PriceDisplay
              price={purchase.price}
              compareAtPrice={purchase.compareAtPrice}
              size="xl"
            />
            <AvailabilityPill
              availability={purchase.availability}
              showStockCount={showStockCounts}
            />
            {purchase.sku ? (
              <p className="text-body-sm text-ink-subtle">{fmt(t.sku, { sku: purchase.sku })}</p>
            ) : null}
          </div>

          {product.options.length > 0 ? (
            <VariantSelector
              options={product.options}
              variants={product.variants}
              selection={selection}
              onChange={chooseValue}
            />
          ) : null}

          {purchase.combinationUnavailable ? (
            <Alert tone="warning" live>
              {t.combinationAlert}
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper
              value={quantity}
              onChange={(next) => {
                setJustAdded(false);
                setRequestedQuantity(next);
              }}
              max={maxQuantity}
              disabled={!purchase.canAddToCart}
              label={fmt(t.quantityFor, { name: product.name })}
            />
            <Button
              size="lg"
              onClick={addToCart}
              disabled={!purchase.canAddToCart}
              className="min-w-44 flex-1 sm:flex-none"
            >
              {justAdded ? (
                <>
                  <Check className="size-4.5" aria-hidden="true" />
                  {t.addedToCart}
                </>
              ) : (
                <>
                  <ShoppingBag className="size-4.5" aria-hidden="true" />
                  {t.addToCart}
                </>
              )}
            </Button>
          </div>

          <div aria-live="polite" className="min-h-0">
            {disabledReason ? <p className="text-body-md text-ink-muted">{disabledReason}</p> : null}
            {justAdded ? (
              <p className="text-body-md text-ink-muted">
                {t.addedNotice}{" "}
                <Link href="/cart" className="font-medium text-brand hover:underline">
                  {t.viewCart}
                </Link>
              </p>
            ) : null}
          </div>

          {reassurance.length > 0 ? (
            <ul className="space-y-2 border-t border-line pt-5 text-body-md text-ink-muted">
              {reassurance.map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Compact sticky bar, mobile only. `sticky` inside normal flow means it
          cannot overlap the footer, and it holds no focusable trap: the single
          button is the same action as above. */}
      <div className="bottom-nav-bar sticky z-30 -mx-4 mt-6 border-t border-line bg-surface-container/95 px-4 py-3 backdrop-blur-md elevation-2 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <PriceDisplay
              price={purchase.price}
              compareAtPrice={purchase.compareAtPrice}
              size="md"
              showDiscount={false}
            />
          </div>
          <Button onClick={addToCart} disabled={!purchase.canAddToCart} className="shrink-0">
            {justAdded ? t.added : t.addToCart}
          </Button>
        </div>
      </div>
    </>
  );
}
