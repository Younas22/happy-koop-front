/**
 * The storefront's languages.
 *
 * English is the default and lives at unprefixed URLs (`/shop`); every other
 * language gets a path prefix (`/nl/shop`). That keeps every existing link,
 * bookmark and search result valid, and gives each language its own URL - which
 * is what lets search engines index Dutch pages separately and what the
 * `hreflang` alternates point at.
 *
 * Adding a language later is a matter of adding it here and adding a
 * dictionary: nothing else in the routing hardcodes `nl`.
 */

export const LOCALES = ["en", "nl"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * How each language names itself. The switcher shows these names rather than
 * flags: a flag is a country, not a language, and Dutch is not only the
 * Netherlands.
 */
export const LOCALE_INFO: Record<
  Locale,
  {
    /** In its own language - what a speaker looks for. */
    nativeName: string;
    /** For the `<html lang>` attribute. */
    htmlLang: string;
    /** For `hreflang` alternates and `Intl` formatting. */
    hreflang: string;
    /** Short form for compact controls. */
    short: string;
  }
> = {
  en: { nativeName: "English", htmlLang: "en", hreflang: "en", short: "EN" },
  nl: { nativeName: "Nederlands", htmlLang: "nl", hreflang: "nl", short: "NL" },
};

/** Request header the proxy sets; never trusted from the client. */
export const LOCALE_HEADER = "x-hk-locale";

/** Remembers an explicit choice made with the language switcher. */
export const LOCALE_COOKIE = "hk_locale";

/** A year: a language choice should survive more than one visit. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
