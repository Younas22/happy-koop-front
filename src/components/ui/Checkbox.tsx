"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer flex size-5 shrink-0 items-center justify-center rounded-xs border border-line-strong bg-surface",
        "transition-colors duration-150 ease-(--ease-in-out-soft)",
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

/** Checkbox plus label in a 44px-tall row, so the whole row is a tap target. */
export function CheckboxField({ id, label, className, ...props }: CheckboxFieldProps) {
  return (
    <div className={cn("flex min-h-11 items-center gap-2.5", className)}>
      <Checkbox id={id} {...props} />
      <label htmlFor={id} className="cursor-pointer text-sm text-ink">
        {label}
      </label>
    </div>
  );
}
