"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { localizePath, stripLocale } from "@/i18n/paths";

/**
 * The request's language, for Client Components.
 *
 * The root layout reads the locale on the server and hands this provider the
 * one dictionary the page needs - the other languages never reach the
 * browser. Client code therefore never decides the language itself; it only
 * reads what the server resolved from the URL.
 */

interface I18nValue {
  locale: Locale;
  messages: Messages;
}

const I18nContext = React.createContext<I18nValue | null>(null);

export function LocaleProvider({
  locale,
  messages,
  children,
}: I18nValue & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18nContext(): I18nValue {
  const value = React.useContext(I18nContext);
  if (!value) {
    // Every page renders under the root layout's provider, so this means a
    // component was mounted somewhere it was never meant to be.
    throw new Error("useLocale/useMessages must be used inside <LocaleProvider>.");
  }
  return value;
}

export function useLocale(): Locale {
  return useI18nContext().locale;
}

export function useMessages(): Messages {
  return useI18nContext().messages;
}

/** Locale and messages together, the common case in a component. */
export function useI18n(): { locale: Locale; m: Messages } {
  const { locale, messages } = useI18nContext();
  return { locale, m: messages };
}

/**
 * The current path without its language prefix.
 *
 * `usePathname()` reports the browser URL - `/nl/shop` on a Dutch page - while
 * navigation is configured as locale-free paths (`/shop`). Active-link checks
 * compare against this, so they work identically in every language.
 */
export function usePathnameWithoutLocale(): string {
  return stripLocale(usePathname()).pathname;
}

/** Turns an internal path into the current language's URL. */
export function useLocalizedHref(): (href: string) => string {
  const locale = useLocale();
  return React.useCallback((href: string) => localizePath(href, locale), [locale]);
}

/** `router.push` / `router.replace` that keep the visitor in their language. */
export function useLocalizedRouter() {
  const router = useRouter();
  const localize = useLocalizedHref();

  return React.useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) =>
        router.push(localize(href), options),
      replace: (href: string, options?: Parameters<typeof router.replace>[1]) =>
        router.replace(localize(href), options),
      prefetch: (href: string, options?: Parameters<typeof router.prefetch>[1]) =>
        router.prefetch(localize(href), options),
    }),
    [router, localize],
  );
}
