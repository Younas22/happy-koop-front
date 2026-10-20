import { describe, expect, it } from "vitest";

import { CheckoutKeyHolder, isUuidV4, newIdempotencyKey } from "@/lib/checkout/idempotency";

/**
 * `POST /checkout/initialize` requires an `Idempotency-Key` (UUIDv4).
 * Replaying the SAME key with the SAME body returns the same order; a
 * different key would create a second order. These tests pin the behaviour
 * that makes a retry safe.
 */

describe("newIdempotencyKey", () => {
  it("produces a UUIDv4", () => {
    const key = newIdempotencyKey();
    expect(isUuidV4(key)).toBe(true);
  });

  it("produces a different key each call", () => {
    const keys = new Set(Array.from({ length: 25 }, () => newIdempotencyKey()));
    expect(keys.size).toBe(25);
  });
});

describe("isUuidV4", () => {
  it("rejects values that are not a v4 UUID", () => {
    expect(isUuidV4("")).toBe(false);
    expect(isUuidV4(null)).toBe(false);
    expect(isUuidV4("not-a-uuid")).toBe(false);
    // v1 UUID: the version nibble is 1, not 4.
    expect(isUuidV4("c232ab00-9414-11ec-b3c8-9f6bdeced846")).toBe(false);
  });

  it("accepts a real v4 UUID in either case", () => {
    expect(isUuidV4("9f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f")).toBe(true);
    expect(isUuidV4("9F1C2D3E-4A5B-4C6D-8E9F-0A1B2C3D4E5F")).toBe(true);
  });
});

describe("CheckoutKeyHolder - a retry reuses the same key", () => {
  it("returns the identical key on every read, so a retried submit cannot duplicate the order", () => {
    const holder = new CheckoutKeyHolder();

    // First attempt.
    const firstAttempt = holder.current();
    // The request fails (timeout / 503) and the customer presses the button
    // again: the component reads the key again rather than minting one.
    const retry = holder.current();
    const secondRetry = holder.current();

    expect(retry).toBe(firstAttempt);
    expect(secondRetry).toBe(firstAttempt);
    expect(isUuidV4(firstAttempt)).toBe(true);
  });

  it("only changes the key when the attempt is deliberately restarted", () => {
    const holder = new CheckoutKeyHolder();
    const original = holder.current();

    // A 422 CART_CHANGED means the body will differ next time, and replaying
    // the same key with a different body is a 409 - so the key is rotated.
    const rotated = holder.rotate();

    expect(rotated).not.toBe(original);
    expect(isUuidV4(rotated)).toBe(true);
    expect(holder.current()).toBe(rotated);
  });

  it("refuses a seed key that is not a UUIDv4", () => {
    expect(() => new CheckoutKeyHolder("nope")).toThrow(TypeError);
  });
});
