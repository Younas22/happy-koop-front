"use client";

import { Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { deleteMediaAction } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { flattenFieldErrors } from "@/lib/forms/api-errors";
import { requestSameOrigin } from "@/lib/http/same-origin";
import type { AdminMediaAsset } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/datetime";

/**
 * Media library: upload and manage.
 *
 * The upload posts a multipart body to our own `/api/admin/media` handler,
 * which forwards it with the bearer token. All real validation - true MIME
 * type, size, dimensions, rejected extensions - happens on the server, so its
 * 422 message is what the admin sees rather than a guess made here.
 */
export function MediaManager({
  assets,
  locale,
  timeZone,
}: {
  assets: readonly AdminMediaAsset[];
  locale: string;
  timeZone: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<{ current: number; total: number } | null>(null);
  const [alt, setAlt] = React.useState("");
  const [folder, setFolder] = React.useState("");
  const [deleting, setDeleting] = React.useState<AdminMediaAsset | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  /**
   * Uploads every selected file, one request per file, in sequence. The API
   * takes a single file per request, and going one at a time keeps the server
   * and the upload rate limit comfortable. A rejected file does not stop the
   * rest; its reason is listed once the batch finishes.
   */
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Allow re-selecting the same files after a failure.
    event.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    const failures: string[] = [];
    let uploaded = 0;

    for (const [index, file] of files.entries()) {
      setProgress({ current: index + 1, total: files.length });

      const body = new FormData();
      body.set("file", file);
      if (alt.trim()) body.set("alt", alt.trim());
      if (folder.trim()) body.set("folder", folder.trim());

      const result = await requestSameOrigin<AdminMediaAsset>("/api/admin/media", {
        method: "POST",
        body,
      });

      if (result.ok) {
        uploaded += 1;
        continue;
      }

      const details = flattenFieldErrors(result.error.errors);
      failures.push(`${file.name}: ${details.length > 0 ? details.join(" ") : result.error.message}`);
    }

    setUploading(false);
    setProgress(null);

    if (failures.length > 0) {
      setUploadError(failures.join("\n"));
      toast.error(
        failures.length === 1 ? "1 file was rejected." : `${failures.length} files were rejected.`,
      );
    }

    if (uploaded > 0) {
      setAlt("");
      toast.success(uploaded === 1 ? "File uploaded." : `${uploaded} files uploaded.`);
      router.refresh();
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);

    const result = await deleteMediaAction(deleting.id);
    setDeleteBusy(false);

    if (!result.ok) {
      setDeleteError(result.error.message);
      return;
    }

    setDeleting(null);
    toast.success("File deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="surface-card p-4">
        <h2 className="text-sm font-semibold text-ink">Upload</h2>
        <p className="mt-1 text-xs text-ink-muted">
          JPEG, PNG, WebP, AVIF and MP4 are accepted. The server checks the real file type, size
          and dimensions, and rejects anything else.
        </p>

        {uploadError ? (
          <Alert tone="danger" live title="The upload was rejected" className="mt-3">
            <span className="whitespace-pre-line">{uploadError}</span>
          </Alert>
        ) : null}

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <FormField
            id="media-alt"
            label="Alt text"
            description="Describe the image for screen readers."
          >
            {(field) => (
              <Input
                {...field}
                value={alt}
                onChange={(event) => setAlt(event.target.value)}
                disabled={uploading}
              />
            )}
          </FormField>

          <FormField id="media-folder" label="Folder" description="Optional grouping label.">
            {(field) => (
              <Input
                {...field}
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
                disabled={uploading}
              />
            )}
          </FormField>
        </div>

        <div className="mt-3">
          <label
            htmlFor="media-file"
            className="tap-target inline-flex cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-sunken"
          >
            <Upload className="size-4" aria-hidden="true" />
            {uploading
              ? progress && progress.total > 1
                ? `Uploading ${progress.current} of ${progress.total}…`
                : "Uploading…"
              : "Choose files"}
          </label>
          <input
            id="media-file"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,video/mp4"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => void upload(event)}
          />
        </div>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          title="No media yet"
          description="Upload an image to use it on products, categories or the homepage."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {assets.map((asset) => (
            <li key={asset.id} className="surface-card overflow-hidden">
              <div className="relative aspect-square bg-sunken">
                {asset.type === "image" ? (
                  <Image
                    src={asset.thumbnailUrl ?? asset.url}
                    alt={asset.alt ?? ""}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-ink-muted">
                    Video
                  </span>
                )}
              </div>

              <div className="p-2.5">
                <p className="truncate text-xs font-medium text-ink">
                  {asset.originalFilename ?? `#${asset.id}`}
                </p>
                <p className="mt-0.5 text-2xs text-ink-muted">
                  {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}
                  {Math.max(1, Math.round(asset.sizeBytes / 1024))} KB
                </p>
                <p className="text-2xs text-ink-subtle">
                  {formatDate(asset.createdAt, { locale, timeZone }) ?? ""}
                </p>

                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-1.5 text-danger"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleting(asset);
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title="Delete this file?"
        recordName={deleting?.originalFilename ?? (deleting ? `Media #${deleting.id}` : "")}
        description="Anything still using this file will lose its image. This cannot be undone."
        confirmLabel="Delete file"
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
