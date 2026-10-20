import { Search } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { HeaderActions } from "@/components/layout/HeaderActions";
import type { ResolvedRuntimeConfig } from "@/lib/types/api";

export interface SiteHeaderProps {
  config: ResolvedRuntimeConfig;
}

/**
 * Site header. A server component apart from the interactive island, so the
 * navigation and brand mark are part of the static shell.
 *
 * Navigation comes entirely from `navigation.primary`; nothing is hardcoded,
 * and an empty list simply means no desktop nav.
 */
export function SiteHeader({ config }: SiteHeaderProps) {
  const { navigation, store, features } = config;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-sm">
      <div className="page-container flex h-16 items-center gap-3">
        <BrandLogo store={store} priority />

        {navigation.primary.length > 0 ? (
          <nav aria-label="Main" className="hidden min-w-0 flex-1 md:block">
            <ul className="flex items-center gap-1">
              {navigation.primary.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-ink transition-colors hover:bg-sunken"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <div className="hidden flex-1 md:block" />
        )}

        {features.search ? (
          // A plain GET form so search works without JavaScript.
          <form action="/search" method="get" role="search" className="hidden md:block">
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden="true"
              />
              <input
                id="site-search"
                type="search"
                name="q"
                maxLength={100}
                placeholder="Search"
                className="h-10 w-44 rounded-md border border-line-strong bg-canvas pl-8 pr-3 text-sm text-ink transition-colors placeholder:text-ink-subtle hover:border-ink-subtle lg:w-56"
              />
            </div>
          </form>
        ) : null}

        <HeaderActions
          primaryNav={navigation.primary}
          searchEnabled={features.search}
          storeName={store.name}
        />
      </div>
    </header>
  );
}
