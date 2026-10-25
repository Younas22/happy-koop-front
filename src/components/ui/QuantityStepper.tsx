"use client";

import { Minus, Plus } from "lucide-react";
import * as React from "react";

import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  /** Real tracked stock ceiling. `null` means no known ceiling. */
  max?: number | null;
  disabled?: boolean;
  /** Accessible name, e.g. "Quantity for Ceramic Dripper". */
  label?: string;
  className?: string;
}

/**
 * Quantity stepper, shaped as a Material 3 segmented control: one tonal pill
 * with two circular icon buttons on it, each carrying a state layer.
 *
 * - Both buttons and the field are 48px tall touch targets.
 * - Fully keyboard operable: the number input accepts typing and arrow keys,
 *   and the buttons are real buttons.
 * - `max` is only applied when the backend gave a real tracked quantity, so
 *   the control never implies a stock limit that does not exist.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = null,
  disabled = false,
  label,
  className,
}: QuantityStepperProps) {
  const { ui } = useMessages();
  const inputLabel = label ?? ui.quantity;
  const inputId = React.useId();
  const ceiling = max === null ? Number.POSITIVE_INFINITY : max;

  const clamp = (next: number): number => {
    if (!Number.isFinite(next)) return min;
    const whole = Math.trunc(next);
    if (whole < min) return min;
    if (whole > ceiling) return Math.trunc(ceiling);
    return whole;
  };

  const atMin = value <= min;
  const atMax = value >= ceiling;

  const stepButton =
    "state-layer tap-target inline-flex items-center justify-center rounded-full text-ink " +
    "disabled:cursor-not-allowed disabled:text-ink-subtle disabled:opacity-60";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface-container p-1",
        disabled && "opacity-55",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || atMin}
        aria-label={ui.decrease}
        className={stepButton}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>

      <label htmlFor={inputId} className="sr-only">
        {inputLabel}
      </label>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max ?? undefined}
        step={1}
        disabled={disabled}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (Number.isNaN(parsed)) return;
          onChange(clamp(parsed));
        }}
        onBlur={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          onChange(clamp(Number.isNaN(parsed) ? min : parsed));
        }}
        className={cn(
          "h-10 w-10 rounded-full border-none bg-transparent text-center text-title-sm text-ink",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          "disabled:cursor-not-allowed",
        )}
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || atMax}
        aria-label={ui.increase}
        className={stepButton}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
