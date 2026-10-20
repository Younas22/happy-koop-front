"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent bg-line-strong",
        "transition-colors duration-150 ease-(--ease-in-out-soft)",
        "data-[state=checked]:bg-brand",
        "disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-surface shadow-xs",
          "transition-transform duration-150 ease-(--ease-out-soft)",
          "translate-x-0.5 data-[state=checked]:translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  );
});
