import type { FieldErrors } from "@/lib/types/api";

/**
 * Maps the contract's error envelope onto form state.
 *
 * `errors` is present only on 422 and its keys are camelCase field paths that
 * match the request body - including nested paths such as
 * `shippingAddress.postalCode` and indexed ones such as `items.0.quantity`
 * (contract 1.3). Those paths are exactly react-hook-form's field names, so
 * they can be applied directly.
 *
 * Anything that is not a field error is surfaced as a form-level message using
 * the server's `message`, which the contract guarantees is safe to display.
 */

export interface ApiErrorPayload {
  message: string;
  code: string;
  errors: FieldErrors | null;
}

/** Narrows an unknown response body to the contract error envelope. */
export function asApiErrorPayload(value: unknown): ApiErrorPayload | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (typeof body.message !== "string") return null;
  const errors =
    body.errors && typeof body.errors === "object" && !Array.isArray(body.errors)
      ? (body.errors as FieldErrors)
      : null;
  return {
    message: body.message,
    code: typeof body.code === "string" ? body.code : "SERVER_ERROR",
    errors,
  };
}

/**
 * The minimal surface of `useForm().setError` this helper needs.
 *
 * Generic over the field name so a concrete `UseFormSetError<T>` - whose
 * parameter is a union of that form's paths - can be passed without widening.
 */
export type SetFieldError<TName extends string = string> = (
  name: TName,
  error: { type: string; message: string },
) => void;

/**
 * Applies field errors and returns the messages that could not be attached to
 * a field, so the caller can show them at form level.
 *
 * `knownFields` keeps a server error for an unexpected key from being written
 * to a field that does not exist (react-hook-form would register a phantom
 * field and the message would never be shown). Matching against that list is
 * also what narrows the server's `string` path to a real field name.
 */
export function applyFieldErrors<TName extends string>(
  payload: ApiErrorPayload,
  setError: SetFieldError<TName>,
  knownFields: readonly TName[],
): string | null {
  const errors = payload.errors;
  if (!errors) return payload.message;

  const unmatched: string[] = [];
  let attached = 0;

  for (const [path, messages] of Object.entries(errors)) {
    const message = Array.isArray(messages) ? messages[0] : null;
    if (typeof message !== "string" || message.length === 0) continue;

    const field = knownFields.find((candidate) => candidate === path);

    if (field !== undefined) {
      setError(field, { type: "server", message });
      attached += 1;
    } else {
      unmatched.push(message);
    }
  }

  if (unmatched.length > 0) return unmatched.join(" ");
  return attached > 0 ? null : payload.message;
}

/** Flattens an `errors` map to a readable list, for non-form surfaces. */
export function flattenFieldErrors(errors: FieldErrors | null): string[] {
  if (!errors) return [];
  return Object.values(errors)
    .flat()
    .filter((message): message is string => typeof message === "string" && message.length > 0);
}
