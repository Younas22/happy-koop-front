"use client";

import { Check, ShoppingBag } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { AvailabilityPill } from "@/components/product/AvailabilityPill";
import { ProductGallery } from "@/components/product/ProductGallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Rating } from "@/components/ui/Rating";
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
      return "That combination is not available. Choose a different option.";
    }
    if (!purchase.selectionComplete) {
      return "Choose an option to continue.";
    }
    if (outOfStock) {
      return purchase.availability.state === "unavailable"
        ? "This item is not available to buy."
        : "This item is currently out of stock.";
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
              <p className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                {product.brand}
              </p>
            ) : null}
            <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{product.name}</h1>
            {product.shortDescription ? (
              <p className="text-base text-ink-muted">{product.shortDescription}</p>
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
              <p className="text-xs text-ink-subtle">SKU {purchase.sku}</p>
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
              That combination is not available. Pick a different option to continue.
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
              label={`Quantity for ${product.name}`}
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
                  Added to cart
                </>
              ) : (
                <>
                  <ShoppingBag className="size-4.5" aria-hidden="true" />
                  Add to cart
                </>
              )}
            </Button>
          </div>

          <div aria-live="polite" className="min-h-0">
            {disabledReason ? <p className="text-sm text-ink-muted">{disabledReason}</p> : null}
            {justAdded ? (
              <p className="text-sm text-ink-muted">
                Added to your cart.{" "}
                <Link href="/cart" className="font-medium text-brand hover:underline">
                  View cart
                </Link>
              </p>
            ) : null}
          </div>

          {reassurance.length > 0 ? (
            <ul className="space-y-1.5 border-t border-line pt-4 text-sm text-ink-muted">
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
      <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-line bg-surface/95 px-4 py-2.5 backdrop-blur-sm lg:hidden">
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
            {justAdded ? "Added" : "Add to cart"}
          </Button>
        </div>
      </div>
    </>
  );
}
