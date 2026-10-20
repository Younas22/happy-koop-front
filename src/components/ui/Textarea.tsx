import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

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
        "w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-ink",
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
