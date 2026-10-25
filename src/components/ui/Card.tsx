import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Card - the three Material 3 card styles.
 *
 *   - `elevated` (the default): a plain surface carried by elevation, with a
 *     hairline outline so it still separates on a tinted canvas.
 *   - `filled`: a tonal surface at elevation 0, for a card that groups
 *     content inside another card or panel.
 *   - `outlined`: outline only, no shadow, for dense lists of cards where
 *     stacked shadows would turn into noise.
 */
const cardVariants = cva("rounded-lg", {
  variants: {
    variant: {
      elevated: "surface-card",
      filled: "border border-transparent bg-surface-container",
      outlined: "border border-line bg-surface",
    },
  },
  defaultVariants: { variant: "elevated" },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-b border-line px-4 py-4 sm:px-6 sm:py-5", className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-title-md text-ink", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-4 sm:px-6 sm:py-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-t border-line bg-surface-container px-4 py-4 sm:px-6 sm:py-5",
        className,
      )}
      {...props}
    />
  );
}

export { cardVariants };
