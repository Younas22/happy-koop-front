import { cn } from "@/lib/utils/cn";

const sizes = {
  sm: "size-4 border-2",
  md: "size-5 border-2",
  lg: "size-6 border-[2.5px]",
} as const;

export interface SpinnerProps {
  size?: keyof typeof sizes;
  className?: string;
  /** Announced to assistive tech. Omit inside a control that already says it. */
  label?: string;
}

/** A plain rotating ring. No gradient, no pulsing, no colour cycling. */
export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent",
        sizes[size],
        className,
      )}
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
    >
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
