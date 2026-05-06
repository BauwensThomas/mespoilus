import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mespoilus.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/blog', '/blog/'],
        disallow: ['/', '/agents/', '/orchestrate/', '/api/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
