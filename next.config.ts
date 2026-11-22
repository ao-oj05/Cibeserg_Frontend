import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const isVercelDeployment =
  process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "development";
const isVercelProduction =
  process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
const apiInternalUrl = process.env.API_INTERNAL_URL?.trim();

if (!apiInternalUrl) {
  throw new Error("Falta configurar la variable de servidor API_INTERNAL_URL.");
}

let apiOrigin: string;

try {
  const parsedUrl = new URL(apiInternalUrl);
  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error();
  }
  if (isVercelDeployment && parsedUrl.protocol !== "https:") {
    throw new Error("API_INTERNAL_URL debe usar HTTPS en producción.");
  }
  apiOrigin = parsedUrl.origin;
} catch (error) {
  if (error instanceof Error && error.message.includes("HTTPS")) {
    throw error;
  }
  throw new Error(
    "API_INTERNAL_URL debe ser el origen HTTP(S) del backend, sin credenciales, ruta, query ni fragmento.",
  );
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  ...(isProduction
    ? [
        "connect-src 'self'",
        ...(isVercelDeployment ? ["upgrade-insecure-requests"] : []),
      ]
    : ["connect-src 'self' ws: wss:"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    proxyClientMaxBodySize: "64kb",
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      ...(isVercelProduction
        ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
        : []),
    ];

    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
