"use client";

import { discountPercent, formatMoney } from "@/lib/money";
import type { Money } from "@/lib/types/api";
import { useMessages } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { cn } from "@/lib/utils/cn";

export interface PriceDisplayProps {
  price: Money;
  /**
   * The backend returns this ONLY when it is strictly greater than `price` and
   * was set by an administrator (contract 4). When `null`, no struck-through
   * price and no discount percentage is shown - nothing is computed or
   * invented.
   */
  compareAtPrice?: Money | null;
  size?: "sm" | "md" | "lg" | "xl";
  /** Shows the saving as a percentage badge. Only from real values. */
  showDiscount?: boolean;
  className?: string;
}

const priceSizes = {
  sm: "text-title-sm",
  md: "text-title-md",
  lg: "text-title-lg",
  xl: "text-headline-sm sm:text-headline-md",
} as const;

const compareSizes = {
  sm: "text-body-sm",
  md: "text-body-md",
  lg: "text-body-md",
  xl: "text-body-lg",
} as const;

/**
 * Price.
 *
 * Always renders the server-formatted string. The compare-at price appears
 * only when the backend supplied one, and the percentage is derived from the
 * two real integer amounts - never fabricated.
 */
export function PriceDisplay({
  price,
  compareAtPrice = null,
  size = "md",
  showDiscount = true,
  className,
}: PriceDisplayProps) {
  const { price: t } = useMessages();
  const percent = discountPercent(price, compareAtPrice);
  const hasCompare = compareAtPrice !== null && percent !== null;

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("text-ink tabular-nums", priceSizes[size])}>{formatMoney(price)}</span>

      {hasCompare ? (
        <>
          <span className={cn("text-ink-subtle line-through tabular-nums", compareSizes[size])}>
            {formatMoney(compareAtPrice)}
          </span>
          <span className="sr-only">
            {fmt(t.reduced, { from: formatMoney(compareAtPrice), to: formatMoney(price) })}
          </span>
          {showDiscount ? (
            <span
              className={cn(
                "rounded-sm bg-success-tint px-1.5 py-0.5 text-label-sm font-semibold text-success",
              )}
            >
              &minus;{percent}%
            </span>
          ) : null}
        </>
      ) : null}
    </span>
  );
}
