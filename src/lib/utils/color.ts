/**
 * Brand colour derivation for the runtime theme.
 *
 * The admin can set one `primaryColor`. The hover, active, tint and ink tokens
 * are derived from it so the palette stays consistent whatever is chosen, and
 * so no component ever hardcodes a hex value.
 *
 * Flat colours only: these produce solid fills, never gradient stops.
 */

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Documented fallback, matching `globals.css` and the task brief. */
export const DEFAULT_BRAND = "#2563EB";

export function isValidHex(value: string | null | undefined): boolean {
  return typeof value === "string" && HEX_PATTERN.test(value.trim());
}

/** Returns the validated hex, or the documented fallback. */
export function normalizeBrandHex(value: string | null | undefined): string {
  const candidate = (value ?? "").trim();
  return isValidHex(candidate) ? candidate.toUpperCase() : DEFAULT_BRAND;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "");
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (channel: number) => clampChannel(channel).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/** Multiplies each channel toward black. `amount` 0..1. */
export function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(normalizeBrandHex(hex));
  const factor = 1 - Math.max(0, Math.min(1, amount));
  return rgbToHex({ r: r * factor, g: g * factor, b: b * factor });
}

/** Mixes toward white. `amount` 0..1, where 1 is white. */
export function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(normalizeBrandHex(hex));
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex({
    r: r + (255 - r) * t,
    g: g + (255 - g) * t,
    b: b + (255 - b) * t,
  });
}

/** Relative luminance per WCAG 2.1. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(normalizeBrandHex(hex));
  const channel = (value: number) => {
    const srgb = value / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.1 contrast ratio between two colours, 1..21. */
export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Picks white or near-black text for a brand background, so a light brand
 * colour does not end up with unreadable white labels.
 */
export function readableInk(hex: string): string {
  return relativeLuminance(hex) > 0.5 ? "#0F172A" : "#FFFFFF";
}

/**
 * Darkens `hex` in small steps until it clears 4.5:1 against `against`.
 *
 * This is what keeps the Material tonal pair honest: `on-container` has to be
 * readable on `container` for *any* brand colour an administrator picks, and
 * a fixed darken factor cannot promise that for a colour that starts out very
 * light (yellow) or very dark (navy). Falls back to the near-black ink, which
 * clears 4.5:1 on every container this function can produce.
 */
function darkenUntilReadable(hex: string, against: string): string {
  for (let step = 0; step <= 18; step += 1) {
    const candidate = darken(hex, step * 0.05);
    if (contrastRatio(candidate, against) >= 4.5) return candidate;
  }
  return "#11182A";
}

export interface BrandTokens {
  brand: string;
  brandHover: string;
  brandActive: string;
  /** Accent chip behind small marks: active nav, brand badges. */
  brandTint: string;
  /** One step lighter than the tint, for whole panels and table heads. */
  brandSurface: string;
  /**
   * M3 primary-container: the filled tonal surface behind a secondary button,
   * a selected chip or an active nav item.
   */
  brandContainer: string;
  /** M3 on-primary-container: text and icons drawn on `brandContainer`. */
  brandOnContainer: string;
  brandInk: string;
}

/** Derives the full brand token set from a single admin-chosen colour. */
export function deriveBrandTokens(primaryColor: string | null | undefined): BrandTokens {
  const brand = normalizeBrandHex(primaryColor);
  const brandContainer = lighten(brand, 0.8);

  return {
    brand,
    brandHover: darken(brand, 0.12),
    brandActive: darken(brand, 0.24),
    brandTint: lighten(brand, 0.84),
    brandSurface: lighten(brand, 0.94),
    brandContainer,
    brandOnContainer: darkenUntilReadable(brand, brandContainer),
    brandInk: readableInk(brand),
  };
}
