import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only wrap with Sentry when a DSN is configured — keeps local builds
// fast for contributors who don't have Sentry credentials.
export default sentryDsn
  ? withSentryConfig(nextConfig, {
      // Build-time options
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      // Tunnel client requests through our origin so ad-blockers don't
      // drop browser-side telemetry.
      tunnelRoute: "/monitoring/sentry-tunnel",
      sourcemaps: { disable: false, deleteSourcemapsAfterUpload: true },
      disableLogger: true,
    })
  : nextConfig;
