import Image from "next/image";
import Link from "next/link";

import type { RuntimeStore } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

export interface BrandLogoProps {
  /** `store` from runtime config - the single source of brand identity. */
  store: Pick<RuntimeStore, "name" | "logoUrl" | "logoDarkUrl">;
  /** Wraps the mark in a link to the home page. */
  asLink?: boolean;
  /** Rendered height in px. Width is derived from the image aspect ratio. */
  height?: number;
  className?: string;
  /** Marks the image high-priority (the header mark above the fold). */
  priority?: boolean;
}

/**
 * The ONLY place the store mark is rendered.
 *
 * Nothing else may reference a logo path. The URL comes from
 * `store.logoUrl`; when it is `null` the store name is rendered as a text
 * logo, so an unconfigured store still has a usable identity instead of a
 * broken image.
 */
export function BrandLogo({
  store,
  asLink = true,
  height = 28,
  className,
  priority = false,
}: BrandLogoProps) {
  const content = store.logoUrl ? (
    <Image
      src={store.logoUrl}
      alt={store.name}
      height={height}
      // The real intrinsic size is unknown, so the height is fixed and the
      // width is left to the aspect ratio.
      width={height * 4}
      priority={priority}
      className="h-(--hk-logo-height) w-auto object-contain object-left"
      style={{ "--hk-logo-height": `${height}px` } as React.CSSProperties}
      unoptimized={store.logoUrl.endsWith(".svg")}
    />
  ) : (
    <span className="text-lg font-semibold tracking-tight text-ink">{store.name}</span>
  );

  if (!asLink) {
    return <span className={cn("inline-flex items-center", className)}>{content}</span>;
  }

  return (
    <Link
      href="/"
      aria-label={`${store.name} home`}
      className={cn("inline-flex shrink-0 items-center rounded-xs", className)}
    >
      {content}
    </Link>
  );
}
