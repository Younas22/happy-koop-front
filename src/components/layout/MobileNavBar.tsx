"use client";

import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react";
import * as React from "react";

import { useI18n, usePathnameWithoutLocale } from "@/i18n/client";
import { plural } from "@/i18n/format";
import { Link } from "@/i18n/Link";
import { selectCartCount, useCartStore } from "@/lib/cart/store";
import { cn } from "@/lib/utils/cn";

export interface MobileNavBarProps {
  /** Hides the search destination when `features.search` is false. */
  searchEnabled: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Also active for anything below this path. */
  prefix?: string;
  badge?: number;
}

/**
 * Material 3 navigation bar, phones only.
 *
 * This is the piece the storefront was missing on a phone: the top app bar
 * holds the cart and the menu, but the primary destinations were two taps
 * away behind a hamburger. M3 puts three to five of them on a bar at the
 * bottom of the screen, within reach of a thumb, each with its own pill
 * indicator when active.
 *
 * It is hidden from `md` up, where the header navigation is already visible,
 * and on checkout, which owns the bottom of the screen for its own sticky
 * action. It is rendered only by the storefront layout, so the admin - a
 * separate application - never carries it.
 */
export function MobileNavBar({ searchEnabled }: MobileNavBarProps) {
  const pathname = usePathnameWithoutLocale();
  const { locale, m } = useI18n();
  const count = useCartStore(selectCartCount);

  // Checkout has its own sticky action bar.
  if (pathname.startsWith("/checkout")) return null;

  const items: NavItem[] = [
    { href: "/", label: m.nav.home, icon: Home },
    { href: "/shop", label: m.nav.shop, icon: LayoutGrid, prefix: "/shop" },
    ...(searchEnabled
      ? [{ href: "/search", label: m.nav.search, icon: Search, prefix: "/search" }]
      : []),
    { href: "/cart", label: m.nav.cart, icon: ShoppingBag, prefix: "/cart", badge: count },
    { href: "/account", label: m.nav.account, icon: User, prefix: "/account" },
  ];

  return (
    <>
      {/* Reserves the bar's own height at the end of the page. It is a
          sibling rather than padding on the body, so a route that hides the
          bar (checkout) gets no dead space either. */}
      <div className="h-18 pb-[env(safe-area-inset-bottom,0px)] md:hidden" aria-hidden="true" />

      <nav
        aria-label={m.nav.primary}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 md:hidden",
          "border-t border-line bg-surface-container/95 backdrop-blur-md elevation-2",
          "pb-[env(safe-area-inset-bottom,0px)]",
        )}
      >
        <ul className="flex items-stretch">
          {items.map((item) => {
            const active = item.prefix ? pathname.startsWith(item.prefix) : pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="flex h-18 flex-col items-center justify-center gap-1 pt-2 pb-1.5"
                >
                  {/* The M3 active indicator: a tonal pill behind the icon, not
                      a colour change on the icon alone. */}
                  <span
                    className={cn(
                      "state-layer relative inline-flex h-8 w-16 items-center justify-center rounded-full",
                      "transition-colors duration-200 ease-(--ease-standard)",
                      active ? "bg-brand-container text-brand-on-container" : "text-ink-muted",
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {item.badge ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-0.5 right-3.5 inline-flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-label-sm font-semibold text-brand-ink tabular-nums"
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "text-label-md",
                      active ? "font-semibold text-ink" : "text-ink-muted",
                    )}
                  >
                    {item.label}
                    {item.badge ? (
                      <span className="sr-only">, {plural(locale, item.badge, m.nav.items)}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
