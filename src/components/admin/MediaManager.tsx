"use client";

import { CheckCircle2, Loader2, Trash2, Upload, XCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { bulkDeleteMediaAction, deleteMediaAction } from "@/app/admin/actions";
import {
  BulkActionBar,
  BulkDeleteButton,
  BulkSelectAll,
  BulkSelection,
  BulkSelectRow,
} from "@/components/admin/BulkSelection";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { flattenFieldErrors } from "@/lib/forms/api-errors";
import { uploadSameOrigin } from "@/lib/http/same-origin";
import type { AdminMediaAsset } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/datetime";

type UploadItem = {
  key: string;
  name: string;
  status: "waiting" | "uploading" | "processing" | "done" | "failed";
  /** Share of the file's bytes sent so far, 0 to 1. */
  fraction: number;
  error: string | null;
};

const STATUS_LABEL: Record<UploadItem["status"], string> = {
  waiting: "Waiting",
  uploading: "Uploading",
  processing: "Processing",
  done: "Uploaded",
  failed: "Rejected",
};

/** Overall bar for the batch plus one bar per file. */
function UploadProgress({ items }: { items: readonly UploadItem[] }) {
  const finished = items.filter(
    (item) => item.status === "done" || item.status === "failed",
  );
  // A file counts fully once the server has answered; until then, by bytes
  // sent, capped short of complete while the server is still processing it.
  const overall =
    items.reduce(
      (sum, item) =>
        sum +
        (item.status === "done" || item.status === "failed"
          ? 1
          : item.fraction * 0.95),
      0,
    ) / items.length;
  const percent = Math.round(overall * 100);

  return (
    <div className="mt-4 space-y-3">
      <div>
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>
            {finished.length} of {items.length}{" "}
            {items.length === 1 ? "file" : "files"}
          </span>
          <span className="tabular-nums">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Upload progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-1 h-2 overflow-hidden rounded-full bg-sunken"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="max-h-72 space-y-2 overflow-y-auto">
        {items.map((item) => {
          const itemPercent =
            item.status === "done" ? 100 : Math.round(item.fraction * 100);
          return (
            <li key={item.key} className="rounded-md border border-line p-2.5">
              <div className="flex items-center gap-2 text-xs">
                {item.status === "done" ? (
                  <CheckCircle2
                    className="size-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                ) : item.status === "failed" ? (
                  <XCircle
                    className="size-4 shrink-0 text-danger"
                    aria-hidden="true"
                  />
                ) : item.status === "waiting" ? (
                  <span className="size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Loader2
                    className="size-4 shrink-0 animate-spin text-ink-muted"
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 flex-1 truncate font-medium text-ink">
                  {item.name}
                </span>
                <span className="shrink-0 tabular-nums text-ink-muted">
                  {item.status === "uploading"
                    ? `${itemPercent}%`
                    : STATUS_LABEL[item.status]}
                </span>
              </div>
              {item.status === "failed" ? (
                <p className="mt-1 text-2xs text-danger">{item.error}</p>
              ) : (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken">
                  <div
                    className={`h-full rounded-full transition-[width] duration-200 ${
                      item.status === "done" ? "bg-success" : "bg-brand"
                    } ${item.status === "processing" ? "animate-pulse" : ""}`}
                    style={{ width: `${itemPercent}%` }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
  const [queue, setQueue] = React.useState<UploadItem[]>([]);
  const [alt, setAlt] = React.useState("");
  const [folder, setFolder] = React.useState("");
  const [deleting, setDeleting] = React.useState<AdminMediaAsset | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const ids = React.useMemo(() => assets.map((asset) => asset.id), [assets]);

  /**
   * Uploads every selected file, one request per file, in sequence. The API
   * takes a single file per request, and going one at a time keeps the server
   * and the upload rate limit comfortable. A rejected file does not stop the
   * rest; its reason is shown on its row in the progress list.
   */
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Allow re-selecting the same files after a failure.
    event.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    setQueue(
      files.map((file, index) => ({
        key: `${Date.now()}-${index}`,
        name: file.name,
        status: "waiting",
        fraction: 0,
        error: null,
      })),
    );

    const patch = (index: number, changes: Partial<UploadItem>) =>
      setQueue((items) =>
        items.map((item, i) => (i === index ? { ...item, ...changes } : item)),
      );

    let failures = 0;
    let uploaded = 0;

    for (const [index, file] of files.entries()) {
      patch(index, { status: "uploading" });

      const body = new FormData();
      body.set("file", file);
      if (alt.trim()) body.set("alt", alt.trim());
      if (folder.trim()) body.set("folder", folder.trim());

      const result = await uploadSameOrigin<AdminMediaAsset>(
        "/api/admin/media",
        body,
        (fraction) =>
          // Bytes sent is not the end: the server still stores and resizes it.
          patch(
            index,
            fraction >= 1
              ? { status: "processing", fraction: 1 }
              : { fraction },
          ),
      );

      if (result.ok) {
        uploaded += 1;
        patch(index, { status: "done", fraction: 1 });
        continue;
      }

      failures += 1;
      const details = flattenFieldErrors(result.error.errors);
      patch(index, {
        status: "failed",
        error: details.length > 0 ? details.join(" ") : result.error.message,
      });
    }

    setUploading(false);

    if (failures > 0) {
      toast.error(
        failures === 1
          ? "1 file was rejected."
          : `${failures} files were rejected.`,
      );
    }

    if (uploaded > 0) {
      setAlt("");
      toast.success(
        uploaded === 1 ? "File uploaded." : `${uploaded} files uploaded.`,
      );
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
          JPEG, PNG, WebP, AVIF and MP4 are accepted. The server checks the real
          file type, size and dimensions, and rejects anything else.
        </p>

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

          <FormField
            id="media-folder"
            label="Folder"
            description="Optional grouping label."
          >
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
            {uploading ? "Uploading…" : "Choose files"}
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

        {queue.length > 0 ? <UploadProgress items={queue} /> : null}
      </div>

      {assets.length === 0 ? (
        <EmptyState
          title="No media yet"
          description="Upload an image to use it on products, categories or the homepage."
        />
      ) : (
        <BulkSelection ids={ids}>
          <div className="mb-3 flex min-h-12 items-center gap-3 px-1">
            <BulkSelectAll label="Select all files on this page" />
            <span className="text-sm text-ink-muted">
              Select all on this page
            </span>
          </div>
          <BulkActionBar>
            <BulkDeleteButton
              action={bulkDeleteMediaAction}
              singular="file"
              plural="files"
              description="Anything still using these files will lose its image. This cannot be undone."
            />
          </BulkActionBar>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {assets.map((asset) => (
              <li key={asset.id} className="surface-card overflow-hidden">
                <div className="relative aspect-square bg-sunken">
                  <span className="absolute top-2 left-2 z-[1] rounded-xs bg-surface/90 p-0.5">
                    <BulkSelectRow
                      id={asset.id}
                      label={`Select ${asset.originalFilename ?? `media #${asset.id}`}`}
                    />
                  </span>
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
                    {asset.width && asset.height
                      ? `${asset.width}×${asset.height} · `
                      : ""}
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
        </BulkSelection>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title="Delete this file?"
        recordName={
          deleting?.originalFilename ??
          (deleting ? `Media #${deleting.id}` : "")
        }
        description="Anything still using this file will lose its image. This cannot be undone."
        confirmLabel="Delete file"
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
