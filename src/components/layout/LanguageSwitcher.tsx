"use client";

import { Globe } from "lucide-react";
import * as React from "react";

import { useI18n, usePathnameWithoutLocale } from "@/i18n/client";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_INFO,
  LOCALES,
  type Locale,
} from "@/i18n/config";
import { localizePath } from "@/i18n/paths";
import { cn } from "@/lib/utils/cn";

export interface LanguageSwitcherProps {
  /**
   * `inline` - a compact `EN | NL` control for the header strip.
   * `list`   - the full language names, one per row, for the menu drawer.
   */
  variant?: "inline" | "list";
  /** `dark` for the ink-coloured header strip and footer. */
  tone?: "light" | "dark";
  /** Languages the store has switched on; defaults to all of them. */
  enabled?: readonly Locale[];
  className?: string;
}

/**
 * Switches the page between languages, staying on the same page.
 *
 * Each option is a real link to the same page in the other language, so it
 * works without JavaScript and can be opened in a new tab. Two things happen on
 * a normal click that a plain link cannot do:
 *
 *  - The choice is written to a cookie. That matters most for English: an
 *    unprefixed URL alone cannot tell "chose English" apart from "followed an
 *    English link", and the proxy would otherwise send a Dutch visitor back.
 *  - The query string and hash are carried over (`/shop?sort=price` stays
 *    sorted), read at click time so this component needs no Suspense boundary.
 *
 * The switch is a FULL page load, deliberately. The root layout - which sets
 * `<html lang>` and holds the dictionary - is not re-rendered by a client-side
 * navigation, so a soft navigation would leave the old language in place.
 *
 * Languages are named in their own language ("Nederlands", not a flag): a flag
 * is a country, not a language.
 */
export function LanguageSwitcher({
  variant = "inline",
  tone = "light",
  enabled = LOCALES,
  className,
}: LanguageSwitcherProps) {
  const { locale, m } = useI18n();
  const pathname = usePathnameWithoutLocale();

  const options = LOCALES.filter((option) => enabled.includes(option));
  if (options.length < 2) return null;

  function choose(event: React.MouseEvent<HTMLAnchorElement>, target: Locale) {
    // Let modified clicks (new tab, new window) behave like any link.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

    event.preventDefault();
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    if (target === locale) return;

    const href = localizePath(pathname, target) + window.location.search + window.location.hash;
    window.location.assign(href);
  }

  if (variant === "list") {
    return (
      <nav aria-label={m.language.choose} className={className}>
        <p className={cn("label-eyebrow px-4 pb-1", tone === "dark" && "text-ink-inverse/60")}>
          {m.language.label}
        </p>
        <ul>
          {options.map((option) => {
            const active = option === locale;
            return (
              <li key={option}>
                <a
                  href={localizePath(pathname, option)}
                  hrefLang={LOCALE_INFO[option].hreflang}
                  lang={LOCALE_INFO[option].htmlLang}
                  aria-current={active ? "true" : undefined}
                  onClick={(event) => choose(event, option)}
                  className={cn(
                    "state-layer flex min-h-12 items-center justify-between rounded-full px-4 text-label-lg transition-colors duration-200 ease-(--ease-standard)",
                    active ? "bg-brand-container text-brand-on-container" : "text-ink",
                  )}
                >
                  {LOCALE_INFO[option].nativeName}
                  <span className="text-label-md text-ink-subtle">{LOCALE_INFO[option].short}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  const dark = tone === "dark";

  return (
    <nav aria-label={m.language.choose} className={cn("flex items-center gap-1.5", className)}>
      <Globe
        className={cn("size-3.5 shrink-0", dark ? "text-ink-inverse/60" : "text-ink-subtle")}
        aria-hidden="true"
      />
      <ul className="flex items-center">
        {options.map((option, index) => {
          const active = option === locale;
          return (
            <li key={option} className="flex items-center">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={cn("mx-0.5", dark ? "text-ink-inverse/30" : "text-line-strong")}
                >
                  |
                </span>
              ) : null}
              <a
                href={localizePath(pathname, option)}
                hrefLang={LOCALE_INFO[option].hreflang}
                lang={LOCALE_INFO[option].htmlLang}
                aria-current={active ? "true" : undefined}
                // The short code is what is drawn; the native name is what a
                // screen reader announces.
                aria-label={LOCALE_INFO[option].nativeName}
                title={LOCALE_INFO[option].nativeName}
                onClick={(event) => choose(event, option)}
                className={cn(
                  "inline-flex min-h-8 min-w-8 items-center justify-center rounded-xs px-1 text-label-md tracking-wide transition-colors",
                  dark
                    ? active
                      ? "font-semibold text-ink-inverse underline decoration-2 underline-offset-4"
                      : "text-ink-inverse/65 hover:text-ink-inverse"
                    : active
                      ? "font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4"
                      : "text-ink-muted hover:text-ink",
                )}
              >
                {LOCALE_INFO[option].short}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
