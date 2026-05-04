/**
 * Sentry — initializes only when SENTRY_DSN is set, so it's safe to
 * leave the SDK installed in environments that don't use Sentry.
 *
 * This file is loaded by Next.js for client-side instrumentation.
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    // Lower sample rates in production to control quota.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    ignoreErrors: [
      // Common noise — auth refresh failures during route transitions
      'Auth session missing',
      'NetworkError',
      // Browser extensions
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
    ],
  });
}
