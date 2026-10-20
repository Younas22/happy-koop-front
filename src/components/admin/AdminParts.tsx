import * as React from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import type { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

/**
 * Small building blocks shared by the admin screens: page header, a
 * horizontally scrollable table wrapper, a metric tile and a standard
 * "the API said no" panel.
 *
 * Metric tiles show a measured value and nothing else. There is no trend
 * arrow, no comparison and no projection, because the API reports counts, not
 * forecasts (contract 8).
 */

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Keeps a wide table inside its column instead of scrolling the page. */
export function AdminTableWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card overflow-x-auto", className)}>
      <table className="w-full min-w-[40rem] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line px-3 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-subtle uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("border-b border-line px-3 py-2.5 align-top text-ink", className)}>
      {children}
    </td>
  );
}

export function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | null;
}) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-ink tabular-nums sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * Standard failure panel. A 401/403 is reported as what it is - the API
 * refused - rather than being disguised as empty data.
 */
export function AdminError({
  error,
  title,
  action,
}: {
  error: ApiError;
  title?: string;
  action?: React.ReactNode;
}) {
  const heading =
    title ??
    (error.isForbidden()
      ? "The API refused this request"
      : error.isUnauthenticated()
        ? "Your admin session has expired"
        : "We could not load this data");

  return (
    <ErrorState
      title={heading}
      message={error.message}
      unreachable={error.isUnreachable()}
      action={action}
    />
  );
}
