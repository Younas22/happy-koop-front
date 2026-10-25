import { Check, Package, RotateCcw, Truck } from "lucide-react";
import Image from "next/image";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { fmt } from "@/i18n/format";
import { getMessages } from "@/i18n/server";
import { formatMoney } from "@/lib/money";
import type { ProductDetail } from "@/lib/types/api";

/**
 * The below-the-fold product sections.
 *
 * EVERY section returns `null` when its data is absent or empty. There are no
 * blank labels, no "N/A" rows, no invented dimensions, certifications,
 * delivery dates or warranty claims. A store that has filled in nothing sees
 * nothing here.
 */

function SectionShell({
  id,
  heading,
  children,
}: {
  id?: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-line pt-8">
      <h2 className="text-title-lg text-ink sm:text-xl">{heading}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Section headings, in the page's language. */
async function sectionLabels() {
  return (await getMessages()).product.sections;
}

export async function ValueProps({ product }: { product: ProductDetail }) {
  if (product.valueProps.length === 0) return null;
  const t = await sectionLabels();

  return (
    <SectionShell heading={t.valueProps}>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        {product.valueProps.map((prop) => (
          <li key={prop.title} className="surface-card p-4">
            <h3 className="text-title-sm text-ink">{prop.title}</h3>
            {prop.body ? <p className="mt-1.5 text-body-md text-ink-muted">{prop.body}</p> : null}
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

/**
 * Product-in-use media: everything after the first image, plus any video.
 * Shown only when there is genuinely more media than the gallery needs.
 */
export async function InUseMedia({ product }: { product: ProductDetail }) {
  const extra = [...product.media].sort((a, b) => a.sortOrder - b.sortOrder).slice(1);
  const images = extra.filter((item) => item.type === "image");
  const videos = extra.filter((item) => item.type === "video");

  if (images.length === 0 && videos.length === 0) return null;
  const { product: p } = await getMessages();

  return (
    <SectionShell heading={p.sections.inUse}>
      <div className="space-y-4">
        {images.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 sm:gap-4">
            {images.map((item) => (
              <li key={item.id} className="surface-card relative aspect-4/3 overflow-hidden bg-surface-container">
                <Image
                  src={item.url}
                  alt={item.alt ?? ""}
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 20rem, 45vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        ) : null}

        {videos.map((item) => (
          <video
            key={item.id}
            src={item.url}
            poster={item.thumbnailUrl ?? undefined}
            controls
            preload="none"
            className="surface-card w-full"
            aria-label={item.alt ?? fmt(p.video, { name: product.name })}
          />
        ))}
      </div>
    </SectionShell>
  );
}

export async function WhatsIncluded({ product }: { product: ProductDetail }) {
  if (product.whatsIncluded.length === 0) return null;
  const t = await sectionLabels();

  return (
    <SectionShell heading={t.included}>
      <ul className="space-y-2 text-body-md text-ink-muted">
        {product.whatsIncluded.map((entry) => (
          <li key={entry} className="flex gap-2.5">
            <Package className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
            <span>{entry}</span>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

export async function Description({ product }: { product: ProductDetail }) {
  if (!product.description) return null;
  const t = await sectionLabels();

  return (
    <SectionShell heading={t.details}>
      {/* Sanitized server-side (contract 4). */}
      <div
        className="prose-hk max-w-prose"
        dangerouslySetInnerHTML={{ __html: product.description }}
      />
    </SectionShell>
  );
}

/**
 * Specifications, grouped exactly as `specificationGroups` defines them.
 * Groups with no items are dropped, and a group's own ordering is respected.
 */
export async function Specifications({ product }: { product: ProductDetail }) {
  const groups = [...product.specificationGroups]
    .filter((group) => group.items.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (groups.length === 0) return null;
  const t = await sectionLabels();

  return (
    <SectionShell id="specifications" heading={t.specifications}>
      <Accordion
        type="multiple"
        defaultValue={[groups[0].group]}
        className="surface-card divide-y divide-line px-4"
      >
        {groups.map((group) => (
          <AccordionItem key={group.group} value={group.group}>
            <AccordionTrigger>{group.group}</AccordionTrigger>
            <AccordionContent>
              <dl className="divide-y divide-line">
                {group.items.map((item) => (
                  <div
                    key={`${group.group}-${item.label}`}
                    className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[12rem_1fr] sm:gap-4"
                  >
                    <dt className="text-body-md text-ink-muted">{item.label}</dt>
                    <dd className="text-label-lg text-ink">
                      {item.value}
                      {item.unit ? <span className="ml-1 font-normal">{item.unit}</span> : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionShell>
  );
}

/**
 * Shipping information. Only renders configured text; `estimateText` is
 * omitted when null, because a delivery estimate is never invented.
 */
export async function ShippingInfo({
  product,
  storeShippingSummary,
}: {
  product: ProductDetail;
  storeShippingSummary: string | null;
}) {
  const info = product.shippingInfo;
  const summary = info?.summary ?? storeShippingSummary;
  const hasAnything = Boolean(summary || info?.estimateText || info?.freeShippingThreshold);

  if (!hasAnything) return null;
  const t = await sectionLabels();

  return (
    <SectionShell heading={t.shipping}>
      <div className="surface-card space-y-2.5 p-4 text-body-md text-ink-muted">
        {summary ? (
          <p className="flex gap-2.5">
            <Truck className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
            <span>{summary}</span>
          </p>
        ) : null}
        {info?.estimateText ? (
          <p className="flex gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
            <span>{info.estimateText}</span>
          </p>
        ) : null}
        {info?.freeShippingThreshold ? (
          <p className="flex gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
            <span>{fmt(t.freeShippingOn, { amount: formatMoney(info.freeShippingThreshold) })}</span>
          </p>
        ) : null}
      </div>
    </SectionShell>
  );
}

/** Returns and warranty, only as the store configured them. */
export async function ReturnsInfo({
  product,
  storeReturnsSummary,
}: {
  product: ProductDetail;
  storeReturnsSummary: string | null;
}) {
  const info = product.returnsInfo;
  const summary = info?.summary ?? storeReturnsSummary;
  const hasAnything = Boolean(summary || info?.windowDays || info?.warrantyText);

  if (!hasAnything) return null;
  const t = await sectionLabels();

  return (
    <SectionShell heading={t.returns}>
      <div className="surface-card space-y-2.5 p-4 text-body-md text-ink-muted">
        {info?.windowDays ? (
          <p className="flex gap-2.5">
            <RotateCcw className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
            <span>{fmt(t.returnsWindow, { days: info.windowDays })}</span>
          </p>
        ) : null}
        {summary ? <p>{summary}</p> : null}
        {info?.warrantyText ? <p>{info.warrantyText}</p> : null}
      </div>
    </SectionShell>
  );
}

export async function Faqs({ product }: { product: ProductDetail }) {
  const faqs = [...product.faqs].sort((a, b) => a.sortOrder - b.sortOrder);
  if (faqs.length === 0) return null;
  const t = await sectionLabels();

  return (
    <SectionShell id="faqs" heading={t.questions}>
      <Accordion type="multiple" className="surface-card divide-y divide-line px-4">
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={String(faq.id)}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>
              <p>{faq.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionShell>
  );
}
