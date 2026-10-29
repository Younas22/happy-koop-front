/**
 * Admin, account and checkout response shapes.
 *
 * Source of truth: docs/api-contract.md. Section 8 lists the admin endpoints
 * but not every response field, so the shapes here mirror what the implemented
 * API actually returns. Anything the contract does not pin down is modelled as
 * nullable, so a missing value renders as "not set" rather than an invented
 * one. Re-exported from `@/lib/types/api`.
 */

import type {
  AccountOrderSummary,
  Address,
  Category,
  CategoryRef,
  ImageRef,
  InventoryPolicy,
  MediaItem,
  MediaType,
  Money,
  Order,
  Page,
  PaymentProvider,
  PaypalMode,
  ProductBadge,
  Review,
  RuntimeFeatures,
  RuntimeNavigation,
  RuntimeSocial,
  SavedAddress,
  SeoFields,
  StripeMode,
  ValueProp,
} from "@/lib/types/api";

/* ------------------------------------------------------------------ *
 * 8.2 Payment settings - status only, never a secret
 * ------------------------------------------------------------------ */

/** Contract 8.2 - a secret is only ever described, never returned. */
export interface AdminSecretStatus {
  configured: boolean;
  maskedSuffix: string | null;
  updatedAt: string | null;
}

export interface AdminConnectionCheck {
  ok: boolean;
  checkedAt: string;
  /** Sanitized provider message. */
  message: string;
}

export interface AdminStripePaymentSettings {
  enabled: boolean;
  mode: StripeMode | string;
  publishableKey: string | null;
  secretKey: AdminSecretStatus;
  webhookSecret: AdminSecretStatus;
  webhookUrl: string;
  lastCheck: AdminConnectionCheck | null;
}

export interface AdminPaypalPaymentSettings {
  enabled: boolean;
  mode: PaypalMode | string;
  clientId: string | null;
  clientSecret: AdminSecretStatus;
  webhookId: AdminSecretStatus;
  webhookUrl: string;
  lastCheck: AdminConnectionCheck | null;
}

/** GET /admin/settings/payments (contract 8.2) - status, never secrets. */
export interface AdminPaymentSettings {
  stripe: AdminStripePaymentSettings;
  paypal: AdminPaypalPaymentSettings;
}

export interface AdminStripeSettingsUpdate {
  enabled?: boolean;
  mode?: StripeMode;
  publishableKey?: string | null;
  secretKey?: string | null;
  webhookSecret?: string | null;
}

export interface AdminPaypalSettingsUpdate {
  enabled?: boolean;
  mode?: PaypalMode;
  clientId?: string | null;
  clientSecret?: string | null;
  webhookId?: string | null;
}

/**
 * PUT /admin/settings/payments body.
 *
 * A secret field is OMITTED to leave it unchanged and sent as `null` to clear
 * it (contract 8.2). It is never pre-filled, echoed back, or persisted
 * anywhere in the browser.
 */
export interface AdminPaymentSettingsUpdate {
  confirmLiveMode?: boolean;
  stripe?: AdminStripeSettingsUpdate;
  paypal?: AdminPaypalSettingsUpdate;
}

/* ------------------------------------------------------------------ *
 * 8.1 Store settings
 * ------------------------------------------------------------------ */

export interface AdminStoreSettings {
  storeName: string | null;
  tagline: string | null;
  logoMediaId: number | null;
  logoDarkMediaId: number | null;
  faviconMediaId: number | null;
  primaryColor: string | null;
  accentColor: string | null;
  radius: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressLines: string[];
  currency: string | null;
  locale: string | null;
  timezone: string | null;
  canonicalFrontendUrl: string | null;
  activeApiBaseUrl: string | null;
  seoDefaultTitle: string | null;
  seoTitleTemplate: string | null;
  seoDefaultDescription: string | null;
  seoDefaultOgImageMediaId: number | null;
  shippingSummary: string | null;
  returnsSummary: string | null;
  social: RuntimeSocial;
  features: RuntimeFeatures;
  navigation: RuntimeNavigation;
  configVersion: string | null;
}

export interface AdminStoreSettingsResponse extends AdminStoreSettings {
  /** Displayed verbatim in the admin UI (contract 8.1). */
  infrastructureNotice: string;
}

/* ------------------------------------------------------------------ *
 * 9. Media
 * ------------------------------------------------------------------ */

export interface AdminMediaAsset {
  id: number;
  url: string;
  thumbnailUrl: string | null;
  type: MediaType;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  alt: string | null;
  folder: string | null;
  originalFilename: string | null;
  createdAt: string | null;
}

/* ------------------------------------------------------------------ *
 * Reviews, audit logs, users
 * ------------------------------------------------------------------ */

export type ReviewModerationStatus = "pending" | "approved" | "rejected";

export interface AdminReview extends Review {
  status: ReviewModerationStatus;
  userId: number | null;
  /** Set when the review is linked to a paid order item (verified purchase). */
  orderItemId: number | null;
  moderatedBy: number | null;
  moderatedAt: string | null;
  updatedAt: string | null;
  product: { id: number; name: string; slug: string } | null;
}

/** GET /admin/audit-logs (contract 8). Changed key NAMES only, no values. */
export interface AdminAuditLogEntry {
  id: number;
  action: string;
  actor: { id: number; name: string; email: string } | null;
  subjectType: string | null;
  subjectId: number | null;
  changedKeys: string[];
  ip: string | null;
  createdAt: string | null;
}

export interface AdminRoleRef {
  id: number;
  name: string;
  slug: string;
}

/** GET /admin/customers row and GET /admin/users row. */
export interface AdminUserSummary {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  emailVerifiedAt: string | null;
  acceptsMarketing: boolean;
  isAdmin: boolean;
  roles: AdminRoleRef[];
  ordersCount: number;
  lastLoginAt: string | null;
  createdAt: string | null;
}

export interface AdminCustomerDetail extends AdminUserSummary {
  addresses: SavedAddress[];
  orders: AccountOrderSummary[];
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

export interface AdminOrderSummary extends AccountOrderSummary {
  id: number;
  email: string | null;
  paymentProvider: PaymentProvider | null;
}

/** GET /admin/orders/{id} - the order plus the refund ledger. */
export interface AdminOrderDetail extends Order {
  userId: number | null;
  phone: string | null;
  adminNote: string | null;
  refundedAmount: Money;
  refundableAmount: Money;
  cancelledAt: string | null;
  inventoryCommittedAt: string | null;
  updatedAt: string | null;
}

/* ------------------------------------------------------------------ *
 * Products
 * ------------------------------------------------------------------ */

/** Admin lists include drafts and archived products (contract 8). */
export type AdminProductStatus = "draft" | "published" | "archived";

/** GET /admin/products row. `costPrice` is admin-only (contract 4). */
export interface AdminProductSummary {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  status: AdminProductStatus;
  price: Money;
  compareAtPrice: Money | null;
  costPrice: Money | null;
  stockQuantity: number;
  inventoryPolicy: InventoryPolicy;
  variantCount: number;
  primaryImage: ImageRef | null;
  publishedAt: string | null;
  updatedAt: string | null;
}

export interface AdminProductOptionValue {
  id: number;
  label: string;
  value: string;
  swatchHex: string | null;
  sortOrder: number;
}

export interface AdminProductOption {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  values: AdminProductOptionValue[];
}

export interface AdminProductVariant {
  id: number;
  sku: string | null;
  /** Minor units, or `null` to inherit the product price. */
  priceAmount: number | null;
  compareAtAmount: number | null;
  stockQuantity: number;
  inventoryPolicy: InventoryPolicy | null;
  weightGrams: number | null;
  mediaId: number | null;
  optionValueIds: number[];
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminProductSpecification {
  id: number;
  group: string | null;
  label: string;
  value: string;
  unit: string | null;
  sortOrder: number;
}

export interface AdminProductFaq {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface AdminProductDetail {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  status: AdminProductStatus;
  shortDescription: string | null;
  description: string | null;
  price: Money;
  compareAtPrice: Money | null;
  costPrice: Money | null;
  currency: string;
  inventoryPolicy: InventoryPolicy;
  stockQuantity: number;
  lowStockThreshold: number | null;
  weightGrams: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  valueProps: ValueProp[];
  whatsIncluded: string[];
  shippingSummary: string | null;
  returnsSummary: string | null;
  warrantyText: string | null;
  returnsWindowDays: number | null;
  badges: ProductBadge[];
  primaryMediaId: number | null;
  seo: SeoFields;
  categoryIds: number[];
  categories: CategoryRef[];
  media: MediaItem[];
  options: AdminProductOption[];
  variants: AdminProductVariant[];
  specifications: AdminProductSpecification[];
  faqs: AdminProductFaq[];
  relatedProductIds: number[];
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

/* ------------------------------------------------------------------ *
 * Shipping
 * ------------------------------------------------------------------ */

export interface AdminShippingRate {
  id: number;
  code: string;
  label: string;
  description: string | null;
  price: Money;
  /** Rate is offered only at or above this subtotal; `null` = always. */
  minSubtotal: Money | null;
  /** Free at or above this subtotal; `null` = never free. */
  freeAbove: Money | null;
  estimateMinDays: number | null;
  estimateMaxDays: number | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface AdminShippingZone {
  id: number;
  name: string;
  /** ISO-3166-1 alpha-2 codes, or `*` for every country no other zone covers. */
  countryCodes: string[];
  isActive: boolean;
  sortOrder: number;
  rates: AdminShippingRate[];
  updatedAt: string | null;
}

/** POST/PATCH body. `rates` replaces the zone's whole rate list. */
export interface AdminShippingZoneInput {
  name: string;
  countryCodes: string[];
  isActive: boolean;
  sortOrder: number;
  rates: {
    id: number | null;
    code: string;
    label: string;
    description: string | null;
    priceAmount: number;
    minSubtotalAmount: number | null;
    freeAboveAmount: number | null;
    estimateMinDays: number | null;
    estimateMaxDays: number | null;
    isDefault: boolean;
    isActive: boolean;
  }[];
}

/* ------------------------------------------------------------------ *
 * Categories, pages, home sections
 * ------------------------------------------------------------------ */

export interface AdminCategory extends Category {
  /** The chosen library asset, for the picker; `imageUrl` is the resolved file. */
  imageMediaId: number | null;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

/** A page's content in one extra language; `null` falls back to the default. */
export interface AdminPageTranslation {
  title: string | null;
  body: string | null;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface AdminPage extends Page {
  /** Other languages, keyed by locale. */
  translations?: Partial<Record<"nl", AdminPageTranslation>>;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string | null;
}

export type HomeSectionType =
  "hero" | "category_tiles" | "product_grid" | "benefits" | "rich_text";

export const HOME_SECTION_TYPES: readonly HomeSectionType[] = [
  "hero",
  "category_tiles",
  "product_grid",
  "benefits",
  "rich_text",
];

/** GET|PUT /admin/home-sections. `config` is type-specific admin JSON. */
export interface AdminHomeSection {
  id: number;
  type: HomeSectionType | string;
  heading: string | null;
  config: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

/* ------------------------------------------------------------------ *
 * Dashboard - measured counts only, no projections (contract 8)
 * ------------------------------------------------------------------ */

export interface AdminDashboardOrders {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  last30Days: number;
}

export interface AdminDashboardRevenue {
  allTime: Money;
  last30Days: Money;
  refundedAllTime: Money;
}

export interface AdminDashboardCatalog {
  products: number;
  published: number;
  drafts: number;
  outOfStock: number;
}

export interface AdminDashboard {
  currency: string;
  orders: AdminDashboardOrders;
  revenue: AdminDashboardRevenue;
  catalog: AdminDashboardCatalog;
  customers: { total: number; last30Days: number };
  reviews: { pending: number; approved: number };
  recentOrders: AccountOrderSummary[];
}

/** POST /admin/orders/{id}/refund response: the order plus the reference. */
export interface AdminRefundResult extends AdminOrderDetail {
  refundReference: string | null;
}

/**
 * Result of an admin bulk endpoint. Ids the API could not find are simply
 * absent; `failed` lists the ones it found but refused, with the reason.
 */
/** Email sender settings (Resend). The API key is never returned. */
export interface AdminMailSettings {
  resendApiKey: {
    configured: boolean;
    maskedSuffix: string | null;
    updatedAt: string | null;
  };
  fromAddress: string | null;
  fromName: string | null;
  /** What the server is sending with right now, and where it came from. */
  effective: {
    mailer: string;
    fromAddress: string;
    fromName: string;
    source: "admin" | "environment";
  };
  lastTest: AdminMailTestResult | null;
}

export interface AdminMailTestResult {
  ok: boolean;
  message: string;
  checkedAt: string;
  to: string;
}

/** Omitted or empty `resendApiKey` keeps the stored key. */
export interface AdminMailSettingsUpdate {
  resendApiKey?: string;
  clearResendApiKey?: boolean;
  fromAddress: string | null;
  fromName: string | null;
}

export type ContactMessageStatus = "new" | "handled";

/** A contact form message in the admin list. */
export interface AdminContactMessageSummary {
  id: number;
  reference: string;
  name: string;
  email: string;
  subject: string | null;
  status: ContactMessageStatus;
  userId: number | null;
  receivedAt: string | null;
  handledAt: string | null;
  /** The start of the message, on one line. */
  preview: string;
}

export interface AdminContactMessage extends Omit<
  AdminContactMessageSummary,
  "preview"
> {
  message: string;
}

export interface AdminBulkResult {
  succeeded: number[];
  failed: { id: number; message: string }[];
}

/** Address shape used by the admin order detail view. */
export type AdminOrderAddress = Address;
