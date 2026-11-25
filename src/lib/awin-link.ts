/**
 * Liens profonds Awin (cread.php + ued), au format exact du "Générateur de liens" Awin.
 * Vérifié le 25/11/2026 dans le compte de Thomas pour 68696, 68698, 59149 et 12878.
 *
 * C'est Awin qui crée l'identifiant de clic (awc) pendant la redirection. Ne JAMAIS fabriquer
 * un awc ni un sscid : il ne correspond à aucun clic enregistré (commission perdue, et risque
 * d'être vu comme de faux clics). C'est ce que faisaient /soutenir et "Ajouter URL" avant.
 *
 * Utilisable côté client : aucun secret ici, tous ces identifiants sont publics.
 */
const AWIN_PUBLISHER_ID = '2885973';

export interface AwinMerchant {
  awinmid: string;
  /** Nom du marchand dans product_offers.merchant_name */
  merchantName: string;
  label: string;
  domain: string;
}

export const AWIN_MERCHANTS: AwinMerchant[] = [
  { awinmid: '68696', merchantName: 'Maxi Zoo BE', label: 'Maxi Zoo Belgique', domain: 'maxizoo.be' },
  { awinmid: '68698', merchantName: 'Maxi Zoo FR', label: 'Maxi Zoo France', domain: 'maxizoo.fr' },
  { awinmid: '59149', merchantName: 'Tuft & Paw', label: 'Tuft & Paw', domain: 'tuftandpaw.com' },
  { awinmid: '12878', merchantName: 'Zooplus BE', label: 'Zooplus Belgique', domain: 'zooplus.be' },
  { awinmid: '30279', merchantName: 'Dogfy Diet', label: 'Dogfy Diet', domain: 'dogfydiet.com' },
];

/** Domaine exact ou sous-domaine ("maxizoo.be.exemple.com" ne correspond pas). */
export function findAwinMerchant(rawUrl: string): AwinMerchant | null {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const host = u.hostname.toLowerCase();
    return AWIN_MERCHANTS.find(m => host === m.domain || host.endsWith(`.${m.domain}`)) ?? null;
  } catch {
    return null;
  }
}

const TRACKING_PARAM = /^(utm_|awc$|sscid$|sv1$|sv_campaign_id$|gclid$|fbclid$|msclkid$)/i;

/** Adresse du produit sans paramètres de suivi (ceux qui choisissent une variante sont gardés). */
export function cleanProductUrl(rawUrl: string): string {
  const u = new URL(rawUrl);
  for (const key of [...u.searchParams.keys()]) if (TRACKING_PARAM.test(key)) u.searchParams.delete(key);
  // Restes d'un ancien lien pclick.php recopiés dans l'adresse du marchand (p, a, m)
  if (u.searchParams.get('a') === AWIN_PUBLISHER_ID) for (const key of ['p', 'a', 'm']) u.searchParams.delete(key);
  u.hash = '';
  return u.toString();
}

export function buildAwinDeepLink(rawUrl: string): { url: string; merchant: AwinMerchant } | null {
  const merchant = findAwinMerchant(rawUrl);
  if (!merchant) return null;
  const ued = encodeURIComponent(cleanProductUrl(rawUrl));
  return { url: `https://www.awin1.com/cread.php?awinmid=${merchant.awinmid}&awinaffid=${AWIN_PUBLISHER_ID}&ued=${ued}`, merchant };
}
