import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static HTML export for Quick deployment
  output: "export",

  // Output directory for Quick deployment
  distDir: "dist",

  // Add trailing slashes for better static routing
  trailingSlash: false,

  // Skip validation for dynamic params in static export
  // This allows client-side dynamic routes
  skipTrailingSlashRedirect: false,

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  images: {
    // Required for static export - disables Next.js Image Optimization API
    unoptimized: true,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.quick.shopify.io",
      },
    ],
  },
};

export default nextConfig;
