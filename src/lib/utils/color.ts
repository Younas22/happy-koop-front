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

/**
 * Picks white or near-black text for a brand background, so a light brand
 * colour does not end up with unreadable white labels.
 */
export function readableInk(hex: string): string {
  return relativeLuminance(hex) > 0.5 ? "#1A1A19" : "#FFFFFF";
}

export interface BrandTokens {
  brand: string;
  brandHover: string;
  brandActive: string;
  brandTint: string;
  brandInk: string;
}

/** Derives the full brand token set from a single admin-chosen colour. */
export function deriveBrandTokens(primaryColor: string | null | undefined): BrandTokens {
  const brand = normalizeBrandHex(primaryColor);
  return {
    brand,
    brandHover: darken(brand, 0.12),
    brandActive: darken(brand, 0.24),
    brandTint: lighten(brand, 0.92),
    brandInk: readableInk(brand),
  };
}
