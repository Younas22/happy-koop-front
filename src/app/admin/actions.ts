"use server";

import { revalidatePath } from "next/cache";

import { ApiError } from "@/lib/api/client";
import * as admin from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import type { ApiErrorPayload } from "@/lib/forms/api-errors";
import { revalidateRuntimeConfig } from "@/lib/runtime-config";
import { CACHE_TAGS } from "@/lib/catalog/queries";
import { revalidateTag } from "next/cache";
import type {
  AdminBulkResult,
  AdminConnectionCheck,
  AdminPaymentSettingsUpdate,
  AdminProductDetail,
  OrderStatus,
  PaymentStatus,
  ReviewModerationStatus,
} from "@/lib/types/api";

/**
 * Admin mutations.
 *
 * Each action re-asserts the admin affordance server-side before calling the
 * API. That is a convenience, not the security boundary: the API authorizes
 * every one of these calls independently (abilities + admin middleware +
 * Policy), so a crafted request from a non-admin fails there regardless of
 * what this file does.
 *
 * Results are normalized instead of thrown so client forms can map `errors`
 * onto fields and branch on codes such as `423 LIVE_MODE_LOCKED` and
 * `409 CONFLICT`. Storefront caches are revalidated after writes that change
 * public content.
 */

export type AdminActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: ApiErrorPayload };

function fail(error: unknown): { ok: false; error: ApiErrorPayload } {
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

function ok(): { ok: true; data: undefined } {
  return { ok: true, data: undefined };
}

/** Public catalog pages are cached by tag; a catalog write must clear them. */
function revalidateCatalog(): void {
  revalidateTag(CACHE_TAGS.products, "max");
  revalidateTag(CACHE_TAGS.categories, "max");
  revalidateTag(CACHE_TAGS.home, "max");
}

/* ------------------------------------------------------------------ *
 * Products
 * ------------------------------------------------------------------ */

export async function createProductAction(
  body: unknown,
): Promise<AdminActionResult<{ id: number }>> {
  await requireAdmin("/admin/products");

  let created: AdminProductDetail;
  try {
    created = await admin.createAdminProduct(body);
  } catch (error) {
    return fail(error);
  }

  revalidateCatalog();
  revalidatePath("/admin/products");
  return { ok: true, data: { id: created.id } };
}

export async function updateProductAction(
  id: number,
  body: unknown,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/products");

  try {
    await admin.updateAdminProduct(id, body);
  } catch (error) {
    return fail(error);
  }

  revalidateCatalog();
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return ok();
}

export async function deleteProductAction(
  id: number,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/products");

  try {
    await admin.deleteAdminProduct(id);
  } catch (error) {
    return fail(error);
  }

  revalidateCatalog();
  revalidatePath("/admin/products");
  return ok();
}

export async function bulkDeleteProductsAction(
  ids: number[],
): Promise<AdminActionResult<AdminBulkResult>> {
  await requireAdmin("/admin/products");

  let result: AdminBulkResult;
  try {
    result = await admin.bulkDeleteAdminProducts(ids);
  } catch (error) {
    return fail(error);
  }

  revalidateCatalog();
  revalidatePath("/admin/products");
  return { ok: true, data: result };
}

export async function replaceProductVariantsAction(
  id: number,
  body: unknown,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/products");
  try {
    await admin.replaceProductVariants(id, body);
  } catch (error) {
    return fail(error);
  }
  revalidateCatalog();
  revalidatePath(`/admin/products/${id}`);
  return ok();
}

export async function replaceProductSpecificationsAction(
  id: number,
  body: unknown,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/products");
  try {
    await admin.replaceProductSpecifications(id, body);
  } catch (error) {
    return fail(error);
  }
  revalidateCatalog();
  revalidatePath(`/admin/products/${id}`);
  return ok();
}

export async function replaceProductFaqsAction(
  id: number,
  body: unknown,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/products");
  try {
    await admin.replaceProductFaqs(id, body);
  } catch (error) {
    return fail(error);
  }
  revalidateCatalog();
  revalidatePath(`/admin/products/${id}`);
  return ok();
}

export async function replaceProductRelatedAction(
  id: number,
  productIds: number[],
): Promise<AdminActionResult> {
  await requireAdmin("/admin/products");
  try {
    await admin.replaceProductRelated(id, { productIds });
  } catch (error) {
    return fail(error);
  }
  revalidateCatalog();
  revalidatePath(`/admin/products/${id}`);
  return ok();
}

export async function setProductMediaAction(
  id: number,
  mediaIds: number[],
  primaryMediaId: number | null,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/products");
  try {
    // `mediaIds` on the product update replaces the set; this endpoint also
    // sets the primary image and the display order.
    await admin.attachProductMedia(id, { mediaIds, primaryMediaId });
    if (mediaIds.length > 0) {
      await admin.reorderProductMedia(id, { mediaIds });
    }
  } catch (error) {
    return fail(error);
  }
  revalidateCatalog();
  revalidatePath(`/admin/products/${id}`);
  return ok();
}

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ */

export async function saveCategoryAction(
  id: number | null,
  body: unknown,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/categories");

  try {
    if (id === null) {
      await admin.createAdminCategory(body);
    } else {
      await admin.updateAdminCategory(id, body);
    }
  } catch (error) {
    return fail(error);
  }

  revalidateCatalog();
  revalidatePath("/admin/categories");
  return ok();
}

export async function deleteCategoryAction(
  id: number,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/categories");
  try {
    await admin.deleteAdminCategory(id);
  } catch (error) {
    return fail(error);
  }
  revalidateCatalog();
  revalidatePath("/admin/categories");
  return ok();
}

export async function bulkDeleteCategoriesAction(
  ids: number[],
): Promise<AdminActionResult<AdminBulkResult>> {
  await requireAdmin("/admin/categories");
  let result: AdminBulkResult;
  try {
    result = await admin.bulkDeleteAdminCategories(ids);
  } catch (error) {
    return fail(error);
  }
  revalidateCatalog();
  revalidatePath("/admin/categories");
  return { ok: true, data: result };
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

export async function updateOrderStatusAction(
  id: number,
  body: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    adminNote?: string | null;
  },
): Promise<AdminActionResult> {
  await requireAdmin("/admin/orders");
  try {
    // Invalid transitions are rejected by the API with 409.
    await admin.updateOrderStatus(id, body);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return ok();
}

export async function updateFulfilmentAction(
  id: number,
  body: {
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
  },
): Promise<AdminActionResult> {
  await requireAdmin("/admin/orders");
  try {
    await admin.updateOrderFulfilment(id, body);
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/admin/orders/${id}`);
  return ok();
}

/** `amount` is minor units and is validated against the refundable balance. */
export async function refundOrderAction(
  id: number,
  body: { amount: number; reason: string | null },
): Promise<AdminActionResult> {
  await requireAdmin("/admin/orders");
  try {
    await admin.refundOrder(id, body);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return ok();
}

/** Orders that cannot make the move are reported in `failed`, not thrown. */
export async function bulkUpdateOrderStatusAction(
  ids: number[],
  status: OrderStatus,
): Promise<AdminActionResult<AdminBulkResult>> {
  await requireAdmin("/admin/orders");
  let result: AdminBulkResult;
  try {
    result = await admin.bulkUpdateOrderStatus(ids, status);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/admin/orders");
  return { ok: true, data: result };
}

export async function deleteOrderAction(
  id: number,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/orders");
  try {
    await admin.deleteAdminOrder(id);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/admin/orders");
  return ok();
}

export async function bulkDeleteOrdersAction(
  ids: number[],
): Promise<AdminActionResult<AdminBulkResult>> {
  await requireAdmin("/admin/orders");
  let result: AdminBulkResult;
  try {
    result = await admin.bulkDeleteAdminOrders(ids);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/admin/orders");
  return { ok: true, data: result };
}

/* ------------------------------------------------------------------ *
 * Reviews
 * ------------------------------------------------------------------ */

export async function moderateReviewAction(
  id: number,
  body: { status?: ReviewModerationStatus; storeReply?: string | null },
): Promise<AdminActionResult> {
  await requireAdmin("/admin/reviews");
  try {
    await admin.moderateReview(id, body);
  } catch (error) {
    return fail(error);
  }
  revalidateCatalog();
  revalidatePath("/admin/reviews");
  return ok();
}

/* ------------------------------------------------------------------ *
 * CMS pages and home sections
 * ------------------------------------------------------------------ */

export async function savePageAction(
  id: number | null,
  body: unknown,
): Promise<AdminActionResult<{ id: number }>> {
  await requireAdmin("/admin/pages");

  try {
    const saved =
      id === null
        ? await admin.createAdminPage(body)
        : await admin.updateAdminPage(id, body);
    revalidateTag(CACHE_TAGS.pages, "max");
    revalidatePath("/admin/pages");
    return { ok: true, data: { id: saved.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function deletePageAction(id: number): Promise<AdminActionResult> {
  await requireAdmin("/admin/pages");
  try {
    await admin.deleteAdminPage(id);
  } catch (error) {
    return fail(error);
  }
  revalidateTag(CACHE_TAGS.pages, "max");
  revalidatePath("/admin/pages");
  return ok();
}

export async function replaceHomeSectionsAction(
  sections: unknown,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/home-sections");
  try {
    await admin.replaceHomeSections({ sections });
  } catch (error) {
    return fail(error);
  }
  revalidateTag(CACHE_TAGS.home, "max");
  revalidatePath("/admin/home-sections");
  return ok();
}

/* ------------------------------------------------------------------ *
 * Media
 * ------------------------------------------------------------------ */

export async function deleteMediaAction(
  id: number,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/media");
  try {
    await admin.deleteAdminMedia(id);
  } catch (error) {
    return fail(error);
  }
  revalidateCatalog();
  revalidatePath("/admin/media");
  return ok();
}

export async function bulkDeleteMediaAction(
  ids: number[],
): Promise<AdminActionResult<AdminBulkResult>> {
  await requireAdmin("/admin/media");
  let result: AdminBulkResult;
  try {
    result = await admin.bulkDeleteAdminMedia(ids);
  } catch (error) {
    return fail(error);
  }
  revalidateCatalog();
  revalidatePath("/admin/media");
  return { ok: true, data: result };
}

/* ------------------------------------------------------------------ *
 * Settings
 * ------------------------------------------------------------------ */

/**
 * Saves store settings and then refreshes the cached public runtime config,
 * so the storefront picks up the new name, colours, currency and URLs without
 * waiting out the 60s window (contract 3, rule 6).
 */
export async function saveStoreSettingsAction(
  body: unknown,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/settings/store");

  try {
    await admin.updateStoreSettings(body);
  } catch (error) {
    return fail(error);
  }

  revalidateRuntimeConfig();
  revalidatePath("/admin/settings/store");
  revalidatePath("/", "layout");
  return ok();
}

/**
 * Saves the header and footer navigation.
 *
 * Only `navigation` is sent, so a save here cannot disturb any other store
 * setting, and the public runtime-config cache is refreshed so the storefront
 * header and footer pick the new links up immediately (contract 3, rule 6).
 */
export async function saveNavigationAction(
  navigation: unknown,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/settings/navigation");

  try {
    await admin.updateStoreSettings({ navigation });
  } catch (error) {
    return fail(error);
  }

  revalidateRuntimeConfig();
  revalidatePath("/admin/settings/navigation");
  revalidatePath("/", "layout");
  return ok();
}

/**
 * Saves payment settings.
 *
 * The payload is built client-side so that an untouched secret field is
 * OMITTED (leave unchanged) and the "Clear" control sends `null` (contract
 * 8.2). Nothing here logs the body, and no secret value is ever returned.
 * Provider enablement is part of the public runtime config, so that cache is
 * refreshed too.
 */
export async function savePaymentSettingsAction(
  body: AdminPaymentSettingsUpdate,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/settings/payments");

  try {
    await admin.updatePaymentSettings(body);
  } catch (error) {
    return fail(error);
  }

  revalidateRuntimeConfig();
  revalidatePath("/admin/settings/payments");
  revalidatePath("/", "layout");
  return ok();
}

export async function testPaymentConnectionAction(
  provider: "stripe" | "paypal",
): Promise<AdminActionResult<AdminConnectionCheck>> {
  await requireAdmin("/admin/settings/payments");

  try {
    const check = await admin.testPaymentConnection(provider);
    revalidatePath("/admin/settings/payments");
    return { ok: true, data: check };
  } catch (error) {
    return fail(error);
  }
}

/* ------------------------------------------------------------------ *
 * Admin users
 * ------------------------------------------------------------------ */

export async function saveAdminUserAction(
  id: number | null,
  body: unknown,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/users");

  try {
    if (id === null) {
      await admin.createAdminUser(body);
    } else {
      await admin.updateAdminUser(id, body);
    }
  } catch (error) {
    return fail(error);
  }

  revalidatePath("/admin/users");
  return ok();
}

/** The API refuses self-deletion and removing your own admin role. */
export async function deleteAdminUserAction(
  id: number,
): Promise<AdminActionResult> {
  await requireAdmin("/admin/users");
  try {
    await admin.deleteAdminUser(id);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/admin/users");
  return ok();
}
