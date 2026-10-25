import { describe, expect, it } from "vitest";

import {
  DEFAULT_BRAND,
  deriveBrandTokens,
  isValidHex,
  normalizeBrandHex,
  readableInk,
  relativeLuminance,
} from "./color";

/**
 * The brand tokens are injected into a `<style>` block by ThemeStyle, so the
 * two properties that matter are: nothing but a validated hex can ever come
 * out, and the derived surfaces stay light enough to carry the brand ink.
 */

/** WCAG 2.1 contrast ratio between two hex colours. */
function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

describe("isValidHex", () => {
  it("accepts a six-digit hex and rejects anything else", () => {
    expect(isValidHex("#2563EB")).toBe(true);
    expect(isValidHex("#2563eb")).toBe(true);

    expect(isValidHex("#2563E")).toBe(false);
    expect(isValidHex("2563EB")).toBe(false);
    expect(isValidHex("#abc")).toBe(false);
    expect(isValidHex("red")).toBe(false);
    expect(isValidHex(null)).toBe(false);
    expect(isValidHex(undefined)).toBe(false);
  });

  it("rejects a value carrying CSS of its own", () => {
    // The whole point of the validator: a settings row cannot inject styling.
    expect(isValidHex("#2563EB;}html{display:none")).toBe(false);
    expect(isValidHex("var(--x)")).toBe(false);
  });
});

describe("normalizeBrandHex", () => {
  it("falls back to the documented default for an invalid value", () => {
    expect(normalizeBrandHex("nonsense")).toBe(DEFAULT_BRAND);
    expect(normalizeBrandHex("")).toBe(DEFAULT_BRAND);
    expect(normalizeBrandHex(null)).toBe(DEFAULT_BRAND);
  });

  it("trims and upper-cases a valid value", () => {
    expect(normalizeBrandHex("  #2563eb  ")).toBe("#2563EB");
  });
});

describe("deriveBrandTokens", () => {
  it("emits only validated hex values, whatever it is given", () => {
    const tokens = deriveBrandTokens("#2563EB;}body{display:none");

    for (const value of Object.values(tokens)) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("orders the ramp from the accent down to active", () => {
    const { brand, brandHover, brandActive } = deriveBrandTokens("#2563EB");

    expect(relativeLuminance(brand)).toBeGreaterThan(relativeLuminance(brandHover));
    expect(relativeLuminance(brandHover)).toBeGreaterThan(relativeLuminance(brandActive));
  });

  it("keeps surface lighter than tint, and tint lighter than the accent", () => {
    // The two pale tokens have distinct jobs - a chip behind a badge and a
    // whole panel - so they must stay visibly apart.
    const { brand, brandTint, brandSurface } = deriveBrandTokens("#2563EB");

    expect(relativeLuminance(brandSurface)).toBeGreaterThan(relativeLuminance(brandTint));
    expect(relativeLuminance(brandTint)).toBeGreaterThan(relativeLuminance(brand));
  });

  it("gives the accent readable text on both pale surfaces", () => {
    // Badge and active-nav styling put brand-coloured text on these, so the
    // pair has to clear AA for normal text at every brand we allow.
    for (const hex of ["#2563EB", "#15803D", "#B91C1C", "#7C3AED", "#0F172A"]) {
      const { brandActive, brandTint, brandSurface } = deriveBrandTokens(hex);

      expect(contrast(brandActive, brandTint)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(brandActive, brandSurface)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("readableInk", () => {
  it("picks the slate ink on a light brand and white on a dark one", () => {
    expect(readableInk("#FACC15")).toBe("#0F172A");
    expect(readableInk("#2563EB")).toBe("#FFFFFF");
  });

  it("clears AA against the brand it was chosen for", () => {
    for (const hex of ["#2563EB", "#FACC15", "#15803D", "#F8FAFC", "#0F172A"]) {
      expect(contrast(readableInk(hex), hex)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
