import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { LOCALE_COOKIE, LOCALE_HEADER } from "@/i18n/config";
import { proxy } from "@/proxy";

/**
 * The language routing rules. These are the ones that decide whether a Dutch
 * visitor sees Dutch, whether English has exactly one URL, and whether a
 * forged header can switch the language - so each rule is pinned down here.
 */

function request(path: string, init: { cookie?: string; headers?: Record<string, string> } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set("cookie", init.cookie);
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

/** The locale the proxy forwarded to the app, read from the response. */
function forwardedLocale(response: Response): string | null {
  return response.headers.get(`x-middleware-request-${LOCALE_HEADER}`);
}

describe("proxy", () => {
  it("serves Dutch under /nl by rewriting to the locale-free route", () => {
    const response = proxy(request("/nl/shop?sort=price"));

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost:3000/shop?sort=price",
    );
    expect(forwardedLocale(response)).toBe("nl");
  });

  it("remembers a Dutch visit in a cookie", () => {
    const response = proxy(request("/nl/shop"));
    expect(response.headers.get("set-cookie")).toContain(`${LOCALE_COOKIE}=nl`);
  });

  it("serves English at unprefixed URLs", () => {
    const response = proxy(request("/shop"));

    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("location")).toBeNull();
    expect(forwardedLocale(response)).toBe("en");
  });

  it("gives English exactly one URL by redirecting /en away", () => {
    const response = proxy(request("/en/shop?sort=price"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("http://localhost:3000/shop?sort=price");
  });

  it("sends a visitor who chose Dutch to the Dutch URL", () => {
    const response = proxy(request("/shop?sort=price", { cookie: `${LOCALE_COOKIE}=nl` }));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/nl/shop?sort=price");
  });

  it("keeps a visitor who chose English on English", () => {
    const response = proxy(request("/shop", { cookie: `${LOCALE_COOKIE}=en` }));

    expect(response.headers.get("location")).toBeNull();
    expect(forwardedLocale(response)).toBe("en");
  });

  it("ignores a forged locale header: the URL decides", () => {
    const response = proxy(request("/shop", { headers: { [LOCALE_HEADER]: "nl" } }));
    expect(forwardedLocale(response)).toBe("en");
  });

  it("redirects a prefixed admin or API path to its real address", () => {
    expect(proxy(request("/nl/admin/orders")).headers.get("location")).toBe(
      "http://localhost:3000/admin/orders",
    );
    expect(proxy(request("/nl/api/contact")).headers.get("location")).toBe(
      "http://localhost:3000/api/contact",
    );
  });
});
