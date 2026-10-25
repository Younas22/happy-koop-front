import { describe, expect, it } from "vitest";

import { fmt, plural } from "@/i18n/format";
import { localizePath, stripLocale } from "@/i18n/paths";

describe("stripLocale", () => {
  it("reads the language prefix and returns the locale-free path", () => {
    expect(stripLocale("/nl/shop")).toEqual({ locale: "nl", pathname: "/shop" });
    expect(stripLocale("/nl/product/bamboo-tray")).toEqual({
      locale: "nl",
      pathname: "/product/bamboo-tray",
    });
  });

  it("treats the bare prefix as the home page", () => {
    expect(stripLocale("/nl")).toEqual({ locale: "nl", pathname: "/" });
  });

  it("reads an unprefixed path as the default language", () => {
    expect(stripLocale("/shop")).toEqual({ locale: "en", pathname: "/shop" });
    expect(stripLocale("/")).toEqual({ locale: "en", pathname: "/" });
  });

  it("does not mistake a path that merely starts with the letters for a prefix", () => {
    expect(stripLocale("/nlx/shop")).toEqual({ locale: "en", pathname: "/nlx/shop" });
  });

  it("never treats the default language as a prefix", () => {
    // `/en/...` is redirected by the proxy; here it is just a path.
    expect(stripLocale("/en/shop")).toEqual({ locale: "en", pathname: "/en/shop" });
  });
});

describe("localizePath", () => {
  it("prefixes internal paths for a non-default language", () => {
    expect(localizePath("/shop", "nl")).toBe("/nl/shop");
    expect(localizePath("/", "nl")).toBe("/nl");
  });

  it("leaves the default language unprefixed", () => {
    expect(localizePath("/shop", "en")).toBe("/shop");
    expect(localizePath("/", "en")).toBe("/");
  });

  it("keeps the query string and hash", () => {
    expect(localizePath("/search?q=tray#results", "nl")).toBe("/nl/search?q=tray#results");
    expect(localizePath("/shop?sort=price", "en")).toBe("/shop?sort=price");
  });

  it("re-points an already prefixed path instead of doubling the prefix", () => {
    expect(localizePath("/nl/shop", "nl")).toBe("/nl/shop");
    expect(localizePath("/nl/shop", "en")).toBe("/shop");
  });

  it("never localizes the admin or the API", () => {
    expect(localizePath("/admin/orders", "nl")).toBe("/admin/orders");
    expect(localizePath("/api/contact", "nl")).toBe("/api/contact");
    expect(localizePath("/nl/admin", "nl")).toBe("/admin");
  });

  it("leaves anything that is not a same-site path alone", () => {
    expect(localizePath("https://example.com/shop", "nl")).toBe("https://example.com/shop");
    expect(localizePath("//cdn.example.com/x.png", "nl")).toBe("//cdn.example.com/x.png");
    expect(localizePath("mailto:hi@example.com", "nl")).toBe("mailto:hi@example.com");
    expect(localizePath("#reviews", "nl")).toBe("#reviews");
  });
});

describe("fmt / plural", () => {
  it("fills placeholders and leaves unknown ones visible", () => {
    expect(fmt("Hello {name}", { name: "Ada" })).toBe("Hello Ada");
    expect(fmt("Hello {name}")).toBe("Hello {name}");
  });

  it("picks the plural form for the language", () => {
    const forms = { one: "{count} artikel", other: "{count} artikelen" };
    expect(plural("nl", 1, forms)).toBe("1 artikel");
    expect(plural("nl", 3, forms)).toBe("3 artikelen");
    expect(plural("nl", 0, forms)).toBe("0 artikelen");
  });
});
