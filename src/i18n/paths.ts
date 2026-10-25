import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";

/**
 * Locale-aware paths. Pure and isomorphic: the proxy, server components and
 * client components all agree on what `/nl/shop` means because they all use
 * these two functions.
 */

/** Paths that are never localized: the admin application and the API. */
const UNLOCALIZED_PREFIXES = ["/admin", "/api"];

function isUnlocalized(path: string): boolean {
  return UNLOCALIZED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`));
}

/**
 * Splits a pathname into its locale and the locale-free path.
 *
 * `/nl/shop` -> `{ locale: "nl", pathname: "/shop" }`
 * `/shop`    -> `{ locale: "en", pathname: "/shop" }`
 * `/nl`      -> `{ locale: "nl", pathname: "/" }`
 */
export function stripLocale(pathname: string): { locale: Locale; pathname: string } {
  const [, first, ...rest] = pathname.split("/");

  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    const remainder = rest.join("/");
    return { locale: first, pathname: remainder === "" ? "/" : `/${remainder}` };
  }

  return { locale: DEFAULT_LOCALE, pathname: pathname === "" ? "/" : pathname };
}

/**
 * The URL of an internal path in a given language.
 *
 * Anything that is not a same-site absolute path - an external URL, `mailto:`,
 * `tel:`, a bare `#hash`, a protocol-relative `//host` - is returned untouched,
 * as are the admin and API paths, which have no language. A path that already
 * carries a locale prefix is re-pointed rather than double-prefixed, which is
 * what the language switcher relies on.
 */
export function localizePath(href: string, locale: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;

  // Split off ?query and #hash so only the path is rewritten.
  const match = /^([^?#]*)(.*)$/.exec(href);
  const rawPath = match?.[1] ?? href;
  const suffix = match?.[2] ?? "";

  const { pathname } = stripLocale(rawPath);
  if (isUnlocalized(pathname)) return `${pathname}${suffix}`;

  if (locale === DEFAULT_LOCALE) return `${pathname}${suffix}`;

  const localized = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return `${localized}${suffix}`;
}
