import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { PaginationMeta } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

export interface PaginationProps {
  meta: PaginationMeta;
  /** Builds the href for a page number, preserving the current filters. */
  buildHref: (page: number) => string;
  className?: string;
}

/** Page numbers around the current page, with ellipses for the gaps. */
function pageWindow(current: number, last: number): (number | "gap")[] {
  if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1);

  const pages = new Set<number>([1, last, current]);
  for (const offset of [-1, 1]) {
    const candidate = current + offset;
    if (candidate > 1 && candidate < last) pages.add(candidate);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push("gap");
    result.push(page);
    previous = page;
  }
  return result;
}

const linkClasses =
  "tap-target inline-flex items-center justify-center rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-sunken";

const disabledClasses =
  "tap-target inline-flex cursor-not-allowed items-center justify-center rounded-md border border-line bg-sunken px-3 text-sm font-medium text-ink-subtle";

export function Pagination({ meta, buildHref, className }: PaginationProps) {
  if (meta.lastPage <= 1) return null;

  const current = meta.currentPage;
  const pages = pageWindow(current, meta.lastPage);

  return (
    <nav aria-label="Pagination" className={cn("flex flex-col items-center gap-3", className)}>
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          {current > 1 ? (
            <Link href={buildHref(current - 1)} className={linkClasses} rel="prev">
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
            </Link>
          ) : (
            <span className={disabledClasses} aria-disabled="true">
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
            </span>
          )}
        </li>

        {pages.map((page, index) =>
          page === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-sm text-ink-subtle">
              &hellip;
            </li>
          ) : (
            <li key={page}>
              {page === current ? (
                <span
                  aria-current="page"
                  className="tap-target inline-flex items-center justify-center rounded-md border border-brand bg-brand px-3 text-sm font-semibold text-brand-ink"
                >
                  {page}
                </span>
              ) : (
                <Link href={buildHref(page)} className={linkClasses} aria-label={`Page ${page}`}>
                  {page}
                </Link>
              )}
            </li>
          ),
        )}

        <li>
          {current < meta.lastPage ? (
            <Link href={buildHref(current + 1)} className={linkClasses} rel="next">
              <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <span className={disabledClasses} aria-disabled="true">
              <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </span>
          )}
        </li>
      </ul>

      {meta.from !== null && meta.to !== null ? (
        <p className="text-xs text-ink-muted">
          Showing {meta.from}&ndash;{meta.to} of {meta.total}
        </p>
      ) : null}
    </nav>
  );
}
