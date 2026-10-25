"use client";

import { Home, MapPin, Package, UserCog } from "lucide-react";
import { Link } from "@/i18n/Link";

import { cn } from "@/lib/utils/cn";
import { usePathnameWithoutLocale } from "@/i18n/client";

const ITEMS = [
  { href: "/account", label: "Overview", icon: Home },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: UserCog },
] as const;

/**
 * Account navigation.
 *
 * Desktop: a vertical sidebar list. Mobile: the same list in one horizontally
 * scrollable row, so it never wraps into a tall block or forces page-level
 * horizontal scroll. The current item is marked with `aria-current`.
 */
export function AccountNav() {
  const pathname = usePathnameWithoutLocale();

  function isCurrent(href: string): boolean {
    if (href === "/account") return pathname === "/account";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-22">
      <ul
        className={cn(
          "flex gap-1.5 overflow-x-auto pb-1",
          "[scrollbar-width:thin]",
          "lg:flex-col lg:overflow-visible lg:pb-0",
        )}
      >
        {ITEMS.map((item) => {
          const current = isCurrent(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "tap-target flex items-center gap-2 rounded-md border px-3 text-label-lg transition-colors",
                  "lg:w-full",
                  current
                    ? "border-brand bg-brand-container text-brand-on-container"
                    : "state-layer border-transparent text-ink",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
