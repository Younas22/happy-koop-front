"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { DialogOverlay, DialogPortal } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils/cn";

/**
 * Sheet / drawer built on the Dialog primitive, so it inherits proper focus
 * trapping, Escape handling and focus restoration.
 *
 * It is `fixed` and sized with `dvh`, so it never overlaps the footer or
 * clips its own scrollable body on mobile browsers with dynamic toolbars.
 */

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;

const sideClasses = {
  right: "inset-y-0 right-0 h-dvh w-[min(26rem,calc(100vw-2rem))] border-l",
  left: "inset-y-0 left-0 h-dvh w-[min(22rem,calc(100vw-3rem))] border-r",
  bottom: "inset-x-0 bottom-0 max-h-[85dvh] w-full border-t rounded-t-xl",
} as const;

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: keyof typeof sideClasses;
  hideClose?: boolean;
}

export const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(function DrawerContent({ className, children, side = "right", hideClose, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col border-line bg-surface shadow-xl",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        {hideClose ? null : (
          <DialogPrimitive.Close
            className="tap-target absolute top-2.5 right-2.5 inline-flex items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

export function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shrink-0 border-b border-line px-4 py-3.5 pr-14", className)}
      {...props}
    />
  );
}

/** The scrollable region. Keeps the header and footer fixed in place. */
export function DrawerBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4", className)} {...props} />;
}

export function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("shrink-0 border-t border-line px-4 py-3.5", className)} {...props} />
  );
}
