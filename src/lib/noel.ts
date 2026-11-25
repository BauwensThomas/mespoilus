/**
 * Période des fêtes (25/11/2026) : décorations et articles de Noël, chaque année du 25 novembre
 * au 10 janvier inclus, heure belge. Après cette date tout disparaît seul ; les articles restent.
 * Utilisable côté client et côté serveur.
 */
function brusselsMonthDay(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
  return get('month') * 100 + get('day');
}

/** Du 25 novembre au 10 janvier inclus. */
export function isNoelSeason(date = new Date()): boolean {
  const md = brusselsMonthDay(date);
  return md >= 1125 || md <= 110;
}

/** Idées cadeaux : du 25 novembre au 25 décembre inclus. */
export function isGiftSeason(date = new Date()): boolean {
  const md = brusselsMonthDay(date);
  return md >= 1125 && md <= 1225;
}

/** Angle de l'article hebdomadaire des fêtes, selon la date. */
export function noelTheme(date = new Date()): string {
  const md = brusselsMonthDay(date);
  if (md >= 1125 && md <= 1225) return 'NOËL (sapin et décorations, aliments de fête dangereux, cadeaux adaptés, calendrier de l\'Avent, invités et bruit, garde pendant les vacances)';
  if (md >= 1226 && md <= 1231) return 'LE RÉVEILLON DU NOUVEL AN (feux d\'artifice et pétards, stress, fugue, restes de repas, musique et invités)';
  return 'L\'APRÈS-FÊTES (galette des rois et fève, retrait du sapin, reprise du poids et des habitudes, rangement des décorations, retour au calme)';
}
