"use client";

import * as React from "react";

import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils/cn";

export interface FormFieldProps {
  /** Must match the control's `id`. */
  id: string;
  label: string;
  /** Helper text shown under the control. */
  description?: string | null;
  /** Validation message. Its presence sets `aria-invalid` on the control. */
  error?: string | null;
  required?: boolean;
  className?: string;
  /**
   * Render prop receiving the wiring the control must spread, so
   * `aria-describedby` / `aria-invalid` can never drift out of sync.
   */
  children: (field: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": true | undefined;
    "aria-required": true | undefined;
    invalid: boolean;
  }) => React.ReactNode;
}

/**
 * Label + description + error wiring.
 *
 * `aria-describedby` points at the description and the error; `aria-invalid`
 * is set only when there is a real error message. Errors are announced via a
 * polite live region so a screen reader hears a failed submit.
 */
export function FormField({
  id,
  label,
  description,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required ? true : undefined,
        invalid: Boolean(error),
      })}

      {/* Under the control, not the label: fields side by side in a grid then
          line up whether or not each one has helper text. */}
      {description ? (
        <p id={descriptionId} className="text-body-sm text-ink-muted">
          {description}
        </p>
      ) : null}

      <div aria-live="polite">
        {error ? (
          <p id={errorId} className="text-label-md text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
