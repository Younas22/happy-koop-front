# HappyKoop storefront (Next.js)

Customer-facing storefront for HappyKoop. The Laravel API in `../happy-koop` is
the source of truth for every product, price, stock level and store setting;
this app renders what that API returns and nothing else.

The authoritative API shape is `docs/api-contract.md`. Change the contract
before changing code on either side.

## Requirements

- Node.js 20+ (developed on 22)
- The Laravel API served by XAMPP Apache at `http://localhost/happy-koop` (no `php artisan serve` needed)

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build. Succeeds with the API down (degraded render) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript + React Compiler rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (jsdom) |
| `npm run test:watch` | Vitest in watch mode |

## Environment variables

See `.env.example` for the full list and comments. Summary:

| Name | Public | Purpose |
|------|--------|---------|
| `NEXT_PUBLIC_API_BOOTSTRAP_URL` | yes | Stable API origin used only to fetch public runtime config |
| `NEXT_PUBLIC_API_BASE_URL` | yes | Documented fallback when the bootstrap fetch fails |
| `NEXT_PUBLIC_ALLOWED_API_HOSTS` | yes | Comma-separated host allowlist that validates `apiBaseUrl` |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical frontend URL for metadata |
| `SESSION_COOKIE_SECRET` | **no** | Server-only secret for the session cookie |
| `INTERNAL_API_BASE_URL` | **no** | Optional server-only API origin |

No Stripe secret, PayPal secret, webhook secret, database credential or
`APP_KEY` may ever appear in a `NEXT_PUBLIC_*` variable or in frontend source.

## Architecture

```
src/
  app/                  App Router routes
    api/auth/*          Next.js route handlers that own the session cookie
    api/cart/validate   Same-origin proxy to POST /api/v1/cart/validate
  components/
    ui/                 Accessible primitives (Radix where interactive)
    layout/             Header, footer, brand mark, theme injection
    product/ shop/ home/ cart/ search/
  lib/
    types/api.ts        Hand-written types for every contract shape
    api/client.ts       Server-only typed fetch client + ApiError
    runtime-config.ts   Bootstrap, URL validation, degraded fallback
    auth/               Session cookie + server-side viewer helpers
    cart/               Client cart store (ids and quantities only)
    product/variants.ts Variant resolution by optionValueIds set
    money.ts            Integer-only money helpers
    utils/              cn, url, seo, jsonld, color
```

### Runtime config bootstrap

1. `NEXT_PUBLIC_API_BOOTSTRAP_URL` is read at runtime (deployment-time setting,
   not a secret).
2. `GET {bootstrap}/api/v1/public/runtime-config` is fetched with
   `revalidate: 60` and the cache tag `runtime-config`.
3. `urls.apiBaseUrl` is **validated** before it is used as a fetch target:
   http/https only, https required in production, no embedded credentials, and
   the host must appear in `NEXT_PUBLIC_ALLOWED_API_HOSTS`. A rejected value
   falls back to the bootstrap origin. An unvalidated URL is never followed.
4. If the bootstrap fetch fails, neutral defaults are returned with
   `degraded: true`; the store renders, says so, and is marked `noindex`.
   No cached or invented store content is substituted.
5. `revalidateRuntimeConfig()` is the explicit refresh hook for after an admin
   saves store settings.

### Authentication

Sanctum bearer tokens, with the token held in an HttpOnly cookie owned by this
app (`hk_session`; `HttpOnly; SameSite=Lax; Path=/`, `Secure` in production).
The browser posts credentials to the same-origin `POST /api/auth/login`; the
Next.js server calls Laravel and stores the token in the cookie. The token is
never returned to the browser and never written to `localStorage`.

`GET /api/auth/session` returns the sanitized viewer for client components.
`User.isAdmin` is a UI affordance only - the backend authorizes every admin
request independently.

### Cart

Client-held, server-validated. `localStorage` holds only
`{ productId, variantId, quantity }`. Every price, total and availability comes
from `POST /cart/validate`, and the local cart is replaced with the server's
items on each response so `removedItems` and `adjustments` take effect.
`shipping`/`tax` of `null` render as "Calculated at checkout", never `$0.00`.

### Theming and the design system

`globals.css` holds the design system (Tailwind v4 `@theme`, no
`tailwind.config.js`). It is **Material 3**:

- **Tonal surfaces.** `canvas`, `surface`, `surface-low`, `surface-container`,
  `surface-high` and `surface-highest` are mixed with the live brand colour via
  `color-mix()`, so the neutrals follow the brand instead of being grey.
- **Elevation** is five named levels (`elevation-1` … `elevation-5`,
  `--shadow-level1` … `5`). The legacy `shadow-xs`/`sm`/`md`/`lg`/`xl` names
  are aliases onto them.
- **State layers.** `state-layer` paints `currentColor` over an interactive
  element at 8% hover / 10% focus / 12% press, which is how every button, nav
  item, chip and list row answers input. It sets `position: relative`, so it
  must not be combined with `absolute`/`fixed`/`sticky`.
- **Shape scale** 4 / 8 / 12 / 16 / 28px (`radius-xs` … `radius-xl`). Buttons,
  chips and the search field are pills; cards and sheets use 12-16px.
- **Type scale** `text-display-*`, `text-headline-*`, `text-title-*`,
  `text-body-*`, `text-label-*` - each token carries its own line height,
  tracking and (for title/label) weight, so no `font-*` class is needed with
  them.
- **Components.** `Button` covers the M3 types (`primary` filled, `secondary`
  filled-tonal, `elevated`, `outline`, `ghost` text, plus `fab` /
  `fab-extended` sizes); `Card` has `elevated` / `filled` / `outlined`; text
  fields are filled, with the label kept above the control.
- **Mobile.** `MobileNavBar` is the M3 navigation bar, phones only, hidden on
  checkout and in the admin, and it reserves its own height with a spacer.
  Listing filters open in a bottom sheet (`FilterSheet`) instead of pushing the
  grid down the page.

`ThemeStyle` injects `--brand*` custom properties derived from the admin's
`theme.primaryColor`, validated with `/^#[0-9a-fA-F]{6}$/` and falling back to
`#2563EB`; `--brand-container` / `--brand-on-container` are the M3 tonal pair,
and `deriveBrandTokens` darkens `on-container` until it clears 4.5:1 on the
container for whatever colour is chosen. No gradients anywhere.

## Deployment notes

- This Next.js app deploys to Vercel. The Laravel API needs its own
  PHP-capable host - Vercel does not run a conventional Laravel app.
- `apiBaseUrl` and `canonicalFrontendUrl` are application settings. Saving them
  does not change DNS, TLS, hosting, the Vercel project domain or its
  environment variables, CORS allowlists, cookie domains or payment-provider
  webhook URLs. Each must be updated in its own system.
- Keep `NEXT_PUBLIC_API_BOOTSTRAP_URL` stable, or update it through deployment
  configuration when migrating environments.
