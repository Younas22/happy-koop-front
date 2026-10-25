import type { Locale } from "@/i18n/config";
import type {
  Category,
  FooterNavGroup,
  NavLink,
  PageSummary,
  ResolvedRuntimeConfig,
  RuntimeSocial,
} from "@/lib/types/api";

/**
 * A navigation label in the page's language.
 *
 * Navigation is admin content, so its translations live with it: `labels.nl`
 * when the admin wrote one, otherwise the default `label`. The fallback is the
 * original text, never a blank link and never a machine guess.
 */
export function navLabel(link: Pick<NavLink, "label" | "labels">, locale: Locale): string {
  const translated = link.labels?.[locale]?.trim();
  return translated ? translated : link.label;
}

/** A footer column heading in the page's language, with the same fallback. */
export function navHeading(group: Pick<FooterNavGroup, "heading" | "headings">, locale: Locale): string {
  const translated = group.headings?.[locale]?.trim();
  return translated ? translated : group.heading;
}

/**
 * Pure helpers behind the site header and footer.
 *
 * The header and footer render nothing of their own invention: every link,
 * label and block below is derived from the admin-managed runtime config or
 * from the catalog. Keeping the derivation here - away from JSX - is what
 * makes it testable, which matters because the interesting cases are the empty
 * ones: a brand-new store with no navigation, no social handles and no
 * contact details still has to produce a correct header and footer.
 */

/** Top-level categories the mega menu shows as columns. */
export const MEGA_MENU_MAX_COLUMNS = 6;
/** Children listed per column before the "view all" link takes over. */
export const MEGA_MENU_MAX_CHILDREN = 6;
/** Automatic page links in the footer before it links the page index. */
export const FOOTER_PAGE_LINK_LIMIT = 6;

export function categoryHref(slug: string): string {
  return `/category/${slug}`;
}

/** Trailing slashes are meaningless here, so links compare without them. */
export function normalizeHref(href: string): string {
  const trimmed = href.trim();
  if (trimmed === "/") return "/";
  return trimmed.replace(/\/+$/, "");
}

/**
 * Whether a navigation link points at the page being viewed.
 *
 * A section link stays current for everything below it (`/shop` for
 * `/shop/page/2`), but the home link only ever matches the home page.
 */
export function isActiveHref(pathname: string, href: string): boolean {
  const target = normalizeHref(href);
  const current = normalizeHref(pathname);

  if (target === "/" || target === "") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}

export interface MegaMenuChild {
  id: number;
  name: string;
  href: string;
  productCount: number;
}

export interface MegaMenuColumn {
  id: number;
  name: string;
  href: string;
  imageUrl: string | null;
  productCount: number;
  children: MegaMenuChild[];
  /** Children beyond `maxChildren`, so the column can say there are more. */
  hiddenChildren: number;
}

/**
 * The category tree as mega-menu columns.
 *
 * `GET /categories?tree=true` already returns only root categories with their
 * descendants nested, so this caps the shape rather than rebuilding it. One
 * level of children is shown: deeper levels belong on the category page, not
 * in a menu panel.
 */
export function megaMenuColumns(
  categories: readonly Category[],
  options: { maxColumns?: number; maxChildren?: number } = {},
): MegaMenuColumn[] {
  const maxColumns = options.maxColumns ?? MEGA_MENU_MAX_COLUMNS;
  const maxChildren = options.maxChildren ?? MEGA_MENU_MAX_CHILDREN;

  return categories.slice(0, maxColumns).map((category) => {
    const children = category.children ?? [];

    return {
      id: category.id,
      name: category.name,
      href: categoryHref(category.slug),
      imageUrl: category.imageUrl,
      productCount: category.productCount,
      children: children.slice(0, maxChildren).map((child) => ({
        id: child.id,
        name: child.name,
        href: categoryHref(child.slug),
        productCount: child.productCount,
      })),
      hiddenChildren: Math.max(0, children.length - maxChildren),
    };
  });
}

/**
 * Published pages the configured navigation does not already link.
 *
 * `navigation.primary` and `navigation.footer` are hand-curated in the admin,
 * so a page created afterwards would otherwise be reachable only by typing its
 * URL. Matching is by href, so a page already linked under different wording
 * is not repeated.
 */
export function unlinkedPages(
  pages: readonly PageSummary[],
  config: ResolvedRuntimeConfig,
): PageSummary[] {
  const linked = new Set<string>();

  for (const link of config.navigation.primary) linked.add(normalizeHref(link.href));
  for (const group of config.navigation.footer) {
    for (const link of group.links) linked.add(normalizeHref(link.href));
  }

  return pages.filter((page) => !linked.has(normalizeHref(`/pages/${page.slug}`)));
}

/** The networks the store settings can hold a handle for. */
export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "x";

export interface SocialLink {
  platform: SocialPlatform;
  href: string;
  label: string;
}

/**
 * Social links for the handles the store actually configured.
 *
 * `platform` is what picks the brand glyph, so each link can only ever be
 * drawn with its own network's mark - the label stays the accessible name.
 */
export function socialLinks(social: RuntimeSocial): SocialLink[] {
  const candidates: { platform: SocialPlatform; href: string | null; label: string }[] = [
    { platform: "instagram", href: social.instagram, label: "Instagram" },
    { platform: "facebook", href: social.facebook, label: "Facebook" },
    { platform: "tiktok", href: social.tiktok, label: "TikTok" },
    { platform: "x", href: social.x, label: "X" },
  ];

  return candidates.filter(
    (item): item is SocialLink => typeof item.href === "string" && item.href.trim() !== "",
  );
}

export interface PaymentMethodBadge {
  /** Which provider - the caller names it in the page's language. */
  provider: "stripe" | "paypal";
  /** Set only when the provider is not in live mode, which is worth saying. */
  testMode: boolean;
}

/**
 * Payment methods the store can actually take.
 *
 * Driven by `payments.*.enabled`, never by a hardcoded row of card logos: a
 * badge for a provider that is switched off is a lie to the customer. A
 * provider still in test/sandbox mode is flagged instead of being presented as
 * a working checkout. Labels are left to the caller, so this stays
 * language-neutral.
 */
export function paymentMethods(config: ResolvedRuntimeConfig): PaymentMethodBadge[] {
  const badges: PaymentMethodBadge[] = [];
  const { stripe, paypal } = config.payments;

  if (stripe.enabled) {
    badges.push({ provider: "stripe", testMode: stripe.mode !== "live" });
  }
  if (paypal.enabled) {
    badges.push({ provider: "paypal", testMode: paypal.mode !== "live" });
  }

  return badges;
}

/**
 * The primary link the category mega menu attaches to.
 *
 * The menu is an alternative presentation of a destination the admin already
 * configured, so it hooks onto the shop link rather than adding a nav item of
 * its own. `null` means no configured link leads to the shop, and the header
 * then offers the shop route itself - a route this storefront really has, not
 * invented content.
 */
export function shopNavIndex(links: readonly { href: string }[]): number {
  return links.findIndex((link) => isActiveHref("/shop", link.href));
}
