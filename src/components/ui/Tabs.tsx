"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-line",
        // Horizontal scroll inside the strip, never on the page.
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  );
});

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "state-layer -mb-px inline-flex min-h-12 shrink-0 items-center rounded-t-sm border-b-3 border-transparent px-4 text-label-lg",
        "text-ink-muted transition-colors duration-200 ease-(--ease-standard) hover:text-ink",
        "data-[state=active]:border-brand data-[state=active]:text-brand",
        "disabled:pointer-events-none disabled:opacity-55",
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cn("pt-4", className)} {...props} />;
});
