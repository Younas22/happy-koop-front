"use client";

import { Minus, Plus } from "lucide-react";
import * as React from "react";

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
 * Quantity stepper.
 *
 * - Both buttons and the field are 44px tall touch targets.
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
  label = "Quantity",
  className,
}: QuantityStepperProps) {
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

  return (
    <div
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-md border border-line-strong bg-surface",
        disabled && "opacity-55",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || atMin}
        aria-label="Decrease quantity"
        className="tap-target inline-flex items-center justify-center text-ink transition-colors hover:bg-sunken disabled:cursor-not-allowed disabled:text-ink-subtle disabled:hover:bg-transparent"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>

      <label htmlFor={inputId} className="sr-only">
        {label}
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
          "h-11 w-12 border-x border-line-strong bg-surface text-center text-sm font-medium text-ink",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          "disabled:cursor-not-allowed",
        )}
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || atMax}
        aria-label="Increase quantity"
        className="tap-target inline-flex items-center justify-center text-ink transition-colors hover:bg-sunken disabled:cursor-not-allowed disabled:text-ink-subtle disabled:hover:bg-transparent"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
