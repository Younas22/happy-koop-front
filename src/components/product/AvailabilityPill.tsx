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
  const quantity =
    showStockCount && "quantity" in availability && availability.policy === "track"
      ? availability.quantity
      : null;

  const config = (() => {
    switch (availability.state) {
      case "in_stock":
        return { label: "In stock", dot: "bg-success", text: "text-success" };
      case "low_stock":
        return { label: "Low stock", dot: "bg-warning", text: "text-warning" };
      case "out_of_stock":
        return { label: "Out of stock", dot: "bg-ink-subtle", text: "text-ink-muted" };
      case "preorder":
        return { label: "Available to pre-order", dot: "bg-info", text: "text-info" };
      case "unavailable":
      default:
        return { label: "Unavailable", dot: "bg-ink-subtle", text: "text-ink-muted" };
    }
  })();

  return (
    <p className={cn("inline-flex items-center gap-1.5 text-sm font-medium", config.text, className)}>
      <span className={cn("size-2 shrink-0 rounded-full", config.dot)} aria-hidden="true" />
      {config.label}
      {quantity !== null && quantity > 0 ? (
        <span className="font-normal text-ink-muted">
          &mdash; {quantity} left
        </span>
      ) : null}
    </p>
  );
}
