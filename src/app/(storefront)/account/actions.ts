"use server";

import { revalidatePath } from "next/cache";

import { ApiError } from "@/lib/api/client";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
  updatePassword,
  updateProfile,
  type AddressInput,
} from "@/lib/account/queries";
import { requireViewer } from "@/lib/auth/session";
import type { ApiErrorPayload } from "@/lib/forms/api-errors";

/**
 * Customer account mutations.
 *
 * Each action re-asserts the session server-side (`requireViewer`) before
 * calling the API, so a stale page cannot post on behalf of a signed-out
 * viewer. The API additionally scopes every record to the authenticated user,
 * so an id belonging to someone else returns 404 (contract 7).
 *
 * Actions return a normalized result rather than throwing, so the client can
 * map `errors` onto form fields. Affected paths are revalidated after a write.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorPayload };

function toFailure(error: unknown): { ok: false; error: ApiErrorPayload } {
  if (error instanceof ApiError) {
    return {
      ok: false,
      error: { message: error.message, code: error.code, errors: error.errors },
    };
  }
  return {
    ok: false,
    error: {
      message: "Something went wrong. Please try again.",
      code: "SERVER_ERROR",
      errors: null,
    },
  };
}

/* ------------------------------------------------------------------ *
 * Profile
 * ------------------------------------------------------------------ */

export async function updateProfileAction(input: {
  name: string;
  phone: string | null;
  acceptsMarketing: boolean;
}): Promise<ActionResult> {
  await requireViewer("/account/profile");

  try {
    await updateProfile({
      name: input.name.trim(),
      phone: input.phone?.trim() ? input.phone.trim() : null,
      acceptsMarketing: input.acceptsMarketing,
    });
  } catch (error) {
    return toFailure(error);
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true, data: undefined };
}

/**
 * The current password is verified server-side and every other session is
 * revoked. The password values are never logged or echoed back.
 */
export async function changePasswordAction(input: {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}): Promise<ActionResult> {
  await requireViewer("/account/profile");

  try {
    await updatePassword(input);
  } catch (error) {
    return toFailure(error);
  }

  return { ok: true, data: undefined };
}

/* ------------------------------------------------------------------ *
 * Addresses
 * ------------------------------------------------------------------ */

export async function saveAddressAction(
  id: number | null,
  input: AddressInput,
): Promise<ActionResult> {
  await requireViewer("/account/addresses");

  const body: AddressInput = {
    ...input,
    countryCode: input.countryCode.toUpperCase(),
    company: input.company?.trim() || null,
    line2: input.line2?.trim() || null,
    region: input.region?.trim() || null,
    phone: input.phone?.trim() || null,
  };

  try {
    if (id === null) {
      await createAddress(body);
    } else {
      await updateAddress(id, body);
    }
  } catch (error) {
    return toFailure(error);
  }

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  return { ok: true, data: undefined };
}

export async function deleteAddressAction(id: number): Promise<ActionResult> {
  await requireViewer("/account/addresses");

  try {
    await deleteAddress(id);
  } catch (error) {
    return toFailure(error);
  }

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  return { ok: true, data: undefined };
}

export async function setDefaultAddressAction(
  id: number,
  type: "shipping" | "billing",
): Promise<ActionResult> {
  await requireViewer("/account/addresses");

  try {
    await setDefaultAddress(id, type);
  } catch (error) {
    return toFailure(error);
  }

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  return { ok: true, data: undefined };
}
