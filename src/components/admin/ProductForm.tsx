"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createProductAction, updateProductAction } from "@/app/admin/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { applyFieldErrors } from "@/lib/forms/api-errors";
import { parseMajorUnitsToMinor, toMajorUnitString } from "@/lib/money";
import type { AdminCategory, AdminMediaAsset, AdminProductDetail } from "@/lib/types/api";

/**
 * Product create / edit.
 *
 * Money is entered in major units and converted to the integer minor units the
 * API requires (`priceAmount`, `compareAtAmount`, `costAmount`) with string
 * maths - no float ever touches a price. An empty optional amount is sent as
 * `null`, never as 0.
 *
 * `costPrice` is admin-only data and exists on this screen alone; it is never
 * sent to or rendered by any storefront view.
 *
 * Variants, specifications, FAQs and related products are replaced through
 * their own atomic endpoints, which need a product id - so on create this form
 * saves the product first and then hands over to the edit screen.
 */

const PLAIN_STATUSES = ["draft", "published", "archived"] as const;
const POLICIES = ["track", "continue", "deny"] as const;

const moneyField = z
  .string()
  .trim()
  .regex(/^$|^\d+(\.\d{1,4})?$/, "Enter an amount like 24.99.");

const intField = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^$|^\d+$/, `${label} must be a whole number.`);

const schema = z.object({
  name: z.string().trim().min(1, "Enter a product name.").max(255),
  slug: z
    .string()
    .trim()
    .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.")
    .max(255),
  sku: z.string().trim().max(64),
  brand: z.string().trim().max(120),
  status: z.enum(PLAIN_STATUSES),
  shortDescription: z.string().trim().max(500),
  description: z.string().max(200000),

  priceAmount: moneyField.min(1, "Enter a price."),
  compareAtAmount: moneyField,
  costAmount: moneyField,

  inventoryPolicy: z.enum(POLICIES),
  stockQuantity: intField("Stock"),
  lowStockThreshold: intField("Low stock threshold"),

  weightGrams: intField("Weight"),
  lengthMm: intField("Length"),
  widthMm: intField("Width"),
  heightMm: intField("Height"),

  shippingSummary: z.string().trim().max(2000),
  returnsSummary: z.string().trim().max(2000),
  warrantyText: z.string().trim().max(2000),
  returnsWindowDays: intField("Returns window"),

  whatsIncluded: z.string().max(4000),
  valueProps: z.array(
    z.object({
      icon: z.string().trim().max(40),
      title: z.string().trim().min(1, "Enter a title.").max(120),
      body: z.string().trim().max(500),
    }),
  ),
  badges: z.array(
    z.object({
      label: z.string().trim().min(1, "Enter a label.").max(40),
      tone: z.enum(["neutral", "info", "success", "warning"]),
    }),
  ),

  seoTitle: z.string().trim().max(160),
  seoDescription: z.string().trim().max(320),
  seoNoindex: z.boolean(),
});

type Values = z.infer<typeof schema>;

const KNOWN_FIELDS = [
  "name",
  "slug",
  "sku",
  "brand",
  "status",
  "shortDescription",
  "description",
  "priceAmount",
  "compareAtAmount",
  "costAmount",
  "inventoryPolicy",
  "stockQuantity",
  "lowStockThreshold",
  "weightGrams",
  "lengthMm",
  "widthMm",
  "heightMm",
  "shippingSummary",
  "returnsSummary",
  "warrantyText",
  "returnsWindowDays",
  "seoTitle",
  "seoDescription",
  "seoNoindex",
] as const;

function toValues(product: AdminProductDetail | null, exponent: number): Values {
  if (!product) {
    return {
      name: "",
      slug: "",
      sku: "",
      brand: "",
      status: "draft",
      shortDescription: "",
      description: "",
      priceAmount: "",
      compareAtAmount: "",
      costAmount: "",
      inventoryPolicy: "track",
      stockQuantity: "0",
      lowStockThreshold: "",
      weightGrams: "",
      lengthMm: "",
      widthMm: "",
      heightMm: "",
      shippingSummary: "",
      returnsSummary: "",
      warrantyText: "",
      returnsWindowDays: "",
      whatsIncluded: "",
      valueProps: [],
      badges: [],
      seoTitle: "",
      seoDescription: "",
      seoNoindex: false,
    };
  }

  const money = (value: { amount: number; currency: string; formatted: string } | null) =>
    value === null ? "" : toMajorUnitString(value, exponent);

  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku ?? "",
    brand: product.brand ?? "",
    status: product.status,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    priceAmount: money(product.price),
    compareAtAmount: money(product.compareAtPrice),
    costAmount: money(product.costPrice),
    inventoryPolicy: product.inventoryPolicy,
    stockQuantity: String(product.stockQuantity),
    lowStockThreshold: product.lowStockThreshold === null ? "" : String(product.lowStockThreshold),
    weightGrams: product.weightGrams === null ? "" : String(product.weightGrams),
    lengthMm: product.lengthMm === null ? "" : String(product.lengthMm),
    widthMm: product.widthMm === null ? "" : String(product.widthMm),
    heightMm: product.heightMm === null ? "" : String(product.heightMm),
    shippingSummary: product.shippingSummary ?? "",
    returnsSummary: product.returnsSummary ?? "",
    warrantyText: product.warrantyText ?? "",
    returnsWindowDays:
      product.returnsWindowDays === null ? "" : String(product.returnsWindowDays),
    whatsIncluded: product.whatsIncluded.join("\n"),
    valueProps: product.valueProps.map((prop) => ({
      icon: prop.icon ?? "",
      title: prop.title,
      body: prop.body ?? "",
    })),
    badges: product.badges.map((badge) => ({
      label: badge.label,
      tone:
        badge.tone === "info" || badge.tone === "success" || badge.tone === "warning"
          ? badge.tone
          : "neutral",
    })),
    seoTitle: product.seo.title ?? "",
    seoDescription: product.seo.description ?? "",
    seoNoindex: product.seo.noindex,
  };
}

const selectClass =
  "h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink";

export interface ProductFormProps {
  product: AdminProductDetail | null;
  categories: readonly AdminCategory[];
  media: readonly AdminMediaAsset[];
  currency: string;
  minorUnitExponent: number;
}

export function ProductForm({
  product,
  categories,
  media,
  currency,
  minorUnitExponent,
}: ProductFormProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);

  const [categoryIds, setCategoryIds] = React.useState<number[]>(product?.categoryIds ?? []);
  /** Filters the attach-media grid. Selection is unaffected by it. */
  const [mediaQuery, setMediaQuery] = React.useState("");

  const [mediaIds, setMediaIds] = React.useState<number[]>(
    product?.media.map((item) => item.id) ?? [],
  );
  const [primaryMediaId, setPrimaryMediaId] = React.useState<number | null>(
    product?.primaryMediaId ?? null,
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(product, minorUnitExponent),
  });

  const valueProps = useFieldArray({ control: form.control, name: "valueProps" });
  const badges = useFieldArray({ control: form.control, name: "badges" });

  function toMinor(value: string): number | null {
    return parseMajorUnitsToMinor(value, minorUnitExponent);
  }

  function toInt(value: string): number | null {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }

  const visibleMedia = React.useMemo(() => {
    const needle = mediaQuery.trim().toLowerCase();
    if (!needle) return media;
    return media.filter((asset) =>
      [asset.originalFilename, asset.alt, asset.folder, String(asset.id)].some((value) =>
        (value ?? "").toLowerCase().includes(needle),
      ),
    );
  }, [media, mediaQuery]);

  async function onSubmit(values: Values) {
    setFormError(null);

    const price = toMinor(values.priceAmount);
    if (price === null) {
      form.setError("priceAmount", { type: "manual", message: "Enter a price like 24.99." });
      return;
    }

    const body: Record<string, unknown> = {
      name: values.name,
      slug: values.slug || null,
      sku: values.sku || null,
      brand: values.brand || null,
      status: values.status,
      shortDescription: values.shortDescription || null,
      description: values.description || null,

      // Integer minor units only (contract 1.5).
      priceAmount: price,
      compareAtAmount: toMinor(values.compareAtAmount),
      costAmount: toMinor(values.costAmount),
      currency,

      inventoryPolicy: values.inventoryPolicy,
      stockQuantity: toInt(values.stockQuantity) ?? 0,
      lowStockThreshold: toInt(values.lowStockThreshold),

      weightGrams: toInt(values.weightGrams),
      lengthMm: toInt(values.lengthMm),
      widthMm: toInt(values.widthMm),
      heightMm: toInt(values.heightMm),

      shippingSummary: values.shippingSummary || null,
      returnsSummary: values.returnsSummary || null,
      warrantyText: values.warrantyText || null,
      returnsWindowDays: toInt(values.returnsWindowDays),

      whatsIncluded: values.whatsIncluded
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      valueProps: values.valueProps.map((prop) => ({
        icon: prop.icon || null,
        title: prop.title,
        body: prop.body || null,
      })),
      badges: values.badges.map((badge) => ({ label: badge.label, tone: badge.tone })),

      categoryIds,
      mediaIds,
      primaryMediaId,

      seoTitle: values.seoTitle || null,
      seoDescription: values.seoDescription || null,
      seoNoindex: values.seoNoindex,
    };

    const result = product
      ? await updateProductAction(product.id, body)
      : await createProductAction(body);

    if (!result.ok) {
      setFormError(applyFieldErrors(result.error, form.setError, KNOWN_FIELDS));
      toast.error("The product was not saved.");
      return;
    }

    toast.success(product ? "Product saved." : "Product created.");

    if (!product && "data" in result && result.data) {
      // Variants, specifications, FAQs and related products need an id.
      router.push(`/admin/products/${result.data.id}`);
      return;
    }

    router.refresh();
  }

  function toggleMedia(id: number) {
    setMediaIds((current) => {
      const next = current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id];
      if (!next.includes(id) && primaryMediaId === id) setPrimaryMediaId(null);
      if (next.includes(id) && primaryMediaId === null) setPrimaryMediaId(id);
      return next;
    });
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert tone="danger" live title="The product was not saved">
          {formError}
        </Alert>
      ) : null}

      <Tabs defaultValue="details">
        <TabsList className="flex-wrap">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="pricing">Pricing &amp; inventory</TabsTrigger>
          <TabsTrigger value="media">Images</TabsTrigger>
          <TabsTrigger value="organization">Categories</TabsTrigger>
          <TabsTrigger value="content">Extra content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* ---------------- Details ---------------- */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="product-name"
              label="Name"
              required
              error={form.formState.errors.name?.message ?? null}
              className="sm:col-span-2"
            >
              {(field) => <Input {...field} {...form.register("name")} />}
            </FormField>

            <FormField
              id="product-slug"
              label="URL slug"
              description="Leave blank to generate one from the name."
              error={form.formState.errors.slug?.message ?? null}
            >
              {(field) => <Input {...field} {...form.register("slug")} />}
            </FormField>

            <FormField
              id="product-sku"
              label="SKU"
              error={form.formState.errors.sku?.message ?? null}
            >
              {(field) => <Input {...field} {...form.register("sku")} />}
            </FormField>

            <FormField
              id="product-brand"
              label="Brand"
              error={form.formState.errors.brand?.message ?? null}
            >
              {(field) => <Input {...field} {...form.register("brand")} />}
            </FormField>

            <FormField id="product-status" label="Publish status" required>
              {(field) => (
                <select {...field} className={selectClass} {...form.register("status")}>
                  <option value="draft">Draft - not visible in the store</option>
                  <option value="published">Published - visible in the store</option>
                  <option value="archived">Archived - hidden, kept for records</option>
                </select>
              )}
            </FormField>

            <FormField
              id="product-short-description"
              label="Short description"
              description="One or two lines, shown on cards and listings."
              error={form.formState.errors.shortDescription?.message ?? null}
              className="sm:col-span-2"
            >
              {(field) => <Textarea {...field} rows={2} {...form.register("shortDescription")} />}
            </FormField>

            <FormField
              id="product-description"
              label="Full description"
              description="HTML is allowed and is sanitized on the server before it is stored."
              error={form.formState.errors.description?.message ?? null}
              className="sm:col-span-2"
            >
              {(field) => <Textarea {...field} rows={10} {...form.register("description")} />}
            </FormField>
          </div>
        </TabsContent>

        {/* ---------------- Pricing ---------------- */}
        <TabsContent value="pricing" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              id="product-price"
              label={`Price (${currency})`}
              required
              error={form.formState.errors.priceAmount?.message ?? null}
            >
              {(field) => (
                <Input {...field} inputMode="decimal" {...form.register("priceAmount")} />
              )}
            </FormField>

            <FormField
              id="product-compare-at"
              label="Compare-at price"
              description="Only set this if it is a real previous price. It is shown only when higher than the price."
              error={form.formState.errors.compareAtAmount?.message ?? null}
            >
              {(field) => (
                <Input {...field} inputMode="decimal" {...form.register("compareAtAmount")} />
              )}
            </FormField>

            <FormField
              id="product-cost"
              label="Cost price"
              description="Internal only. Never sent to the storefront."
              error={form.formState.errors.costAmount?.message ?? null}
            >
              {(field) => (
                <Input {...field} inputMode="decimal" {...form.register("costAmount")} />
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="product-policy" label="Inventory policy" required>
              {(field) => (
                <select {...field} className={selectClass} {...form.register("inventoryPolicy")}>
                  <option value="track">Track stock</option>
                  <option value="continue">Do not track, keep selling</option>
                  <option value="deny">Do not track, refuse orders</option>
                </select>
              )}
            </FormField>

            <FormField
              id="product-stock"
              label="Stock quantity"
              error={form.formState.errors.stockQuantity?.message ?? null}
            >
              {(field) => (
                <Input {...field} inputMode="numeric" {...form.register("stockQuantity")} />
              )}
            </FormField>

            <FormField
              id="product-low-stock"
              label="Low stock threshold"
              description="Leave blank to never show a low-stock state."
              error={form.formState.errors.lowStockThreshold?.message ?? null}
            >
              {(field) => (
                <Input {...field} inputMode="numeric" {...form.register("lowStockThreshold")} />
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <FormField
              id="product-weight"
              label="Weight (g)"
              error={form.formState.errors.weightGrams?.message ?? null}
            >
              {(field) => (
                <Input {...field} inputMode="numeric" {...form.register("weightGrams")} />
              )}
            </FormField>
            <FormField
              id="product-length"
              label="Length (mm)"
              error={form.formState.errors.lengthMm?.message ?? null}
            >
              {(field) => <Input {...field} inputMode="numeric" {...form.register("lengthMm")} />}
            </FormField>
            <FormField
              id="product-width"
              label="Width (mm)"
              error={form.formState.errors.widthMm?.message ?? null}
            >
              {(field) => <Input {...field} inputMode="numeric" {...form.register("widthMm")} />}
            </FormField>
            <FormField
              id="product-height"
              label="Height (mm)"
              error={form.formState.errors.heightMm?.message ?? null}
            >
              {(field) => <Input {...field} inputMode="numeric" {...form.register("heightMm")} />}
            </FormField>
          </div>
        </TabsContent>

        {/* ---------------- Media ---------------- */}
        <TabsContent value="media" className="space-y-4">
          {media.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No media has been uploaded yet. Upload images in Media, then come back to attach them.
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-muted">
                Select the images for this product and mark one as the primary image. Selection
                order is the display order.
              </p>

              {/* The library can run to hundreds of uploads, so it is
                  searchable here too - by filename, alt text, folder or id. */}
              <div className="relative max-w-sm">
                <Search
                  className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-subtle"
                  aria-hidden="true"
                />
                <label htmlFor="product-media-search" className="sr-only">
                  Search the media library
                </label>
                <Input
                  id="product-media-search"
                  type="search"
                  value={mediaQuery}
                  onChange={(event) => setMediaQuery(event.target.value)}
                  placeholder="Search images"
                  className="pl-11"
                />
              </div>

              {visibleMedia.length === 0 ? (
                <p className="text-sm text-ink-muted">No image matches that search.</p>
              ) : null}

              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {visibleMedia.map((asset) => {
                  const selected = mediaIds.includes(asset.id);
                  const position = mediaIds.indexOf(asset.id);
                  return (
                    <li key={asset.id} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => toggleMedia(asset.id)}
                        aria-pressed={selected}
                        className={`relative block aspect-square w-full overflow-hidden rounded-md border-2 bg-sunken ${
                          selected ? "border-brand" : "border-line"
                        }`}
                      >
                        {asset.type === "image" ? (
                          <Image
                            src={asset.thumbnailUrl ?? asset.url}
                            alt={asset.alt ?? ""}
                            fill
                            sizes="160px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs text-ink-muted">
                            Video
                          </span>
                        )}
                        {selected ? (
                          <span className="absolute top-1 left-1 rounded-sm bg-brand px-1.5 text-2xs font-semibold text-brand-ink">
                            {position + 1}
                          </span>
                        ) : null}
                      </button>

                      {selected ? (
                        <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                          <input
                            type="radio"
                            name="primary-media"
                            checked={primaryMediaId === asset.id}
                            onChange={() => setPrimaryMediaId(asset.id)}
                            className="size-3.5"
                          />
                          Primary
                        </label>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </TabsContent>

        {/* ---------------- Organization ---------------- */}
        <TabsContent value="organization" className="space-y-4">
          {categories.length === 0 ? (
            <p className="text-sm text-ink-muted">No categories exist yet.</p>
          ) : (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink">Categories</legend>
              <ul className="grid gap-1 sm:grid-cols-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <CheckboxField
                      id={`product-category-${category.id}`}
                      label={category.name}
                      checked={categoryIds.includes(category.id)}
                      onCheckedChange={(checked) =>
                        setCategoryIds((current) =>
                          checked === true
                            ? [...current, category.id]
                            : current.filter((value) => value !== category.id),
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
        </TabsContent>

        {/* ---------------- Extra content ---------------- */}
        <TabsContent value="content" className="space-y-5">
          <FormField
            id="product-whats-included"
            label="What's included"
            description="One item per line."
            error={form.formState.errors.whatsIncluded?.message ?? null}
          >
            {(field) => <Textarea {...field} rows={4} {...form.register("whatsIncluded")} />}
          </FormField>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-ink">Value propositions</h3>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => valueProps.append({ icon: "", title: "", body: "" })}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add
              </Button>
            </div>

            {valueProps.fields.length === 0 ? (
              <p className="text-sm text-ink-muted">None added.</p>
            ) : (
              <ul className="space-y-3">
                {valueProps.fields.map((field, index) => (
                  <li key={field.id} className="rounded-md border border-line p-3">
                    <div className="grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
                      <FormField id={`vp-icon-${index}`} label="Icon name">
                        {(f) => <Input {...f} {...form.register(`valueProps.${index}.icon`)} />}
                      </FormField>
                      <FormField
                        id={`vp-title-${index}`}
                        label="Title"
                        required
                        error={form.formState.errors.valueProps?.[index]?.title?.message ?? null}
                      >
                        {(f) => <Input {...f} {...form.register(`valueProps.${index}.title`)} />}
                      </FormField>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove value proposition ${index + 1}`}
                          onClick={() => valueProps.remove(index)}
                        >
                          <Trash2 className="size-4 text-danger" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <FormField id={`vp-body-${index}`} label="Body" className="mt-3">
                      {(f) => (
                        <Textarea {...f} rows={2} {...form.register(`valueProps.${index}.body`)} />
                      )}
                    </FormField>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-ink">Badges</h3>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => badges.append({ label: "", tone: "neutral" })}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add
              </Button>
            </div>

            <p className="mb-2 text-xs text-ink-muted">
              Badges are factual labels you set, such as &ldquo;New&rdquo;. Do not use them for
              urgency or discount claims.
            </p>

            {badges.fields.length === 0 ? (
              <p className="text-sm text-ink-muted">None added.</p>
            ) : (
              <ul className="space-y-2">
                {badges.fields.map((field, index) => (
                  <li key={field.id} className="grid gap-3 sm:grid-cols-[1fr_12rem_auto]">
                    <FormField
                      id={`badge-label-${index}`}
                      label="Label"
                      required
                      error={form.formState.errors.badges?.[index]?.label?.message ?? null}
                    >
                      {(f) => <Input {...f} {...form.register(`badges.${index}.label`)} />}
                    </FormField>
                    <FormField id={`badge-tone-${index}`} label="Tone">
                      {(f) => (
                        <select
                          {...f}
                          className={selectClass}
                          {...form.register(`badges.${index}.tone`)}
                        >
                          <option value="neutral">Neutral</option>
                          <option value="info">Info</option>
                          <option value="success">Success</option>
                          <option value="warning">Warning</option>
                        </select>
                      )}
                    </FormField>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove badge ${index + 1}`}
                        onClick={() => badges.remove(index)}
                      >
                        <Trash2 className="size-4 text-danger" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="product-shipping-summary"
              label="Shipping summary"
              error={form.formState.errors.shippingSummary?.message ?? null}
            >
              {(field) => <Textarea {...field} rows={3} {...form.register("shippingSummary")} />}
            </FormField>
            <FormField
              id="product-returns-summary"
              label="Returns summary"
              error={form.formState.errors.returnsSummary?.message ?? null}
            >
              {(field) => <Textarea {...field} rows={3} {...form.register("returnsSummary")} />}
            </FormField>
            <FormField
              id="product-warranty"
              label="Warranty text"
              error={form.formState.errors.warrantyText?.message ?? null}
            >
              {(field) => <Textarea {...field} rows={3} {...form.register("warrantyText")} />}
            </FormField>
            <FormField
              id="product-returns-window"
              label="Returns window (days)"
              error={form.formState.errors.returnsWindowDays?.message ?? null}
            >
              {(field) => (
                <Input {...field} inputMode="numeric" {...form.register("returnsWindowDays")} />
              )}
            </FormField>
          </div>
        </TabsContent>

        {/* ---------------- SEO ---------------- */}
        <TabsContent value="seo" className="space-y-4">
          <FormField
            id="product-seo-title"
            label="SEO title"
            description="Leave blank to use the product name."
            error={form.formState.errors.seoTitle?.message ?? null}
          >
            {(field) => <Input {...field} {...form.register("seoTitle")} />}
          </FormField>

          <FormField
            id="product-seo-description"
            label="SEO description"
            error={form.formState.errors.seoDescription?.message ?? null}
          >
            {(field) => <Textarea {...field} rows={3} {...form.register("seoDescription")} />}
          </FormField>

          <CheckboxField
            id="product-seo-noindex"
            label="Ask search engines not to index this product"
            checked={form.watch("seoNoindex") === true}
            onCheckedChange={(checked) => form.setValue("seoNoindex", checked === true)}
          />
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-line bg-surface py-3">
        <Button type="submit" loading={form.formState.isSubmitting} loadingLabel="Saving…">
          {product ? "Save product" : "Create product"}
        </Button>
        {!product ? (
          <span className="text-xs text-ink-muted">
            Variants, specifications, FAQs and related products can be set once the product exists.
          </span>
        ) : null}
      </div>
    </form>
  );
}
