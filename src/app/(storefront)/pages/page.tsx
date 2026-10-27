import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/i18n/Link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getLocale } from "@/i18n/server";
import { fetchPages } from "@/lib/catalog/queries";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata } from "@/lib/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRuntimeConfig();
  return buildPageMetadata(config, {
    title: "Pages",
    description: `Information pages from ${config.store.name}.`,
    canonicalPath: "/pages",
  });
}

/**
 * Index of the CMS pages.
 *
 * The footer links the first few automatically, but an administrator can
 * create any number of pages, and before this route the rest were reachable
 * only by typing a URL. Titles and excerpts come from `GET /pages`; nothing is
 * invented, and a page with no excerpt simply shows its title.
 */
export default async function PagesIndex() {
  const { data: pages, error } = await fetchPages(await getLocale());

  if (!pages) {
    return (
      <div className="page-container py-10">
        <ErrorState
          message={error?.message}
          unreachable={error?.isUnreachable()}
        />
      </div>
    );
  }

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }]} current="Pages" />

      <h1 className="mt-3 text-headline-md text-ink sm:text-headline-lg">
        Pages
      </h1>

      {pages.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={FileText}
            title="No pages have been published yet"
            description="Information pages such as shipping, returns or contact details will appear here once the store publishes them."
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {pages.map((page) => (
            <li key={page.slug} className="flex">
              <Link
                href={`/pages/${page.slug}`}
                className="surface-card-interactive group flex w-full flex-col gap-1.5 p-5"
              >
                <span className="text-title-md text-ink transition-colors group-hover:text-brand">
                  {page.title}
                </span>
                {page.excerpt ? (
                  <span className="line-clamp-3 text-body-md text-ink-muted">
                    {page.excerpt}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
