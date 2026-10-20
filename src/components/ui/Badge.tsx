import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Badge. Only ever used for administrator-set, factual labels (contract 4) -
 * never for invented urgency, "hot" markers or fake scarcity.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-2xs font-semibold tracking-wide uppercase",
  {
    variants: {
      tone: {
        neutral: "border-line bg-sunken text-ink-muted",
        brand: "border-transparent bg-brand-tint text-brand",
        success: "border-transparent bg-success-tint text-success",
        warning: "border-transparent bg-warning-tint text-warning",
        danger: "border-transparent bg-danger-tint text-danger",
        info: "border-transparent bg-info-tint text-info",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

const TONES: readonly BadgeTone[] = ["neutral", "brand", "success", "warning", "danger", "info"];

/**
 * Maps the backend's free-form `tone` string onto a known style.
 * Anything unrecognised falls back to neutral rather than being dropped.
 */
export function resolveBadgeTone(tone: string | null | undefined): BadgeTone {
  const value = (tone ?? "").toLowerCase();
  return (TONES as readonly string[]).includes(value) ? (value as BadgeTone) : "neutral";
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
