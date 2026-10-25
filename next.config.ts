import type { NextConfig } from "next";

/**
 * Image hosts are derived from the configured API origins. Product and
 * branding images are served by Laravel (local: /storage/...), so those
 * origins must be allowlisted for next/image optimisation.
 *
 * Only hosts listed in NEXT_PUBLIC_ALLOWED_API_HOSTS are permitted - the same
 * allowlist used to validate the runtime-config apiBaseUrl. This keeps a
 * compromised or misconfigured settings row from turning next/image into an
 * open image proxy.
 */
const allowedHosts = (process.env.NEXT_PUBLIC_ALLOWED_API_HOSTS ?? "127.0.0.1,localhost")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Surface type errors at build time instead of shipping past them.
  // Next 16 no longer accepts an `eslint` key here; linting runs through the
  // `lint` script instead.
  typescript: { ignoreBuildErrors: false },

  // Do not advertise the framework version.
  poweredByHeader: false,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  images: {
    remotePatterns: allowedHosts.flatMap((hostname) => [
      { protocol: "http" as const, hostname, port: "8000", pathname: "/storage/**" },
      { protocol: "https" as const, hostname, pathname: "/storage/**" },
    ]),

    // Next 16 refuses to let the image optimiser fetch a host that resolves to
    // a private IP, as SSRF protection. Locally the Laravel API is on
    // 127.0.0.1:8000, so without this every product, category and avatar image
    // fails with "hostname resolved to private IP".
    //
    // Development only. In production the API is a public host, the optimiser
    // has no reason to reach a private address, and leaving this on would let a
    // misconfigured remotePattern probe the internal network.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    // Sizes that match the storefront grid breakpoints.
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 96, 128, 192, 256, 384],
    formats: ["image/webp"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
