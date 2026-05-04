import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kpservicepro.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Customer-facing surfaces are indexed (storefront, landing).
        // Internal staff & API surfaces are not.
        disallow: [
          '/dashboard',
          '/super-admin',
          '/api',
          '/auth',
          '/inspect',
          '/c/track',
          '/c/quotation',
          '/liff',
          '/monitoring',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
