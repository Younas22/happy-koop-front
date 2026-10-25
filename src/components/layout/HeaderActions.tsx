"use client";

import { Search, ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { SearchDialog } from "@/components/search/SearchDialog";
import { useI18n } from "@/i18n/client";
import { plural } from "@/i18n/format";
import { selectCartCount, useCartStore } from "@/lib/cart/store";

export interface HeaderActionsProps {
  /** Hides the search affordances when `features.search` is false. */
  searchEnabled: boolean;
}

/**
 * The trailing actions of the header: search, account and cart.
 *
 * On a phone this is deliberately two controls, not four. The menu sits at the
 * leading edge of the bar, and the account entry point is not repeated here:
 * the navigation bar at the bottom of the screen already carries Account, and
 * so does the menu drawer. Four 48px controls plus a brand mark do not fit a
 * 320px row, and the two that survive are the two a shopper reaches for.
 *
 * The search icon is shown until `lg`, where the bar has room for the inline
 * field instead; the account menu appears from `md`.
 */
export function HeaderActions({ searchEnabled }: HeaderActionsProps) {
  const pathname = usePathname();
  const { locale, m } = useI18n();
  const count = useCartStore(selectCartCount);

  /**
   * Which sheet is open, tied to the path it was opened on. Navigation
   * therefore closes every sheet by derivation - no effect, so a back/forward
   * can never leave one open over the new page.
   */
  const [sheet, setSheet] = React.useState<{
    path: string;
    open: "search" | "cart" | null;
  }>({ path: pathname, open: null });

  const current = sheet.path === pathname ? sheet.open : null;
  const setOpen = (which: "search" | "cart", open: boolean) =>
    setSheet({ path: pathname, open: open ? which : null });

  const searchOpen = current === "search";
  const cartOpen = current === "cart";

  return (
    // `ml-auto` is what keeps the actions on the right edge of a phone: the
    // desktop navigation carries the row's `flex-1`, and it is `display:none`
    // below `md`, so without this the actions pack against the brand mark and
    // leave the whole right half of the bar empty.
    <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
      {searchEnabled ? (
        <>
          <button
            type="button"
            onClick={() => setOpen("search", true)}
            className="state-layer tap-target inline-flex items-center justify-center rounded-full text-ink lg:hidden"
            aria-label={m.common.search}
          >
            <Search className="size-5" aria-hidden="true" />
          </button>
          <SearchDialog open={searchOpen} onOpenChange={(next) => setOpen("search", next)} />
        </>
      ) : null}

      <span className="hidden md:inline-flex">
        <AccountMenu />
      </span>

      <button
        type="button"
        onClick={() => setOpen("cart", true)}
        className="state-layer tap-target relative -mr-2 inline-flex items-center justify-center rounded-full text-ink sm:mr-0"
        aria-label={count > 0 ? plural(locale, count, m.header.cartItems) : m.header.cartEmpty}
      >
        <ShoppingBag className="size-5" aria-hidden="true" />
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1 text-label-sm font-semibold text-brand-ink tabular-nums ring-2 ring-surface"
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>
      <CartDrawer open={cartOpen} onOpenChange={(next) => setOpen("cart", next)} />
    </div>
  );
}
