"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { saveStoreSettingsAction } from "@/app/admin/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckboxField } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { applyFieldErrors } from "@/lib/forms/api-errors";
import type { AdminMediaAsset, AdminStoreSettingsResponse } from "@/lib/types/api";

/**
 * Store settings.
 *
 * TRUTHFULNESS ABOUT SCOPE: the API returns an `infrastructureNotice` and it
 * is rendered VERBATIM, right next to the two URL fields it concerns. These
 * are application settings. Saving them does not touch DNS, TLS, hosting,
 * the Vercel project or its environment variables, CORS allowlists, cookie
 * domains or provider webhook URLs - each of those lives in its own system,
 * and this form must not imply otherwise.
 *
 * Changing the live API endpoint is additionally explained: the new origin has
 * to serve the same runtime-config contract, must be on the frontend's host
 * allowlist, and the cached config/sessions may need a refresh.
 *
 * On a successful save the action refreshes the public runtime-config cache,
 * so the storefront picks the change up immediately.
 */

const urlField = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value),
    "Enter an absolute http(s) URL.",
  );

const hexField = z
  .string()
  .trim()
  .refine((value) => value === "" || /^#[0-9a-fA-F]{6}$/.test(value), "Use a hex colour like #2563EB.");

const schema = z.object({
  storeName: z.string().trim().min(1, "Enter the store name.").max(120),
  tagline: z.string().trim().max(200),
  contactEmail: z.string().trim().max(255),
  contactPhone: z.string().trim().max(40),
  addressLines: z.string().max(500),

  primaryColor: hexField,
  accentColor: hexField,
  radius: z.string().trim().max(20),

  currency: z.string().trim().length(3, "Use a 3-letter ISO currency code.").toUpperCase(),
  locale: z.string().trim().min(2).max(20),
  timezone: z.string().trim().min(1).max(64),

  canonicalFrontendUrl: urlField,
  activeApiBaseUrl: urlField,

  seoDefaultTitle: z.string().trim().max(160),
  seoTitleTemplate: z.string().trim().max(160),
  seoDefaultDescription: z.string().trim().max(320),

  shippingSummary: z.string().trim().max(2000),
  returnsSummary: z.string().trim().max(2000),

  instagram: urlField,
  facebook: urlField,
  tiktok: urlField,
  x: urlField,

  logoMediaId: z.string(),
  logoDarkMediaId: z.string(),
  faviconMediaId: z.string(),
  seoDefaultOgImageMediaId: z.string(),

  featureReviews: z.boolean(),
  featureWishlist: z.boolean(),
  featureNewsletter: z.boolean(),
  featureGuestCheckout: z.boolean(),
  featureSearch: z.boolean(),
  featurePublicStockCounts: z.boolean(),
});

type Values = z.infer<typeof schema>;

const KNOWN_FIELDS = [
  "storeName",
  "tagline",
  "contactEmail",
  "contactPhone",
  "addressLines",
  "primaryColor",
  "accentColor",
  "radius",
  "currency",
  "locale",
  "timezone",
  "canonicalFrontendUrl",
  "activeApiBaseUrl",
  "seoDefaultTitle",
  "seoTitleTemplate",
  "seoDefaultDescription",
  "shippingSummary",
  "returnsSummary",
  "logoMediaId",
  "logoDarkMediaId",
  "faviconMediaId",
  "seoDefaultOgImageMediaId",
] as const;

const selectClass =
  "h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink";

function mediaIdString(value: number | null): string {
  return value === null ? "" : String(value);
}

function toValues(settings: AdminStoreSettingsResponse): Values {
  return {
    storeName: settings.storeName ?? "",
    tagline: settings.tagline ?? "",
    contactEmail: settings.contactEmail ?? "",
    contactPhone: settings.contactPhone ?? "",
    addressLines: settings.addressLines.join("\n"),

    primaryColor: settings.primaryColor ?? "",
    accentColor: settings.accentColor ?? "",
    radius: settings.radius ?? "md",

    currency: settings.currency ?? "USD",
    locale: settings.locale ?? "en-US",
    timezone: settings.timezone ?? "UTC",

    canonicalFrontendUrl: settings.canonicalFrontendUrl ?? "",
    activeApiBaseUrl: settings.activeApiBaseUrl ?? "",

    seoDefaultTitle: settings.seoDefaultTitle ?? "",
    seoTitleTemplate: settings.seoTitleTemplate ?? "",
    seoDefaultDescription: settings.seoDefaultDescription ?? "",

    shippingSummary: settings.shippingSummary ?? "",
    returnsSummary: settings.returnsSummary ?? "",

    instagram: settings.social.instagram ?? "",
    facebook: settings.social.facebook ?? "",
    tiktok: settings.social.tiktok ?? "",
    x: settings.social.x ?? "",

    logoMediaId: mediaIdString(settings.logoMediaId),
    logoDarkMediaId: mediaIdString(settings.logoDarkMediaId),
    faviconMediaId: mediaIdString(settings.faviconMediaId),
    seoDefaultOgImageMediaId: mediaIdString(settings.seoDefaultOgImageMediaId),

    featureReviews: settings.features.reviews,
    featureWishlist: settings.features.wishlist,
    featureNewsletter: settings.features.newsletter,
    featureGuestCheckout: settings.features.guestCheckout,
    featureSearch: settings.features.search,
    featurePublicStockCounts: settings.features.publicStockCounts,
  };
}

export function StoreSettingsForm({
  settings,
  media,
  allowedApiHosts,
  bootstrapUrl,
}: {
  settings: AdminStoreSettingsResponse;
  media: readonly AdminMediaAsset[];
  /** The frontend's deployment-time host allowlist, for the API URL note. */
  allowedApiHosts: readonly string[];
  /** The frontend's stable bootstrap origin, which this form cannot change. */
  bootstrapUrl: string;
}) {
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(settings),
  });

  function mediaId(value: string): number | null {
    const parsed = Number.parseInt(value, 10);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }

  async function onSubmit(values: Values) {
    setFormError(null);

    const result = await saveStoreSettingsAction({
      storeName: values.storeName,
      tagline: values.tagline || null,
      contactEmail: values.contactEmail || null,
      contactPhone: values.contactPhone || null,
      addressLines: values.addressLines
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),

      primaryColor: values.primaryColor || null,
      accentColor: values.accentColor || null,
      radius: values.radius || null,

      currency: values.currency,
      locale: values.locale,
      timezone: values.timezone,

      canonicalFrontendUrl: values.canonicalFrontendUrl || null,
      activeApiBaseUrl: values.activeApiBaseUrl || null,

      seoDefaultTitle: values.seoDefaultTitle || null,
      seoTitleTemplate: values.seoTitleTemplate || null,
      seoDefaultDescription: values.seoDefaultDescription || null,

      shippingSummary: values.shippingSummary || null,
      returnsSummary: values.returnsSummary || null,

      logoMediaId: mediaId(values.logoMediaId),
      logoDarkMediaId: mediaId(values.logoDarkMediaId),
      faviconMediaId: mediaId(values.faviconMediaId),
      seoDefaultOgImageMediaId: mediaId(values.seoDefaultOgImageMediaId),

      social: {
        instagram: values.instagram || null,
        facebook: values.facebook || null,
        tiktok: values.tiktok || null,
        x: values.x || null,
      },

      features: {
        reviews: values.featureReviews,
        wishlist: values.featureWishlist,
        newsletter: values.featureNewsletter,
        guestCheckout: values.featureGuestCheckout,
        search: values.featureSearch,
        publicStockCounts: values.featurePublicStockCounts,
      },
    });

    if (!result.ok) {
      setFormError(applyFieldErrors(result.error, form.setError, KNOWN_FIELDS));
      toast.error("Settings were not saved.");
      return;
    }

    form.reset(values);
    toast.success("Settings saved. The storefront configuration cache has been refreshed.");
  }

  const mediaSelect = (name: keyof Values, label: string, description?: string) => (
    <FormField id={`setting-${String(name)}`} label={label} description={description}>
      {(field) => (
        <select {...field} className={selectClass} {...form.register(name)}>
          <option value="">Not set</option>
          {media.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.originalFilename ?? asset.alt ?? `Media #${asset.id}`}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {formError ? (
        <Alert tone="danger" live title="Settings were not saved">
          {formError}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Store identity</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="setting-store-name"
            label="Store name"
            required
            error={form.formState.errors.storeName?.message ?? null}
          >
            {(field) => <Input {...field} {...form.register("storeName")} />}
          </FormField>

          <FormField
            id="setting-tagline"
            label="Tagline"
            error={form.formState.errors.tagline?.message ?? null}
          >
            {(field) => <Input {...field} {...form.register("tagline")} />}
          </FormField>

          <FormField
            id="setting-contact-email"
            label="Contact email"
            error={form.formState.errors.contactEmail?.message ?? null}
          >
            {(field) => <Input {...field} type="email" {...form.register("contactEmail")} />}
          </FormField>

          <FormField
            id="setting-contact-phone"
            label="Contact phone"
            error={form.formState.errors.contactPhone?.message ?? null}
          >
            {(field) => <Input {...field} type="tel" {...form.register("contactPhone")} />}
          </FormField>

          <FormField
            id="setting-address"
            label="Address lines"
            description="One line per row. Shown in the footer."
            className="sm:col-span-2"
          >
            {(field) => <Textarea {...field} rows={3} {...form.register("addressLines")} />}
          </FormField>

          {mediaSelect("logoMediaId", "Logo")}
          {mediaSelect("logoDarkMediaId", "Logo (dark background)")}
          {mediaSelect("faviconMediaId", "Favicon")}
          {mediaSelect("seoDefaultOgImageMediaId", "Default social share image")}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <FormField
            id="setting-primary-color"
            label="Primary colour"
            description="Hex, e.g. #2563EB."
            error={form.formState.errors.primaryColor?.message ?? null}
          >
            {(field) => <Input {...field} {...form.register("primaryColor")} />}
          </FormField>

          <FormField
            id="setting-accent-color"
            label="Accent colour"
            error={form.formState.errors.accentColor?.message ?? null}
          >
            {(field) => <Input {...field} {...form.register("accentColor")} />}
          </FormField>

          <FormField id="setting-radius" label="Corner rounding">
            {(field) => (
              <select {...field} className={selectClass} {...form.register("radius")}>
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            )}
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Locale and currency</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <FormField
            id="setting-currency"
            label="Currency"
            description="ISO 4217 code from the supported list."
            error={form.formState.errors.currency?.message ?? null}
          >
            {(field) => <Input {...field} {...form.register("currency")} />}
          </FormField>

          <FormField
            id="setting-locale"
            label="Locale"
            description="e.g. en-US. Used for number and date formatting."
            error={form.formState.errors.locale?.message ?? null}
          >
            {(field) => <Input {...field} {...form.register("locale")} />}
          </FormField>

          <FormField
            id="setting-timezone"
            label="Timezone"
            description="e.g. UTC or Europe/Berlin."
            error={form.formState.errors.timezone?.message ?? null}
          >
            {(field) => <Input {...field} {...form.register("timezone")} />}
          </FormField>
        </CardBody>
      </Card>

      {/* --------------------------------------------------------------- *
          URLs - the notice the contract requires, shown verbatim.
       * --------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Public URLs</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Alert tone="warning" title="What saving these does and does not change">
            {/* VERBATIM from the API response - do not paraphrase. */}
            {settings.infrastructureNotice}
          </Alert>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="setting-frontend-url"
              label="Canonical frontend URL"
              description="Used for canonical links, sitemap entries and share previews."
              error={form.formState.errors.canonicalFrontendUrl?.message ?? null}
            >
              {(field) => (
                <Input {...field} type="url" {...form.register("canonicalFrontendUrl")} />
              )}
            </FormField>

            <FormField
              id="setting-api-url"
              label="Active API base URL"
              description="The API origin the storefront is told to use."
              error={form.formState.errors.activeApiBaseUrl?.message ?? null}
            >
              {(field) => <Input {...field} type="url" {...form.register("activeApiBaseUrl")} />}
            </FormField>
          </div>

          <div className="rounded-md border border-line bg-sunken p-3 text-xs text-ink-muted">
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              <Info className="size-3.5 shrink-0" aria-hidden="true" />
              Before you change the active API base URL
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              <li>
                The new origin must expose the same runtime-config contract at
                {" "}
                <code className="rounded-xs bg-surface px-1">/api/v1/public/runtime-config</code>,
                or the storefront falls back to neutral defaults and marks itself as degraded.
              </li>
              <li>
                Its host must appear in the storefront&rsquo;s deployment-time allowlist. Hosts
                currently allowed:{" "}
                <span className="font-medium text-ink">
                  {allowedApiHosts.length > 0 ? allowedApiHosts.join(", ") : "none configured"}
                </span>
                . A host that is not listed is rejected and the previous origin keeps being used.
              </li>
              <li>
                The storefront caches this configuration, so a change may take up to a minute to
                appear everywhere even though saving refreshes the cache immediately. Signed-in
                sessions issued by the old API will not be valid on a different API.
              </li>
              <li>
                The bootstrap address the storefront reads first is{" "}
                <span className="font-medium text-ink">{bootstrapUrl}</span>. It is a deployment
                setting and cannot be changed from this screen.
              </li>
            </ul>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO defaults</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="setting-seo-title"
            label="Default title"
            error={form.formState.errors.seoDefaultTitle?.message ?? null}
          >
            {(field) => <Input {...field} {...form.register("seoDefaultTitle")} />}
          </FormField>

          <FormField
            id="setting-seo-template"
            label="Title template"
            description="Use %s for the page title, e.g. %s | HappyKoop."
            error={form.formState.errors.seoTitleTemplate?.message ?? null}
          >
            {(field) => <Input {...field} {...form.register("seoTitleTemplate")} />}
          </FormField>

          <FormField
            id="setting-seo-description"
            label="Default description"
            className="sm:col-span-2"
            error={form.formState.errors.seoDefaultDescription?.message ?? null}
          >
            {(field) => <Textarea {...field} rows={2} {...form.register("seoDefaultDescription")} />}
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policies</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="setting-shipping-summary"
            label="Shipping summary"
            description="Shown on product pages. Leave blank to show nothing."
          >
            {(field) => <Textarea {...field} rows={4} {...form.register("shippingSummary")} />}
          </FormField>

          <FormField id="setting-returns-summary" label="Returns summary">
            {(field) => <Textarea {...field} rows={4} {...form.register("returnsSummary")} />}
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social links</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="setting-instagram"
            label="Instagram URL"
            error={form.formState.errors.instagram?.message ?? null}
          >
            {(field) => <Input {...field} type="url" {...form.register("instagram")} />}
          </FormField>
          <FormField
            id="setting-facebook"
            label="Facebook URL"
            error={form.formState.errors.facebook?.message ?? null}
          >
            {(field) => <Input {...field} type="url" {...form.register("facebook")} />}
          </FormField>
          <FormField
            id="setting-tiktok"
            label="TikTok URL"
            error={form.formState.errors.tiktok?.message ?? null}
          >
            {(field) => <Input {...field} type="url" {...form.register("tiktok")} />}
          </FormField>
          <FormField
            id="setting-x"
            label="X URL"
            error={form.formState.errors.x?.message ?? null}
          >
            {(field) => <Input {...field} type="url" {...form.register("x")} />}
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardBody className="space-y-1">
          <CheckboxField
            id="feature-reviews"
            label="Customer reviews"
            checked={form.watch("featureReviews") === true}
            onCheckedChange={(checked) => form.setValue("featureReviews", checked === true)}
          />
          <CheckboxField
            id="feature-guest-checkout"
            label="Guest checkout"
            checked={form.watch("featureGuestCheckout") === true}
            onCheckedChange={(checked) => form.setValue("featureGuestCheckout", checked === true)}
          />
          <CheckboxField
            id="feature-search"
            label="Search"
            checked={form.watch("featureSearch") === true}
            onCheckedChange={(checked) => form.setValue("featureSearch", checked === true)}
          />
          <CheckboxField
            id="feature-stock-counts"
            label="Show exact stock counts in the store"
            checked={form.watch("featurePublicStockCounts") === true}
            onCheckedChange={(checked) =>
              form.setValue("featurePublicStockCounts", checked === true)
            }
          />
          <CheckboxField
            id="feature-wishlist"
            label="Wishlist"
            checked={form.watch("featureWishlist") === true}
            onCheckedChange={(checked) => form.setValue("featureWishlist", checked === true)}
          />
          <CheckboxField
            id="feature-newsletter"
            label="Newsletter signup"
            checked={form.watch("featureNewsletter") === true}
            onCheckedChange={(checked) => form.setValue("featureNewsletter", checked === true)}
          />
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-surface py-3">
        <Button type="submit" loading={form.formState.isSubmitting} loadingLabel="Saving…">
          Save settings
        </Button>
        {settings.configVersion ? (
          <span className="text-xs text-ink-muted">
            Configuration version {settings.configVersion}
          </span>
        ) : null}
      </div>
    </form>
  );
}
