"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { RadioCard, RadioGroup } from "@/components/ui/RadioGroup";
import { Spinner } from "@/components/ui/Spinner";
import { formatMoney } from "@/lib/money";
import type { ShippingOption } from "@/lib/types/api";

/**
 * Delivery method.
 *
 * `GET /shipping/options` returning `[]` means the store has configured NO
 * rate for that destination. That blocks checkout for it with a plain
 * explanation - it is never treated as free shipping, and no delivery estimate
 * is shown unless an administrator configured one (contract 5).
 */

export interface ShippingMethodPickerProps {
  countryCode: string;
  options: readonly ShippingOption[];
  /** True while the options request is in flight. */
  loading: boolean;
  /** Message from a failed options request. */
  error: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
  disabled?: boolean;
}

function estimateText(option: ShippingOption): string | null {
  const { estimateMinDays: min, estimateMaxDays: max } = option;
  if (min === null && max === null) return null;
  if (min !== null && max !== null) {
    return min === max ? `${min} business days` : `${min}-${max} business days`;
  }
  const single = min ?? max;
  return single === null ? null : `${single} business days`;
}

export function ShippingMethodPicker({
  countryCode,
  options,
  loading,
  error,
  selectedId,
  onSelect,
  onRetry,
  disabled,
}: ShippingMethodPickerProps) {
  if (!countryCode) {
    return (
      <p className="text-sm text-ink-muted">
        Choose a delivery country above to see the available delivery options.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-muted" aria-live="polite">
        <Spinner size="sm" />
        Checking delivery options…
      </p>
    );
  }

  if (error) {
    return (
      <Alert tone="danger" live title="We could not load delivery options">
        {error}
        <div className="mt-2">
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </Alert>
    );
  }

  if (options.length === 0) {
    return (
      <Alert tone="warning" live title="We cannot deliver to this country yet">
        No delivery rate is configured for this destination, so this order cannot be completed.
        Choose a different delivery country, or contact us to ask about delivery there.
      </Alert>
    );
  }

  return (
    <RadioGroup
      value={selectedId ?? ""}
      onValueChange={onSelect}
      disabled={disabled}
      className="space-y-2"
      aria-label="Delivery method"
    >
      {options.map((option) => {
        const estimate = estimateText(option);
        return (
          <RadioCard
            key={option.id}
            id={`shipping-${option.id}`}
            value={option.id}
            title={option.label}
            description={
              <>
                {option.description ? <span className="block">{option.description}</span> : null}
                {estimate ? <span className="block">{estimate}</span> : null}
              </>
            }
            trailing={
              <span className="text-sm font-semibold text-ink tabular-nums">
                {formatMoney(option.price)}
              </span>
            }
            disabled={disabled}
          />
        );
      })}
    </RadioGroup>
  );
}
