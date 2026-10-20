import { describe, expect, it } from "vitest";

import { buildQuery, isAllowedApiBaseUrl, parseAllowedHosts, safeInternalPath } from "@/lib/utils/url";

const allowed = ["127.0.0.1", "localhost", "api.happykoop.com"];

describe("isAllowedApiBaseUrl", () => {
  it("accepts an allowlisted http host in development", () => {
    const result = isAllowedApiBaseUrl("http://127.0.0.1:8000/api/v1", {
      allowedHosts: allowed,
      requireHttps: false,
    });

    expect(result.ok).toBe(true);
    expect(result.url).toBe("http://127.0.0.1:8000/api/v1");
  });

  it("rejects a host that is not on the allowlist", () => {
    const result = isAllowedApiBaseUrl("https://evil.example.com/api/v1", {
      allowedHosts: allowed,
      requireHttps: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("host_not_allowed");
    expect(result.url).toBeNull();
  });

  it("rejects a non-http scheme even on an allowlisted host", () => {
    for (const candidate of [
      "javascript:alert(1)",
      "file:///etc/passwd",
      "ftp://127.0.0.1/api/v1",
      "data:text/html,<script>alert(1)</script>",
    ]) {
      const result = isAllowedApiBaseUrl(candidate, {
        allowedHosts: allowed,
        requireHttps: false,
      });
      expect(result.ok, candidate).toBe(false);
      expect(result.url, candidate).toBeNull();
    }
  });

  it("requires https in production", () => {
    const result = isAllowedApiBaseUrl("http://api.happykoop.com/api/v1", {
      allowedHosts: allowed,
      requireHttps: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("https_required");
  });

  it("rejects credentials embedded in the URL", () => {
    const result = isAllowedApiBaseUrl("https://user:pass@api.happykoop.com/api/v1", {
      allowedHosts: allowed,
      requireHttps: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("credentials_in_url");
  });

  it("rejects empty, relative and unparseable values", () => {
    const options = { allowedHosts: allowed, requireHttps: false };
    expect(isAllowedApiBaseUrl("", options).reason).toBe("empty");
    expect(isAllowedApiBaseUrl(null, options).reason).toBe("empty");
    expect(isAllowedApiBaseUrl("/api/v1", options).reason).toBe("unparseable");
    expect(isAllowedApiBaseUrl("not a url", options).reason).toBe("unparseable");
  });

  it("rejects everything when the allowlist is empty", () => {
    const result = isAllowedApiBaseUrl("https://api.happykoop.com/api/v1", {
      allowedHosts: [],
      requireHttps: true,
    });
    expect(result.ok).toBe(false);
  });

  it("is case-insensitive about the host", () => {
    const result = isAllowedApiBaseUrl("https://API.HappyKoop.com/api/v1", {
      allowedHosts: allowed,
      requireHttps: true,
    });
    expect(result.ok).toBe(true);
  });
});

describe("parseAllowedHosts", () => {
  it("splits, trims and lowercases, dropping blanks", () => {
    expect(parseAllowedHosts(" 127.0.0.1, LOCALHOST ,, api.happykoop.com ")).toEqual([
      "127.0.0.1",
      "localhost",
      "api.happykoop.com",
    ]);
  });

  it("returns an empty list for an unset variable", () => {
    expect(parseAllowedHosts(undefined)).toEqual([]);
  });
});

describe("buildQuery", () => {
  it("drops null, undefined and empty values", () => {
    expect(buildQuery({ q: "mug", category: null, page: undefined, sort: "" })).toBe("?q=mug");
  });

  it("returns an empty string when nothing is set", () => {
    expect(buildQuery({ q: null })).toBe("");
  });

  it("encodes booleans as 1/0", () => {
    expect(buildQuery({ in_stock: true })).toBe("?in_stock=1");
  });
});

describe("safeInternalPath", () => {
  it("accepts a root-relative path", () => {
    expect(safeInternalPath("/account/orders")).toBe("/account/orders");
  });

  it("rejects protocol-relative and absolute URLs so it cannot open-redirect", () => {
    expect(safeInternalPath("//evil.example.com")).toBe("/");
    expect(safeInternalPath("https://evil.example.com")).toBe("/");
    expect(safeInternalPath("/\\evil.example.com")).toBe("/");
  });
});
