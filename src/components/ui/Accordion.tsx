"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Accordion. Radix wires `aria-expanded`, `aria-controls` and the
 * button/region relationship, and supports Home/End/arrow navigation.
 * Triggers are 44px tall.
 */

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn("border-b border-line last:border-b-0", className)}
      {...props}
    />
  );
});

export const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(function AccordionTrigger({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "group flex min-h-12 flex-1 items-center justify-between gap-3 py-4 text-left",
          "text-label-lg text-ink transition-colors hover:text-brand",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className="size-4 shrink-0 text-ink-muted transition-transform duration-200 ease-(--ease-standard) group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

export const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn("overflow-hidden text-body-md text-ink-muted", className)}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </AccordionPrimitive.Content>
  );
});
