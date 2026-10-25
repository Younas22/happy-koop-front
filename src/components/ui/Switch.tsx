"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Switch - the Material 3 switch.
 *
 * The 52x32 track and the growing handle are what make it read as Material:
 * off is a 16px handle on an outlined, tonal track; on is a 24px handle on a
 * filled brand track. The size change is the state change, so the control is
 * legible without relying on colour alone.
 */
export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "relative inline-flex h-8 w-13 shrink-0 items-center rounded-full border-2",
        "border-line-strong bg-surface-highest",
        "transition-colors duration-200 ease-(--ease-standard)",
        "data-[state=checked]:border-brand data-[state=checked]:bg-brand",
        "disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none absolute left-0 block size-4 translate-x-1.5 rounded-full bg-ink-subtle",
          "transition-all duration-200 ease-(--ease-emphasized)",
          "data-[state=checked]:size-6 data-[state=checked]:translate-x-5.5 data-[state=checked]:bg-brand-ink",
        )}
      />
    </SwitchPrimitive.Root>
  );
});
