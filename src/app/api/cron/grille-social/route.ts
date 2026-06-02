import { NextResponse } from 'next/server';
import { runAgent } from '@/lib/anthropic';
import { getAgent } from '@/lib/agents/config';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const globalStart = Date.now();
  const supabase = createAdminClient();

  // Grille active
  const { data: grille } = await supabase
    .from('pixel_grilles')
    .select('id, animal, grille_taille, gagnant_devinette_id, created_at, ends_at')
    .eq('statut', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!grille) {
    return NextResponse.json({ success: false, reason: 'no_active_grille' });
  }

  // Achats confirmés → pixels vendus + acheteurs uniques
  const { data: achats } = await supabase
    .from('pixel_achats')
    .select('acheteur_email, positions')
    .eq('grille_id', grille.id)
    .not('confirmed_at', 'is', null);

  const totalPixels = grille.grille_taille * grille.grille_taille;
  let pixelsVendus = 0;
  const buyers = new Set<string>();
  achats?.forEach(a => {
    pixelsVendus += (a.positions as number[]).length;
    buyers.add(a.acheteur_email);
  });
  const pourcentageExact = (pixelsVendus / totalPixels) * 100;
  const pourcentage = pourcentageExact < 1 && pixelsVendus > 0
    ? pourcentageExact.toFixed(2).replace('.', ',')
    : String(Math.round(pourcentageExact));
  const pixelsRestants = totalPixels - pixelsVendus;

  // Compte à rebours : démarre au 1er achat (ends_at NULL = pas encore commencé)
  const compteARebours = grille.ends_at
    ? `Il reste ${Math.max(0, Math.ceil((new Date(grille.ends_at).getTime() - Date.now()) / 86400000))} jours (fin le ${new Date(grille.ends_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })})`
    : `Le compte à rebours de 90 jours démarre dès le 1er pixel acheté`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mespoilus.com';
  const imageUrl = `${baseUrl}/api/grille/${grille.id}/image?fmt=jpg&v=${Date.now()}`;
  const grilleUrl = `${baseUrl}/grille`;

  const emma = getAgent('emma');
  const prompt = `Crée un post Facebook et Instagram intrigant pour le jeu "Grille Mystère" de Mes Poilus.

Concept : un animal mystère est caché derrière une grille de pixels. Les gens achètent des pixels qui se révèlent aléatoirement et dévoilent peu à peu la photo. Le premier qui devine la race gagne le 1er cadeau, les 2 plus gros acheteurs gagnent les 2 autres. Une partie des recettes est reversée à un refuge animalier ou une association.

État actuel de la grille (à intégrer naturellement dans le post) :
- ${pourcentage}% de l'image déjà révélée (${pixelsRestants} pixels encore à découvrir)
- ${buyers.size} participant${buyers.size > 1 ? 's' : ''} pour l'instant
- ${compteARebours}

⚠️ RÈGLE ABSOLUE : l'animal et sa race sont SECRETS. Ne donne AUCUN indice sur son identité — ne mentionne jamais "quatre pattes", "félin", "canin", "oreilles", "museau", une couleur, une taille, ni quoi que ce soit qui pourrait aider à deviner. Reste totalement vague ("un animal mystère", "une surprise à plumes ou à poils…" est interdit aussi). Le mystère doit rester entier.

Consignes :
- Ton intrigant et joueur, donne envie de participer avant les autres
- Crée un sentiment d'urgence (compte à rebours, pixels qui partent)
- Inclure ce lien EXACT à la fin : ${grilleUrl}
- Ajoute des hashtags pertinents (#MesPoilus #GrilleMystère #Animaux …)`;

  let emmaContent = '';
  let totalTokens = 0;
  try {
    const { content, inputTokens, outputTokens } = await runAgent(
      emma.systemPrompt, prompt, emma.model, emma.maxTokens ?? 3000
    );
    emmaContent = content.trim();
    totalTokens = inputTokens + outputTokens;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur runAgent';
    await supabase.from('activity_logs').insert({
      agent_id: 'emma', agent_name: 'Emma',
      action: `[Grille social] Erreur: ${msg}`,
      status: 'error', duration_ms: Date.now() - globalStart, details: {},
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const hashtags = (emmaContent.match(/#[\wÀ-ɏ]+/g) ?? []);
  const cleanContent = emmaContent.replace(/#[\wÀ-ɏ]+/g, '').replace(/\n{3,}/g, '\n\n').trim();

  // Sauvegarde brouillons
  for (const platform of ['facebook', 'instagram']) {
    await supabase.from('social_posts').insert({
      content: emmaContent, platform, hashtags, status: 'draft', image_url: imageUrl,
    });
  }

  // Envoi Make.com avec l'image actuelle de la grille (JPEG)
  const makeUrl = process.env.MAKE_WEBHOOK_URL;
  if (makeUrl) {
    try {
      await fetch(makeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cleanContent, hashtags: hashtags.join(' '), image_url: imageUrl }),
        signal: AbortSignal.timeout(5000),
      });
    } catch { /* non-bloquant */ }
  }

  const duration = Date.now() - globalStart;
  await supabase.from('activity_logs').insert({
    agent_id: 'emma', agent_name: 'Emma',
    action: `[Grille social] Post publié (${pourcentage}% révélé, ${buyers.size} participants)`,
    status: 'success', duration_ms: duration,
    details: { pourcentage, participants: buyers.size, tokens: totalTokens },
    tokens_used: totalTokens,
  });

  await supabase.from('agent_stats').upsert({
    agent_id: 'emma', total_tasks: 1, successful_tasks: 1, last_active: new Date().toISOString(),
  }, { onConflict: 'agent_id', ignoreDuplicates: false });

  return NextResponse.json({ success: true, pourcentage, participants: buyers.size, image_url: imageUrl, duration_ms: duration });
}
