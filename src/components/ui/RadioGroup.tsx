"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-2", className)} {...props} />;
});

export const RadioGroupItem = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(function RadioGroupItem({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface",
        "transition-colors duration-150 ease-(--ease-in-out-soft)",
        "data-[state=checked]:border-brand",
        "disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="block size-2.5 rounded-full bg-brand" />
    </RadioGroupPrimitive.Item>
  );
});

export interface RadioCardProps {
  id: string;
  value: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  trailing?: React.ReactNode;
  disabled?: boolean;
}

/** A full-width selectable row: the whole card is the hit area. */
export function RadioCard({ id, value, title, description, trailing, disabled }: RadioCardProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-line bg-surface p-3",
        "transition-colors duration-150 ease-(--ease-in-out-soft) hover:bg-sunken",
        "has-data-[state=checked]:border-brand has-data-[state=checked]:bg-brand-tint",
        disabled && "cursor-not-allowed opacity-55 hover:bg-surface",
      )}
    >
      <RadioGroupItem id={id} value={value} disabled={disabled} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-ink-muted">{description}</span>
        ) : null}
      </span>
      {trailing ? <span className="shrink-0 text-sm font-medium text-ink">{trailing}</span> : null}
    </label>
  );
}
