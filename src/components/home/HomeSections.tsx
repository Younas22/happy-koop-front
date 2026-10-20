import Image from "next/image";
import Link from "next/link";

import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import type {
  HomeBenefitsSection,
  HomeCategoryTilesSection,
  HomeContent,
  HomeHero,
  HomeProductGridSection,
  HomeRichTextSection,
  HomeSection,
} from "@/lib/types/api";

/**
 * Homepage composition.
 *
 * Sections are rendered by `type`. An UNKNOWN type is skipped silently
 * (contract 4) so a newer backend never breaks the page. Every section also
 * renders nothing when its own payload is empty - no empty headings.
 */

function SectionHeading({ children }: { children: string }) {
  return <h2 className="text-xl font-semibold text-ink sm:text-2xl">{children}</h2>;
}

function Hero({ hero }: { hero: HomeHero }) {
  const hasCta = Boolean(hero.ctaLabel && hero.ctaHref);

  return (
    <section className="page-container pt-6 sm:pt-8">
      <div className="surface-card overflow-hidden">
        <div className="grid items-stretch lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
            <h1 className="text-2xl font-semibold text-ink sm:text-4xl">{hero.headline}</h1>
            {hero.subheadline ? (
              <p className="max-w-prose text-base text-ink-muted">{hero.subheadline}</p>
            ) : null}
            {hasCta ? (
              <div>
                <Button asChild size="lg">
                  <Link href={hero.ctaHref as string}>{hero.ctaLabel}</Link>
                </Button>
              </div>
            ) : null}
          </div>

          {hero.imageUrl ? (
            <div className="relative order-first aspect-4/3 bg-sunken lg:order-last lg:aspect-auto lg:min-h-80">
              <Image
                src={hero.imageUrl}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CategoryTiles({ section }: { section: HomeCategoryTilesSection }) {
  if (section.categories.length === 0) return null;

  return (
    <section className="page-container pt-10 sm:pt-14">
      {section.heading ? <SectionHeading>{section.heading}</SectionHeading> : null}
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {section.categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/category/${category.slug}`}
              className="surface-card group flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-md"
            >
              {category.imageUrl ? (
                <span className="relative block aspect-3/2 bg-sunken">
                  <Image
                    src={category.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 23vw, 45vw"
                    className="object-cover"
                  />
                </span>
              ) : null}
              <span className="flex flex-1 flex-col gap-0.5 p-3 sm:p-4">
                <span className="text-sm font-medium text-ink group-hover:underline">
                  {category.name}
                </span>
                {category.productCount > 0 ? (
                  <span className="text-xs text-ink-muted">
                    {category.productCount} {category.productCount === 1 ? "product" : "products"}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductGridSection({ section }: { section: HomeProductGridSection }) {
  if (section.products.length === 0) return null;

  return (
    <section className="page-container pt-10 sm:pt-14">
      {section.heading ? <SectionHeading>{section.heading}</SectionHeading> : null}
      <ProductGrid products={section.products} className="mt-4" priorityCount={2} />
    </section>
  );
}

function Benefits({ section }: { section: HomeBenefitsSection }) {
  if (section.items.length === 0) return null;

  return (
    <section className="page-container pt-10 sm:pt-14">
      {section.heading ? <SectionHeading>{section.heading}</SectionHeading> : null}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {section.items.map((item) => (
          <li key={item.title} className="surface-card p-4">
            <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
            {item.body ? <p className="mt-1.5 text-sm text-ink-muted">{item.body}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RichText({ section }: { section: HomeRichTextSection }) {
  if (!section.html) return null;

  return (
    <section className="page-container pt-10 sm:pt-14">
      {section.heading ? <SectionHeading>{section.heading}</SectionHeading> : null}
      {/* Sanitized server-side (contract 4). */}
      <div
        className="prose-hk mt-4 max-w-prose"
        dangerouslySetInnerHTML={{ __html: section.html }}
      />
    </section>
  );
}

function renderSection(section: HomeSection, index: number) {
  switch (section.type) {
    case "category_tiles":
      return <CategoryTiles key={index} section={section as HomeCategoryTilesSection} />;
    case "product_grid":
      return <ProductGridSection key={index} section={section as HomeProductGridSection} />;
    case "benefits":
      return <Benefits key={index} section={section as HomeBenefitsSection} />;
    case "rich_text":
      return <RichText key={index} section={section as HomeRichTextSection} />;
    default:
      // Unknown type: skip silently, never render an error.
      return null;
  }
}

export function HomeSections({ content }: { content: HomeContent }) {
  return (
    <>
      {content.hero ? <Hero hero={content.hero} /> : null}
      {content.sections.map(renderSection)}
    </>
  );
}
