import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

import { ContactForm } from "@/components/contact/ContactForm";
import { fmt } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  const { locale, m } = await getI18n();
  return buildPageMetadata(config, {
    title: m.contact.metaTitle,
    description: fmt(m.contact.metaDescription, { store: config.store.name }),
    canonicalPath: "/contact",
    locale,
  });
}

/**
 * Contact page.
 *
 * The contact details beside the form are the store's own configured ones, and
 * each line is rendered only when it is set - an unconfigured store shows the
 * form alone rather than a placeholder address. The page promises no response
 * time, because no setting records one.
 */
export default async function ContactPage() {
  const config = await getRuntimeConfig();
  const { m } = await getI18n();
  const { store, policies } = config;

  const hasDetails = Boolean(store.email || store.phone || store.addressLines.length > 0);
  const hasPolicies = Boolean(policies.shippingSummary || policies.returnsSummary);
  // Without anything for the side column, the form stands alone and centred
  // instead of leaving an empty column beside it.
  const hasAside = hasDetails || hasPolicies;

  return (
    <div className="page-container py-10 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {m.contact.title}
        </h1>
        <p className="mt-3 text-body-lg text-ink-muted">{m.contact.intro}</p>
      </div>

      <div
        className={
          hasAside
            ? "mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14"
            : "mx-auto mt-10 max-w-2xl"
        }
      >
        <div className="surface-card p-5 sm:p-7">
          <ContactForm />
        </div>

        {hasAside ? (
          <aside className="space-y-8">
            {hasDetails ? (
              <div>
                <h2 className="label-eyebrow">{m.contact.otherWays}</h2>
                <ul className="mt-3 space-y-3 text-body-md text-ink-muted">
                  {store.email ? (
                    <li className="flex items-start gap-2.5">
                      <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <a
                        href={`mailto:${store.email}`}
                        className="rounded-xs transition-colors hover:text-ink"
                      >
                        {store.email}
                      </a>
                    </li>
                  ) : null}
                  {store.phone ? (
                    <li className="flex items-start gap-2.5">
                      <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <a
                        href={`tel:${store.phone.replace(/[^+\d]/g, "")}`}
                        className="rounded-xs transition-colors hover:text-ink"
                      >
                        {store.phone}
                      </a>
                    </li>
                  ) : null}
                  {store.addressLines.length > 0 ? (
                    <li className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
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

            {hasPolicies ? (
              <div className="space-y-5">
                {policies.shippingSummary ? (
                  <div>
                    <h2 className="label-eyebrow">{m.contact.shipping}</h2>
                    <p className="mt-2 text-body-sm whitespace-pre-line text-ink-muted">
                      {policies.shippingSummary}
                    </p>
                  </div>
                ) : null}
                {policies.returnsSummary ? (
                  <div>
                    <h2 className="label-eyebrow">{m.contact.returns}</h2>
                    <p className="mt-2 text-body-sm whitespace-pre-line text-ink-muted">
                      {policies.returnsSummary}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
