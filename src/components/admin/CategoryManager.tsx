"use client";

import { ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/actions";
import { AdminTableWrap, Td, Th } from "@/components/admin/AdminParts";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { MediaPickerField } from "@/components/admin/MediaPickerField";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { flattenFieldErrors } from "@/lib/forms/api-errors";
import type { AdminCategory, AdminMediaAsset } from "@/lib/types/api";

/**
 * Category list with create / edit / delete.
 *
 * Parent selection excludes the category itself; the API additionally rejects
 * any choice that would create a cycle in the tree, and that 422 is shown on
 * the form.
 */

interface Draft {
  name: string;
  slug: string;
  parentId: string;
  description: string;
  imageMediaId: number | null;
  isActive: boolean;
  sortOrder: string;
  seoTitle: string;
  seoDescription: string;
}

function toDraft(category: AdminCategory | null): Draft {
  if (!category) {
    return {
      name: "",
      slug: "",
      parentId: "",
      description: "",
      imageMediaId: null,
      isActive: true,
      sortOrder: "0",
      seoTitle: "",
      seoDescription: "",
    };
  }
  return {
    name: category.name,
    slug: category.slug,
    parentId: category.parentId === null ? "" : String(category.parentId),
    description: category.description ?? "",
    imageMediaId: category.imageMediaId,
    isActive: category.isActive,
    sortOrder: String(category.sortOrder),
    seoTitle: category.seoTitle ?? "",
    seoDescription: category.seoDescription ?? "",
  };
}

const selectClass =
  "h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink";

export function CategoryManager({
  categories,
  media,
  mediaTotal,
  mediaTruncated,
}: {
  categories: readonly AdminCategory[];
  media: readonly AdminMediaAsset[];
  mediaTotal?: number;
  mediaTruncated?: boolean;
}) {
  const router = useRouter();

  const [editing, setEditing] = React.useState<{ open: boolean; category: AdminCategory | null }>({
    open: false,
    category: null,
  });
  const [draft, setDraft] = React.useState<Draft>(toDraft(null));
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [deleting, setDeleting] = React.useState<AdminCategory | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const byId = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  function open(category: AdminCategory | null) {
    setDraft(toDraft(category));
    setFormError(null);
    setEditing({ open: true, category });
  }

  async function save() {
    setSaving(true);
    setFormError(null);

    const parentId = draft.parentId === "" ? null : Number.parseInt(draft.parentId, 10);
    const sortOrder = Number.parseInt(draft.sortOrder, 10);

    const result = await saveCategoryAction(editing.category?.id ?? null, {
      name: draft.name,
      slug: draft.slug || null,
      parentId: Number.isFinite(parentId as number) ? parentId : null,
      description: draft.description || null,
      imageMediaId: draft.imageMediaId,
      isActive: draft.isActive,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      seoTitle: draft.seoTitle || null,
      seoDescription: draft.seoDescription || null,
    });

    setSaving(false);

    if (!result.ok) {
      const details = flattenFieldErrors(result.error.errors);
      setFormError(details.length > 0 ? details.join(" ") : result.error.message);
      return;
    }

    setEditing({ open: false, category: null });
    toast.success(editing.category ? "Category saved." : "Category created.");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);

    const result = await deleteCategoryAction(deleting.id);
    setDeleteBusy(false);

    if (!result.ok) {
      setDeleteError(result.error.message);
      return;
    }

    setDeleting(null);
    toast.success("Category deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => open(null)}>
          <Plus className="size-4" aria-hidden="true" />
          New category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Categories group products in the shop and give each one its own page."
          action={<Button onClick={() => open(null)}>New category</Button>}
        />
      ) : (
        <AdminTableWrap>
          <thead>
            <tr>
              <Th className="w-16">
                <span className="sr-only">Image</span>
              </Th>
              <Th>Name</Th>
              <Th>Parent</Th>
              <Th className="text-right">Products</Th>
              <Th className="text-right">Order</Th>
              <Th>Active</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <Td>
                  <span className="relative block size-10 overflow-hidden rounded-md border border-line bg-sunken">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center">
                        <ImageIcon className="size-4 text-ink-subtle" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                </Td>
                <Td>
                  <span className="font-medium text-ink">{category.name}</span>
                  <span className="block text-xs text-ink-muted">/{category.slug}</span>
                </Td>
                <Td>
                  {category.parentId === null
                    ? "-"
                    : (byId.get(category.parentId)?.name ?? `#${category.parentId}`)}
                </Td>
                <Td className="text-right tabular-nums">{category.productCount}</Td>
                <Td className="text-right tabular-nums">{category.sortOrder}</Td>
                <Td>
                  <Badge tone={category.isActive ? "success" : "neutral"}>
                    {category.isActive ? "Active" : "Hidden"}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => open(category)}>
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleting(category);
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTableWrap>
      )}

      <Dialog
        open={editing.open}
        onOpenChange={(open) => setEditing((state) => ({ ...state, open }))}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing.category ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>
              Categories appear in the shop filters and get their own page.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {formError ? (
              <Alert tone="danger" live title="The category was not saved">
                {formError}
              </Alert>
            ) : null}

            <FormField id="category-name" label="Name" required>
              {(field) => (
                <Input
                  {...field}
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              )}
            </FormField>

            <FormField
              id="category-slug"
              label="URL slug"
              description="Leave blank to generate one from the name."
            >
              {(field) => (
                <Input
                  {...field}
                  value={draft.slug}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              )}
            </FormField>

            <FormField
              id="category-parent"
              label="Parent category"
              description="A category cannot be its own ancestor."
            >
              {(field) => (
                <select
                  {...field}
                  className={selectClass}
                  value={draft.parentId}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, parentId: event.target.value }))
                  }
                >
                  <option value="">No parent (top level)</option>
                  {categories
                    .filter((candidate) => candidate.id !== editing.category?.id)
                    .map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </option>
                    ))}
                </select>
              )}
            </FormField>

            <FormField id="category-description" label="Description">
              {(field) => (
                <Textarea
                  {...field}
                  rows={3}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, description: event.target.value }))
                  }
                />
              )}
            </FormField>

            <MediaPickerField
              id="category-image"
              label="Category image"
              description="Used by the home page's category tiles section. The category page itself does not show it."
              value={draft.imageMediaId}
              onChange={(next) => setDraft((current) => ({ ...current, imageMediaId: next }))}
              media={media}
              total={mediaTotal}
              truncated={mediaTruncated}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="category-sort" label="Sort order">
                {(field) => (
                  <Input
                    {...field}
                    inputMode="numeric"
                    value={draft.sortOrder}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, sortOrder: event.target.value }))
                    }
                  />
                )}
              </FormField>

              <div className="flex items-end">
                <CheckboxField
                  id="category-active"
                  label="Visible in the shop"
                  checked={draft.isActive}
                  onCheckedChange={(checked) =>
                    setDraft((current) => ({ ...current, isActive: checked === true }))
                  }
                />
              </div>
            </div>

            <FormField id="category-seo-title" label="SEO title">
              {(field) => (
                <Input
                  {...field}
                  value={draft.seoTitle}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, seoTitle: event.target.value }))
                  }
                />
              )}
            </FormField>

            <FormField id="category-seo-description" label="SEO description">
              {(field) => (
                <Textarea
                  {...field}
                  rows={2}
                  value={draft.seoDescription}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, seoDescription: event.target.value }))
                  }
                />
              )}
            </FormField>
          </DialogBody>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing({ open: false, category: null })}>
              Cancel
            </Button>
            <Button loading={saving} loadingLabel="Saving…" onClick={() => void save()}>
              {editing.category ? "Save category" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title="Delete this category?"
        recordName={deleting ? `${deleting.name} (/${deleting.slug})` : ""}
        description={
          deleting && deleting.productCount > 0
            ? `${deleting.productCount} product(s) are in this category. They are not deleted, but they lose this category.`
            : "Products are not deleted, only unlinked from this category."
        }
        confirmLabel="Delete category"
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
