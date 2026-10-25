"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { replaceHomeSectionsAction } from "@/app/admin/actions";
import { Alert } from "@/components/ui/Alert";
import { MediaPickerField } from "@/components/admin/MediaPickerField";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { flattenFieldErrors } from "@/lib/forms/api-errors";
import type {
  AdminCategory,
  AdminHomeSection,
  AdminMediaAsset,
  AdminProductSummary,
  HomeSectionType,
} from "@/lib/types/api";
import { HOME_SECTION_TYPES } from "@/lib/types/admin";

/**
 * Homepage composition editor.
 *
 * `PUT /admin/home-sections` REPLACES the whole composition, so the editor
 * holds the entire list and sends it in one save - there is no partial state
 * to get out of sync.
 *
 * Each section type has its own `config` keys, matching exactly what the
 * public `/home` endpoint reads:
 *  - hero: headline, subheadline, imageMediaId, ctaLabel, ctaHref
 *  - category_tiles: categoryIds
 *  - product_grid: productIds, limit
 *  - benefits: items[{icon,title,body}]
 *  - rich_text: html (sanitized server-side)
 *
 * A section that references content which no longer exists resolves to an
 * empty list on the storefront rather than filler, so an empty section simply
 * does not render.
 */

interface Draft {
  type: HomeSectionType | string;
  heading: string;
  isActive: boolean;
  config: Record<string, unknown>;
}

const TYPE_LABELS: Record<string, string> = {
  hero: "Hero banner",
  category_tiles: "Category tiles",
  product_grid: "Product grid",
  benefits: "Benefits",
  rich_text: "Rich text",
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "number" ? item : Number.parseInt(String(item), 10)))
    .filter((item) => Number.isFinite(item));
}

interface BenefitItem {
  icon: string;
  title: string;
  body: string;
}

function asBenefits(value: unknown): BenefitItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = (item ?? {}) as Record<string, unknown>;
    return {
      icon: asString(record.icon),
      title: asString(record.title),
      body: asString(record.body),
    };
  });
}

const selectClass =
  "h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink";

export function HomeSectionsEditor({
  sections,
  categories,
  products,
  media,
  mediaTotal,
  mediaTruncated,
}: {
  sections: readonly AdminHomeSection[];
  categories: readonly AdminCategory[];
  products: readonly AdminProductSummary[];
  media: readonly AdminMediaAsset[];
  /** The library's real size, which may exceed `media.length`. */
  mediaTotal?: number;
  /** True when the loader hit its page cap before the end of the library. */
  mediaTruncated?: boolean;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = React.useState<Draft[]>(
    sections.map((section) => ({
      type: section.type,
      heading: section.heading ?? "",
      isActive: section.isActive,
      config: { ...section.config },
    })),
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function update(index: number, changes: Partial<Draft>) {
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, ...changes } : draft)),
    );
  }

  function updateConfig(index: number, key: string, value: unknown) {
    setDrafts((current) =>
      current.map((draft, i) =>
        i === index ? { ...draft, config: { ...draft.config, [key]: value } } : draft,
      ),
    );
  }

  function move(index: number, delta: number) {
    setDrafts((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setError(null);

    const result = await replaceHomeSectionsAction(
      drafts.map((draft) => ({
        type: draft.type,
        heading: draft.heading || null,
        isActive: draft.isActive,
        config: draft.config,
      })),
    );

    setBusy(false);

    if (!result.ok) {
      const details = flattenFieldErrors(result.error.errors);
      setError(details.length > 0 ? details.join(" ") : result.error.message);
      toast.error("The homepage was not saved.");
      return;
    }

    toast.success("Homepage saved.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert tone="danger" live title="The homepage was not saved">
          {error}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="new-section-type" className="text-sm text-ink-muted">
          Add a section
        </label>
        <select id="new-section-type" className={`${selectClass} w-auto`} defaultValue="hero">
          {HOME_SECTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type] ?? type}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          onClick={(event) => {
            const select = event.currentTarget.parentElement?.querySelector("select");
            const type = (select as HTMLSelectElement | null)?.value ?? "rich_text";
            setDrafts((current) => [
              ...current,
              { type, heading: "", isActive: true, config: {} },
            ]);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      {drafts.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No sections. The homepage will show only the store header and footer.
        </p>
      ) : (
        <ul className="space-y-4">
          {drafts.map((draft, index) => (
            <li key={index} className="surface-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">
                  {index + 1}. {TYPE_LABELS[draft.type] ?? draft.type}
                </h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Move section ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Move section ${index + 1} down`}
                    disabled={index === drafts.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove section ${index + 1}`}
                    onClick={() => setDrafts((current) => current.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4 text-danger" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id={`section-heading-${index}`} label="Heading">
                  {(field) => (
                    <Input
                      {...field}
                      value={draft.heading}
                      onChange={(event) => update(index, { heading: event.target.value })}
                    />
                  )}
                </FormField>

                <div className="flex items-end">
                  <CheckboxField
                    id={`section-active-${index}`}
                    label="Active"
                    checked={draft.isActive}
                    onCheckedChange={(checked) => update(index, { isActive: checked === true })}
                  />
                </div>
              </div>

              {draft.type === "hero" ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <FormField id={`hero-headline-${index}`} label="Headline">
                    {(field) => (
                      <Input
                        {...field}
                        value={asString(draft.config.headline)}
                        onChange={(event) => updateConfig(index, "headline", event.target.value)}
                      />
                    )}
                  </FormField>
                  <FormField id={`hero-subheadline-${index}`} label="Subheadline">
                    {(field) => (
                      <Input
                        {...field}
                        value={asString(draft.config.subheadline)}
                        onChange={(event) => updateConfig(index, "subheadline", event.target.value)}
                      />
                    )}
                  </FormField>
                  <FormField id={`hero-cta-label-${index}`} label="Button label">
                    {(field) => (
                      <Input
                        {...field}
                        value={asString(draft.config.ctaLabel)}
                        onChange={(event) => updateConfig(index, "ctaLabel", event.target.value)}
                      />
                    )}
                  </FormField>
                  <FormField
                    id={`hero-cta-href-${index}`}
                    label="Button link"
                    description="A path such as /shop."
                  >
                    {(field) => (
                      <Input
                        {...field}
                        value={asString(draft.config.ctaHref)}
                        onChange={(event) => updateConfig(index, "ctaHref", event.target.value)}
                      />
                    )}
                  </FormField>
                  <div className="sm:col-span-2">
                    <MediaPickerField
                      id={`hero-image-${index}`}
                      label="Image"
                      description={
                        media.length === 0
                          ? "No media uploaded yet. Upload images under Media first."
                          : undefined
                      }
                      value={
                        typeof draft.config.imageMediaId === "number"
                          ? draft.config.imageMediaId
                          : null
                      }
                      onChange={(next) => updateConfig(index, "imageMediaId", next)}
                      media={media}
                      total={mediaTotal}
                      truncated={mediaTruncated}
                    />
                  </div>
                </div>
              ) : null}

              {draft.type === "category_tiles" ? (
                <fieldset className="mt-4">
                  <legend className="text-sm font-medium text-ink">Categories to show</legend>
                  {categories.length === 0 ? (
                    <p className="mt-1 text-sm text-ink-muted">No categories exist yet.</p>
                  ) : (
                    <ul className="mt-1 grid gap-1 sm:grid-cols-2">
                      {categories.map((category) => {
                        const ids = asNumberArray(draft.config.categoryIds);
                        return (
                          <li key={category.id}>
                            <CheckboxField
                              id={`section-${index}-category-${category.id}`}
                              label={category.name}
                              checked={ids.includes(category.id)}
                              onCheckedChange={(checked) =>
                                updateConfig(
                                  index,
                                  "categoryIds",
                                  checked === true
                                    ? [...ids, category.id]
                                    : ids.filter((id) => id !== category.id),
                                )
                              }
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </fieldset>
              ) : null}

              {draft.type === "product_grid" ? (
                <div className="mt-4 space-y-3">
                  <FormField
                    id={`grid-limit-${index}`}
                    label="Maximum products"
                    description="1 to 24. With no products selected, the newest published products are shown."
                  >
                    {(field) => (
                      <Input
                        {...field}
                        inputMode="numeric"
                        value={String(draft.config.limit ?? 8)}
                        onChange={(event) => {
                          const parsed = Number.parseInt(event.target.value, 10);
                          updateConfig(index, "limit", Number.isFinite(parsed) ? parsed : 8);
                        }}
                      />
                    )}
                  </FormField>

                  <fieldset>
                    <legend className="text-sm font-medium text-ink">Specific products</legend>
                    {products.length === 0 ? (
                      <p className="mt-1 text-sm text-ink-muted">No products exist yet.</p>
                    ) : (
                      <ul className="mt-1 grid max-h-64 gap-1 overflow-y-auto sm:grid-cols-2">
                        {products.map((product) => {
                          const ids = asNumberArray(draft.config.productIds);
                          return (
                            <li key={product.id}>
                              <CheckboxField
                                id={`section-${index}-product-${product.id}`}
                                label={product.name}
                                checked={ids.includes(product.id)}
                                onCheckedChange={(checked) =>
                                  updateConfig(
                                    index,
                                    "productIds",
                                    checked === true
                                      ? [...ids, product.id]
                                      : ids.filter((id) => id !== product.id),
                                  )
                                }
                              />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </fieldset>
                </div>
              ) : null}

              {draft.type === "benefits" ? (
                <div className="mt-4 space-y-3">
                  {asBenefits(draft.config.items).map((item, itemIndex) => (
                    <div key={itemIndex} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[8rem_1fr_auto]">
                      <Input
                        aria-label="Icon name"
                        placeholder="Icon"
                        value={item.icon}
                        onChange={(event) => {
                          const items = asBenefits(draft.config.items);
                          items[itemIndex] = { ...item, icon: event.target.value };
                          updateConfig(index, "items", items);
                        }}
                      />
                      <Input
                        aria-label="Benefit title"
                        placeholder="Title"
                        value={item.title}
                        onChange={(event) => {
                          const items = asBenefits(draft.config.items);
                          items[itemIndex] = { ...item, title: event.target.value };
                          updateConfig(index, "items", items);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove benefit ${itemIndex + 1}`}
                        onClick={() => {
                          const items = asBenefits(draft.config.items).filter(
                            (_, i) => i !== itemIndex,
                          );
                          updateConfig(index, "items", items);
                        }}
                      >
                        <Trash2 className="size-4 text-danger" aria-hidden="true" />
                      </Button>
                      <Textarea
                        className="sm:col-span-3"
                        rows={2}
                        aria-label="Benefit body"
                        placeholder="Body"
                        value={item.body}
                        onChange={(event) => {
                          const items = asBenefits(draft.config.items);
                          items[itemIndex] = { ...item, body: event.target.value };
                          updateConfig(index, "items", items);
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      updateConfig(index, "items", [
                        ...asBenefits(draft.config.items),
                        { icon: "", title: "", body: "" },
                      ])
                    }
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Add benefit
                  </Button>
                </div>
              ) : null}

              {draft.type === "rich_text" ? (
                <FormField
                  id={`rich-text-${index}`}
                  label="HTML"
                  description="Sanitized on the server before it is stored."
                  className="mt-4"
                >
                  {(field) => (
                    <Textarea
                      {...field}
                      rows={8}
                      className="font-mono text-xs"
                      value={asString(draft.config.html)}
                      onChange={(event) => updateConfig(index, "html", event.target.value)}
                    />
                  )}
                </FormField>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button loading={busy} loadingLabel="Saving…" onClick={() => void save()}>
          Save homepage
        </Button>
        <span className="text-xs text-ink-muted">
          Saving replaces the whole homepage composition.
        </span>
      </div>
    </div>
  );
}
