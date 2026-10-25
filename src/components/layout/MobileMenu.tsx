"use client";

import { ArrowRight, Mail, Menu, Package, Phone, User as UserIcon } from "lucide-react";
import * as React from "react";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/Drawer";
import { useI18n, usePathnameWithoutLocale } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { Link } from "@/i18n/Link";
import { isActiveHref, type MegaMenuColumn, navLabel } from "@/lib/layout/navigation";
import type { NavLink } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

export interface MobileMenuProps {
  /** `navigation.primary` from runtime config. */
  primaryNav: readonly NavLink[];
  /** Category columns from the server, for the nested accordion. */
  categories: readonly MegaMenuColumn[];
  /** Store contact details; both may be null. */
  contact: { email: string | null; phone: string | null };
  storeName: string;
}

const drawerLinkClass =
  "state-layer flex min-h-12 items-center rounded-full px-4 text-label-lg transition-colors duration-200 ease-(--ease-standard)";

/**
 * The phone navigation drawer, opened from the bar's leading button.
 *
 * It sits at the START of the header row, where a phone's menu button belongs.
 * The drawer carries what the desktop bar shows in several places - the
 * configured primary links, the category tree, the account links and the
 * language switcher - so a phone reaches all of it from one place. The
 * category data is passed in from the server; the drawer never fetches.
 *
 * The open state is tied to the path it was opened on, so navigating closes the
 * drawer by derivation - no effect, and a back/forward can never leave it open
 * over the new page.
 */
export function MobileMenu({ primaryNav, categories, contact, storeName }: MobileMenuProps) {
  const pathname = usePathnameWithoutLocale();
  const { locale, m } = useI18n();
  const [openedOn, setOpenedOn] = React.useState<string | null>(null);

  const open = openedOn === pathname;
  const hasContact = Boolean(contact.email || contact.phone);

  return (
    <Drawer open={open} onOpenChange={(next) => setOpenedOn(next ? pathname : null)}>
      <button
        type="button"
        onClick={() => setOpenedOn(pathname)}
        className="state-layer tap-target -ml-2 inline-flex items-center justify-center rounded-full text-ink md:hidden"
        aria-label={m.header.openMenu}
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <DrawerContent side="left" aria-describedby={undefined}>
        <DrawerHeader>
          <DrawerTitle className="text-title-lg text-ink">{storeName}</DrawerTitle>
        </DrawerHeader>

        <DrawerBody className="px-2">
          {primaryNav.length > 0 ? (
            <nav aria-label={m.header.main}>
              <ul>
                {primaryNav.map((link) => {
                  const active = isActiveHref(pathname, link.href);
                  return (
                    <li key={`${link.href}-${link.label}`}>
                      <Link
                        href={link.href}
                        className={cn(
                          drawerLinkClass,
                          active ? "bg-brand-container text-brand-on-container" : "text-ink",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {navLabel(link, locale)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}

          {categories.length > 0 ? (
            <nav
              aria-label={m.header.categories}
              className={cn(primaryNav.length > 0 && "mt-4 border-t border-line pt-3")}
            >
              <p className="label-eyebrow px-4 pb-1">{m.header.categories}</p>

              <Accordion type="single" collapsible className="px-2">
                {categories.map((column) =>
                  column.children.length > 0 ? (
                    <AccordionItem key={column.id} value={String(column.id)}>
                      <AccordionTrigger className="px-2">{column.name}</AccordionTrigger>
                      <AccordionContent className="pb-0">
                        <ul>
                          <li>
                            <Link
                              href={column.href}
                              className={cn(drawerLinkClass, "min-h-11 text-brand")}
                            >
                              {fmt(m.header.allIn, { name: column.name })}
                            </Link>
                          </li>
                          {column.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={child.href}
                                className={cn(drawerLinkClass, "min-h-11 text-ink-muted")}
                                aria-current={
                                  isActiveHref(pathname, child.href) ? "page" : undefined
                                }
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ) : (
                    <Link
                      key={column.id}
                      href={column.href}
                      className={cn(drawerLinkClass, "text-ink")}
                      aria-current={isActiveHref(pathname, column.href) ? "page" : undefined}
                    >
                      {column.name}
                    </Link>
                  ),
                )}
              </Accordion>

              <Link href="/shop" className={cn(drawerLinkClass, "mt-1 gap-1.5 font-semibold text-brand")}>
                {m.header.browseAll}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </nav>
          ) : null}

          <div className="mt-4 border-t border-line pt-3">
            <ul>
              <li>
                <Link href="/account" className={cn(drawerLinkClass, "text-ink")}>
                  <UserIcon className="mr-2.5 size-4 shrink-0" aria-hidden="true" />
                  {m.header.account}
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className={cn(drawerLinkClass, "text-ink")}>
                  <Package className="mr-2.5 size-4 shrink-0" aria-hidden="true" />
                  {m.header.orders}
                </Link>
              </li>
            </ul>
          </div>

          <LanguageSwitcher variant="list" className="mt-4 border-t border-line pt-3" />
        </DrawerBody>

        {hasContact ? (
          <DrawerFooter>
            <ul className="space-y-1 text-body-sm text-ink-muted">
              {contact.phone ? (
                <li>
                  <a
                    href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                    className="inline-flex items-center gap-2 rounded-xs transition-colors hover:text-ink"
                  >
                    <Phone className="size-4 shrink-0" aria-hidden="true" />
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact.email ? (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-2 rounded-xs transition-colors hover:text-ink"
                  >
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{contact.email}</span>
                  </a>
                </li>
              ) : null}
            </ul>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
