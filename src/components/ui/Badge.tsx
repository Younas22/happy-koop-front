import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Badge - a Material 3 label chip, non-interactive.
 *
 * Only ever used for administrator-set, factual labels (contract 4) - never
 * for invented urgency, "hot" markers or fake scarcity. Sentence case rather
 * than all-caps: M3 reserves uppercase for the eyebrow micro-type, and a
 * shouted "SOLD OUT" over a photograph reads as marketing noise.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-label-md font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-line bg-surface-high text-ink-muted",
        brand: "border-transparent bg-brand-container text-brand-on-container",
        success: "border-success-line bg-success-tint text-success",
        warning: "border-warning-line bg-warning-tint text-warning",
        danger: "border-danger-line bg-danger-tint text-danger",
        info: "border-info-line bg-info-tint text-info",
      },
      /** Raises the badge off a photograph, where a flat tint disappears. */
      raised: {
        true: "elevation-1",
        false: "",
      },
    },
    defaultVariants: { tone: "neutral", raised: false },
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

export function Badge({ className, tone, raised, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, raised }), className)} {...props} />;
}
