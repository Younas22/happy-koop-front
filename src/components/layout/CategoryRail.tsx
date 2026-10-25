"use client";

import { useMessages, usePathnameWithoutLocale } from "@/i18n/client";
import { Link } from "@/i18n/Link";
import { isActiveHref, type MegaMenuColumn } from "@/lib/layout/navigation";
import { cn } from "@/lib/utils/cn";

export interface CategoryRailProps {
  /** Prepared by `megaMenuColumns` on the server. */
  categories: readonly MegaMenuColumn[];
}

/**
 * Swipeable category chips under the app bar, on phones and tablets.
 *
 * A phone cannot show the desktop navigation, and the categories were
 * previously two taps away behind the menu button. The rail puts the catalog on
 * the first screen: one swipeable row of real categories, snapping and bleeding
 * into the page gutter so the first and last chip sit flush with the page text.
 *
 * It is hidden from `md` up, where the mega menu already shows the same tree,
 * and on two routes that would otherwise show category chips twice or lose
 * their own focus: the shop (its filters are a category rail) and checkout.
 */
export function CategoryRail({ categories }: CategoryRailProps) {
  const pathname = usePathnameWithoutLocale();
  const m = useMessages();

  if (categories.length === 0) return null;
  if (pathname.startsWith("/shop") || pathname.startsWith("/checkout")) return null;

  return (
    <nav
      aria-label={m.header.categories}
      className="border-b border-line bg-surface py-2 md:hidden"
    >
      <div className="page-container">
        <ul className="chip-rail">
          <li>
            <Link
              href="/shop"
              className={cn(
                "chip text-label-md",
                isActiveHref(pathname, "/shop") && "border-brand bg-brand-container text-brand-on-container",
              )}
            >
              {m.header.all}
            </Link>
          </li>
          {categories.map((category) => {
            const active = isActiveHref(pathname, category.href);
            return (
              <li key={category.id}>
                <Link
                  href={category.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "chip text-label-md",
                    active
                      ? "border-brand bg-brand-container text-brand-on-container"
                      : "text-ink-muted",
                  )}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
