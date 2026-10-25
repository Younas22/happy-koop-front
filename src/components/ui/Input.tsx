import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Marks the field invalid and wires `aria-invalid`. */
  invalid?: boolean;
}

/**
 * Text input, styled as a Material 3 filled text field.
 *
 * The label stays above the control rather than floating inside it: the forms
 * here carry descriptions and validation messages, and a label that animates
 * into the border leaves nowhere consistent for those to sit. Everything else
 * is M3 - a tonal fill that lightens to the plain surface on focus, a 12px
 * shape, and 48px of height so it is a comfortable touch target.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-12 w-full rounded-md border bg-surface-low px-4 text-body-md text-ink",
        "placeholder:text-ink-subtle",
        "transition-[background-color,border-color] duration-200 ease-(--ease-standard)",
        "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-container disabled:text-ink-subtle",
        // The border and the fill both answer focus, so the control reads as
        // active even where the global focus-visible outline is clipped.
        "focus:border-brand focus:bg-surface focus-visible:border-brand",
        invalid
          ? "border-danger bg-danger-tint/60"
          : "border-line-strong hover:border-ink-subtle hover:bg-surface-container",
        className,
      )}
      {...props}
    />
  );
});
