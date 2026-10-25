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
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/**
 * Keeps a wide table inside its column instead of scrolling the page.
 *
 * Row hover and the last-row rule are set here rather than on `Td`, so every
 * admin table gets them without each call site having to pass a class to its
 * own `<tr>`. `overflow-hidden` on the outer element is what lets the card's
 * radius clip the header band.
 */
export function AdminTableWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full min-w-[40rem] border-collapse text-sm",
            "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-sunken/70",
            // The card border already closes the table; a rule under the last
            // row would read as a double line.
            "[&_tbody_tr:last-child_td]:border-b-0",
          )}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "surface-panel px-3 py-2.5 text-left whitespace-nowrap",
        "label-eyebrow",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("border-b border-line px-3 py-3 align-middle text-ink", className)}>
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
    <div className="surface-card flex flex-col p-4 sm:p-5">
      <p className="label-eyebrow">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink tabular-nums sm:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-auto pt-2 text-xs leading-relaxed text-ink-subtle">{hint}</p>
      ) : null}
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
