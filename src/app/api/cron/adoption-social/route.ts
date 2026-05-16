import { NextResponse } from 'next/server';
import { runAgent } from '@/lib/anthropic';
import { getAgent } from '@/lib/agents/config';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ANIMAL_LABEL: Record<string, string> = {
  chien: 'Chien', chat: 'Chat', oiseau: 'Oiseau',
  rongeur: 'Rongeur', reptile: 'Reptile', autre: 'Animal',
};

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const globalStart = Date.now();
  const supabase = createAdminClient();

  // Récupère jusqu'à 3 annonces approuvées récentes avec photos
  const { data: posts } = await supabase
    .from('adoption_posts')
    .select('id, animal_type, breed, age, gender, region, description, photo_urls')
    .eq('status', 'approved')
    .not('photo_urls', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3);

  // Abandon si aucune annonce — pas de post vide
  if (!posts || posts.length === 0) {
    console.log('[Cron adoption-social] Aucune annonce approuvée, abandon.');
    return NextResponse.json({ success: false, reason: 'no_approved_posts' });
  }

  // Construit les fiches détaillées pour Emma
  const fiches = posts.map((p, i) => {
    const label = ANIMAL_LABEL[p.animal_type] ?? p.animal_type;
    const lines = [
      `${i + 1}. ${label}${p.breed ? ` — ${p.breed}` : ''}`,
      p.age ? `   Âge : ${p.age}` : null,
      p.gender && p.gender !== 'inconnu' ? `   Sexe : ${p.gender}` : null,
      p.region ? `   Ville : ${p.region}` : null,
      p.description ? `   Description : ${p.description.slice(0, 150)}` : null,
      `   Lien : https://mespoilus.com/adoption/${p.id}`,
    ].filter(Boolean);
    return lines.join('\n');
  }).join('\n\n');

  // Image = première photo du premier animal (Supabase Storage → acceptée par Instagram)
  const imageUrl: string | null = posts[0].photo_urls?.[0] ?? null;

  const emma = getAgent('emma');
  const prompt = `Crée un post Facebook et Instagram chaleureux et émouvant pour promouvoir les adoptions d'animaux de la semaine sur Mes Poilus.

Voici les annonces disponibles :

${fiches}

Consignes :
- Mentionne chaque animal avec ses vraies informations (type, race, ville)
- Donne envie d'adopter ou de partager l'annonce
- Inclure le lien vers chaque annonce ET ce lien global à la fin : https://mespoilus.com/adoption
- Ajoute des hashtags pertinents`;

  let emmaContent = '';
  let totalTokens = 0;

  try {
    const { content, inputTokens, outputTokens } = await runAgent(
      emma.systemPrompt,
      prompt,
      emma.model,
      emma.maxTokens ?? 3000
    );
    emmaContent = content.trim();
    totalTokens = inputTokens + outputTokens;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur runAgent';
    console.error('[Cron adoption-social] Erreur Emma:', msg);
    await supabase.from('activity_logs').insert({
      agent_id: 'emma', agent_name: 'Emma',
      action: `[Adoption social] Erreur: ${msg}`,
      status: 'error', duration_ms: Date.now() - globalStart, details: {},
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Sauvegarde dans social_posts avec la photo d'adoption
  const hashtags = (emmaContent.match(/#[\wÀ-ɏ]+/g) ?? []);
  const cleanContent = emmaContent.replace(/#[\wÀ-ɏ]+/g, '').replace(/\n{3,}/g, '\n\n').trim();

  for (const platform of ['facebook', 'instagram']) {
    await supabase.from('social_posts').insert({
      content: emmaContent, platform, hashtags, status: 'draft',
      ...(imageUrl ? { image_url: imageUrl } : {}),
    });
  }

  // Envoi Make.com avec la photo d'adoption
  const makeUrl = process.env.MAKE_WEBHOOK_URL;
  if (makeUrl) {
    const body: Record<string, string> = { content: cleanContent, hashtags: hashtags.join(' ') };
    if (imageUrl) body.image_url = imageUrl;
    try {
      await fetch(makeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
    } catch { /* non-bloquant */ }
  }

  // Log activité
  const duration = Date.now() - globalStart;
  await supabase.from('activity_logs').insert({
    agent_id: 'emma', agent_name: 'Emma',
    action: `[Adoption social] ${posts.length} annonce${posts.length > 1 ? 's' : ''} mise${posts.length > 1 ? 's' : ''} en avant`,
    status: 'success', duration_ms: duration,
    details: { count: posts.length, tokens: totalTokens },
    tokens_used: totalTokens,
  });

  // Mise à jour stats Emma
  await supabase.from('agent_stats').upsert({
    agent_id: 'emma',
    total_tasks: 1,
    successful_tasks: 1,
    last_active: new Date().toISOString(),
  }, { onConflict: 'agent_id', ignoreDuplicates: false });

  return NextResponse.json({ success: true, posts: posts.length, duration_ms: duration });
}
