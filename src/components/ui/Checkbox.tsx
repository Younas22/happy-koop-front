"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

/** Checkbox - M3: a 2px outline when unselected, filled brand when selected. */
export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer flex size-5 shrink-0 items-center justify-center rounded-xs border-2 border-ink-subtle bg-transparent",
        "transition-colors duration-200 ease-(--ease-standard)",
        "hover:border-brand",
        "data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-brand-ink",
        "data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand data-[state=indeterminate]:text-brand-ink",
        "disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {props.checked === "indeterminate" ? (
          <Minus className="size-3.5" aria-hidden="true" />
        ) : (
          <Check className="size-3.5" aria-hidden="true" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

export interface CheckboxFieldProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  id: string;
  label: string;
}

/**
 * Checkbox plus label in a 48px row. The whole row is the tap target, and it
 * takes the M3 state layer so a touch anywhere on it is acknowledged.
 */
export function CheckboxField({ id, label, className, ...props }: CheckboxFieldProps) {
  return (
    <div className={cn("flex min-h-12 items-center gap-3", className)}>
      <Checkbox id={id} {...props} />
      <label htmlFor={id} className="cursor-pointer text-body-md text-ink">
        {label}
      </label>
    </div>
  );
}
