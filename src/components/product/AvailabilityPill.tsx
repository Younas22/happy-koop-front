"use client";

import { useMessages } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import type { Availability, DetailedAvailability } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

export interface AvailabilityPillProps {
  availability: Availability | DetailedAvailability;
  /** `features.publicStockCounts` - gates showing a real tracked quantity. */
  showStockCount?: boolean;
  className?: string;
}

/**
 * Availability indicator.
 *
 * `low_stock` is emitted by the backend only when a real configured threshold
 * is met (contract 4) - it is never an urgency device, so the wording here is
 * factual and carries no countdown, no "hurry" and no viewer count.
 *
 * A stock number is shown only when the store enabled public stock counts AND
 * the backend returned a real tracked quantity.
 */
export function AvailabilityPill({
  availability,
  showStockCount = false,
  className,
}: AvailabilityPillProps) {
  const { availability: t } = useMessages();
  const quantity =
    showStockCount && "quantity" in availability && availability.policy === "track"
      ? availability.quantity
      : null;

  const config = (() => {
    switch (availability.state) {
      case "in_stock":
        return {
          label: t.in_stock,
          dot: "bg-success",
          chip: "border-success-line bg-success-tint text-success",
        };
      case "low_stock":
        return {
          label: t.low_stock,
          dot: "bg-warning",
          chip: "border-warning-line bg-warning-tint text-warning",
        };
      case "out_of_stock":
        return {
          label: t.out_of_stock,
          dot: "bg-ink-subtle",
          chip: "border-line bg-surface-high text-ink-muted",
        };
      case "preorder":
        return {
          label: t.preorder,
          dot: "bg-info",
          chip: "border-info-line bg-info-tint text-info",
        };
      case "unavailable":
      default:
        return {
          label: t.unavailable,
          dot: "bg-ink-subtle",
          chip: "border-line bg-surface-high text-ink-muted",
        };
    }
  })();

  return (
    // A tonal M3 chip: the state reads at a glance even without the dot.
    <p
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-label-lg",
        config.chip,
        className,
      )}
    >
      <span className={cn("size-2 shrink-0 rounded-full", config.dot)} aria-hidden="true" />
      {config.label}
      {quantity !== null && quantity > 0 ? (
        <span className="font-normal text-ink-muted">
          &mdash; {fmt(t.left, { count: quantity })}
        </span>
      ) : null}
    </p>
  );
}
