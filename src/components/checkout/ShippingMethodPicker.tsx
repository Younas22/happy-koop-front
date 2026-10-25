"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { RadioCard, RadioGroup } from "@/components/ui/RadioGroup";
import { Spinner } from "@/components/ui/Spinner";
import { formatMoney } from "@/lib/money";
import { useI18n } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { fmt, plural } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
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

function estimateText(
  option: ShippingOption,
  locale: Locale,
  t: Messages["checkout"]["shipping"],
): string | null {
  const { estimateMinDays: min, estimateMaxDays: max } = option;
  if (min === null && max === null) return null;
  if (min !== null && max !== null) {
    return min === max ? plural(locale, min, t.days) : fmt(t.range, { min, max });
  }
  const single = min ?? max;
  return single === null ? null : plural(locale, single, t.days);
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
  const { locale, m } = useI18n();
  const t = m.checkout.shipping;

  if (!countryCode) {
    return (
      <p className="text-body-md text-ink-muted">
        {t.chooseCountry}
      </p>
    );
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-body-md text-ink-muted" aria-live="polite">
        <Spinner size="sm" />
        {t.checking}
      </p>
    );
  }

  if (error) {
    return (
      <Alert tone="danger" live title={t.loadFailed}>
        {error}
        <div className="mt-2">
          <Button size="sm" variant="secondary" onClick={onRetry}>
            {m.common.tryAgain}
          </Button>
        </div>
      </Alert>
    );
  }

  if (options.length === 0) {
    return (
      <Alert tone="warning" live title={t.blockedTitle}>
        {t.blockedBody}
      </Alert>
    );
  }

  return (
    <RadioGroup
      value={selectedId ?? ""}
      onValueChange={onSelect}
      disabled={disabled}
      className="space-y-2"
      aria-label={t.label}
    >
      {options.map((option) => {
        const estimate = estimateText(option, locale, t);
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
              <span className="text-title-sm text-ink tabular-nums">
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
