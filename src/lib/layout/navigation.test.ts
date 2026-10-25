import { describe, expect, it } from "vitest";

import {
  isActiveHref,
  megaMenuColumns,
  navHeading,
  navLabel,
  paymentMethods,
  shopNavIndex,
  socialLinks,
  unlinkedPages,
} from "@/lib/layout/navigation";
import type {
  Category,
  PageSummary,
  ResolvedRuntimeConfig,
  RuntimeSocial,
} from "@/lib/types/api";

function category(
  id: number,
  name: string,
  slug: string,
  children: Category[] = [],
  productCount = 0,
): Category {
  return {
    id,
    name,
    slug,
    parentId: null,
    description: null,
    imageUrl: null,
    productCount,
    sortOrder: 0,
    children,
  };
}

function social(overrides: Partial<RuntimeSocial> = {}): RuntimeSocial {
  return { instagram: null, facebook: null, tiktok: null, x: null, ...overrides };
}

/** A config with nothing configured - the state of a brand-new store. */
function config(overrides: Partial<ResolvedRuntimeConfig> = {}): ResolvedRuntimeConfig {
  return {
    configVersion: "1",
    store: {
      name: "HappyKoop",
      tagline: null,
      logoUrl: null,
      logoDarkUrl: null,
      faviconUrl: null,
      email: null,
      phone: null,
      addressLines: [],
    },
    theme: { primaryColor: "#2563EB", accentColor: "#2563EB", radius: "md" },
    locale: {
      currency: "USD",
      currencySymbol: "$",
      minorUnitExponent: 2,
      locale: "en-US",
      timezone: "UTC",
    },
    urls: { apiBaseUrl: "http://127.0.0.1:8000", canonicalFrontendUrl: "http://localhost:3000" },
    seo: {
      defaultTitle: "HappyKoop",
      titleTemplate: "%s",
      defaultDescription: null,
      defaultOgImageUrl: null,
    },
    policies: { shippingSummary: null, returnsSummary: null },
    features: {
      reviews: true,
      wishlist: false,
      newsletter: false,
      guestCheckout: true,
      search: true,
      publicStockCounts: false,
    },
    payments: {
      stripe: { enabled: false, mode: "test", publishableKey: null },
      paypal: { enabled: false, mode: "sandbox", clientId: null },
    },
    social: social(),
    navigation: { primary: [], footer: [] },
    degraded: false,
    apiBaseUrlRejected: false,
    ...overrides,
  };
}

describe("isActiveHref", () => {
  it("matches the home page only exactly", () => {
    expect(isActiveHref("/", "/")).toBe(true);
    expect(isActiveHref("/shop", "/")).toBe(false);
  });

  it("keeps a section link current for pages below it", () => {
    expect(isActiveHref("/shop", "/shop")).toBe(true);
    expect(isActiveHref("/shop/page/2", "/shop")).toBe(true);
    expect(isActiveHref("/shopping", "/shop")).toBe(false);
  });

  it("ignores trailing slashes on either side", () => {
    expect(isActiveHref("/pages/about/", "/pages/about")).toBe(true);
    expect(isActiveHref("/pages/about", "/pages/about/")).toBe(true);
  });
});

describe("megaMenuColumns", () => {
  const tree = [
    category(1, "Kitchen", "kitchen", [category(2, "Pans", "pans"), category(3, "Knives", "knives")], 7),
    category(4, "Garden", "garden"),
  ];

  it("builds a column per root category with category hrefs", () => {
    const columns = megaMenuColumns(tree);

    expect(columns).toHaveLength(2);
    expect(columns[0]).toMatchObject({ name: "Kitchen", href: "/category/kitchen", productCount: 7 });
    expect(columns[0].children.map((child) => child.href)).toEqual([
      "/category/pans",
      "/category/knives",
    ]);
  });

  it("keeps a root category with no children", () => {
    expect(megaMenuColumns(tree)[1]).toMatchObject({ name: "Garden", children: [] });
  });

  it("caps columns and children, and reports what was left out", () => {
    const many = Array.from({ length: 9 }, (_, i) => category(i + 1, `C${i}`, `c${i}`));
    const deep = [category(1, "Kitchen", "kitchen", many)];

    expect(megaMenuColumns(many, { maxColumns: 4 })).toHaveLength(4);

    const [column] = megaMenuColumns(deep, { maxChildren: 3 });
    expect(column.children).toHaveLength(3);
    expect(column.hiddenChildren).toBe(6);
  });

  it("returns nothing for an empty tree, so the menu simply does not appear", () => {
    expect(megaMenuColumns([])).toEqual([]);
  });
});

describe("shopNavIndex", () => {
  it("finds the configured shop link", () => {
    expect(shopNavIndex([{ href: "/" }, { href: "/shop" }])).toBe(1);
  });

  it("reports -1 when no configured link leads to the shop", () => {
    expect(shopNavIndex([{ href: "/pages/about" }])).toBe(-1);
    expect(shopNavIndex([])).toBe(-1);
  });
});

describe("unlinkedPages", () => {
  const pages: PageSummary[] = [
    { slug: "about", title: "About" } as PageSummary,
    { slug: "privacy", title: "Privacy" } as PageSummary,
  ];

  it("drops pages the configured navigation already links", () => {
    const result = unlinkedPages(
      pages,
      config({
        navigation: {
          primary: [{ label: "About us", href: "/pages/about" }],
          footer: [],
        },
      }),
    );

    expect(result.map((page) => page.slug)).toEqual(["privacy"]);
  });

  it("matches footer links too, and ignores trailing slashes", () => {
    const result = unlinkedPages(
      pages,
      config({
        navigation: {
          primary: [],
          footer: [{ heading: "Legal", links: [{ label: "Privacy", href: "/pages/privacy/" }] }],
        },
      }),
    );

    expect(result.map((page) => page.slug)).toEqual(["about"]);
  });

  it("lists every page when nothing is configured", () => {
    expect(unlinkedPages(pages, config())).toHaveLength(2);
  });
});

describe("socialLinks", () => {
  it("returns only the handles that are set", () => {
    expect(socialLinks(social({ instagram: "https://instagram.com/happykoop" }))).toEqual([
      { platform: "instagram", href: "https://instagram.com/happykoop", label: "Instagram" },
    ]);
  });

  it("treats a blank handle as unset", () => {
    expect(socialLinks(social({ facebook: "   " }))).toEqual([]);
  });

  it("returns nothing for a store with no social handles", () => {
    expect(socialLinks(social())).toEqual([]);
  });

  it("tags each link with its own platform, so a glyph cannot be mismatched", () => {
    const links = socialLinks(
      social({ facebook: "https://facebook.com/hk", tiktok: "https://tiktok.com/@hk" }),
    );

    expect(links.map((link) => link.platform)).toEqual(["facebook", "tiktok"]);
  });
});

describe("paymentMethods", () => {
  it("shows nothing when no provider is enabled", () => {
    expect(paymentMethods(config())).toEqual([]);
  });

  it("flags a provider that is not in live mode", () => {
    const badges = paymentMethods(
      config({
        payments: {
          stripe: { enabled: true, mode: "test", publishableKey: "pk_test_x" },
          paypal: { enabled: true, mode: "live", clientId: "abc" },
        },
      }),
    );

    expect(badges).toEqual([
      { provider: "stripe", testMode: true },
      { provider: "paypal", testMode: false },
    ]);
  });
});

describe("navLabel / navHeading", () => {
  it("uses the translation the admin wrote for the page's language", () => {
    const link = { label: "About", href: "/pages/about", labels: { nl: "Over ons" } };

    expect(navLabel(link, "nl")).toBe("Over ons");
    expect(navLabel(link, "en")).toBe("About");
  });

  it("falls back to the default text, never to a blank label", () => {
    expect(navLabel({ label: "About", labels: { nl: "   " } }, "nl")).toBe("About");
    expect(navLabel({ label: "About", labels: null }, "nl")).toBe("About");
    expect(navLabel({ label: "About" }, "nl")).toBe("About");
  });

  it("does the same for footer headings", () => {
    expect(navHeading({ heading: "Help", headings: { nl: "Hulp" } }, "nl")).toBe("Hulp");
    expect(navHeading({ heading: "Help" }, "nl")).toBe("Help");
  });
});
