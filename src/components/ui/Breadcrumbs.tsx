import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { Breadcrumb } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

export interface BreadcrumbsProps {
  /** Server-supplied trail. Renders nothing when empty. */
  items: readonly Breadcrumb[];
  /** The current page label, rendered as plain text with aria-current. */
  current?: string | null;
  className?: string;
}

/** Breadcrumb trail. Renders nothing at all when there is no trail to show. */
export function Breadcrumbs({ items, current, className }: BreadcrumbsProps) {
  if (items.length === 0 && !current) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-muted">
        {items.map((item) => (
          <li key={`${item.href}-${item.label}`} className="flex items-center gap-1.5">
            <Link
              href={item.href}
              className="rounded-xs transition-colors hover:text-ink hover:underline"
            >
              {item.label}
            </Link>
            <ChevronRight className="size-3 shrink-0 text-ink-subtle" aria-hidden="true" />
          </li>
        ))}
        {current ? (
          <li aria-current="page" className="truncate font-medium text-ink">
            {current}
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
