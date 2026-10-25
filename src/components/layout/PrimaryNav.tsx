"use client";

import { ChevronDown } from "lucide-react";

import { CategoryMegaMenu } from "@/components/layout/CategoryMegaMenu";
import { navItemClass } from "@/components/layout/nav-styles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { useI18n, usePathnameWithoutLocale } from "@/i18n/client";
import { Link } from "@/i18n/Link";
import {
  isActiveHref,
  type MegaMenuColumn,
  navLabel,
  shopNavIndex,
} from "@/lib/layout/navigation";
import type { NavLink } from "@/lib/types/api";

/**
 * How many configured links sit directly in the bar. The rest move into an
 * overflow menu: the server allows up to 12 primary links, and twelve labels
 * plus a search field and two actions do not fit a 1024px row. A fixed limit
 * is deliberate - measuring widths on the client would mean the bar reflows
 * after hydration on every page load.
 */
const INLINE_LIMIT = 5;

export interface PrimaryNavProps {
  /** `navigation.primary` from the runtime config, in admin order. */
  links: readonly NavLink[];
  /** Category columns from the server; empty disables the mega menu. */
  columns: readonly MegaMenuColumn[];
}

/**
 * Desktop primary navigation, centred in the bar.
 *
 * Every label and destination comes from the admin-managed runtime config, in
 * the page's language when the admin wrote one; nothing is hardcoded, and an
 * empty list simply means no desktop nav. The markup is server-rendered with
 * the rest of the header - this is a client component only because the current
 * route decides which item is marked `aria-current`.
 *
 * The category mega menu is attached to the configured shop link rather than
 * added as an extra destination. When no configured link leads to the shop,
 * the shop route is offered on its own, because `/shop` is a route this
 * storefront really has.
 */
export function PrimaryNav({ links, columns }: PrimaryNavProps) {
  const pathname = usePathnameWithoutLocale();
  const { locale, m } = useI18n();

  const hasMenu = columns.length > 0;
  const shopIndex = hasMenu ? shopNavIndex(links) : -1;
  const menuIsExtra = hasMenu && shopIndex === -1;

  // A category page belongs to the shop destination, so the menu stays marked
  // as current while the viewer is inside the catalog.
  const menuActive = pathname.startsWith("/category") || isActiveHref(pathname, "/shop");

  const items = links.map((link, index) => ({
    label: navLabel(link, locale),
    href: link.href,
    isMenu: index === shopIndex,
  }));
  if (menuIsExtra) items.push({ label: m.header.shop, href: "/shop", isMenu: true });

  if (items.length === 0) return <div className="hidden flex-1 md:block" />;

  const inline = items.slice(0, INLINE_LIMIT);
  const overflow = items.slice(INLINE_LIMIT);

  return (
    <nav aria-label={m.header.main} className="hidden min-w-0 flex-1 md:flex md:justify-center">
      <ul className="flex items-center gap-1">
        {inline.map((item) => {
          const active = item.isMenu ? menuActive : isActiveHref(pathname, item.href);

          return (
            <li key={`${item.href}-${item.label}`} className="min-w-0">
              {item.isMenu ? (
                <CategoryMegaMenu
                  label={item.label}
                  allHref={item.href}
                  columns={columns}
                  active={active}
                />
              ) : (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={navItemClass(active)}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}

        {overflow.length > 0 ? (
          <li>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className={navItemClass(false)} aria-label={m.header.moreLinks}>
                {m.header.more}
                <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {overflow.map((item) => {
                  const active = isActiveHref(pathname, item.href);
                  return (
                    <DropdownMenuItem key={`${item.href}-${item.label}`} asChild>
                      <Link href={item.href} aria-current={active ? "page" : undefined}>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
