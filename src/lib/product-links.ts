import { createAdminClient } from '@/lib/supabase/server';

/**
 * Liens produits Awin écrits dans les articles par Marie (cron blog) : le texte de l'article
 * n'est jamais modifié, mais chaque lien est vérifié AU MOMENT DE L'AFFICHAGE contre la
 * boutique (catalog_best_offer = produits actifs, en stock, prix > 0).
 *
 * - Produit toujours disponible : lien vers sa meilleure offre actuelle (peut avoir changé
 *   de marchand ou de prix depuis l'écriture de l'article).
 * - Produit retiré, en rupture, ou lien inconnu de la boutique : le lien envoie vers la
 *   boutique filtrée sur la catégorie de l'article, au lieu d'une page marchand morte.
 *
 * Les liens de programmes partenaires (awin1.com/cread.php, ex. Dogfy Diet) ne sont pas des
 * produits du catalogue et restent tels quels. En cas d'erreur Supabase, le HTML est rendu
 * inchangé (fail-safe).
 */

const SHOP_CATEGORIES = new Set(['chiens', 'chats', 'oiseaux', 'rongeurs', 'reptiles']);
const PCLICK_HREF = /href="(https?:\/\/www\.awin1\.com\/pclick\.php[^"]*)"/gi;

const decode = (s: string) => s.replace(/&amp;/g, '&');

export async function refreshProductLinks(html: string, category: string): Promise<string> {
  const urls = [...new Set([...html.matchAll(PCLICK_HREF)].map(m => decode(m[1])))];
  if (!urls.length) return html;

  try {
    const sb = createAdminClient();
    const { data: offers, error: e1 } = await sb
      .from('product_offers')
      .select('affiliate_url, catalog_id')
      .in('affiliate_url', urls);
    if (e1) throw e1;
    const catalogOf = new Map((offers ?? []).map(o => [o.affiliate_url as string, o.catalog_id as string]));

    const ids = [...new Set(catalogOf.values())];
    const bestOf = new Map<string, string>();
    if (ids.length) {
      const { data: best, error: e2 } = await sb
        .from('catalog_best_offer')
        .select('catalog_id, affiliate_url')
        .in('catalog_id', ids);
      if (e2) throw e2;
      for (const b of best ?? []) bestOf.set(b.catalog_id as string, b.affiliate_url as string);
    }

    const shopFallback = SHOP_CATEGORIES.has(category) ? `/boutique?category=${category}` : '/boutique';
    return html.replace(PCLICK_HREF, (_, href: string) => {
      const id = catalogOf.get(decode(href));
      const current = id ? bestOf.get(id) : undefined;
      // & laissé brut comme le fait marked (valide en HTML5)
      return `href="${current ?? shopFallback}"`;
    });
  } catch {
    return html;
  }
}
