import {
  BadgeCheck,
  Box,
  GripHorizontal,
  Leaf,
  LifeBuoy,
  Lock,
  MoveHorizontal,
  Package,
  RefreshCw,
  Ruler,
  ShieldCheck,
  Sparkles,
  Truck,
  Undo2,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/Link";

import { HeroSlider } from "@/components/home/HeroSlider";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { plural } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
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

/**
 * Benefit icons.
 *
 * `item.icon` is a free-form string an administrator typed, so it is matched
 * against this allowlist rather than used to look a component up dynamically:
 * an unknown name must not be able to reach for an arbitrary export, and the
 * bundle should only carry the glyphs that can actually render. An
 * unrecognised or absent name falls back to a neutral mark, so a benefit never
 * loses its tile over a typo.
 */
const BENEFIT_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "badge-check": BadgeCheck,
  box: Box,
  "grip-horizontal": GripHorizontal,
  leaf: Leaf,
  "life-buoy": LifeBuoy,
  lock: Lock,
  "move-horizontal": MoveHorizontal,
  package: Package,
  "refresh-cw": RefreshCw,
  ruler: Ruler,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  truck: Truck,
  "undo-2": Undo2,
  wrench: Wrench,
};

function BenefitIcon({ name }: { name: string | null }) {
  const Icon = BENEFIT_ICONS[(name ?? "").trim().toLowerCase()] ?? Sparkles;

  return (
    <span
      className="flex size-12 items-center justify-center rounded-full bg-brand-container text-brand-on-container"
      aria-hidden="true"
    >
      <Icon className="size-6" />
    </span>
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="text-headline-sm text-ink sm:text-headline-md">
      {children}
    </h2>
  );
}

function Hero({ hero }: { hero: HomeHero }) {
  const hasCta = Boolean(hero.ctaLabel && hero.ctaHref);
  // Older API responses carry only the single `imageUrl`.
  const images = hero.imageUrls ?? (hero.imageUrl ? [hero.imageUrl] : []);

  return (
    <section className="page-container pt-6 sm:pt-8">
      <div className="surface-card overflow-hidden rounded-xl elevation-2">
        <div className="grid items-stretch lg:grid-cols-2">
          {/* The M3 primary-container, so the hero reads as one tonal block
              against the canvas without a gradient or a tinted image wash. */}
          <div className="flex flex-col justify-center gap-5 bg-brand-container p-6 sm:p-10 lg:p-14">
            <h1 className="text-headline-md text-brand-on-container text-balance sm:text-display-sm">
              {hero.headline}
            </h1>
            {hero.subheadline ? (
              <p className="max-w-prose text-body-lg text-brand-on-container sm:text-title-md sm:font-normal">
                {hero.subheadline}
              </p>
            ) : null}
            {hasCta ? (
              <div>
                <Button asChild size="lg">
                  <Link href={hero.ctaHref as string}>{hero.ctaLabel}</Link>
                </Button>
              </div>
            ) : null}
          </div>

          {images.length > 0 ? (
            <div className="relative order-first aspect-4/3 overflow-hidden bg-surface-container lg:order-last lg:aspect-auto lg:min-h-100">
              <HeroSlider images={images} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

async function CategoryTiles({
  section,
}: {
  section: HomeCategoryTilesSection;
}) {
  if (section.categories.length === 0) return null;
  const { locale, m } = await getI18n();

  return (
    <section className="page-container pt-12 sm:pt-16">
      {section.heading ? (
        <SectionHeading>{section.heading}</SectionHeading>
      ) : null}
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {section.categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/category/${category.slug}`}
              className="surface-card-interactive group flex h-full flex-col overflow-hidden"
            >
              {category.imageUrl ? (
                <span className="relative block aspect-3/2 overflow-hidden rounded-t-[calc(var(--radius-lg)-1px)] bg-surface-container">
                  <Image
                    src={category.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 23vw, 45vw"
                    className="object-cover transition-transform duration-500 ease-(--ease-emphasized-decelerate) group-hover:scale-[1.04]"
                  />
                </span>
              ) : null}
              <span className="flex flex-1 flex-col gap-0.5 p-4">
                <span className="text-title-sm text-ink transition-colors group-hover:text-brand">
                  {category.name}
                </span>
                {category.productCount > 0 ? (
                  <span className="text-body-sm text-ink-muted">
                    {plural(locale, category.productCount, m.home.productCount)}
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
    <section className="page-container pt-12 sm:pt-16">
      {section.heading ? (
        <SectionHeading>{section.heading}</SectionHeading>
      ) : null}
      <ProductGrid
        products={section.products}
        className="mt-5"
        priorityCount={2}
      />
    </section>
  );
}

function Benefits({ section }: { section: HomeBenefitsSection }) {
  if (section.items.length === 0) return null;

  return (
    <section className="page-container pt-12 sm:pt-16">
      {section.heading ? (
        <SectionHeading>{section.heading}</SectionHeading>
      ) : null}
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {section.items.map((item) => (
          <li key={item.title} className="surface-card p-5 sm:p-6">
            <BenefitIcon name={item.icon} />
            <h3 className="mt-4 text-title-sm text-ink">{item.title}</h3>
            {item.body ? (
              <p className="mt-1.5 text-body-md leading-relaxed text-ink-muted">
                {item.body}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RichText({ section }: { section: HomeRichTextSection }) {
  if (!section.html) return null;

  return (
    <section className="page-container pt-12 sm:pt-16">
      {section.heading ? (
        <SectionHeading>{section.heading}</SectionHeading>
      ) : null}
      {/* Sanitized server-side (contract 4). */}
      <div
        className="prose-hk mt-5 max-w-prose"
        dangerouslySetInnerHTML={{ __html: section.html }}
      />
    </section>
  );
}

function renderSection(section: HomeSection, index: number) {
  switch (section.type) {
    case "category_tiles":
      return (
        <CategoryTiles
          key={index}
          section={section as HomeCategoryTilesSection}
        />
      );
    case "product_grid":
      return (
        <ProductGridSection
          key={index}
          section={section as HomeProductGridSection}
        />
      );
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
