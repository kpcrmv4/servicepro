/**
 * Server-side Sentry initialization. Only activates when SENTRY_DSN
 * is set — production deployments inject it via Vercel env vars.
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Server runtime only — browser SDK handles user-side replays.
    integrations: [],
  });
}
