import { cn } from "@/lib/utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rounded like a product image rather than a text line. */
  shape?: "line" | "block" | "circle";
}

/**
 * Loading placeholder. Opacity pulse only (see the `skeleton` utility in
 * globals.css) - no moving gradient sweep.
 */
export function Skeleton({ className, shape = "line", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton",
        shape === "block" && "rounded-lg",
        shape === "circle" && "rounded-full",
        className,
      )}
      {...props}
    />
  );
}
