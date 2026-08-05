import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mespoilus.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/agents/', '/orchestrate/', '/adoption-admin/', '/blog-admin/', '/races-admin/', '/produits-admin/', '/boutique-v2-admin/', '/guides-admin/', '/grille-admin/', '/partenaires-admin/', '/outreach-admin/', '/abonnes-admin/', '/avis-admin/', '/qrcode-admin/', '/seo-admin/', '/api/', '/login'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
