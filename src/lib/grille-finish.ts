import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail, sendBulkNewsletter } from '@/lib/resend';

const PRIZE_CAPS = [10000, 5000, 2500]; // 100€ / 50€ / 25€ en cents

export interface Winner {
  rang: number;
  prenom: string;
  email: string;
  raison: string;
  montantCents: number;
}

interface GrilleRow {
  id: string;
  animal: string;
  race_secrete: string;
  grille_taille: number;
  gagnant_devinette_id: string | null;
  created_at: string;
  ends_at: string | null;
}

/** Calcule les montants financiers + les 3 gagnants d'une grille. */
export async function computeGrilleResults(supabase: SupabaseClient, grille: GrilleRow) {
  const { data: achats } = await supabase
    .from('pixel_achats')
    .select('id, acheteur_prenom, acheteur_email, positions, montant_cents, devinette, devinette_correcte, created_at')
    .eq('grille_id', grille.id)
    .not('confirmed_at', 'is', null);

  const rows = achats ?? [];
  const brutCents = rows.reduce((s, r) => s + r.montant_cents, 0);
  const stripeCents = Math.round(brutCents * 0.015 + rows.length * 25);
  const netCents = brutCents - stripeCents;
  const taPartCents = Math.round(netCents * 0.4);
  const cagnotteCents = Math.round(taPartCents * 0.25);
  const cadeaux = [
    Math.min(Math.round(cagnotteCents * 0.5), PRIZE_CAPS[0]),
    Math.min(Math.round(cagnotteCents * 0.3), PRIZE_CAPS[1]),
    Math.min(Math.round(cagnotteCents * 0.2), PRIZE_CAPS[2]),
  ];

  // Classement par acheteur (email) selon le nombre de pixels
  const buyerMap = new Map<string, { prenom: string; email: string; pixels: number }>();
  rows.forEach(r => {
    const cur = buyerMap.get(r.acheteur_email) ?? { prenom: r.acheteur_prenom, email: r.acheteur_email, pixels: 0 };
    cur.pixels += (r.positions as number[]).length;
    buyerMap.set(r.acheteur_email, cur);
  });
  const classement = Array.from(buyerMap.values()).sort((a, b) => b.pixels - a.pixels);

  const gagnantDevinette = grille.gagnant_devinette_id
    ? rows.find(r => r.id === grille.gagnant_devinette_id) ?? null
    : null;

  const winners: Winner[] = [];
  const used = new Set<string>();
  if (gagnantDevinette) {
    winners.push({ rang: 1, prenom: gagnantDevinette.acheteur_prenom, email: gagnantDevinette.acheteur_email, raison: 'A trouvé la race', montantCents: cadeaux[0] });
    used.add(gagnantDevinette.acheteur_email);
  } else if (classement[0]) {
    winners.push({ rang: 1, prenom: classement[0].prenom, email: classement[0].email, raison: 'Plus gros acheteur', montantCents: cadeaux[0] });
    used.add(classement[0].email);
  }
  const restants = classement.filter(b => !used.has(b.email));
  if (restants[0]) winners.push({ rang: 2, prenom: restants[0].prenom, email: restants[0].email, raison: 'Top acheteur', montantCents: cadeaux[1] });
  if (restants[1]) winners.push({ rang: 3, prenom: restants[1].prenom, email: restants[1].email, raison: 'Top acheteur', montantCents: cadeaux[2] });

  return { rows, brutCents, stripeCents, netCents, taPartCents, cagnotteCents, cadeaux, classement, winners };
}

/** Génère le CSV des achats et l'uploade dans le bucket Supabase `grille-backups`. */
async function backupCSV(supabase: SupabaseClient, grille: GrilleRow, rows: Array<{ acheteur_prenom: string; acheteur_email: string; positions: number[]; montant_cents: number; devinette: string | null; devinette_correcte: boolean; created_at: string }>) {
  const SEP = ';';
  const header = ['Prénom', 'Email', 'Pixels', 'Montant (€)', 'Devinette', 'Correcte', 'Date'];
  const lines = rows.map(r => [
    r.acheteur_prenom, r.acheteur_email, String(r.positions.length),
    (r.montant_cents / 100).toFixed(2).replace('.', ','),
    r.devinette ?? '', r.devinette_correcte ? 'oui' : '',
    new Date(r.created_at).toLocaleString('fr-BE'),
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(SEP));
  const csv = '﻿' + [header.join(SEP), ...lines].join('\n');
  const date = new Date().toISOString().slice(0, 10);
  const path = `grille-${grille.animal}-${date}-${grille.id.slice(0, 8)}.csv`;
  try {
    await supabase.storage.from('grille-backups').upload(path, new Blob([csv], { type: 'text/csv' }), { upsert: true });
  } catch (e) {
    console.error('[grille-finish] backup CSV échoué:', e);
  }
}

function euro(cents: number) {
  return (cents / 100).toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' });
}

/**
 * Termine une grille active : calcule les gagnants, fixe les dates,
 * sauvegarde le CSV, envoie les emails. Idempotent (ne fait rien si déjà completed).
 * @param reason 'guessed' (race trouvée) | 'countdown' (3 mois écoulés)
 */
export async function finishGrille(supabase: SupabaseClient, grilleId: string, reason: 'guessed' | 'countdown') {
  const { data: grille } = await supabase
    .from('pixel_grilles')
    .select('id, animal, race_secrete, grille_taille, gagnant_devinette_id, statut, created_at, ends_at')
    .eq('id', grilleId)
    .single();

  if (!grille || grille.statut !== 'active') return null; // déjà terminée ou inexistante

  const endedAt = reason === 'guessed' ? new Date() : (grille.ends_at ? new Date(grille.ends_at) : new Date());
  const nextStartsAt = new Date(endedAt.getTime() + 7 * 86400000);

  const results = await computeGrilleResults(supabase, grille);

  // Marque la grille terminée
  await supabase.from('pixel_grilles').update({
    statut: 'completed',
    ends_at: endedAt.toISOString(),
    next_starts_at: nextStartsAt.toISOString(),
  }).eq('id', grilleId);

  // Backup CSV
  await backupCSV(supabase, grille, results.rows);

  // ── Emails ────────────────────────────────────────────
  const dateProchaine = nextStartsAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const podiumHtml = results.winners.map(w =>
    `<p style="margin:6px 0;color:#374151"><strong>${['🥇','🥈','🥉'][w.rang - 1]} ${w.prenom}</strong> - ${w.raison}</p>`
  ).join('');

  // 1) Annonce à tous les participants + abonnés newsletter (sans montants)
  try {
    const { data: subs } = await supabase.from('newsletter_subscribers').select('email').eq('status', 'active');
    const emails = new Set<string>((subs ?? []).map((s: { email: string }) => s.email.toLowerCase().trim()));
    results.rows.forEach(r => emails.add(r.acheteur_email.toLowerCase().trim()));
    if (emails.size > 0) {
      const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
        <h1 style="color:#1f2937">La Grille Mystère est terminée ! 🎉</h1>
        <p style="color:#374151">L'image a été révélée et la race était <strong>${grille.race_secrete}</strong>.</p>
        <h2 style="color:#ea580c;font-size:16px">Les gagnants</h2>
        ${podiumHtml}
        <p style="color:#374151;margin-top:16px">Une nouvelle grille démarre le <strong>${dateProchaine}</strong> avec un nouvel animal mystère.</p>
        <p style="margin-top:20px"><a href="https://www.mespoilus.com/grille" style="background:#ea580c;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Voir la grille</a></p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px"><a href="{{UNSUBSCRIBE_URL}}" style="color:#9ca3af">Se désinscrire</a></p>
      </div>`;
      await sendBulkNewsletter({ subject: '🎉 La Grille Mystère est terminée - découvrez les gagnants', html, subscribers: Array.from(emails) });
    }
  } catch (e) { console.error('[grille-finish] email annonce échoué:', e); }

  // 2) Email aux gagnants (SANS le montant)
  for (const w of results.winners) {
    try {
      await sendEmail({
        to: w.email,
        subject: '🏆 Félicitations, vous avez gagné à la Grille Mystère !',
        html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
          <h1 style="color:#1f2937">Félicitations ${w.prenom} ! 🏆</h1>
          <p style="color:#374151">Vous faites partie des <strong>gagnants</strong> de la Grille Mystère (${w.raison.toLowerCase()}).</p>
          <p style="color:#374151">Nous vous recontacterons très vite à cette adresse pour vous remettre votre cadeau surprise. 🎁</p>
          <p style="color:#374151;margin-top:16px">Merci d'avoir participé et soutenu un refuge animalier par la même occasion. ❤️</p>
        </div>`,
      });
    } catch (e) { console.error('[grille-finish] email gagnant échoué:', e); }
  }

  // 3) Email admin (récap complet avec montants)
  try {
    const adminRows = results.winners.map(w =>
      `<tr><td style="padding:4px 8px">${['🥇','🥈','🥉'][w.rang - 1]} ${w.prenom}</td><td style="padding:4px 8px">${w.email}</td><td style="padding:4px 8px">${euro(w.montantCents)}</td><td style="padding:4px 8px">${w.raison}</td></tr>`
    ).join('');
    await sendEmail({
      to: process.env.ADMIN_EMAIL ?? 'contact@mespoilus.com',
      subject: `[Grille] Terminée (${reason === 'guessed' ? 'race trouvée' : 'compte à rebours'}) - ${grille.animal}`,
      html: `<div style="font-family:system-ui,sans-serif">
        <h2>Grille terminée : ${grille.animal} (${grille.race_secrete})</h2>
        <p>Raison : <strong>${reason === 'guessed' ? 'Race devinée' : 'Compte à rebours écoulé'}</strong></p>
        <p>Total collecté : <strong>${euro(results.brutCents)}</strong> · Net : ${euro(results.netCents)} · Ta part : ${euro(results.taPartCents)} · Cagnotte cadeaux : ${euro(results.cagnotteCents)}</p>
        <p>Prochaine grille le : <strong>${dateProchaine}</strong></p>
        <table style="border-collapse:collapse;margin-top:8px"><tr><th style="padding:4px 8px;text-align:left">Gagnant</th><th style="padding:4px 8px;text-align:left">Email</th><th style="padding:4px 8px;text-align:left">Cadeau</th><th style="padding:4px 8px;text-align:left">Raison</th></tr>${adminRows}</table>
        <p style="color:#6b7280;font-size:12px;margin-top:12px">CSV des achats sauvegardé dans le bucket grille-backups.</p>
      </div>`,
    });
  } catch (e) { console.error('[grille-finish] email admin échoué:', e); }

  // 4) Article de blog de bilan (catégorie general, SANS nombre de pixels)
  await publishGrilleArticle(supabase, grille, results.winners).catch(() => {});

  return results.winners;
}

/** Publie un article de bilan dans le blog (catégorie general). Aucun nombre de pixels révélé. */
async function publishGrilleArticle(
  supabase: SupabaseClient,
  grille: { id: string; animal: string; race_secrete: string },
  winners: Winner[],
) {
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const slugDate = new Date().toISOString().slice(0, 10);
  const slug = `grille-mystere-${grille.animal}-${slugDate}-${grille.id.slice(0, 6)}`
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const imageUrl = `https://www.mespoilus.com/api/grille/${grille.id}/image`;

  const podium = winners.map(w => `- ${['🥇', '🥈', '🥉'][w.rang - 1]} **${w.prenom}** - ${w.raison}`).join('\n');

  const content = `![Grille Mystère révélée](${imageUrl})

La **Grille Mystère** de Mes Poilus est terminée ! Après plusieurs jours de suspense, l'image cachée derrière les pixels a enfin été dévoilée : il s'agissait d'un **${grille.race_secrete}**. 🐾

## Les gagnants

${podium || "Pas de participant cette fois - la prochaine sera la bonne !"}

Un grand merci à toutes les personnes qui ont participé. Une partie des recettes de cette grille est reversée à un refuge animalier. ❤️

## Une nouvelle grille arrive bientôt

Un nouvel animal mystère se cache déjà derrière une nouvelle grille. Sauras-tu deviner sa race avant tout le monde ? [Joue dès maintenant](/grille) et tente de remporter un cadeau surprise !`;

  await supabase.from('articles').upsert({
    title: `Grille Mystère terminée : c'était un ${grille.race_secrete} !`,
    slug,
    content,
    excerpt: `L'animal caché derrière la grille de pixels était un ${grille.race_secrete}. Découvrez les gagnants et participez à la prochaine grille !`,
    category: 'general',
    categories: ['general'],
    seo_keywords: ['grille mystère', 'mes poilus', grille.race_secrete.toLowerCase(), 'jeu animaux'],
    meta_description: `La Grille Mystère est terminée : c'était un ${grille.race_secrete}. Voici les gagnants et la prochaine grille à venir.`,
    reading_time: 2,
    image_url: imageUrl,
    status: 'published',
    published_at: new Date().toISOString(),
  }, { onConflict: 'slug' });

  console.log(`[grille-finish] Article de bilan publié (${dateStr})`);
}

/**
 * Active la prochaine grille `scheduled` si la phase de résultats (7j) est passée
 * et qu'aucune grille n'est active. Retourne l'id activé ou null.
 */
export async function activateNextGrille(supabase: SupabaseClient): Promise<string | null> {
  const { data: active } = await supabase
    .from('pixel_grilles').select('id').eq('statut', 'active').limit(1).maybeSingle();
  if (active) return null; // une grille est déjà active

  // La dernière grille terminée doit avoir dépassé sa date next_starts_at
  const { data: lastCompleted } = await supabase
    .from('pixel_grilles')
    .select('id, next_starts_at')
    .eq('statut', 'completed')
    .order('ends_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastCompleted?.next_starts_at && new Date(lastCompleted.next_starts_at) > new Date()) {
    return null; // encore dans la phase de 7 jours
  }

  // Prochaine grille programmée (plus petit ordre)
  const { data: next } = await supabase
    .from('pixel_grilles')
    .select('id, grille_taille')
    .eq('statut', 'scheduled')
    .order('ordre', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!next) return null;

  // La grille devient active mais le compte à rebours ne démarre qu'au 1er achat
  // (starts_at / ends_at restent NULL jusqu'à la première vente - voir webhook).
  await supabase.from('pixel_grilles').update({
    statut: 'active',
    starts_at: null,
    ends_at: null,
  }).eq('id', next.id);

  // ── Email de lancement : abonnés newsletter + anciens participants ──────────
  try {
    const emails = new Set<string>();
    const { data: subs } = await supabase.from('newsletter_subscribers').select('email').eq('status', 'active');
    (subs ?? []).forEach((s: { email: string }) => emails.add(s.email.toLowerCase().trim()));
    const { data: players } = await supabase.from('pixel_achats').select('acheteur_email').not('confirmed_at', 'is', null);
    (players ?? []).forEach((p: { acheteur_email: string }) => emails.add(p.acheteur_email.toLowerCase().trim()));

    if (emails.size > 0) {
      const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
        <h1 style="color:#1f2937">Une nouvelle Grille Mystère vient de commencer ! 🎉</h1>
        <p style="color:#374151">Un nouvel animal mystère se cache derrière la grille de pixels. À toi de le révéler et de deviner sa race en premier pour gagner !</p>
        <p style="color:#374151">3 cadeaux à remporter, et une partie des recettes est reversée à un refuge animalier ou une association.</p>
        <p style="color:#374151">Le compte à rebours de 90 jours démarre dès le premier pixel acheté. Plus tu joues tôt, plus tu as de chances.</p>
        <p style="margin-top:20px"><a href="https://www.mespoilus.com/grille" style="background:#ea580c;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Jouer maintenant</a></p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px"><a href="{{UNSUBSCRIBE_URL}}" style="color:#9ca3af">Se désinscrire</a></p>
      </div>`;
      await sendBulkNewsletter({ subject: '🎉 Nouvelle Grille Mystère - à toi de jouer !', html, subscribers: Array.from(emails) });
    }
  } catch (e) { console.error('[grille-finish] email lancement échoué:', e); }

  return next.id;
}
