import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  /** A lucide icon component, rendered decoratively. */
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  title: string;
  description?: string | null;
  /** A primary action, e.g. "Browse the shop". */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Honest empty state. It says what is not there - it never fills the gap with
 * invented products or placeholder tiles.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "surface-card flex flex-col items-center px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="mb-5 inline-flex size-14 items-center justify-center rounded-full bg-brand-container">
          <Icon className="size-6 text-brand-on-container" aria-hidden="true" />
        </span>
      ) : null}
      <h2 className="text-title-lg text-ink">{title}</h2>
      {description ? <p className="mt-1.5 max-w-sm text-body-md text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
