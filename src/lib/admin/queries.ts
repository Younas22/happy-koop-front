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
  AdminAuditLogEntry,
  AdminBulkResult,
  AdminCategory,
  AdminConnectionCheck,
  AdminCustomerDetail,
  AdminDashboard,
  AdminHomeSection,
  AdminMailSettings,
  AdminMailSettingsUpdate,
  AdminMailTestResult,
  AdminMediaAsset,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminPage,
  AdminPaymentSettings,
  AdminPaymentSettingsUpdate,
  AdminProductDetail,
  AdminProductSummary,
  AdminRefundResult,
  AdminReview,
  AdminStoreSettingsResponse,
  AdminUserSummary,
  OrderStatus,
  Paginated,
  PaymentStatus,
  ReviewModerationStatus,
} from "@/lib/types/api";

/**
 * Admin reads and writes (contract 8).
 *
 * SERVER ONLY and bearer-authenticated. Hiding a screen is NOT access control:
 * every one of these endpoints is independently authorized server-side by
 * Sanctum abilities, `EnsureUserIsAdmin` and a Policy, so an unauthorized call
 * fails with 401/403 whatever the UI renders.
 *
 * Reads return `{ data, error }` so an admin screen renders a real error state
 * and the production build succeeds with the API down. Writes throw `ApiError`
 * so a Server Action can map `errors` onto form fields and branch on
 * `423 LIVE_MODE_LOCKED` / `409 CONFLICT`.
 */

export type Result<T> = { data: T | null; error: ApiError | null };

const AUTH = { auth: true, revalidate: false } as const;

/* ------------------------------------------------------------------ *
 * Dashboard
 * ------------------------------------------------------------------ */

export function fetchDashboard(): Promise<Result<AdminDashboard>> {
  return tryApi(() => apiGet<AdminDashboard>("/admin/dashboard", AUTH));
}

/* ------------------------------------------------------------------ *
 * Products
 * ------------------------------------------------------------------ */

export const ADMIN_PRODUCT_SORTS = [
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
  "price_asc",
  "price_desc",
  "stock_asc",
] as const;

export type AdminProductSort = (typeof ADMIN_PRODUCT_SORTS)[number];

export function isAdminProductSort(value: unknown): value is AdminProductSort {
  return (
    typeof value === "string" &&
    (ADMIN_PRODUCT_SORTS as readonly string[]).includes(value)
  );
}

export interface AdminProductListParams {
  q?: string | null;
  status?: string | null;
  category?: number | null;
  trashed?: boolean;
  sort?: AdminProductSort | null;
  page?: number;
  perPage?: number;
}

export function fetchAdminProducts(
  params: AdminProductListParams = {},
): Promise<Result<Paginated<AdminProductSummary>>> {
  return tryApi(() =>
    apiGetPaginated<AdminProductSummary>("/admin/products", {
      ...AUTH,
      query: {
        q: params.q ?? null,
        status: params.status ?? null,
        category: params.category ?? null,
        trashed: params.trashed === true ? true : null,
        sort: params.sort ?? null,
        page: params.page && params.page > 1 ? params.page : null,
        per_page: params.perPage ?? null,
      },
    }),
  );
}

export function fetchAdminProduct(
  id: number,
): Promise<Result<AdminProductDetail>> {
  return tryApi(() =>
    apiGet<AdminProductDetail>(`/admin/products/${id}`, AUTH),
  );
}

export function createAdminProduct(body: unknown): Promise<AdminProductDetail> {
  return apiPost<AdminProductDetail>("/admin/products", body, AUTH);
}

export function updateAdminProduct(
  id: number,
  body: unknown,
): Promise<AdminProductDetail> {
  return apiPatch<AdminProductDetail>(`/admin/products/${id}`, body, AUTH);
}

export function deleteAdminProduct(id: number): Promise<void> {
  return apiDelete<void>(`/admin/products/${id}`, AUTH);
}

export function bulkDeleteAdminProducts(
  ids: readonly number[],
): Promise<AdminBulkResult> {
  return apiPost<AdminBulkResult>("/admin/products/bulk-delete", { ids }, AUTH);
}

/** Replaces the option/variant set atomically (contract 8). */
export function replaceProductVariants(
  id: number,
  body: unknown,
): Promise<AdminProductDetail> {
  return apiPut<AdminProductDetail>(
    `/admin/products/${id}/variants`,
    body,
    AUTH,
  );
}

export function replaceProductSpecifications(
  id: number,
  body: unknown,
): Promise<AdminProductDetail> {
  return apiPut<AdminProductDetail>(
    `/admin/products/${id}/specifications`,
    body,
    AUTH,
  );
}

export function replaceProductFaqs(
  id: number,
  body: unknown,
): Promise<AdminProductDetail> {
  return apiPut<AdminProductDetail>(`/admin/products/${id}/faqs`, body, AUTH);
}

export function replaceProductRelated(
  id: number,
  body: unknown,
): Promise<AdminProductDetail> {
  return apiPut<AdminProductDetail>(
    `/admin/products/${id}/related`,
    body,
    AUTH,
  );
}

export function attachProductMedia(
  id: number,
  body: { mediaIds: number[]; primaryMediaId?: number | null },
): Promise<AdminProductDetail> {
  return apiPost<AdminProductDetail>(`/admin/products/${id}/media`, body, AUTH);
}

export function reorderProductMedia(
  id: number,
  body: { mediaIds: number[] },
): Promise<AdminProductDetail> {
  return apiPatch<AdminProductDetail>(
    `/admin/products/${id}/media/reorder`,
    body,
    AUTH,
  );
}

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ */

export function fetchAdminCategories(): Promise<Result<AdminCategory[]>> {
  return tryApi(() => apiGet<AdminCategory[]>("/admin/categories", AUTH));
}

export function createAdminCategory(body: unknown): Promise<AdminCategory> {
  return apiPost<AdminCategory>("/admin/categories", body, AUTH);
}

export function updateAdminCategory(
  id: number,
  body: unknown,
): Promise<AdminCategory> {
  return apiPatch<AdminCategory>(`/admin/categories/${id}`, body, AUTH);
}

export function deleteAdminCategory(id: number): Promise<void> {
  return apiDelete<void>(`/admin/categories/${id}`, AUTH);
}

export function bulkDeleteAdminCategories(
  ids: readonly number[],
): Promise<AdminBulkResult> {
  return apiPost<AdminBulkResult>(
    "/admin/categories/bulk-delete",
    { ids },
    AUTH,
  );
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

export interface AdminOrderListParams {
  q?: string | null;
  status?: OrderStatus | null;
  paymentStatus?: PaymentStatus | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  perPage?: number;
}

export function fetchAdminOrders(
  params: AdminOrderListParams = {},
): Promise<Result<Paginated<AdminOrderSummary>>> {
  return tryApi(() =>
    apiGetPaginated<AdminOrderSummary>("/admin/orders", {
      ...AUTH,
      query: {
        q: params.q ?? null,
        status: params.status ?? null,
        payment_status: params.paymentStatus ?? null,
        from: params.from ?? null,
        to: params.to ?? null,
        page: params.page && params.page > 1 ? params.page : null,
        per_page: params.perPage ?? null,
      },
    }),
  );
}

export function fetchAdminOrder(id: number): Promise<Result<AdminOrderDetail>> {
  return tryApi(() => apiGet<AdminOrderDetail>(`/admin/orders/${id}`, AUTH));
}

/** Transitions are validated server-side; an invalid one returns 409. */
export function updateOrderStatus(
  id: number,
  body: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    adminNote?: string | null;
  },
): Promise<AdminOrderDetail> {
  return apiPatch<AdminOrderDetail>(`/admin/orders/${id}/status`, body, AUTH);
}

/** Each order is moved on its own; refused transitions come back in `failed`. */
export function bulkUpdateOrderStatus(
  ids: readonly number[],
  status: OrderStatus,
): Promise<AdminBulkResult> {
  return apiPatch<AdminBulkResult>(
    "/admin/orders/bulk-status",
    { ids, status },
    AUTH,
  );
}

export function deleteAdminOrder(id: number): Promise<void> {
  return apiDelete<void>(`/admin/orders/${id}`, AUTH);
}

export function bulkDeleteAdminOrders(
  ids: readonly number[],
): Promise<AdminBulkResult> {
  return apiPost<AdminBulkResult>("/admin/orders/bulk-delete", { ids }, AUTH);
}

export function updateOrderFulfilment(
  id: number,
  body: {
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
  },
): Promise<AdminOrderDetail> {
  return apiPatch<AdminOrderDetail>(
    `/admin/orders/${id}/fulfilment`,
    body,
    AUTH,
  );
}

/** `amount` is minor units and must not exceed the refundable balance. */
export function refundOrder(
  id: number,
  body: { amount: number; reason: string | null },
): Promise<AdminRefundResult> {
  return apiPost<AdminRefundResult>(`/admin/orders/${id}/refund`, body, AUTH);
}

/* ------------------------------------------------------------------ *
 * Customers and users
 * ------------------------------------------------------------------ */

export function fetchAdminCustomers(
  params: { q?: string | null; page?: number } = {},
): Promise<Result<Paginated<AdminUserSummary>>> {
  return tryApi(() =>
    apiGetPaginated<AdminUserSummary>("/admin/customers", {
      ...AUTH,
      query: {
        q: params.q ?? null,
        page: params.page && params.page > 1 ? params.page : null,
      },
    }),
  );
}

export function fetchAdminCustomer(
  id: number,
): Promise<Result<AdminCustomerDetail>> {
  return tryApi(() =>
    apiGet<AdminCustomerDetail>(`/admin/customers/${id}`, AUTH),
  );
}

export function fetchAdminUsers(
  params: { q?: string | null; page?: number } = {},
): Promise<Result<Paginated<AdminUserSummary>>> {
  return tryApi(() =>
    apiGetPaginated<AdminUserSummary>("/admin/users", {
      ...AUTH,
      query: {
        q: params.q ?? null,
        page: params.page && params.page > 1 ? params.page : null,
      },
    }),
  );
}

export function createAdminUser(body: unknown): Promise<AdminUserSummary> {
  return apiPost<AdminUserSummary>("/admin/users", body, AUTH);
}

export function updateAdminUser(
  id: number,
  body: unknown,
): Promise<AdminUserSummary> {
  return apiPatch<AdminUserSummary>(`/admin/users/${id}`, body, AUTH);
}

/** The API refuses self-deletion and removing one's own admin role. */
export function deleteAdminUser(id: number): Promise<void> {
  return apiDelete<void>(`/admin/users/${id}`, AUTH);
}

/* ------------------------------------------------------------------ *
 * Reviews
 * ------------------------------------------------------------------ */

export function fetchAdminReviews(
  params: {
    status?: ReviewModerationStatus | null;
    product?: number | null;
    page?: number;
  } = {},
): Promise<Result<Paginated<AdminReview>>> {
  return tryApi(() =>
    apiGetPaginated<AdminReview>("/admin/reviews", {
      ...AUTH,
      query: {
        status: params.status ?? null,
        product: params.product ?? null,
        page: params.page && params.page > 1 ? params.page : null,
      },
    }),
  );
}

export function moderateReview(
  id: number,
  body: { status?: ReviewModerationStatus; storeReply?: string | null },
): Promise<AdminReview> {
  return apiPatch<AdminReview>(`/admin/reviews/${id}`, body, AUTH);
}

/* ------------------------------------------------------------------ *
 * CMS pages and home sections
 * ------------------------------------------------------------------ */

export function fetchAdminPages(
  params: { page?: number } = {},
): Promise<Result<Paginated<AdminPage>>> {
  return tryApi(() =>
    apiGetPaginated<AdminPage>("/admin/pages", {
      ...AUTH,
      query: { page: params.page && params.page > 1 ? params.page : null },
    }),
  );
}

export function fetchAdminPage(id: number): Promise<Result<AdminPage>> {
  return tryApi(() => apiGet<AdminPage>(`/admin/pages/${id}`, AUTH));
}

export function createAdminPage(body: unknown): Promise<AdminPage> {
  return apiPost<AdminPage>("/admin/pages", body, AUTH);
}

export function updateAdminPage(id: number, body: unknown): Promise<AdminPage> {
  return apiPatch<AdminPage>(`/admin/pages/${id}`, body, AUTH);
}

export function deleteAdminPage(id: number): Promise<void> {
  return apiDelete<void>(`/admin/pages/${id}`, AUTH);
}

export function fetchAdminHomeSections(): Promise<Result<AdminHomeSection[]>> {
  return tryApi(() => apiGet<AdminHomeSection[]>("/admin/home-sections", AUTH));
}

/** Replaces the whole homepage composition atomically. */
export function replaceHomeSections(
  body: unknown,
): Promise<AdminHomeSection[]> {
  return apiPut<AdminHomeSection[]>("/admin/home-sections", body, AUTH);
}

/* ------------------------------------------------------------------ *
 * Media
 * ------------------------------------------------------------------ */

export function fetchAdminMedia(
  params: {
    type?: "image" | "video" | null;
    folder?: string | null;
    page?: number;
  } = {},
): Promise<Result<Paginated<AdminMediaAsset>>> {
  return tryApi(() =>
    apiGetPaginated<AdminMediaAsset>("/admin/media", {
      ...AUTH,
      query: {
        type: params.type ?? null,
        folder: params.folder ?? null,
        page: params.page && params.page > 1 ? params.page : null,
      },
    }),
  );
}

/**
 * Every image in the library, for the pickers.
 *
 * The media picker searches and previews the whole library, so one page is not
 * enough - but neither is an unbounded loop against a store with thousands of
 * uploads. It walks pages until the API says there are no more, up to
 * `MEDIA_PICKER_PAGE_CAP` requests, and reports whether anything was left
 * behind so the picker can say so instead of pretending the list is complete.
 */
export const MEDIA_PICKER_PAGE_CAP = 8;

export interface AllAdminMedia {
  assets: AdminMediaAsset[];
  /** Total the API reports, which may exceed what was fetched. */
  total: number;
  /** True when the cap stopped the walk before the last page. */
  truncated: boolean;
}

export async function fetchAllAdminMedia(
  params: { type?: "image" | "video" | null; folder?: string | null } = {},
): Promise<Result<AllAdminMedia>> {
  const first = await fetchAdminMedia(params);
  if (!first.data) return { data: null, error: first.error };

  const assets = [...first.data.data];
  const lastPage = first.data.meta.lastPage;
  const reachable = Math.min(lastPage, MEDIA_PICKER_PAGE_CAP);

  for (let page = 2; page <= reachable; page += 1) {
    const next = await fetchAdminMedia({ ...params, page });
    // A failed later page is not worth failing the whole screen over: the
    // picker shows what did load and says the list is incomplete.
    if (!next.data)
      return {
        data: { assets, total: first.data.meta.total, truncated: true },
        error: null,
      };
    assets.push(...next.data.data);
  }

  return {
    data: {
      assets,
      total: first.data.meta.total,
      truncated: lastPage > reachable,
    },
    error: null,
  };
}

export function deleteAdminMedia(id: number): Promise<void> {
  return apiDelete<void>(`/admin/media/${id}`, AUTH);
}

export function bulkDeleteAdminMedia(
  ids: readonly number[],
): Promise<AdminBulkResult> {
  return apiPost<AdminBulkResult>("/admin/media/bulk-delete", { ids }, AUTH);
}

/* ------------------------------------------------------------------ *
 * Settings
 * ------------------------------------------------------------------ */

export function fetchStoreSettings(): Promise<
  Result<AdminStoreSettingsResponse>
> {
  return tryApi(() =>
    apiGet<AdminStoreSettingsResponse>("/admin/settings/store", AUTH),
  );
}

export function updateStoreSettings(
  body: unknown,
): Promise<AdminStoreSettingsResponse> {
  return apiPut<AdminStoreSettingsResponse>(
    "/admin/settings/store",
    body,
    AUTH,
  );
}

export function fetchPaymentSettings(): Promise<Result<AdminPaymentSettings>> {
  return tryApi(() =>
    apiGet<AdminPaymentSettings>("/admin/settings/payments", AUTH),
  );
}

/** Omitted secret fields stay unchanged; `null` clears (contract 8.2). */
export function updatePaymentSettings(
  body: AdminPaymentSettingsUpdate,
): Promise<AdminPaymentSettings> {
  return apiPut<AdminPaymentSettings>("/admin/settings/payments", body, AUTH);
}

/** Real server-side provider call; the returned message is sanitized. */
export function testPaymentConnection(
  provider: "stripe" | "paypal",
): Promise<AdminConnectionCheck> {
  return apiPost<AdminConnectionCheck>(
    "/admin/settings/payments/test",
    { provider },
    AUTH,
  );
}

export function fetchMailSettings(): Promise<Result<AdminMailSettings>> {
  return tryApi(() => apiGet<AdminMailSettings>("/admin/settings/mail", AUTH));
}

/** An omitted or empty `resendApiKey` keeps the stored key. */
export function updateMailSettings(
  body: AdminMailSettingsUpdate,
): Promise<AdminMailSettings> {
  return apiPut<AdminMailSettings>("/admin/settings/mail", body, AUTH);
}

/** Sends a real email right away; the returned message is sanitized. */
export function sendTestMail(to: string | null): Promise<AdminMailTestResult> {
  return apiPost<AdminMailTestResult>(
    "/admin/settings/mail/test",
    to ? { to } : {},
    AUTH,
  );
}

/* ------------------------------------------------------------------ *
 * Audit logs
 * ------------------------------------------------------------------ */

export function fetchAuditLogs(
  params: { action?: string | null; page?: number } = {},
): Promise<Result<Paginated<AdminAuditLogEntry>>> {
  return tryApi(() =>
    apiGetPaginated<AdminAuditLogEntry>("/admin/audit-logs", {
      ...AUTH,
      query: {
        action: params.action ?? null,
        page: params.page && params.page > 1 ? params.page : null,
      },
    }),
  );
}
