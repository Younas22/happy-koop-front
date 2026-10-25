"use client";

import { CloudOff, TriangleAlert } from "lucide-react";
import * as React from "react";

import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";

export interface ErrorStateProps {
  title?: string;
  /** Safe-to-display message, normally `ApiError.message`. */
  message?: string | null;
  /** True when the backend was unreachable rather than returning an error. */
  unreachable?: boolean;
  /** A retry control, usually a button that calls `reset()` or re-navigates. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Real error state.
 *
 * When the backend is down the store shows this - it never falls back to mock
 * products, cached placeholders or fabricated content.
 */
export function ErrorState({
  title,
  message,
  unreachable = false,
  action,
  className,
}: ErrorStateProps) {
  const { ui } = useMessages();
  const Icon = unreachable ? CloudOff : TriangleAlert;
  const heading = title ?? (unreachable ? ui.errorUnreachableTitle : ui.errorGenericTitle);
  const body = message ?? (unreachable ? ui.errorUnreachableBody : ui.errorGenericBody);

  return (
    <div
      role="alert"
      className={cn("surface-card flex flex-col items-center px-6 py-12 text-center", className)}
    >
      <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-danger-tint">
        <Icon className="size-5.5 text-danger" aria-hidden="true" />
      </span>
      <h2 className="text-title-md text-ink">{heading}</h2>
      <p className="mt-1.5 max-w-sm text-body-md text-ink-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
