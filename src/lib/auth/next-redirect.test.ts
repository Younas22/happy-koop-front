import { describe, expect, it } from "vitest";

import { safeInternalPath } from "@/lib/utils/url";

/**
 * The `?next=` open-redirect guard used by `/login` and `/register`.
 *
 * `safeInternalPath` is the only thing standing between a crafted link
 * (`/login?next=https://evil.example.com`) and sending a freshly
 * authenticated customer to an attacker's page, so the accepted shape is
 * pinned here explicitly: a root-relative path, and nothing else.
 */

const FALLBACK = "/account";

describe("?next= redirect guard", () => {
  it("accepts a root-relative path", () => {
    expect(safeInternalPath("/account", FALLBACK)).toBe("/account");
    expect(safeInternalPath("/account/orders", FALLBACK)).toBe("/account/orders");
    expect(safeInternalPath("/checkout", FALLBACK)).toBe("/checkout");
  });

  it("keeps a query string and fragment on an internal path", () => {
    expect(safeInternalPath("/account/orders?page=2", FALLBACK)).toBe("/account/orders?page=2");
    expect(safeInternalPath("/shop#grid", FALLBACK)).toBe("/shop#grid");
  });

  it("rejects a protocol-relative URL", () => {
    // `//evil.example.com` is a same-protocol absolute URL in a browser.
    expect(safeInternalPath("//evil.example.com", FALLBACK)).toBe(FALLBACK);
    expect(safeInternalPath("//evil.example.com/pwn", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects an absolute URL", () => {
    expect(safeInternalPath("https://evil.example.com", FALLBACK)).toBe(FALLBACK);
    expect(safeInternalPath("http://evil.example.com/path", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects a non-http scheme", () => {
    expect(safeInternalPath("javascript:alert(1)", FALLBACK)).toBe(FALLBACK);
    expect(safeInternalPath("data:text/html,<script>alert(1)</script>", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects backslash variants browsers may normalize to a host", () => {
    expect(safeInternalPath("/\\evil.example.com", FALLBACK)).toBe(FALLBACK);
    expect(safeInternalPath("\\\\evil.example.com", FALLBACK)).toBe(FALLBACK);
    expect(safeInternalPath("/path\\evil", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects a bare path with no leading slash", () => {
    expect(safeInternalPath("account", FALLBACK)).toBe(FALLBACK);
    expect(safeInternalPath("evil.example.com", FALLBACK)).toBe(FALLBACK);
  });

  it("falls back for empty, missing and whitespace values", () => {
    expect(safeInternalPath("", FALLBACK)).toBe(FALLBACK);
    expect(safeInternalPath(null, FALLBACK)).toBe(FALLBACK);
    expect(safeInternalPath(undefined, FALLBACK)).toBe(FALLBACK);
    expect(safeInternalPath("   ", FALLBACK)).toBe(FALLBACK);
  });

  it("never returns a value that is not root-relative", () => {
    const hostile = [
      "//evil.example.com",
      "https://evil.example.com",
      "http://evil.example.com",
      "javascript:alert(1)",
      "\\\\evil.example.com",
      "/\\evil.example.com",
      "mailto:a@b.com",
    ];

    for (const candidate of hostile) {
      const result = safeInternalPath(candidate, FALLBACK);
      expect(result.startsWith("/"), candidate).toBe(true);
      expect(result.startsWith("//"), candidate).toBe(false);
      expect(result.includes("\\"), candidate).toBe(false);
      expect(result, candidate).toBe(FALLBACK);
    }
  });
});
