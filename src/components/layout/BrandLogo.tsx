import Image from "next/image";

import { Link } from "@/i18n/Link";
import type { RuntimeStore } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";

export interface BrandLogoProps {
  /** `store` from runtime config - the single source of brand identity. */
  store: Pick<RuntimeStore, "name" | "logoUrl" | "logoDarkUrl">;
  /** Wraps the mark in a link to the home page. */
  asLink?: boolean;
  /** Accessible name of the home link, e.g. "HappyKoop home", in the page's language. */
  homeLabel?: string;
  /** Rendered height in px. Width is derived from the image aspect ratio. */
  height?: number;
  /**
   * `dark` for the ink-coloured footer: it uses the admin's
   * "Logo (dark background)" upload, and falls back to a white text logo -
   * never to the regular mark, which is drawn for a light background and may
   * disappear on a dark one.
   */
  tone?: "light" | "dark";
  className?: string;
  /** Marks the image high-priority (the header mark above the fold). */
  priority?: boolean;
}

/**
 * The ONLY place the store mark is rendered.
 *
 * Nothing else may reference a logo path. The URL comes from `store.logoUrl`
 * (or `logoDarkUrl` on a dark surface); when it is `null` the store name is
 * rendered as a text logo, so an unconfigured store still has a usable
 * identity instead of a broken image.
 */
export function BrandLogo({
  store,
  asLink = true,
  homeLabel,
  height = 28,
  tone = "light",
  className,
  priority = false,
}: BrandLogoProps) {
  const src = tone === "dark" ? store.logoDarkUrl : store.logoUrl;

  const content = src ? (
    <Image
      src={src}
      alt={store.name}
      height={height}
      // The real intrinsic size is unknown, so the height is fixed and the
      // width is left to the aspect ratio.
      width={height * 4}
      priority={priority}
      // `max-w-full` lets a caller clamp the mark's width: a very wide logo
      // then scales down inside that box instead of overflowing the header row.
      className="h-(--hk-logo-height) w-auto max-w-full object-contain object-left"
      style={{ "--hk-logo-height": `${height}px` } as React.CSSProperties}
      unoptimized={src.endsWith(".svg")}
    />
  ) : (
    // The text logo is clamped the same way, so a long store name cannot
    // push the header actions off a narrow screen.
    <span
      className={cn(
        "truncate text-title-lg font-semibold tracking-tight",
        tone === "dark" ? "text-ink-inverse" : "text-ink",
      )}
    >
      {store.name}
    </span>
  );

  if (!asLink) {
    return <span className={cn("inline-flex items-center", className)}>{content}</span>;
  }

  return (
    <Link
      href="/"
      aria-label={homeLabel ?? store.name}
      className={cn("inline-flex shrink-0 items-center rounded-xs", className)}
    >
      {content}
    </Link>
  );
}
