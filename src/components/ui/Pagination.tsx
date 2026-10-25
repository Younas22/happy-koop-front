import { ChevronLeft, ChevronRight } from "lucide-react";

import { fmt } from "@/i18n/format";
import { Link } from "@/i18n/Link";
import { getMessages } from "@/i18n/server";
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
  "state-layer tap-target inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 text-label-lg text-ink";

const disabledClasses =
  "tap-target inline-flex cursor-not-allowed items-center justify-center rounded-md border border-line bg-surface-container px-3 text-label-lg text-ink-subtle";

/**
 * A server component: `buildHref` is a function, which cannot cross into a
 * Client Component, so the labels are read on the server instead of through
 * the client provider. Links are written locale-free and localized by `Link`.
 */
export async function Pagination({ meta, buildHref, className }: PaginationProps) {
  if (meta.lastPage <= 1) return null;

  const { ui } = await getMessages();

  const current = meta.currentPage;
  const pages = pageWindow(current, meta.lastPage);

  return (
    <nav aria-label={ui.pagination} className={cn("flex flex-col items-center gap-3", className)}>
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          {current > 1 ? (
            <Link href={buildHref(current - 1)} className={linkClasses} rel="prev">
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only sm:ml-1">{ui.previous}</span>
            </Link>
          ) : (
            <span className={disabledClasses} aria-disabled="true">
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only sm:ml-1">{ui.previous}</span>
            </span>
          )}
        </li>

        {pages.map((page, index) =>
          page === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-body-md text-ink-subtle">
              &hellip;
            </li>
          ) : (
            <li key={page}>
              {page === current ? (
                <span
                  aria-current="page"
                  className="tap-target inline-flex items-center justify-center rounded-md border border-brand bg-brand px-3 text-title-sm text-brand-ink"
                >
                  {page}
                </span>
              ) : (
                <Link href={buildHref(page)} className={linkClasses} aria-label={fmt(ui.pageN, { page })}>
                  {page}
                </Link>
              )}
            </li>
          ),
        )}

        <li>
          {current < meta.lastPage ? (
            <Link href={buildHref(current + 1)} className={linkClasses} rel="next">
              <span className="sr-only sm:not-sr-only sm:mr-1">{ui.next}</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <span className={disabledClasses} aria-disabled="true">
              <span className="sr-only sm:not-sr-only sm:mr-1">{ui.next}</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </span>
          )}
        </li>
      </ul>

      {meta.from !== null && meta.to !== null ? (
        <p className="text-body-sm text-ink-muted">
          {fmt(ui.showing, { from: meta.from, to: meta.to, total: meta.total })}
        </p>
      ) : null}
    </nav>
  );
}
