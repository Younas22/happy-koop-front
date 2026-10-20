/**
 * Idempotency keys for `POST /checkout/initialize` (contract 5).
 *
 * The endpoint requires an `Idempotency-Key` header holding a UUIDv4.
 * Replaying the SAME key with the SAME body returns the same order (200
 * instead of a second 201); the same key with a different body returns 409.
 *
 * So the key must be generated once per checkout attempt and reused across
 * retries of that attempt - otherwise a retry after a timeout would create a
 * duplicate order. `CheckoutKeyHolder` keeps that discipline in one place:
 * `current()` is stable until `rotate()` is called, which only happens after
 * the cart contents have deliberately changed.
 */

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(value: string | null | undefined): boolean {
  return typeof value === "string" && UUID_V4.test(value);
}

/**
 * A UUIDv4 from the platform CSPRNG.
 *
 * `crypto.randomUUID` is available in modern browsers over https/localhost and
 * in Node 19+. The fallback uses `crypto.getRandomValues` and sets the version
 * and variant bits by hand; `Math.random` is never used for a key the server
 * treats as a request identity.
 */
export function newIdempotencyKey(): string {
  const cryptoObj = globalThis.crypto;

  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }

  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    const bytes = cryptoObj.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join("-");
  }

  throw new Error(
    "A cryptographically secure random source is required to create an idempotency key.",
  );
}

/**
 * Holds one key for the lifetime of a checkout attempt.
 *
 * The checkout keeps this in component state so a re-render never produces a
 * new key, and a retry of a failed submit reuses the same one.
 */
export class CheckoutKeyHolder {
  private key: string;

  constructor(key: string = newIdempotencyKey()) {
    if (!isUuidV4(key)) {
      throw new TypeError("CheckoutKeyHolder: the key must be a UUIDv4.");
    }
    this.key = key;
  }

  /** The key to send. Stable across retries of the same attempt. */
  current(): string {
    return this.key;
  }

  /**
   * Starts a NEW attempt. Only valid after the submitted body has changed -
   * e.g. the cart was re-validated following a 422 CART_CHANGED - because
   * reusing a key with a different body is a 409.
   */
  rotate(): string {
    this.key = newIdempotencyKey();
    return this.key;
  }
}
