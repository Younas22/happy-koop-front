import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  apiPut,
  tryApi,
  type ApiError,
} from "@/lib/api/client";
import type {
  AccountOrderDetail,
  AccountOrderSummary,
  Address,
  CustomerProfile,
  OkResult,
  Paginated,
  SavedAddress,
} from "@/lib/types/api";

/**
 * Customer account reads and writes (contract 7).
 *
 * SERVER ONLY - every call goes out with the bearer token from the HttpOnly
 * cookie, read by the api client. Reads return `{ data, error }` so a page can
 * render a real error state and the production build still succeeds with the
 * API down. Writes throw `ApiError` so a Server Action can map `errors` onto
 * form fields.
 *
 * Every endpoint here is scoped server-side to the authenticated user, so a
 * mismatched id returns 404 rather than another customer's record (contract 7,
 * IDOR protection).
 */

export type Result<T> = { data: T | null; error: ApiError | null };

const AUTH = { auth: true, revalidate: false } as const;

/* ------------------------------------------------------------------ *
 * Profile
 * ------------------------------------------------------------------ */

export function fetchProfile(): Promise<Result<CustomerProfile>> {
  return tryApi(() => apiGet<CustomerProfile>("/account/profile", AUTH));
}

export interface UpdateProfileInput {
  name: string;
  phone: string | null;
  acceptsMarketing: boolean;
}

export function updateProfile(input: UpdateProfileInput): Promise<CustomerProfile> {
  return apiPatch<CustomerProfile>("/account/profile", input, AUTH);
}

export interface UpdatePasswordInput {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}

/** `PUT /account/password`. Other sessions are invalidated server-side. */
export function updatePassword(input: UpdatePasswordInput): Promise<OkResult> {
  return apiPut<OkResult>("/account/password", input, AUTH);
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

export function fetchAccountOrders(
  params: { page?: number; perPage?: number } = {},
): Promise<Result<Paginated<AccountOrderSummary>>> {
  return tryApi(() =>
    apiGetPaginated<AccountOrderSummary>("/account/orders", {
      ...AUTH,
      query: {
        page: params.page && params.page > 1 ? params.page : null,
        per_page: params.perPage ?? null,
      },
    }),
  );
}

/** Orders are addressed by `orderNumber`, not by id (contract 7). */
export function fetchAccountOrder(orderNumber: string): Promise<Result<AccountOrderDetail>> {
  return tryApi(() =>
    apiGet<AccountOrderDetail>(`/account/orders/${encodeURIComponent(orderNumber)}`, AUTH),
  );
}

/* ------------------------------------------------------------------ *
 * Addresses
 * ------------------------------------------------------------------ */

export function fetchAddresses(): Promise<Result<SavedAddress[]>> {
  return tryApi(() => apiGet<SavedAddress[]>("/account/addresses", AUTH));
}

export interface AddressInput extends Address {
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export function createAddress(input: AddressInput): Promise<SavedAddress> {
  return apiPost<SavedAddress>("/account/addresses", input, AUTH);
}

export function updateAddress(id: number, input: AddressInput): Promise<SavedAddress> {
  return apiPatch<SavedAddress>(`/account/addresses/${id}`, input, AUTH);
}

export function deleteAddress(id: number): Promise<void> {
  return apiDelete<void>(`/account/addresses/${id}`, AUTH);
}

export function setDefaultAddress(
  id: number,
  type: "shipping" | "billing",
): Promise<SavedAddress> {
  return apiPost<SavedAddress>(`/account/addresses/${id}/default`, { type }, AUTH);
}
