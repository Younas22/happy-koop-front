import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

/**
 * Button.
 *
 * Flat surfaces only - no gradients. Elevation is a hint, never decoration.
 * Every size keeps a >=44px touch target on the `md`/`lg` scales; `sm` is for
 * dense desktop toolbars and still clears 36px with a 44px hit area applied by
 * the `tap-target` utility where it sits alone on a touch surface.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md border font-medium",
    "transition-colors duration-150 ease-(--ease-out-soft)",
    "disabled:pointer-events-none disabled:opacity-55",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "border-transparent bg-brand text-brand-ink hover:bg-brand-hover active:bg-brand-active shadow-xs",
        secondary: "border-line bg-surface text-ink hover:bg-sunken active:bg-sunken shadow-xs",
        outline: "border-line-strong bg-transparent text-ink hover:bg-sunken active:bg-sunken",
        ghost: "border-transparent bg-transparent text-ink hover:bg-sunken active:bg-sunken",
        danger: "border-transparent bg-danger text-ink-inverse hover:brightness-95 active:brightness-90 shadow-xs",
        link: "border-transparent bg-transparent text-brand underline underline-offset-2 hover:text-brand-hover",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-11 p-0",
        "icon-sm": "size-9 p-0",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Renders the single child as the button, keeping styles (e.g. a Link). */
  asChild?: boolean;
  /** Disables the control and shows a spinner. */
  loading?: boolean;
  /** Replaces the label while loading. Announced via aria-live. */
  loadingLabel?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    block,
    asChild = false,
    loading = false,
    loadingLabel,
    disabled,
    children,
    type,
    ...props
  },
  ref,
) {
  const Component = asChild ? Slot : "button";
  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      // `asChild` forwards to an anchor or Link, which has no `type`/`disabled`.
      {...(asChild ? {} : { type: type ?? "button", disabled: isDisabled })}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* Slot requires exactly one child, so the spinner is only wrapped in
          for a real <button>. */}
      {loading && !asChild ? (
        <>
          <Spinner size={size === "lg" ? "md" : "sm"} />
          <span>{loadingLabel ?? children}</span>
        </>
      ) : (
        children
      )}
    </Component>
  );
});

export { buttonVariants };
