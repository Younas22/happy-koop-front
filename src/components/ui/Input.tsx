import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Marks the field invalid and wires `aria-invalid`. */
  invalid?: boolean;
}

/**
 * Text input. 44px tall so it is a comfortable touch target, flat surface,
 * visible border. Focus comes from the global `:focus-visible` rule.
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
        "h-11 w-full rounded-md border bg-surface px-3 text-sm text-ink",
        "placeholder:text-ink-subtle",
        "transition-colors duration-150 ease-(--ease-in-out-soft)",
        "disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-subtle",
        invalid ? "border-danger" : "border-line-strong hover:border-ink-subtle",
        className,
      )}
      {...props}
    />
  );
});
