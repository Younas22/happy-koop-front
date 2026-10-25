import { Mail, Phone } from "lucide-react";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { FooterColumn } from "@/components/layout/FooterColumn";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { SocialIcon } from "@/components/layout/SocialIcon";
import { fmt } from "@/i18n/format";
import { Link } from "@/i18n/Link";
import { getI18n } from "@/i18n/server";
import { fetchCategories, fetchPages } from "@/lib/catalog/queries";
import {
  FOOTER_PAGE_LINK_LIMIT,
  megaMenuColumns,
  navHeading,
  navLabel,
  paymentMethods,
  socialLinks,
  unlinkedPages,
} from "@/lib/layout/navigation";
import type { ResolvedRuntimeConfig } from "@/lib/types/api";

export interface SiteFooterProps {
  config: ResolvedRuntimeConfig;
}

const footerLinkClass =
  "inline-flex min-h-9 items-center rounded-xs text-body-md text-ink-inverse/70 transition-colors hover:text-ink-inverse";

/**
 * Site footer, in the brand's ink.
 *
 * The dark surface bookends the page with the ink strip above the header, so
 * the storefront reads as one framed brand rather than a white page that just
 * stops. Content is laid out as a brand column and up to five link columns,
 * collapsing to accordions on a phone, with a bottom bar for the copyright,
 * payment methods, currency and language.
 *
 * Built from `navigation.footer` (in the page's language where the admin wrote
 * one), the store's published pages and categories, `policies`, `payments`,
 * `social` and `store` contact details. Every block is skipped when its data
 * is absent - no empty column headings, no placeholder contact details, no
 * payment badge for a provider that is switched off, and no newsletter form,
 * because the store settings expose a newsletter flag but the API has no
 * subscribe endpoint to send an address to.
 *
 * The brand mark uses the admin's "Logo (dark background)" upload and falls
 * back to a white text logo - never to the regular mark, which is drawn for a
 * light page.
 */
export async function SiteFooter({ config }: SiteFooterProps) {
  const { navigation, store, locale: storeLocale } = config;
  const { locale, m } = await getI18n();

  const socials = socialLinks(config.social);
  const payments = paymentMethods(config);
  const year = new Date().getFullYear();

  const shipping = config.policies.shippingSummary?.trim() || null;
  const returns = config.policies.returnsSummary?.trim() || null;
  const hasContact = Boolean(store.email || store.phone || store.addressLines.length > 0);

  // A failed read simply means no automatic column; the configured navigation
  // is unaffected and the footer still renders.
  const [pageResult, categoryResult] = await Promise.all([
    fetchPages(),
    fetchCategories({ tree: true }),
  ]);

  const pages = pageResult.data ? unlinkedPages(pageResult.data, config) : [];
  const shownPages = pages.slice(0, FOOTER_PAGE_LINK_LIMIT);
  const categories = megaMenuColumns(categoryResult.data ?? [], {
    maxColumns: 6,
    maxChildren: 0,
  });

  return (
    <footer className="mt-20 bg-ink text-ink-inverse">
      {shipping || returns ? (
        <div className="border-b border-white/10">
          <div className="page-container grid gap-6 py-8 sm:grid-cols-2 sm:gap-10">
            {shipping ? (
              <div className="space-y-2">
                <h2 className="label-eyebrow text-ink-inverse/55">{m.footer.shipping}</h2>
                <p className="max-w-prose text-body-md whitespace-pre-line text-ink-inverse/80">
                  {shipping}
                </p>
              </div>
            ) : null}
            {returns ? (
              <div className="space-y-2">
                <h2 className="label-eyebrow text-ink-inverse/55">{m.footer.returns}</h2>
                <p className="max-w-prose text-body-md whitespace-pre-line text-ink-inverse/80">
                  {returns}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="page-container pt-12 pb-8 sm:pt-16">
        <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
          <div className="space-y-5 pb-8 sm:col-span-2 sm:pb-0 lg:col-span-1">
            <BrandLogo
              store={store}
              tone="dark"
              height={34}
              homeLabel={fmt(m.header.homeLabel, { store: store.name })}
              className="max-w-52"
            />
            {store.tagline ? (
              <p className="max-w-80 text-body-md text-ink-inverse/70">{store.tagline}</p>
            ) : null}
            {socials.length > 0 ? (
              <ul className="flex flex-wrap items-center gap-2.5">
                {socials.map(({ platform, href, label }) => (
                  <li key={platform}>
                    {/* Icon-only, so the accessible name lives on the link.
                        It names the store as well as the network, because
                        "Instagram" alone does not say whose profile it is. */}
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer me"
                      aria-label={fmt(m.footer.socialOn, { store: store.name, network: label })}
                      title={label}
                      className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-ink-inverse/80 transition-[color,background-color,border-color] duration-200 ease-(--ease-standard) hover:border-white hover:bg-white hover:text-ink"
                    >
                      <SocialIcon platform={platform} className="size-4.5" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {navigation.footer.map((group) =>
            group.links.length > 0 ? (
              <FooterColumn
                key={group.heading}
                heading={navHeading(group, locale)}
                landmark
                tone="dark"
              >
                <ul className="space-y-0.5">
                  {group.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <Link href={link.href} className={footerLinkClass}>
                        {navLabel(link, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </FooterColumn>
            ) : null,
          )}

          {/* The catalog itself, so the footer is useful on a store whose
              admin has not written any footer columns yet. */}
          {categories.length > 0 ? (
            <FooterColumn heading={m.footer.categories} landmark tone="dark">
              <ul className="space-y-0.5">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link href={category.href} className={footerLinkClass}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterColumn>
          ) : null}

          {shownPages.length > 0 ? (
            <FooterColumn heading={m.footer.pages} landmark tone="dark">
              <ul className="space-y-0.5">
                {shownPages.map((page) => (
                  <li key={page.slug}>
                    <Link href={`/pages/${page.slug}`} className={footerLinkClass}>
                      {page.title}
                    </Link>
                  </li>
                ))}
                {pages.length > shownPages.length ? (
                  <li>
                    <Link
                      href="/pages"
                      className="inline-flex min-h-9 items-center rounded-xs text-body-md font-medium text-ink-inverse underline-offset-4 hover:underline"
                    >
                      {m.footer.allPages}
                    </Link>
                  </li>
                ) : null}
              </ul>
            </FooterColumn>
          ) : null}

          {hasContact ? (
            <FooterColumn heading={m.footer.contact} tone="dark">
              <ul className="space-y-2 text-body-md text-ink-inverse/70">
                {store.email ? (
                  <li>
                    <a
                      href={`mailto:${store.email}`}
                      className="inline-flex items-center gap-2 rounded-xs break-all transition-colors hover:text-ink-inverse"
                    >
                      <Mail className="size-4 shrink-0" aria-hidden="true" />
                      {store.email}
                    </a>
                  </li>
                ) : null}
                {store.phone ? (
                  <li>
                    <a
                      href={`tel:${store.phone.replace(/[^+\d]/g, "")}`}
                      className="inline-flex items-center gap-2 rounded-xs transition-colors hover:text-ink-inverse"
                    >
                      <Phone className="size-4 shrink-0" aria-hidden="true" />
                      {store.phone}
                    </a>
                  </li>
                ) : null}
                {store.addressLines.length > 0 ? (
                  <li>
                    <address className="not-italic">
                      {store.addressLines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                  </li>
                ) : null}
              </ul>
            </FooterColumn>
          ) : null}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-body-sm text-ink-inverse/55">
            &copy; {year} {store.name}. {m.footer.rights}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-body-sm text-ink-inverse/60">
            {/* Only the providers the store has actually switched on, and a
                test/sandbox provider says so instead of looking like a
                working checkout. */}
            {payments.length > 0 ? (
              <ul aria-label={m.footer.payments} className="flex flex-wrap items-center gap-2">
                {payments.map((method) => (
                  <li
                    key={method.provider}
                    className="inline-flex min-h-8 items-center gap-1 rounded-md border border-white/15 px-2.5 text-label-md text-ink-inverse/85"
                  >
                    {method.provider === "paypal" ? m.footer.paypal : m.footer.card}
                    {method.testMode ? (
                      <span className="text-ink-inverse/50"> · {m.footer.testMode}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="tabular-nums">{fmt(m.footer.pricesIn, { currency: storeLocale.currency })}</p>
            <LanguageSwitcher tone="dark" />
          </div>
        </div>
      </div>
    </footer>
  );
}
