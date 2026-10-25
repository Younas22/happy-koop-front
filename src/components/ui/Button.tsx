import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

/**
 * Button - Material 3.
 *
 * The five M3 button types map onto the variants below: `primary` is filled,
 * `secondary` is filled-tonal, `elevated` is the raised tonal one, `outline`
 * is outlined and `ghost` is the text button. `danger` is a filled button in
 * the error role, and `link` stays an inline text link.
 *
 * Three things make them read as Material rather than as rounded rectangles:
 *
 *   - Full-round shape. M3 buttons are pills at every size.
 *   - A state layer. Hover / focus / press paint `currentColor` over the
 *     button at 8% / 10% / 12% instead of swapping the background, so one
 *     rule covers white-on-brand and ink-on-nothing alike. That is the
 *     `state-layer` utility, which needs `overflow-hidden` here because the
 *     label and spinner are children.
 *   - Elevation that answers the press: `elevated` rests at level 1 and lifts
 *     to level 2 on hover, and the filled variants stay flat as M3 specifies.
 *
 * Every size keeps a >=44px touch target on the `md`/`lg` scales; `sm` is for
 * dense desktop toolbars and still clears 36px, with `tap-target` applied
 * where it sits alone on a touch surface.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-full border",
    "text-label-lg",
    "state-layer overflow-hidden",
    "transition-[background-color,border-color,box-shadow,color] duration-200 ease-(--ease-standard)",
    "disabled:pointer-events-none disabled:opacity-55 disabled:shadow-none",
    "aria-disabled:pointer-events-none aria-disabled:opacity-55",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        /** M3 filled button: the one high-emphasis action on a screen. */
        primary: "border-transparent bg-brand text-brand-ink",
        /** M3 filled-tonal: the secondary action, tonal rather than outlined. */
        secondary: "border-transparent bg-brand-container text-brand-on-container",
        /** M3 elevated: tonal surface carried by elevation instead of a border. */
        elevated:
          "border-transparent bg-surface text-brand elevation-1 hover:elevation-2 active:elevation-1",
        outline: "border-line-strong bg-transparent text-ink hover:border-ink-subtle",
        ghost: "border-transparent bg-transparent text-ink",
        danger: "border-transparent bg-danger text-ink-inverse",
        link: "border-transparent bg-transparent text-brand underline underline-offset-2 hover:text-brand-hover",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-13 px-8 text-body-lg font-medium",
        icon: "size-11 p-0",
        "icon-sm": "size-9 p-0",
        /** M3 FAB: 56px, level-3 elevation, 16px shape rather than a pill. */
        fab: "size-14 rounded-lg p-0 elevation-3 hover:elevation-4",
        /** M3 extended FAB. */
        "fab-extended": "h-14 rounded-lg px-5 elevation-3 hover:elevation-4",
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
