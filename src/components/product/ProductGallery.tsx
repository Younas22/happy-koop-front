"use client";

import { ImageOff, Play, ZoomIn } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import type { MediaItem } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";
import { useMessages } from "@/i18n/client";
import { fmt } from "@/i18n/format";

export interface ProductGalleryProps {
  media: readonly MediaItem[];
  productName: string;
  /**
   * `variant.mediaId` of the active variant. When it matches an item, the
   * gallery jumps to it - the backend decides which media belongs to which
   * variant.
   */
  activeMediaId?: number | null;
}

/**
 * Product gallery: main media, thumbnail rail, lightbox, and video support.
 *
 * Renders an honest placeholder only when the product genuinely has no media -
 * it never shows a stand-in product photo.
 */
export function ProductGallery({ media, productName, activeMediaId = null }: ProductGalleryProps) {
  const t = useMessages().product;
  const items = React.useMemo(
    () => [...media].sort((a, b) => a.sortOrder - b.sortOrder),
    [media],
  );

  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  /**
   * The index the variant implies: when the backend named a `mediaId` for the
   * active variant, the gallery starts there.
   */
  const variantIndex = React.useMemo(() => {
    if (activeMediaId === null) return 0;
    const match = items.findIndex((item) => item.id === activeMediaId);
    return match >= 0 ? match : 0;
  }, [activeMediaId, items]);

  /**
   * A thumbnail click overrides the variant index, but only for the variant it
   * was made on. Changing variant therefore returns to that variant's media -
   * derived, so no effect is needed to re-sync.
   */
  const [override, setOverride] = React.useState<{ mediaId: number | null; index: number } | null>(
    null,
  );
  const index = override && override.mediaId === activeMediaId ? override.index : variantIndex;
  const setIndex = (next: number) => setOverride({ mediaId: activeMediaId, index: next });

  // Guard against the list shrinking under us.
  const safeIndex = Math.min(index, Math.max(0, items.length - 1));
  const active = items[safeIndex];

  if (items.length === 0 || !active) {
    return (
      <div className="surface-card flex aspect-square items-center justify-center bg-surface-container">
        <ImageOff className="size-8 text-ink-subtle" aria-hidden="true" />
        <span className="sr-only">No product images available</span>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="surface-card relative aspect-square overflow-hidden bg-surface-container">
        {active.type === "video" ? (
          <video
            key={active.id}
            src={active.url}
            poster={active.thumbnailUrl ?? undefined}
            controls
            preload="metadata"
            className="size-full object-contain"
            aria-label={active.alt ?? fmt(t.video, { name: productName })}
          />
        ) : (
          <>
            <Image
              key={active.id}
              src={active.url}
              alt={active.alt ?? productName}
              fill
              priority={safeIndex === 0}
              sizes="(min-width: 1024px) 40rem, 100vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="tap-target absolute right-3 bottom-3 inline-flex items-center justify-center rounded-full border border-line bg-surface/90 text-ink elevation-2 transition-colors duration-200 ease-(--ease-standard) hover:bg-surface-high"
              aria-label={t.viewLarger}
            >
              <ZoomIn className="size-4.5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {items.length > 1 ? (
        <ul
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
          aria-label={t.media}
        >
          {items.map((item, itemIndex) => (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(itemIndex)}
                aria-current={itemIndex === safeIndex ? "true" : undefined}
                aria-label={
                  item.type === "video"
                    ? fmt(t.showVideo, { n: itemIndex + 1 })
                    : fmt(t.showImage, { n: itemIndex + 1 })
                }
                className={cn(
                  "relative block size-18 overflow-hidden rounded-sm border-2 bg-surface-container transition-colors duration-200 ease-(--ease-standard) sm:size-20",
                  itemIndex === safeIndex ? "border-brand" : "border-transparent hover:border-line-strong",
                )}
              >
                {item.thumbnailUrl || item.type === "image" ? (
                  <Image
                    src={item.thumbnailUrl ?? item.url}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : null}
                {item.type === "video" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/35">
                    <Play className="size-5 text-ink-inverse" aria-hidden="true" />
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[min(56rem,calc(100vw-2rem))] p-0">
          <DialogTitle className="sr-only">{active.alt ?? productName}</DialogTitle>
          <div className="relative aspect-square w-full bg-surface-container">
            <Image
              src={active.url}
              alt={active.alt ?? productName}
              fill
              sizes="(min-width: 1024px) 56rem, 100vw"
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
