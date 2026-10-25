"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { navItemClass } from "@/components/layout/nav-styles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { useMessages } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { Link } from "@/i18n/Link";
import type { MegaMenuColumn } from "@/lib/layout/navigation";
import { cn } from "@/lib/utils/cn";

export interface CategoryMegaMenuProps {
  /** Label of the destination this menu belongs to, e.g. "Shop". */
  label: string;
  /** The plain destination, offered as the first link in the panel. */
  allHref: string;
  /** Prepared by `megaMenuColumns` on the server. */
  columns: readonly MegaMenuColumn[];
  /** True when the viewer is on `allHref` or a category page. */
  active?: boolean;
}

/**
 * Desktop category mega menu.
 *
 * The columns are built on the server from `GET /categories?tree=true` and
 * passed in, so opening the menu costs no request and shows no spinner.
 *
 * The panel is laid out as a catalog, not a list: categories with an image are
 * shown as image tiles across the top - the store's own category photography,
 * the strongest cue a visitor has - and the full set follows as columns of
 * links with their sub-categories. A store whose categories have no images
 * simply gets the columns.
 *
 * It is a button rather than a link, because an element cannot be both a
 * destination and a disclosure without one of the two behaviours surprising
 * someone; the destination itself is the first entry in the panel. Radix
 * supplies the menu semantics, `aria-expanded`, Escape to close, click-outside
 * dismissal and focus return to the trigger.
 */
export function CategoryMegaMenu({ label, allHref, columns, active = false }: CategoryMegaMenuProps) {
  const m = useMessages();
  const [open, setOpen] = React.useState(false);

  const tiles = columns.filter((column) => column.imageUrl).slice(0, 4);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger className={navItemClass(active || open)}>
        {label}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform duration-200 ease-(--ease-standard)",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        sideOffset={14}
        className="w-[min(64rem,calc(100vw-2rem))] max-h-[min(72dvh,38rem)] overflow-y-auto rounded-2xl border-line bg-surface p-5 elevation-3"
      >
        {/* Radix gives the panel `role="menu"`, where only menu items are
            valid children - the layout wrappers are marked presentational so
            the accessibility tree stays a flat list of destinations. */}
        <div role="none" className="flex items-center justify-between gap-4 pb-4">
          <p role="none" className="label-eyebrow">
            {m.header.categories}
          </p>
          <DropdownMenuItem asChild className="min-h-10 gap-1.5 px-3 font-semibold text-brand">
            <Link href={allHref}>
              {m.header.browseAll}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </DropdownMenuItem>
        </div>

        {tiles.length > 0 ? (
          <div role="none" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map((column) => (
              <DropdownMenuItem
                key={column.id}
                asChild
                className="group block min-h-0 overflow-hidden rounded-xl border border-line p-0 data-highlighted:border-brand data-highlighted:bg-surface"
              >
                <Link href={column.href}>
                  <span className="relative block aspect-[4/3] bg-sunken">
                    <Image
                      src={column.imageUrl!}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 240px, 50vw"
                      className="object-cover transition-transform duration-300 ease-(--ease-standard) group-data-highlighted:scale-[1.03]"
                    />
                  </span>
                  <span className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <span className="truncate text-label-lg font-medium text-ink">{column.name}</span>
                    {column.productCount > 0 ? (
                      <span className="shrink-0 text-body-sm text-ink-subtle tabular-nums">
                        {column.productCount}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        ) : null}

        <div
          role="none"
          className={cn(
            "grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3",
            tiles.length > 0 && "mt-5 border-t border-line pt-5",
          )}
        >
          {columns.map((column) => (
            <div key={column.id} role="none" className="min-w-0">
              <DropdownMenuItem asChild className="min-h-10 gap-2 px-2 font-medium">
                <Link href={column.href}>
                  <span className="min-w-0 flex-1 truncate text-ink">{column.name}</span>
                  {column.productCount > 0 ? (
                    <span className="shrink-0 text-body-sm text-ink-subtle tabular-nums">
                      {column.productCount}
                    </span>
                  ) : null}
                </Link>
              </DropdownMenuItem>

              {column.children.length > 0 ? (
                <ul role="none" className="mt-0.5 border-l border-line pl-2">
                  {column.children.map((child) => (
                    <li key={child.id} role="none">
                      <DropdownMenuItem asChild className="min-h-9 px-2 text-ink-muted">
                        <Link href={child.href}>
                          <span className="min-w-0 truncate">{child.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    </li>
                  ))}
                  {column.hiddenChildren > 0 ? (
                    <li role="none">
                      <DropdownMenuItem asChild className="min-h-9 px-2 text-brand">
                        <Link href={column.href}>{fmt(m.header.viewAllIn, { name: column.name })}</Link>
                      </DropdownMenuItem>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
