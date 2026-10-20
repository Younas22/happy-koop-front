import { Mail, Phone } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/layout/BrandLogo";
import type { ResolvedRuntimeConfig } from "@/lib/types/api";

export interface SiteFooterProps {
  config: ResolvedRuntimeConfig;
}

/**
 * Social links, rendered only for the handles the store actually configured.
 * Lucide ships no brand glyphs, so these are honest text links rather than
 * look-alike icons.
 */
function socialLinks(config: ResolvedRuntimeConfig): { href: string; label: string }[] {
  const { social } = config;
  const candidates: { href: string | null; label: string }[] = [
    { href: social.instagram, label: "Instagram" },
    { href: social.facebook, label: "Facebook" },
    { href: social.tiktok, label: "TikTok" },
    { href: social.x, label: "X" },
  ];
  return candidates.filter((item): item is { href: string; label: string } =>
    typeof item.href === "string" && item.href.length > 0,
  );
}

/**
 * Site footer, built from `navigation.footer`, `social` and `store` contact
 * details. Every block is skipped when its data is absent - no empty column
 * headings and no placeholder contact details.
 */
export function SiteFooter({ config }: SiteFooterProps) {
  const { navigation, store } = config;
  const socials = socialLinks(config);
  const year = new Date().getFullYear();

  const hasContact = Boolean(store.email || store.phone || store.addressLines.length > 0);

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="page-container py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <BrandLogo store={store} />
            {store.tagline ? <p className="text-sm text-ink-muted">{store.tagline}</p> : null}
            {socials.length > 0 ? (
              <ul className="flex flex-wrap items-center gap-1">
                {socials.map(({ href, label }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="tap-target inline-flex items-center justify-center rounded-md px-2 text-sm text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {navigation.footer.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="text-2xs font-semibold tracking-wide text-ink-subtle uppercase">
                {group.heading}
              </h2>
              {group.links.length > 0 ? (
                <ul className="mt-3 space-y-0.5">
                  {group.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-9 items-center rounded-xs text-sm text-ink-muted transition-colors hover:text-ink hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </nav>
          ))}

          {hasContact ? (
            <div>
              <h2 className="text-2xs font-semibold tracking-wide text-ink-subtle uppercase">
                Contact
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-muted">
                {store.email ? (
                  <li>
                    <a
                      href={`mailto:${store.email}`}
                      className="inline-flex items-center gap-1.5 rounded-xs transition-colors hover:text-ink"
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
                      className="inline-flex items-center gap-1.5 rounded-xs transition-colors hover:text-ink"
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
            </div>
          ) : null}
        </div>

        <p className="mt-10 border-t border-line pt-6 text-xs text-ink-subtle">
          &copy; {year} {store.name}
        </p>
      </div>
    </footer>
  );
}
