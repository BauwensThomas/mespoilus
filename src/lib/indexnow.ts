// IndexNow : notifie instantanément Bing/Yandex qu'une URL a été ajoutée ou mise à jour.
// Clé de vérification hébergée à https://www.mespoilus.com/<KEY>.txt (dossier public/).
// Recommandation Bing Webmaster Tools (18/06/2026).

const INDEXNOW_KEY = 'ca8aaba288857f4b487a4944227d8234';
const HOST = 'www.mespoilus.com';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

/**
 * Soumet une ou plusieurs URLs à IndexNow (Bing + Yandex via l'endpoint partagé).
 * Non bloquant : les erreurs sont loguées, jamais propagées (ne doit pas casser un cron).
 */
export async function pingIndexNow(urls: string | string[]): Promise<void> {
  const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  if (urlList.length === 0) return;

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList,
      }),
    });
    // 200 = OK, 202 = accepté (en cours de validation). Tout autre code → log.
    if (res.status !== 200 && res.status !== 202) {
      console.warn(`[indexnow] HTTP ${res.status} pour ${urlList.length} URL(s)`);
    } else {
      console.log(`[indexnow] ${urlList.length} URL(s) soumise(s) (HTTP ${res.status})`);
    }
  } catch (e) {
    console.warn('[indexnow] échec ping:', e instanceof Error ? e.message : String(e));
  }
}
