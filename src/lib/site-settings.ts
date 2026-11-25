import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Réglages du site (table site_settings, migration_site_settings.sql).
 *
 * Visibilité du jeu "Grille Mystère" : interrupteur dans /grille-admin. Jeu masqué = plus aucun
 * lien, /grille et /grilles redirigent vers l'accueil, paiement refusé, rotation et posts arrêtés.
 * En cas d'erreur ou de réglage absent, le jeu est considéré MASQUÉ (jeu payant : prudence).
 */
export const SITE_SETTINGS_TAG = 'site-settings';

async function readGrilleVisible(): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from('site_settings')
    .select('value')
    .eq('key', 'grille_visible')
    .maybeSingle();
  if (error) throw error; // une erreur n'est jamais mise en cache
  return data?.value === true;
}

const cachedGrilleVisible = unstable_cache(readGrilleVisible, ['grille-visible'], {
  tags: [SITE_SETTINGS_TAG],
  // Pas de durée : le layout racine lit ce réglage, une durée forcerait TOUTES les pages statiques à
  // se régénérer à ce rythme. Seul l'interrupteur (revalidateTag) invalide la valeur.
  revalidate: false,
});

/** Pour les pages et le menu : mis en cache, invalidé quand l'admin change l'interrupteur. */
export async function isGrilleVisible(): Promise<boolean> {
  try { return await cachedGrilleVisible(); } catch { return false; }
}

/** Pour le paiement et les crons : lecture directe, jamais de cache. */
export async function isGrilleVisibleNow(): Promise<boolean> {
  try { return await readGrilleVisible(); } catch { return false; }
}

async function readNoelEnabled(): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from('site_settings')
    .select('value')
    .eq('key', 'noel_enabled')
    .maybeSingle();
  if (error) throw error;
  return data?.value !== false; // activé par défaut, la période fait le reste (src/lib/noel.ts)
}

const cachedNoelEnabled = unstable_cache(readNoelEnabled, ['noel-enabled'], { tags: [SITE_SETTINGS_TAG], revalidate: false });

/** Décorations de Noël autorisées (interrupteur du dashboard). */
export async function isNoelEnabled(): Promise<boolean> {
  try { return await cachedNoelEnabled(); } catch { return false; }
}

export async function setNoelEnabled(enabled: boolean): Promise<void> {
  const { error } = await createAdminClient()
    .from('site_settings')
    .upsert({ key: 'noel_enabled', value: enabled, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function setGrilleVisible(visible: boolean): Promise<void> {
  const { error } = await createAdminClient()
    .from('site_settings')
    .upsert({ key: 'grille_visible', value: visible, updated_at: new Date().toISOString() });
  if (error) throw error;
}
