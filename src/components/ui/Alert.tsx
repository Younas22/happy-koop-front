import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

const tones = {
  info: { wrap: "border-info-line bg-info-tint text-ink", icon: Info, iconClass: "text-info" },
  success: {
    wrap: "border-success-line bg-success-tint text-ink",
    icon: CheckCircle2,
    iconClass: "text-success",
  },
  warning: {
    wrap: "border-warning-line bg-warning-tint text-ink",
    icon: AlertTriangle,
    iconClass: "text-warning",
  },
  danger: {
    wrap: "border-danger-line bg-danger-tint text-ink",
    icon: XCircle,
    iconClass: "text-danger",
  },
} as const;

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: keyof typeof tones;
  title?: React.ReactNode;
  /** Announce changes to screen readers (for validation / cart changes). */
  live?: boolean;
}

/** M3 banner: a tonal panel with a leading status icon. No gradient. */
export function Alert({ className, tone = "info", title, live, children, ...props }: AlertProps) {
  const config = tones[tone];
  const Icon = config.icon;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      aria-live={live ? (tone === "danger" ? "assertive" : "polite") : undefined}
      className={cn("flex gap-3 rounded-md border p-4 text-body-md", config.wrap, className)}
      {...props}
    >
      <Icon className={cn("mt-0.5 size-4.5 shrink-0", config.iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold text-ink">{title}</p> : null}
        {children ? <div className={cn("text-ink-muted", title && "mt-0.5")}>{children}</div> : null}
      </div>
    </div>
  );
}
