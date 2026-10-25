"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";

/**
 * Accessible modal dialog. Radix handles focus trapping, `aria-modal`,
 * Escape-to-close and restoring focus to the trigger.
 *
 * Every dialog MUST render a `DialogTitle` (visually hidden if necessary) or
 * Radix warns and screen readers announce nothing.
 */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn("fixed inset-0 z-50 bg-ink/35", className)}
      {...props}
    />
  );
});

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Hides the built-in close button when the content supplies its own. */
  hideClose?: boolean;
}

export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent({ className, children, hideClose, ...props }, ref) {
  const { ui } = useMessages();
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
          "max-h-[calc(100dvh-2rem)] overflow-y-auto",
          "rounded-xl border border-line bg-surface elevation-3",
          className,
        )}
        {...props}
      >
        {children}
        {hideClose ? null : (
          <DialogPrimitive.Close
            className="tap-target absolute top-2 right-2 inline-flex items-center justify-center rounded-full text-ink-muted transition-colors duration-200 ease-(--ease-standard) hover:bg-surface-high hover:text-ink"
            aria-label={ui.close}
          >
            <X className="size-5" aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-b border-line px-4 py-3.5 pr-14 sm:px-5", className)}
      {...props}
    />
  );
}

export const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-title-lg text-ink", className)}
      {...props}
    />
  );
});

export const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("mt-1 text-body-md text-ink-muted", className)}
      {...props}
    />
  );
});

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-4 sm:px-5", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-line px-4 py-3.5 sm:flex-row sm:justify-end sm:px-5",
        className,
      )}
      {...props}
    />
  );
}
