import "server-only";

import { headers } from "next/headers";

import { DEFAULT_LOCALE, isLocale, LOCALE_HEADER, type Locale } from "@/i18n/config";
import { messagesFor, type Messages } from "@/i18n/messages";
import { localizePath } from "@/i18n/paths";

/**
 * The request's language, for Server Components, Route Handlers and Server
 * Actions alike.
 *
 * The proxy derives it from the URL and writes it to a request header, always
 * overwriting whatever the client sent - so a forged header cannot switch the
 * language of a page whose URL says otherwise. Requests the proxy does not see
 * (the admin, the API routes) fall back to the default language.
 */
export async function getLocale(): Promise<Locale> {
  const value = (await headers()).get(LOCALE_HEADER);
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getMessages(): Promise<Messages> {
  return messagesFor(await getLocale());
}

/** Locale and messages together, the common case in a page. */
export async function getI18n(): Promise<{ locale: Locale; m: Messages }> {
  const locale = await getLocale();
  return { locale, m: messagesFor(locale) };
}

/** An internal path in the request's language, for server-side redirects and forms. */
export async function localized(href: string): Promise<string> {
  return localizePath(href, await getLocale());
}
