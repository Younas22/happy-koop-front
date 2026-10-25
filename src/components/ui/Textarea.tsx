import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

/** Multi-line input. Same Material 3 filled treatment as `Input`. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full rounded-md border bg-surface-low px-4 py-3 text-body-md text-ink",
        "placeholder:text-ink-subtle",
        "transition-[background-color,border-color] duration-200 ease-(--ease-standard)",
        "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-container disabled:text-ink-subtle",
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
