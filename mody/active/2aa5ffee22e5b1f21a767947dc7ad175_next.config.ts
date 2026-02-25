 .import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * Next.js Configuration
 * 
 * Security headers, code protection, and performance optimizations.
 */
const nextConfig: NextConfig = {
  // Enable React strict mode for catching bugs early
  reactStrictMode: true,

  // ============================================
  // BUNDLE OPTIMIZATION
  // ============================================
  // NOTE: lucide-react with Next.js Turbopack already tree-shakes properly
  // No modularizeImports needed - icons are automatically code-split

  // CRITICAL: Disable source maps in production to protect code
  productionBrowserSourceMaps: false,

  // Turbopack config (required for Next.js 16)
  turbopack: {},

  // Use SWC for fast minification (built-in to Next.js)
  // This minifies and mangles variable names

  // Compiler options for additional protection
  compiler: {
    // Remove console.log in production (protects debug info)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,

    // Remove React display names in production (minor obfuscation)
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Skip ESLint and Type Checking during build for faster Vercel deployments
  // We already run these in CI/pre-commit
  typescript: {
    ignoreBuildErrors: true,
  },

  // Security headers - applied to all routes
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent XSS attacks
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control iframe embedding (prevent clickjacking)
          // X-Frame-Options REMOVED to allow external embedding (Phase 8)
          // Refer to CSP frame-ancestors * below
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions policy (formerly Feature Policy)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Allow Firebase popup auth to communicate back
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          // Content Security Policy - only apply in production
          // In development, Firebase reCAPTCHA needs unrestricted access
          ...(process.env.NODE_ENV === "production"
            ? [
              {
                key: "Content-Security-Policy",
                value: [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://apis.google.com https://static.cloudflareinsights.com",
                  "style-src 'self' 'unsafe-inline'",
                  "img-src 'self' data: blob: https:",
                  "font-src 'self' data:",
                  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://www.google.com https://fonts.gstatic.com https://cloudflareinsights.com",
                  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://www.google.com",
                  "frame-ancestors *", // ALLOW EMBEDDING ON EXTERNAL SITES (Required for Chat Widget)
                  "form-action 'self'",
                  "base-uri 'self'",
                ].join("; "),
              },
            ]
            : []),
        ],
      },
      // Cache control for static assets
      // PRODUCTION: Long cache with immutable for performance
      // DEVELOPMENT: No aggressive caching to see changes immediately
      {
        source: "/_next/static/:path*",
        headers: process.env.NODE_ENV === "production"
          ? [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ]
          : [
            {
              key: "Cache-Control",
              value: "no-cache, no-store, must-revalidate", // Note: This impacts dev performance
            },
          ],
      },
    ];
  },

  // Phase 3: Redirect old dashboard to new layout
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/newlayout1/dashboard',
        permanent: false, // Use 307 (temporary) - allows reverting if issues
      },
      {
        source: '/dashboard/:path*',
        destination: '/newlayout1/dashboard/:path*',
        permanent: false,
      },
    ];
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // Experimental features (if needed)
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // ============================================
  // WEBPACK CONFIGURATION FOR ADDITIONAL PROTECTION
  // ============================================
  webpack: (config, { isServer, dev }) => {
    // Only apply in production client builds
    if (!isServer && !dev) {
      // Ensure terser plugin mangles names aggressively
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
 .*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72‚file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/next.config.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version