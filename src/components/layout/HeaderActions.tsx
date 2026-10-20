"use client";

import { Menu, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { SearchDialog } from "@/components/search/SearchDialog";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/Drawer";
import { selectCartCount, useCartStore } from "@/lib/cart/store";
import type { NavLink } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

export interface HeaderActionsProps {
  /** `navigation.primary` from runtime config, for the mobile menu. */
  primaryNav: readonly NavLink[];
  /** Hides the search affordances when `features.search` is false. */
  searchEnabled: boolean;
  storeName: string;
}

/**
 * The interactive part of the header: mobile menu, search, cart and account.
 * Kept in one client island so the rest of the header stays a server
 * component.
 */
export function HeaderActions({ primaryNav, searchEnabled, storeName }: HeaderActionsProps) {
  const pathname = usePathname();
  const count = useCartStore(selectCartCount);

  /**
   * Which sheet is open, tied to the path it was opened on. Navigation
   * therefore closes every sheet by derivation - no effect, so a back/forward
   * can never leave one open over the new page.
   */
  const [sheet, setSheet] = React.useState<{
    path: string;
    open: "menu" | "search" | "cart" | null;
  }>({ path: pathname, open: null });

  const current = sheet.path === pathname ? sheet.open : null;
  const setOpen = (which: "menu" | "search" | "cart", open: boolean) =>
    setSheet({ path: pathname, open: open ? which : null });

  const menuOpen = current === "menu";
  const searchOpen = current === "search";
  const cartOpen = current === "cart";

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {searchEnabled ? (
        <>
          <button
            type="button"
            onClick={() => setOpen("search", true)}
            className="tap-target inline-flex items-center justify-center rounded-md text-ink transition-colors hover:bg-sunken md:hidden"
            aria-label="Search"
          >
            <Search className="size-5" aria-hidden="true" />
          </button>
          <SearchDialog open={searchOpen} onOpenChange={(next) => setOpen("search", next)} />
        </>
      ) : null}

      <AccountMenu />

      <button
        type="button"
        onClick={() => setOpen("cart", true)}
        className="tap-target relative inline-flex items-center justify-center rounded-md text-ink transition-colors hover:bg-sunken"
        aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart, empty"}
      >
        <ShoppingBag className="size-5" aria-hidden="true" />
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 inline-flex min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-2xs font-semibold text-brand-ink tabular-nums"
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>
      <CartDrawer open={cartOpen} onOpenChange={(next) => setOpen("cart", next)} />

      {primaryNav.length > 0 ? (
        <Drawer open={menuOpen} onOpenChange={(next) => setOpen("menu", next)}>
          <button
            type="button"
            onClick={() => setOpen("menu", true)}
            className="tap-target inline-flex items-center justify-center rounded-md text-ink transition-colors hover:bg-sunken md:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <DrawerContent side="left" aria-describedby={undefined}>
            <DrawerHeader>
              <DrawerTitle className="text-base font-semibold text-ink">{storeName}</DrawerTitle>
            </DrawerHeader>
            <DrawerBody className="px-2">
              <nav aria-label="Main">
                <ul>
                  {primaryNav.map((link) => {
                    const active = pathname === link.href;
                    return (
                      <li key={`${link.href}-${link.label}`}>
                        <Link
                          href={link.href}
                          className={cn(
                            "flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors",
                            active ? "bg-brand-tint text-brand" : "text-ink hover:bg-sunken",
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      ) : null}
    </div>
  );
}
