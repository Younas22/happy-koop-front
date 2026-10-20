import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchPage } from "@/lib/catalog/queries";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { buildPageMetadata, htmlToMetaDescription } from "@/lib/utils/seo";

export async function generateMetadata({ params }: PageProps<"/pages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [config, { data: page }] = await Promise.all([getRuntimeConfig(), fetchPage(slug)]);

  if (!page) {
    return buildPageMetadata(config, { title: "Page", noindex: true });
  }

  return buildPageMetadata(config, {
    title: page.seo.title ?? page.title,
    description: page.seo.description ?? page.excerpt ?? htmlToMetaDescription(page.body),
    canonicalPath: `/pages/${page.slug}`,
    noindex: page.seo.noindex,
    ogType: "article",
  });
}

/** CMS page. The body is HTML sanitized server-side (contract 4). */
export default async function CmsPage({ params }: PageProps<"/pages/[slug]">) {
  const { slug } = await params;
  const { data: page, error } = await fetchPage(slug);

  if (error?.isNotFound()) {
    notFound();
  }

  if (!page) {
    return (
      <div className="page-container py-10">
        <ErrorState message={error?.message} unreachable={error?.isUnreachable()} />
      </div>
    );
  }

  const updated = new Date(page.updatedAt);
  const updatedValid = !Number.isNaN(updated.getTime());

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }]} current={page.title} />

      <article className="mt-4 max-w-3xl">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{page.title}</h1>
        {page.excerpt ? <p className="mt-2 text-base text-ink-muted">{page.excerpt}</p> : null}

        {page.body ? (
          <div className="prose-hk mt-6" dangerouslySetInnerHTML={{ __html: page.body }} />
        ) : null}

        {updatedValid ? (
          <p className="mt-10 border-t border-line pt-4 text-xs text-ink-subtle">
            Last updated{" "}
            <time dateTime={page.updatedAt}>
              {updated.toLocaleDateString("en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "UTC",
              })}
            </time>
          </p>
        ) : null}
      </article>
    </div>
  );
}
