"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { deletePageAction, savePageAction } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { applyFieldErrors } from "@/lib/forms/api-errors";
import type { AdminPage } from "@/lib/types/api";

/**
 * CMS page editor.
 *
 * `body` accepts HTML, which the server sanitizes before storing and serves
 * sanitized to the storefront - this editor does not try to sanitize anything
 * itself, because the browser is not the right place to enforce that.
 */

const schema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Enter a slug.")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens."),
  excerpt: z.string().trim().max(500),
  body: z.string().max(200000),
  seoTitle: z.string().trim().max(160),
  seoDescription: z.string().trim().max(320),
  seoNoindex: z.boolean(),
  isPublished: z.boolean(),
});

type Values = z.infer<typeof schema>;

const FIELDS = [
  "title",
  "slug",
  "excerpt",
  "body",
  "seoTitle",
  "seoDescription",
  "seoNoindex",
  "isPublished",
] as const;

export function PageEditor({ page }: { page: AdminPage | null }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: page?.title ?? "",
      slug: page?.slug ?? "",
      excerpt: page?.excerpt ?? "",
      body: page?.body ?? "",
      seoTitle: page?.seo.title ?? "",
      seoDescription: page?.seo.description ?? "",
      seoNoindex: page?.seo.noindex ?? false,
      isPublished: page?.isPublished ?? false,
    },
  });

  async function onSubmit(values: Values) {
    setFormError(null);

    const result = await savePageAction(page?.id ?? null, {
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt || null,
      body: values.body || null,
      seoTitle: values.seoTitle || null,
      seoDescription: values.seoDescription || null,
      seoNoindex: values.seoNoindex,
      isPublished: values.isPublished,
    });

    if (!result.ok) {
      setFormError(applyFieldErrors(result.error, form.setError, FIELDS));
      toast.error("The page was not saved.");
      return;
    }

    toast.success(page ? "Page saved." : "Page created.");

    if (!page) {
      router.push(`/admin/pages/${result.data.id}`);
      return;
    }

    router.refresh();
  }

  async function confirmDelete() {
    if (!page) return;
    setDeleteBusy(true);
    setDeleteError(null);

    const result = await deletePageAction(page.id);
    setDeleteBusy(false);

    if (!result.ok) {
      setDeleteError(result.error.message);
      return;
    }

    setDeleteOpen(false);
    toast.success("Page deleted.");
    router.push("/admin/pages");
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <Alert tone="danger" live title="The page was not saved">
          {formError}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="page-title"
          label="Title"
          required
          error={form.formState.errors.title?.message ?? null}
        >
          {(field) => <Input {...field} {...form.register("title")} />}
        </FormField>

        <FormField
          id="page-slug"
          label="URL slug"
          required
          description="The page is served at /pages/{slug}."
          error={form.formState.errors.slug?.message ?? null}
        >
          {(field) => <Input {...field} {...form.register("slug")} />}
        </FormField>
      </div>

      <FormField
        id="page-excerpt"
        label="Excerpt"
        description="Short summary, used where a preview is needed."
        error={form.formState.errors.excerpt?.message ?? null}
      >
        {(field) => <Textarea {...field} rows={2} {...form.register("excerpt")} />}
      </FormField>

      <FormField
        id="page-body"
        label="Body"
        description="HTML is allowed and is sanitized on the server before it is stored."
        error={form.formState.errors.body?.message ?? null}
      >
        {(field) => <Textarea {...field} rows={16} className="font-mono text-xs" {...form.register("body")} />}
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="page-seo-title"
          label="SEO title"
          error={form.formState.errors.seoTitle?.message ?? null}
        >
          {(field) => <Input {...field} {...form.register("seoTitle")} />}
        </FormField>

        <FormField
          id="page-seo-description"
          label="SEO description"
          error={form.formState.errors.seoDescription?.message ?? null}
        >
          {(field) => <Input {...field} {...form.register("seoDescription")} />}
        </FormField>
      </div>

      <div className="space-y-1">
        <CheckboxField
          id="page-published"
          label="Published - visible in the store"
          checked={form.watch("isPublished") === true}
          onCheckedChange={(checked) => form.setValue("isPublished", checked === true)}
        />
        <CheckboxField
          id="page-noindex"
          label="Ask search engines not to index this page"
          checked={form.watch("seoNoindex") === true}
          onCheckedChange={(checked) => form.setValue("seoNoindex", checked === true)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={form.formState.isSubmitting} loadingLabel="Saving…">
          {page ? "Save page" : "Create page"}
        </Button>

        {page ? (
          <Button
            type="button"
            variant="ghost"
            className="text-danger"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete page
          </Button>
        ) : null}
      </div>

      {page ? (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete this page?"
          recordName={`${page.title} (/pages/${page.slug})`}
          description="The page and its content are removed. Any link to it will 404."
          confirmLabel="Delete page"
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </form>
  );
}
