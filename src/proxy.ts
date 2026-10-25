import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HEADER,
  type Locale,
} from "@/i18n/config";
import { localizePath, stripLocale } from "@/i18n/paths";

/**
 * Language routing.
 *
 * English lives at unprefixed URLs and every other language under its prefix.
 * The app's routes are locale-free (`app/(storefront)/shop`), so a Dutch
 * request is REWRITTEN, not redirected: `/nl/shop` keeps its URL in the
 * address bar while `/shop` renders, with the language passed in a request
 * header the server reads through `getLocale()`.
 *
 * This is the proxy-rewrite variant of Next's i18n routing rather than an
 * `app/[lang]` segment. A `[lang]` root segment would have forced the admin -
 * a separate application with no language - into a second root layout, and its
 * root parameter cannot be read from Route Handlers or Server Actions, which
 * this storefront uses for its cart, checkout and account flows.
 *
 * Rules:
 *  1. `/en/...` redirects to the unprefixed URL: English has ONE address, so
 *     search engines never see two copies of a page.
 *  2. `/nl/...` renders Dutch and remembers the choice in a cookie.
 *  3. An unprefixed URL renders English - unless the visitor earlier chose
 *     another language, in which case they are sent to that language's URL.
 *  4. `/nl/admin` and `/nl/api` are not pages; they redirect to their real,
 *     language-free addresses.
 *
 * The locale header is always SET, never appended, so a client cannot smuggle
 * a different language in past the URL.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const [, firstSegment] = pathname.split("/");

  // 1. The default language never carries a prefix.
  if (firstSegment === DEFAULT_LOCALE) {
    const target = request.nextUrl.clone();
    target.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(target, 308);
  }

  const { locale, pathname: bare } = stripLocale(pathname);

  // 4. The admin and the API have no language.
  if (locale !== DEFAULT_LOCALE && (bare === "/admin" || bare.startsWith("/admin/") || bare.startsWith("/api/"))) {
    const target = request.nextUrl.clone();
    target.pathname = bare;
    return NextResponse.redirect(target, 308);
  }

  // 3. An earlier explicit choice wins over an unprefixed link.
  if (locale === DEFAULT_LOCALE) {
    const preferred = request.cookies.get(LOCALE_COOKIE)?.value;
    if (isLocale(preferred) && preferred !== DEFAULT_LOCALE) {
      const target = request.nextUrl.clone();
      target.pathname = localizePath(pathname, preferred);
      target.search = search;
      return NextResponse.redirect(target, 307);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);

  let response: NextResponse;
  if (locale === DEFAULT_LOCALE) {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    // 2. Same page, served under the language prefix.
    const target = request.nextUrl.clone();
    target.pathname = bare;
    response = NextResponse.rewrite(target, { request: { headers: requestHeaders } });
  }

  rememberLocale(request, response, locale);
  return response;
}

function rememberLocale(request: NextRequest, response: NextResponse, locale: Locale) {
  // Only a non-default language is worth remembering: an English visit must
  // not overwrite a Dutch visitor's choice just because they followed an
  // unprefixed link - the switcher sets English explicitly when they choose it.
  if (locale === DEFAULT_LOCALE) return;
  if (request.cookies.get(LOCALE_COOKIE)?.value === locale) return;

  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

export const config = {
  // Everything except the API, the admin, Next's internals and files with an
  // extension (images, robots.txt, sitemap.xml, the favicon).
  matcher: ["/((?!api/|admin|_next/|.*\\..*).*)"],
};
