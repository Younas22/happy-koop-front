/**
 * Hand-written types for HappyKoop API v1.
 *
 * Source of truth: docs/api-contract.md. Field names are camelCase exactly as
 * the contract specifies. Per contract 1.7 a field with no value is returned as
 * `null` (scalars) or `[]` (lists) and is NEVER omitted - so optional (`?`)
 * markers are deliberately absent and nullable fields are `| null`.
 *
 * Nothing in here may be widened "just in case": if the contract does not
 * define a field, it is not in this file.
 */

/* ------------------------------------------------------------------ *
 * 1. Envelopes, money, errors
 * ------------------------------------------------------------------ */

/** Contract 1.2 - single resource / non-paginated collection envelope. */
export interface ApiEnvelope<T> {
  data: T;
}

/** Contract 1.2 - pagination meta. */
export interface PaginationMeta {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
  /** `null` when the page is empty. */
  from: number | null;
  /** `null` when the page is empty. */
  to: number | null;
}

/** Contract 1.2 - paginated collection envelope, unwrapped by the api client. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Contract 1.2 - action response with no resource. */
export interface OkResult {
  ok: true;
}

/**
 * Contract 1.5 - money is never a float.
 * `amount` is integer minor units. `formatted` is server-rendered for display
 * and must never be parsed.
 */
export interface Money {
  amount: number;
  currency: string;
  formatted: string;
}

/** Contract 1.4 - stable machine-readable error codes. */
export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "GONE"
  | "VALIDATION_FAILED"
  | "CART_CHANGED"
  | "PAYMENT_NOT_CONFIGURED"
  | "LIVE_MODE_LOCKED"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "SERVICE_UNAVAILABLE";

/**
 * Contract 1.3 - the single error body shape.
 * `errors` is present only on 422 VALIDATION_FAILED; keys are camelCase field
 * paths (e.g. `shippingAddress.postalCode`, `items.0.quantity`).
 */
export interface ApiErrorBody {
  message: string;
  code: ApiErrorCode | string;
  errors: Record<string, string[]> | null;
}

/** Field-path -> messages map extracted from a 422 response. */
export type FieldErrors = Record<string, string[]>;

/* ------------------------------------------------------------------ *
 * 3. Public runtime config
 * ------------------------------------------------------------------ */

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterNavGroup {
  heading: string;
  links: NavLink[];
}

export interface RuntimeStore {
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  email: string | null;
  phone: string | null;
  addressLines: string[];
}

/** Contract 8.1 - radius is an admin-chosen scale key. */
export type ThemeRadius = "none" | "sm" | "md" | "lg";

export interface RuntimeTheme {
  /** `/^#[0-9a-fA-F]{6}$/` per contract 8.1. Validated again client-side. */
  primaryColor: string;
  accentColor: string;
  radius: ThemeRadius | string;
}

export interface RuntimeLocale {
  currency: string;
  currencySymbol: string;
  /** Exponent for minor units: 2 for USD, 0 for JPY. Contract 1.5. */
  minorUnitExponent: number;
  locale: string;
  timezone: string;
}

export interface RuntimeUrls {
  apiBaseUrl: string;
  canonicalFrontendUrl: string;
}

export interface RuntimeSeo {
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string | null;
  defaultOgImageUrl: string | null;
}

export interface RuntimePolicies {
  shippingSummary: string | null;
  returnsSummary: string | null;
}

export interface RuntimeFeatures {
  reviews: boolean;
  wishlist: boolean;
  newsletter: boolean;
  guestCheckout: boolean;
  search: boolean;
  publicStockCounts: boolean;
}

export type StripeMode = "test" | "live";
export type PaypalMode = "sandbox" | "live";

export interface RuntimeStripeConfig {
  enabled: boolean;
  mode: StripeMode | string;
  /** Returned only when `enabled` is true (contract 3). */
  publishableKey: string | null;
}

export interface RuntimePaypalConfig {
  enabled: boolean;
  mode: PaypalMode | string;
  /** Returned only when `enabled` is true (contract 3). */
  clientId: string | null;
}

export interface RuntimePayments {
  stripe: RuntimeStripeConfig;
  paypal: RuntimePaypalConfig;
}

export interface RuntimeSocial {
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  x: string | null;
}

export interface RuntimeNavigation {
  primary: NavLink[];
  footer: FooterNavGroup[];
}

/** `GET /api/v1/public/runtime-config` payload (contract 3). */
export interface RuntimeConfig {
  configVersion: string;
  store: RuntimeStore;
  theme: RuntimeTheme;
  locale: RuntimeLocale;
  urls: RuntimeUrls;
  seo: RuntimeSeo;
  policies: RuntimePolicies;
  features: RuntimeFeatures;
  payments: RuntimePayments;
  social: RuntimeSocial;
  navigation: RuntimeNavigation;
}

/**
 * Runtime config as the frontend actually uses it.
 *
 * `apiBaseUrl` here is always a validated, allowlisted origin - never the raw
 * value from the response. `degraded` is true when the bootstrap fetch failed
 * and neutral defaults are in use, so the UI can be honest about it instead of
 * rendering invented store details.
 */
export interface ResolvedRuntimeConfig extends RuntimeConfig {
  degraded: boolean;
  /** Set when `urls.apiBaseUrl` failed validation and was replaced. */
  apiBaseUrlRejected: boolean;
}

/* ------------------------------------------------------------------ *
 * 4. Catalog
 * ------------------------------------------------------------------ */

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
  sortOrder: number;
  children: Category[];
}

/** Breadcrumb trail entry (contract 4 - product `breadcrumbs`, category `ancestors`). */
export interface Breadcrumb {
  label: string;
  href: string;
}

/** `GET /categories/{slug}` - Category plus `seo` and `ancestors` (contract 4). */
export interface CategoryDetail extends Category {
  seo: SeoFields;
  ancestors: Breadcrumb[];
}

/** Product / page SEO block. `canonicalPath` is present on product detail. */
export interface SeoFields {
  title: string | null;
  description: string | null;
  noindex: boolean;
}

export interface ProductSeoFields extends SeoFields {
  canonicalPath: string;
  ogImageUrl: string | null;
}

/** Contract 4 - availability states. `low_stock` is never an urgency device. */
export type AvailabilityState =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "preorder"
  | "unavailable";

/** Contract 4 - inventory policy. */
export type InventoryPolicy = "track" | "continue" | "deny";

/** Availability as returned on list/card endpoints. */
export interface Availability {
  inStock: boolean;
  state: AvailabilityState;
}

/** Availability as returned on detail endpoints and variants. */
export interface DetailedAvailability extends Availability {
  /**
   * `null` unless `features.publicStockCounts` is enabled AND policy is
   * `track` (contract 4). Never rendered as 0.
   */
  quantity: number | null;
  policy: InventoryPolicy;
}

export interface ImageRef {
  id: number;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
}

export type MediaType = "image" | "video";

export interface MediaItem {
  id: number;
  type: MediaType;
  url: string;
  thumbnailUrl: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
}

/**
 * `null` when the product has zero approved reviews (contract 4).
 * Never 0, never a seeded default.
 */
export interface Rating {
  average: number;
  count: number;
}

/**
 * Administrator-set factual label. The backend never invents badges.
 * `tone` is not enumerated by the contract, so it is kept as a string and
 * mapped to a known style with a neutral fallback.
 */
export interface ProductBadge {
  label: string;
  tone: string;
}

export interface CategoryRef {
  id: number;
  name: string;
  slug: string;
}

/** Paginated list item from `GET /products` (contract 4). */
export interface ProductCard {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: Money;
  /** Only present when strictly greater than `price`; otherwise `null`. */
  compareAtPrice: Money | null;
  primaryImage: ImageRef | null;
  availability: Availability;
  rating: Rating | null;
  categories: CategoryRef[];
  hasVariants: boolean;
  badges: ProductBadge[];
}

/**
 * Contract 4/8 - public endpoints only ever expose `published`. `draft` exists
 * for admin list responses.
 */
export type ProductStatus = "draft" | "published";

export interface ProductOptionValue {
  id: number;
  label: string;
  value: string;
  swatchHex: string | null;
}

export interface ProductOption {
  id: number;
  name: string;
  slug: string;
  values: ProductOptionValue[];
}

/**
 * A variant is identified by the SET of `optionValueIds` - one value per
 * option, order-insensitive (contract 4, "Variant selection contract").
 * A combination absent from `variants` is unavailable; the frontend must not
 * synthesize variants from the cartesian product of options.
 */
export interface ProductVariant {
  id: number;
  sku: string | null;
  optionValueIds: number[];
  price: Money;
  compareAtPrice: Money | null;
  availability: DetailedAvailability;
  mediaId: number | null;
  weightGrams: number | null;
  isDefault: boolean;
}

export interface ValueProp {
  icon: string | null;
  title: string;
  body: string | null;
}

export interface SpecificationItem {
  label: string;
  value: string;
  unit: string | null;
}

export interface SpecificationGroup {
  group: string;
  sortOrder: number;
  items: SpecificationItem[];
}

export interface ProductShippingInfo {
  summary: string | null;
  /**
   * Admin-authored text. `null` means no estimate is configured - delivery
   * dates are never invented.
   */
  estimateText: string | null;
  freeShippingThreshold: Money | null;
}

export interface ProductReturnsInfo {
  summary: string | null;
  windowDays: number | null;
  warrantyText: string | null;
}

export interface ProductFaq {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface ShippingDimensions {
  weightGrams: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
}

/** `GET /products/{slug}` (contract 4). */
export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  status: ProductStatus;
  shortDescription: string | null;
  /** Server-sanitized HTML. */
  description: string | null;
  valueProps: ValueProp[];
  price: Money;
  compareAtPrice: Money | null;
  availability: DetailedAvailability;
  rating: Rating | null;
  reviewCount: number;
  media: MediaItem[];
  options: ProductOption[];
  /** `[]` for a simple product; `hasVariants` is then false. */
  variants: ProductVariant[];
  specificationGroups: SpecificationGroup[];
  whatsIncluded: string[];
  shippingInfo: ProductShippingInfo | null;
  returnsInfo: ProductReturnsInfo | null;
  faqs: ProductFaq[];
  categories: CategoryRef[];
  breadcrumbs: Breadcrumb[];
  seo: ProductSeoFields;
  shippingDimensions: ShippingDimensions | null;
  publishedAt: string | null;
}

/* ------------------------------------------------------------------ *
 * 4. Reviews
 * ------------------------------------------------------------------ */

export interface ReviewStoreReply {
  body: string;
  repliedAt: string;
}

export interface Review {
  id: number;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  /**
   * `true` only when the review is linked to a paid order item for that
   * product by that customer (contract 4). Imported/supplier reviews are
   * never exposed.
   */
  isVerifiedPurchase: boolean;
  createdAt: string;
  helpfulCount: number;
  storeReply: ReviewStoreReply | null;
}

/** Keys are the rating value as a string, `"1"`..`"5"`. */
export type ReviewDistribution = Record<"1" | "2" | "3" | "4" | "5", number>;

/** `null` when `count` is 0 (contract 4). */
export interface ReviewSummary {
  average: number;
  count: number;
  distribution: ReviewDistribution;
}

/** `GET /products/{slug}/reviews` - paginated plus a `summary` sibling. */
export interface ReviewPage extends Paginated<Review> {
  summary: ReviewSummary | null;
}

export type ReviewSort = "newest" | "highest" | "lowest" | "helpful";

export interface CreateReviewRequest {
  productId: number;
  rating: number;
  title: string | null;
  body: string;
}

export interface CreateReviewResult {
  id: number;
  status: "pending";
}

/* ------------------------------------------------------------------ *
 * 4. CMS pages and home
 * ------------------------------------------------------------------ */

/** `GET /pages/{slug}` (contract 4). */
export interface Page {
  id: number;
  slug: string;
  title: string;
  /** Server-sanitized HTML. */
  body: string;
  excerpt: string | null;
  seo: SeoFields;
  updatedAt: string;
}

/** `hero` may be `null` (contract 4). */
export interface HomeHero {
  headline: string;
  subheadline: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
}

export interface HomeBenefitItem {
  icon: string | null;
  title: string;
  body: string | null;
}

export interface HomeCategoryTilesSection {
  type: "category_tiles";
  heading: string | null;
  categories: Category[];
}

export interface HomeProductGridSection {
  type: "product_grid";
  heading: string | null;
  products: ProductCard[];
}

export interface HomeBenefitsSection {
  type: "benefits";
  heading: string | null;
  items: HomeBenefitItem[];
}

export interface HomeRichTextSection {
  type: "rich_text";
  heading: string | null;
  /** Server-sanitized HTML. */
  html: string;
}

export type KnownHomeSection =
  | HomeCategoryTilesSection
  | HomeProductGridSection
  | HomeBenefitsSection
  | HomeRichTextSection;

/**
 * Unknown `type` values MUST be skipped silently by the frontend, not rendered
 * as errors (contract 4). This union keeps them representable.
 */
export type HomeSection = KnownHomeSection | { type: string; heading: string | null };

export interface HomeContent {
  hero: HomeHero | null;
  sections: HomeSection[];
}

/* ------------------------------------------------------------------ *
 * 5. Cart
 * ------------------------------------------------------------------ */

/** What the browser is allowed to hold: ids and quantities only, no prices. */
export interface CartLineInput {
  productId: number;
  variantId: number | null;
  quantity: number;
}

export interface CartIssue {
  code: string;
  message: string;
}

export interface CartValidationRequest {
  items: CartLineInput[];
  couponCode: string | null;
  countryCode: string | null;
  postalCode: string | null;
}

/** Server-priced cart line. These prices are display-only echoes. */
export interface CartItem {
  /** `"{productId}:{variantId}"`, server-assigned. */
  key: string;
  productId: number;
  variantId: number | null;
  name: string;
  variantLabel: string | null;
  sku: string | null;
  slug: string;
  imageUrl: string | null;
  quantity: number;
  maxQuantity: number | null;
  unitPrice: Money;
  lineTotal: Money;
  availability: Availability;
  issues: CartIssue[];
}

export interface CartRemovedItem {
  productId: number;
  variantId: number | null;
  reason: string;
  message: string;
}

export interface CartAdjustment {
  key: string;
  field: string;
  from: number;
  to: number;
  reason: string;
  message: string;
}

/**
 * `shipping` and `tax` are `null` until they can be computed. `null` means
 * "not yet determined" and renders as "Calculated at checkout" - never $0.00.
 */
export interface CartTotals {
  subtotal: Money;
  discount: Money;
  shipping: Money | null;
  tax: Money | null;
  total: Money;
}

export interface CartCoupon {
  code: string;
  label: string | null;
  discount: Money;
}

export interface CartValidation {
  items: CartItem[];
  removedItems: CartRemovedItem[];
  adjustments: CartAdjustment[];
  totals: CartTotals;
  coupon: CartCoupon | null;
  currency: string;
  /** Fingerprint passed to checkout/initialize; mismatch => 422 CART_CHANGED. */
  cartHash: string;
}

/* ------------------------------------------------------------------ *
 * 5. Shipping and checkout
 * ------------------------------------------------------------------ */

export interface ShippingOption {
  id: string;
  label: string;
  description: string | null;
  price: Money;
  /** `null` unless an administrator configured it. Never invented. */
  estimateMinDays: number | null;
  estimateMaxDays: number | null;
  isDefault: boolean;
}

/** Address as accepted by `checkout/initialize` (contract 5). */
export interface Address {
  firstName: string;
  lastName: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  countryCode: string;
  phone: string | null;
}

/**
 * Saved account address. The contract lists the endpoints (7) but not the
 * response fields beyond the checkout address shape; `id` and the default
 * flags are the minimum the documented `/default` action implies.
 */
export interface SavedAddress extends Address {
  id: number;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export type PaymentProvider = "stripe" | "paypal";

export interface CheckoutInitializeRequest {
  items: CartLineInput[];
  cartHash: string;
  email: string;
  phone: string | null;
  shippingAddress: Address;
  /** `null` means "same as shipping". */
  billingAddress: Address | null;
  shippingMethodId: string;
  couponCode: string | null;
  paymentProvider: PaymentProvider;
  customerNote: string | null;
  acceptsMarketing: boolean;
}

/* ------------------------------------------------------------------ *
 * 6. Orders and payments
 * ------------------------------------------------------------------ */

/** Contract 6 - fulfilment status. */
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

/** Contract 6 - payment status. */
export type PaymentStatus =
  | "unpaid"
  | "authorized"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "failed"
  | "cancelled";

export interface OrderTotals {
  subtotal: Money;
  discount: Money;
  shipping: Money | null;
  tax: Money | null;
  total: Money;
}

/**
 * Order line snapshot, frozen at checkout/initialize (contract 5).
 * The contract shows `"items": [ ]` without field names, so this mirrors the
 * cart line snapshot fields it says are frozen: name, sku, options, unit price.
 */
export interface OrderItem {
  id: number;
  productId: number;
  variantId: number | null;
  name: string;
  variantLabel: string | null;
  sku: string | null;
  slug: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

/** `POST /checkout/initialize` order payload (contract 5). */
export interface Order {
  id: number;
  orderNumber: string;
  /** Opaque guest token guarding guest order reads. */
  accessToken: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  totals: OrderTotals;
  items: OrderItem[];
  createdAt: string;
  /** 60 minutes out at initialize. */
  expiresAt: string | null;
}

export interface PaymentAttempt {
  id: number;
  provider: PaymentProvider;
  status: string;
}

export interface CheckoutInitializeResult {
  order: Order;
  paymentAttempt: PaymentAttempt;
}

/**
 * `GET /orders/by-number/{orderNumber}` (contract 5). The authoritative status
 * read used by the checkout return pages - payment is never inferred from
 * redirect query parameters.
 */
export interface OrderStatusView {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totals: OrderTotals;
  items: OrderItem[];
  placedAt: string | null;
}

export interface StripeIntentResult {
  provider: "stripe";
  mode: StripeMode | string;
  /** Single-order client confirmation credential, not an API secret. */
  clientSecret: string;
  publishableKey: string;
  paymentIntentId: string;
  amount: Money;
}

export interface StripeCheckoutSessionResult {
  url: string;
  sessionId: string;
}

export interface PaypalOrderResult {
  provider: "paypal";
  mode: PaypalMode | string;
  paypalOrderId: string;
  amount: Money;
}

/* ------------------------------------------------------------------ *
 * 2 / 7. Auth, viewer, account
 * ------------------------------------------------------------------ */

export type TokenAbility = "customer" | "admin";

/**
 * `isAdmin` is a UI affordance only. Every admin endpoint independently
 * authorizes server-side (contract 2.2).
 */
export interface User {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  isAdmin: boolean;
  createdAt: string;
}

/** `GET /account/profile` and `PATCH` response (contract 7). */
export interface CustomerProfile extends User {
  phone: string | null;
  acceptsMarketing: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceName: string;
}

/** `POST /auth/login` - the token never reaches the browser. */
export interface LoginResult {
  token: string;
  expiresAt: string | null;
  abilities: TokenAbility[];
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  deviceName: string;
}

/** `GET /api/auth/session` (Next.js route handler, not Laravel). */
export interface SessionResult {
  user: User | null;
}

/* ------------------------------------------------------------------ *
 * 8. Admin
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

/** `GET /admin/settings/payments` (contract 8.2) - status, never secrets. */
export interface AdminPaymentSettings {
  stripe: AdminStripePaymentSettings;
  paypal: AdminPaypalPaymentSettings;
}

/** `GET|PUT /admin/settings/store` validated fields (contract 8.1). */
export interface AdminStoreSettings {
  storeName: string;
  tagline: string | null;
  logoMediaId: number | null;
  logoDarkMediaId: number | null;
  faviconMediaId: number | null;
  primaryColor: string;
  accentColor: string;
  contactEmail: string | null;
  contactPhone: string | null;
  addressLines: string[];
  currency: string;
  locale: string;
  timezone: string;
  canonicalFrontendUrl: string;
  activeApiBaseUrl: string;
  seo: RuntimeSeo;
  policies: RuntimePolicies;
  social: RuntimeSocial;
  features: RuntimeFeatures;
}

export interface AdminStoreSettingsResponse extends AdminStoreSettings {
  /** Displayed verbatim in the admin UI (contract 8.1). */
  infrastructureNotice: string;
}

/** `POST /admin/media` (contract 9). */
export interface AdminMediaAsset {
  id: number;
  url: string;
  thumbnailUrl: string | null;
  type: MediaType;
  mimeType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  alt: string | null;
  createdAt: string;
}

export type ReviewModerationStatus = "pending" | "approved" | "rejected";

export interface AdminReview extends Review {
  status: ReviewModerationStatus;
  productId: number;
  productName: string;
}

/**
 * `GET /admin/audit-logs` (contract 8). The contract defines the endpoint as
 * "paginated, read-only" but not its fields; these are the actor/ip/key-names
 * that 8.2 says every write records.
 */
export interface AdminAuditLogEntry {
  id: number;
  action: string;
  actorId: number | null;
  actorName: string | null;
  ipAddress: string | null;
  /** Changed key NAMES only - never values (contract 8.2). */
  changedKeys: string[];
  createdAt: string;
}
