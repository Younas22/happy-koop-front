"use client";

import { ImageIcon, Search, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import type { AdminMediaAsset } from "@/lib/types/api";

export interface MediaPickerFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string | null;
  /** The selected asset id, or `null` when nothing is chosen. */
  value: number | null;
  onChange: (value: number | null) => void;
  media: readonly AdminMediaAsset[];
  /** True when the library holds more assets than were loaded. */
  truncated?: boolean;
  /** The library's real size, for the "showing N of M" line. */
  total?: number;
}

/** Filename, alt text, folder, id and MIME type are all worth searching by. */
function matches(asset: AdminMediaAsset, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [asset.originalFilename, asset.alt, asset.folder, String(asset.id), asset.mimeType].some(
    (value) => (value ?? "").toLowerCase().includes(needle),
  );
}

function assetLabel(asset: AdminMediaAsset): string {
  return asset.originalFilename ?? asset.alt ?? `Media #${asset.id}`;
}

/**
 * Image field backed by the media library.
 *
 * This replaces a `<select>` of filenames, which could not do the job it was
 * given: a filename is not a picture, so choosing a logo or a hero image meant
 * guessing, saving, looking at the storefront and going back. The field now
 * shows the current image and opens the library in a dialog with a search box
 * and a thumbnail grid.
 *
 * The grid searches the assets it was handed. `truncated` comes from the
 * loader, so a library bigger than the picker fetched says so rather than
 * letting an admin conclude an image has gone missing.
 */
export function MediaPickerField({
  id,
  label,
  description,
  error,
  value,
  onChange,
  media,
  truncated = false,
  total,
}: MediaPickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = value === null ? null : (media.find((asset) => asset.id === value) ?? null);
  const results = React.useMemo(
    () => media.filter((asset) => matches(asset, query)),
    [media, query],
  );

  function choose(assetId: number) {
    onChange(assetId);
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    // Clearing the query on close means the dialog always reopens on the whole
    // library, not on whatever was typed last time.
    if (!next) setQuery("");
    setOpen(next);
  }

  const libraryLine = truncated && total
    ? `Showing the ${media.length} most recent of ${total} assets.`
    : `${media.length} ${media.length === 1 ? "asset" : "assets"}.`;

  return (
    <FormField id={id} label={label} description={description} error={error}>
      {(field) => (
        <div className="flex items-center gap-3">
          {/* The preview is the field's value, made visible. */}
          <span className="relative size-16 shrink-0 overflow-hidden rounded-md border border-line bg-sunken">
            {selected && selected.type === "image" ? (
              <Image
                src={selected.thumbnailUrl ?? selected.url}
                alt={selected.alt ?? ""}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center">
                <ImageIcon className="size-5 text-ink-subtle" aria-hidden="true" />
              </span>
            )}
          </span>

          <div className="min-w-0 flex-1 space-y-1.5">
            <p id={`${id}-selection`} className="truncate text-sm text-ink">
              {selected ? assetLabel(selected) : "No image selected"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setOpen(true)}
                aria-describedby={`${id}-selection`}
              >
                {selected ? "Change image" : "Choose image"}
              </Button>
              {value !== null ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                  <X className="size-4" aria-hidden="true" />
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          {/* Keeps the chosen id in the DOM, so the label points at a real
              control and the value is visible to anything reading the form. */}
          <input
            type="hidden"
            id={field.id}
            name={id}
            value={value ?? ""}
            aria-invalid={field["aria-invalid"]}
            readOnly
          />

          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{label}</DialogTitle>
                <DialogDescription>
                  {media.length === 0
                    ? "The media library is empty. Upload images under Media first."
                    : `Search by filename, alt text, folder or id. ${libraryLine}`}
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4">
                {media.length > 0 ? (
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-subtle"
                      aria-hidden="true"
                    />
                    <label htmlFor={`${id}-search`} className="sr-only">
                      Search the media library
                    </label>
                    <Input
                      id={`${id}-search`}
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search images"
                      autoFocus
                      className="pl-11"
                    />
                  </div>
                ) : null}

                {media.length === 0 ? null : results.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ink-muted">
                    No image matches &ldquo;{query}&rdquo;.
                  </p>
                ) : (
                  <ul className="grid max-h-[55dvh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4">
                    {results.map((asset) => {
                      const isSelected = asset.id === value;
                      return (
                        <li key={asset.id}>
                          <button
                            type="button"
                            onClick={() => choose(asset.id)}
                            aria-pressed={isSelected}
                            className={`block w-full overflow-hidden rounded-md border-2 text-left transition-colors ${
                              isSelected ? "border-brand" : "border-line hover:border-line-strong"
                            }`}
                          >
                            <span className="relative block aspect-square bg-sunken">
                              {asset.type === "image" ? (
                                <Image
                                  src={asset.thumbnailUrl ?? asset.url}
                                  alt={asset.alt ?? ""}
                                  fill
                                  sizes="200px"
                                  className="object-cover"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center">
                                  <ImageIcon
                                    className="size-5 text-ink-subtle"
                                    aria-hidden="true"
                                  />
                                </span>
                              )}
                            </span>
                            <span className="block truncate px-2 py-1.5 text-xs text-ink">
                              {assetLabel(asset)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </DialogBody>

              <DialogFooter>
                {value !== null ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      onChange(null);
                      handleOpenChange(false);
                    }}
                  >
                    Remove image
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </FormField>
  );
}
