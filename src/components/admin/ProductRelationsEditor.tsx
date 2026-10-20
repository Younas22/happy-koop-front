"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  replaceProductFaqsAction,
  replaceProductRelatedAction,
  replaceProductSpecificationsAction,
  replaceProductVariantsAction,
} from "@/app/admin/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/Checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { flattenFieldErrors } from "@/lib/forms/api-errors";
import { parseMajorUnitsToMinor, toMajorUnitString } from "@/lib/money";
import type { AdminProductDetail, AdminProductSummary } from "@/lib/types/api";

/**
 * Variants, specifications, FAQs and related products.
 *
 * Each of these is replaced ATOMICALLY by its own endpoint
 * (`PUT /admin/products/{id}/variants` etc.), so each section has its own save
 * button and the whole set is sent together - a partial save is not possible.
 *
 * Variant option values are referenced by their `value` slug, which is how the
 * API resolves them against the submitted options. A variant whose option
 * values are not in the submitted options is rejected with a 422 naming the
 * variant index, so errors are shown with the section.
 */

interface OptionValueRow {
  label: string;
  value: string;
  swatchHex: string;
}

interface OptionRow {
  name: string;
  slug: string;
  values: OptionValueRow[];
}

interface VariantRow {
  sku: string;
  priceAmount: string;
  compareAtAmount: string;
  stockQuantity: string;
  weightGrams: string;
  optionValues: string[];
  isDefault: boolean;
  isActive: boolean;
}

interface SpecRow {
  group: string;
  label: string;
  value: string;
  unit: string;
}

interface FaqRow {
  question: string;
  answer: string;
}

const inputClass = "h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductRelationsEditor({
  product,
  relatedCandidates,
  minorUnitExponent,
}: {
  product: AdminProductDetail;
  relatedCandidates: readonly AdminProductSummary[];
  minorUnitExponent: number;
}) {
  const router = useRouter();

  const [options, setOptions] = React.useState<OptionRow[]>(
    product.options.map((option) => ({
      name: option.name,
      slug: option.slug,
      values: option.values.map((value) => ({
        label: value.label,
        value: value.value,
        swatchHex: value.swatchHex ?? "",
      })),
    })),
  );

  const valueSlugById = React.useMemo(() => {
    const map = new Map<number, string>();
    for (const option of product.options) {
      for (const value of option.values) map.set(value.id, value.value);
    }
    return map;
  }, [product.options]);

  const [variants, setVariants] = React.useState<VariantRow[]>(
    product.variants.map((variant) => ({
      sku: variant.sku ?? "",
      priceAmount:
        variant.priceAmount === null
          ? ""
          : toMajorUnitString(
              { amount: variant.priceAmount, currency: product.currency, formatted: "" },
              minorUnitExponent,
            ),
      compareAtAmount:
        variant.compareAtAmount === null
          ? ""
          : toMajorUnitString(
              { amount: variant.compareAtAmount, currency: product.currency, formatted: "" },
              minorUnitExponent,
            ),
      stockQuantity: String(variant.stockQuantity),
      weightGrams: variant.weightGrams === null ? "" : String(variant.weightGrams),
      optionValues: variant.optionValueIds
        .map((id) => valueSlugById.get(id))
        .filter((value): value is string => typeof value === "string"),
      isDefault: variant.isDefault,
      isActive: variant.isActive,
    })),
  );

  const [specs, setSpecs] = React.useState<SpecRow[]>(
    product.specifications.map((spec) => ({
      group: spec.group ?? "",
      label: spec.label,
      value: spec.value,
      unit: spec.unit ?? "",
    })),
  );

  const [faqs, setFaqs] = React.useState<FaqRow[]>(
    product.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
  );

  const [relatedIds, setRelatedIds] = React.useState<number[]>(product.relatedProductIds);

  const [busy, setBusy] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string | null>>({});

  function setError(section: string, message: string | null) {
    setErrors((current) => ({ ...current, [section]: message }));
  }

  async function run(section: string, action: () => Promise<{ ok: boolean; error?: unknown }>) {
    setBusy(section);
    setError(section, null);

    const result = (await action()) as
      | { ok: true }
      | { ok: false; error: { message: string; errors: Record<string, string[]> | null } };

    setBusy(null);

    if (!result.ok) {
      const details = flattenFieldErrors(result.error.errors);
      setError(section, details.length > 0 ? details.join(" ") : result.error.message);
      toast.error("That did not save.");
      return;
    }

    toast.success("Saved.");
    router.refresh();
  }

  const minor = (value: string) => parseMajorUnitsToMinor(value, minorUnitExponent);
  const int = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isSafeInteger(parsed) ? parsed : null;
  };

  const allValueSlugs = options.flatMap((option) =>
    option.values.map((value) => ({ optionName: option.name, slug: value.value, label: value.label })),
  );

  return (
    <Tabs defaultValue="variants">
      <TabsList className="flex-wrap">
        <TabsTrigger value="variants">Options &amp; variants</TabsTrigger>
        <TabsTrigger value="specs">Specifications</TabsTrigger>
        <TabsTrigger value="faqs">FAQs</TabsTrigger>
        <TabsTrigger value="related">Related products</TabsTrigger>
      </TabsList>

      {/* ---------------- Variants ---------------- */}
      <TabsContent value="variants" className="space-y-5">
        {errors.variants ? (
          <Alert tone="danger" live title="Variants were not saved">
            {errors.variants}
          </Alert>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-ink">Options</h3>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                setOptions((current) => [...current, { name: "", slug: "", values: [] }])
              }
              disabled={options.length >= 3}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add option
            </Button>
          </div>

          {options.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No options. A product without options is a single simple product.
            </p>
          ) : (
            <ul className="space-y-3">
              {options.map((option, optionIndex) => (
                <li key={optionIndex} className="rounded-md border border-line p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <label className="block text-xs font-medium text-ink-muted">
                      Option name
                      <input
                        className={`${inputClass} mt-1`}
                        value={option.name}
                        onChange={(event) => {
                          const name = event.target.value;
                          setOptions((current) =>
                            current.map((item, index) =>
                              index === optionIndex
                                ? { ...item, name, slug: item.slug || slugify(name) }
                                : item,
                            ),
                          );
                        }}
                      />
                    </label>
                    <label className="block text-xs font-medium text-ink-muted">
                      Option slug
                      <input
                        className={`${inputClass} mt-1`}
                        value={option.slug}
                        onChange={(event) => {
                          const slug = event.target.value;
                          setOptions((current) =>
                            current.map((item, index) =>
                              index === optionIndex ? { ...item, slug } : item,
                            ),
                          );
                        }}
                      />
                    </label>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove option ${optionIndex + 1}`}
                        onClick={() =>
                          setOptions((current) =>
                            current.filter((_, index) => index !== optionIndex),
                          )
                        }
                      >
                        <Trash2 className="size-4 text-danger" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-ink-muted">Values</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setOptions((current) =>
                            current.map((item, index) =>
                              index === optionIndex
                                ? {
                                    ...item,
                                    values: [...item.values, { label: "", value: "", swatchHex: "" }],
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        Add value
                      </Button>
                    </div>

                    <ul className="space-y-2">
                      {option.values.map((value, valueIndex) => (
                        <li
                          key={valueIndex}
                          className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]"
                        >
                          <input
                            className={inputClass}
                            aria-label="Value label"
                            placeholder="Label"
                            value={value.label}
                            onChange={(event) => {
                              const label = event.target.value;
                              setOptions((current) =>
                                current.map((item, index) =>
                                  index === optionIndex
                                    ? {
                                        ...item,
                                        values: item.values.map((entry, vIndex) =>
                                          vIndex === valueIndex
                                            ? {
                                                ...entry,
                                                label,
                                                value: entry.value || slugify(label),
                                              }
                                            : entry,
                                        ),
                                      }
                                    : item,
                                ),
                              );
                            }}
                          />
                          <input
                            className={inputClass}
                            aria-label="Value slug"
                            placeholder="value-slug"
                            value={value.value}
                            onChange={(event) => {
                              const next = event.target.value;
                              setOptions((current) =>
                                current.map((item, index) =>
                                  index === optionIndex
                                    ? {
                                        ...item,
                                        values: item.values.map((entry, vIndex) =>
                                          vIndex === valueIndex ? { ...entry, value: next } : entry,
                                        ),
                                      }
                                    : item,
                                ),
                              );
                            }}
                          />
                          <input
                            className={inputClass}
                            aria-label="Swatch hex"
                            placeholder="#AABBCC"
                            value={value.swatchHex}
                            onChange={(event) => {
                              const next = event.target.value;
                              setOptions((current) =>
                                current.map((item, index) =>
                                  index === optionIndex
                                    ? {
                                        ...item,
                                        values: item.values.map((entry, vIndex) =>
                                          vIndex === valueIndex
                                            ? { ...entry, swatchHex: next }
                                            : entry,
                                        ),
                                      }
                                    : item,
                                ),
                              );
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove value ${valueIndex + 1}`}
                            onClick={() =>
                              setOptions((current) =>
                                current.map((item, index) =>
                                  index === optionIndex
                                    ? {
                                        ...item,
                                        values: item.values.filter(
                                          (_, vIndex) => vIndex !== valueIndex,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          >
                            <Trash2 className="size-4 text-danger" aria-hidden="true" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-ink">Variants</h3>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                setVariants((current) => [
                  ...current,
                  {
                    sku: "",
                    priceAmount: "",
                    compareAtAmount: "",
                    stockQuantity: "0",
                    weightGrams: "",
                    optionValues: [],
                    isDefault: current.length === 0,
                    isActive: true,
                  },
                ])
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Add variant
            </Button>
          </div>

          <p className="mb-2 text-xs text-ink-muted">
            A variant is identified by its set of option values - one per option. Leave the price
            blank to inherit the product price.
          </p>

          {variants.length === 0 ? (
            <p className="text-sm text-ink-muted">No variants.</p>
          ) : (
            <ul className="space-y-3">
              {variants.map((variant, variantIndex) => (
                <li key={variantIndex} className="rounded-md border border-line p-3">
                  <div className="grid gap-2 sm:grid-cols-4">
                    <label className="block text-xs font-medium text-ink-muted">
                      SKU
                      <input
                        className={`${inputClass} mt-1`}
                        value={variant.sku}
                        onChange={(event) => {
                          const next = event.target.value;
                          setVariants((current) =>
                            current.map((item, index) =>
                              index === variantIndex ? { ...item, sku: next } : item,
                            ),
                          );
                        }}
                      />
                    </label>
                    <label className="block text-xs font-medium text-ink-muted">
                      Price ({product.currency})
                      <input
                        className={`${inputClass} mt-1`}
                        inputMode="decimal"
                        value={variant.priceAmount}
                        onChange={(event) => {
                          const next = event.target.value;
                          setVariants((current) =>
                            current.map((item, index) =>
                              index === variantIndex ? { ...item, priceAmount: next } : item,
                            ),
                          );
                        }}
                      />
                    </label>
                    <label className="block text-xs font-medium text-ink-muted">
                      Compare-at
                      <input
                        className={`${inputClass} mt-1`}
                        inputMode="decimal"
                        value={variant.compareAtAmount}
                        onChange={(event) => {
                          const next = event.target.value;
                          setVariants((current) =>
                            current.map((item, index) =>
                              index === variantIndex ? { ...item, compareAtAmount: next } : item,
                            ),
                          );
                        }}
                      />
                    </label>
                    <label className="block text-xs font-medium text-ink-muted">
                      Stock
                      <input
                        className={`${inputClass} mt-1`}
                        inputMode="numeric"
                        value={variant.stockQuantity}
                        onChange={(event) => {
                          const next = event.target.value;
                          setVariants((current) =>
                            current.map((item, index) =>
                              index === variantIndex ? { ...item, stockQuantity: next } : item,
                            ),
                          );
                        }}
                      />
                    </label>
                  </div>

                  {allValueSlugs.length > 0 ? (
                    <fieldset className="mt-3">
                      <legend className="text-xs font-medium text-ink-muted">Option values</legend>
                      <ul className="mt-1 flex flex-wrap gap-x-4">
                        {allValueSlugs.map((entry) => (
                          <li key={`${entry.optionName}-${entry.slug}`}>
                            <CheckboxField
                              id={`variant-${variantIndex}-${entry.slug}`}
                              label={`${entry.optionName}: ${entry.label || entry.slug}`}
                              checked={variant.optionValues.includes(entry.slug)}
                              onCheckedChange={(checked) =>
                                setVariants((current) =>
                                  current.map((item, index) =>
                                    index === variantIndex
                                      ? {
                                          ...item,
                                          optionValues:
                                            checked === true
                                              ? [...item.optionValues, entry.slug]
                                              : item.optionValues.filter(
                                                  (slug) => slug !== entry.slug,
                                                ),
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    </fieldset>
                  ) : null}

                  <div className="mt-2 flex flex-wrap items-center gap-x-4">
                    <CheckboxField
                      id={`variant-default-${variantIndex}`}
                      label="Default variant"
                      checked={variant.isDefault}
                      onCheckedChange={(checked) =>
                        setVariants((current) =>
                          current.map((item, index) => ({
                            ...item,
                            isDefault: index === variantIndex ? checked === true : false,
                          })),
                        )
                      }
                    />
                    <CheckboxField
                      id={`variant-active-${variantIndex}`}
                      label="Active"
                      checked={variant.isActive}
                      onCheckedChange={(checked) =>
                        setVariants((current) =>
                          current.map((item, index) =>
                            index === variantIndex ? { ...item, isActive: checked === true } : item,
                          ),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-danger"
                      onClick={() =>
                        setVariants((current) =>
                          current.filter((_, index) => index !== variantIndex),
                        )
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Remove variant
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button
          type="button"
          loading={busy === "variants"}
          loadingLabel="Saving…"
          onClick={() =>
            void run("variants", () =>
              replaceProductVariantsAction(product.id, {
                options: options.map((option) => ({
                  name: option.name,
                  slug: option.slug || slugify(option.name),
                  values: option.values.map((value) => ({
                    label: value.label,
                    value: value.value || slugify(value.label),
                    swatchHex: value.swatchHex || null,
                  })),
                })),
                variants: variants.map((variant) => ({
                  sku: variant.sku || null,
                  priceAmount: minor(variant.priceAmount),
                  compareAtAmount: minor(variant.compareAtAmount),
                  stockQuantity: int(variant.stockQuantity) ?? 0,
                  weightGrams: int(variant.weightGrams),
                  optionValues: variant.optionValues,
                  isDefault: variant.isDefault,
                  isActive: variant.isActive,
                })),
              }),
            )
          }
        >
          Replace options and variants
        </Button>
      </TabsContent>

      {/* ---------------- Specifications ---------------- */}
      <TabsContent value="specs" className="space-y-4">
        {errors.specs ? (
          <Alert tone="danger" live title="Specifications were not saved">
            {errors.specs}
          </Alert>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-ink-muted">
            Grouped rows, in this order. Leave the group blank for ungrouped rows.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              setSpecs((current) => [...current, { group: "", label: "", value: "", unit: "" }])
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add row
          </Button>
        </div>

        {specs.length === 0 ? (
          <p className="text-sm text-ink-muted">No specifications.</p>
        ) : (
          <ul className="space-y-2">
            {specs.map((spec, index) => (
              <li key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_6rem_auto]">
                <input
                  className={inputClass}
                  aria-label="Group"
                  placeholder="Group"
                  value={spec.group}
                  onChange={(event) => {
                    const next = event.target.value;
                    setSpecs((current) =>
                      current.map((item, i) => (i === index ? { ...item, group: next } : item)),
                    );
                  }}
                />
                <input
                  className={inputClass}
                  aria-label="Label"
                  placeholder="Label"
                  value={spec.label}
                  onChange={(event) => {
                    const next = event.target.value;
                    setSpecs((current) =>
                      current.map((item, i) => (i === index ? { ...item, label: next } : item)),
                    );
                  }}
                />
                <input
                  className={inputClass}
                  aria-label="Value"
                  placeholder="Value"
                  value={spec.value}
                  onChange={(event) => {
                    const next = event.target.value;
                    setSpecs((current) =>
                      current.map((item, i) => (i === index ? { ...item, value: next } : item)),
                    );
                  }}
                />
                <input
                  className={inputClass}
                  aria-label="Unit"
                  placeholder="Unit"
                  value={spec.unit}
                  onChange={(event) => {
                    const next = event.target.value;
                    setSpecs((current) =>
                      current.map((item, i) => (i === index ? { ...item, unit: next } : item)),
                    );
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove specification ${index + 1}`}
                  onClick={() => setSpecs((current) => current.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4 text-danger" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          loading={busy === "specs"}
          loadingLabel="Saving…"
          onClick={() =>
            void run("specs", () =>
              replaceProductSpecificationsAction(product.id, {
                specifications: specs.map((spec) => ({
                  group: spec.group || null,
                  label: spec.label,
                  value: spec.value,
                  unit: spec.unit || null,
                })),
              }),
            )
          }
        >
          Replace specifications
        </Button>
      </TabsContent>

      {/* ---------------- FAQs ---------------- */}
      <TabsContent value="faqs" className="space-y-4">
        {errors.faqs ? (
          <Alert tone="danger" live title="FAQs were not saved">
            {errors.faqs}
          </Alert>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-ink-muted">
            Answers accept HTML and are sanitized on the server.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setFaqs((current) => [...current, { question: "", answer: "" }])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add FAQ
          </Button>
        </div>

        {faqs.length === 0 ? (
          <p className="text-sm text-ink-muted">No FAQs.</p>
        ) : (
          <ul className="space-y-3">
            {faqs.map((faq, index) => (
              <li key={index} className="rounded-md border border-line p-3">
                <div className="flex items-start gap-2">
                  <input
                    className={inputClass}
                    aria-label={`Question ${index + 1}`}
                    placeholder="Question"
                    value={faq.question}
                    onChange={(event) => {
                      const next = event.target.value;
                      setFaqs((current) =>
                        current.map((item, i) => (i === index ? { ...item, question: next } : item)),
                      );
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove FAQ ${index + 1}`}
                    onClick={() => setFaqs((current) => current.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4 text-danger" aria-hidden="true" />
                  </Button>
                </div>
                <Textarea
                  className="mt-2"
                  rows={3}
                  aria-label={`Answer ${index + 1}`}
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(event) => {
                    const next = event.target.value;
                    setFaqs((current) =>
                      current.map((item, i) => (i === index ? { ...item, answer: next } : item)),
                    );
                  }}
                />
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          loading={busy === "faqs"}
          loadingLabel="Saving…"
          onClick={() =>
            void run("faqs", () =>
              replaceProductFaqsAction(product.id, {
                faqs: faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
              }),
            )
          }
        >
          Replace FAQs
        </Button>
      </TabsContent>

      {/* ---------------- Related ---------------- */}
      <TabsContent value="related" className="space-y-4">
        {errors.related ? (
          <Alert tone="danger" live title="Related products were not saved">
            {errors.related}
          </Alert>
        ) : null}

        <p className="text-xs text-ink-muted">
          Up to 12 products. The storefront never pads this list with unrelated filler.
        </p>

        {relatedCandidates.length === 0 ? (
          <p className="text-sm text-ink-muted">There are no other products to relate to yet.</p>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2">
            {relatedCandidates
              .filter((candidate) => candidate.id !== product.id)
              .map((candidate) => (
                <li key={candidate.id}>
                  <CheckboxField
                    id={`related-${candidate.id}`}
                    label={candidate.name}
                    checked={relatedIds.includes(candidate.id)}
                    disabled={!relatedIds.includes(candidate.id) && relatedIds.length >= 12}
                    onCheckedChange={(checked) =>
                      setRelatedIds((current) =>
                        checked === true
                          ? [...current, candidate.id]
                          : current.filter((id) => id !== candidate.id),
                      )
                    }
                  />
                </li>
              ))}
          </ul>
        )}

        <Button
          type="button"
          loading={busy === "related"}
          loadingLabel="Saving…"
          onClick={() => void run("related", () => replaceProductRelatedAction(product.id, relatedIds))}
        >
          Replace related products
        </Button>
      </TabsContent>
    </Tabs>
  );
}
