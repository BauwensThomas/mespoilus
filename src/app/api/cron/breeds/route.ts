import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';
import { BREEDS_SEED, type AnimalType } from '@/lib/breeds-list';

export const runtime = 'nodejs';
export const maxDuration = 300;

const BATCH_SIZE = 10;

const ANIMAL_LABEL_FR: Record<AnimalType, string> = {
  chien:   'chien domestique',
  chat:    'chat domestique',
  oiseau:  'oiseau de compagnie',
  rongeur: 'rongeur / petit mammifère de compagnie',
  reptile: 'reptile de compagnie',
};

async function logActivity(
  status: 'success' | 'error',
  durationMs: number,
  details: Record<string, unknown>,
  tokensUsed: number
) {
  try {
    const supabase = createAdminClient();
    await supabase.from('activity_logs').insert({
      agent_id: 'thomas',
      agent_name: 'Thomas',
      action: 'Cron races : génération fiches',
      status,
      duration_ms: durationMs,
      details,
      tokens_used: tokensUsed,
    });
  } catch { /* non-bloquant */ }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const batchSize = Math.min(parseInt(url.searchParams.get('batch') ?? String(BATCH_SIZE)), 30);

  const globalStart = Date.now();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = createAdminClient();

  // Récupère les slugs déjà générés
  const { data: existing } = await supabase
    .from('breeds')
    .select('slug, animal')
    .not('content', 'is', null);

  const existingSet = new Set((existing ?? []).map(r => `${r.animal}:${r.slug}`));

  // Sélectionne les prochaines races à générer
  const toGenerate = BREEDS_SEED
    .filter(b => !existingSet.has(`${b.animal}:${b.slug}`))
    .slice(0, batchSize);

  if (toGenerate.length === 0) {
    return NextResponse.json({ success: true, message: 'Toutes les races sont déjà générées', generated: 0 });
  }

  let totalTokens = 0;
  const generated: string[] = [];
  const errors: string[] = [];

  for (const breed of toGenerate) {
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `Expert animaux. Fiche race JSON pour : ${breed.name} (${ANIMAL_LABEL_FR[breed.animal]}).

IMPORTANT: Retourne UNIQUEMENT le JSON ci-dessous, sans markdown. Sois CONCIS pour ne pas dépasser la limite.

{
  "excerpt": "1 phrase max 100 caractères",
  "description": "2-3 phrases courtes sur l'origine et le caractère. Pas de HTML.",
  "origine": "pays",
  "taille": "petit|moyen|grand|très grand",
  "poids": "X-Y kg",
  "esperance_vie": "X-Y ans",
  "caractere": ["trait1","trait2","trait3","trait4"],
  "entretien": "1 phrase.",
  "alimentation": "1 phrase.",
  "sante": "1 phrase.",
  "convient_pour": {"appartement":true,"jardin":false,"enfants":true,"debutants":false,"seniors":true},
  "niveau_activite": "faible|modéré|élevé|très élevé"
}`,
        }],
      });

      totalTokens += response.usage.input_tokens + response.usage.output_tokens;

      if (response.stop_reason === 'max_tokens') {
        throw new Error('Réponse tronquée (max_tokens atteint)');
      }

      const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON introuvable dans la réponse');

      let jsonStr = jsonMatch[0];
      // Nettoie les problèmes courants de Haiku
      jsonStr = jsonStr
        .replace(/,\s*([}\]])/g, '$1')   // virgules trailing
        .replace(/(['"])?([a-zA-Z_éèêàâùûîï]+)(['"])?\s*:/g, '"$2":') // clés sans guillemets
        .replace(/:\s*'([^']*)'/g, ': "$1"'); // valeurs avec guillemets simples

      let content: Record<string, unknown>;
      try {
        content = JSON.parse(jsonStr);
      } catch {
        // Tentative de réparation : fermer les chaînes et objets ouverts
        let fixed = jsonStr.trimEnd();
        if (!fixed.endsWith('}')) {
          // Couper à la dernière virgule ou propriété complète
          const lastComplete = fixed.lastIndexOf(',"niveau_activite"');
          if (lastComplete > 0) fixed = fixed.slice(0, lastComplete);
          // Fermer les structures ouvertes
          const opens = (fixed.match(/\{/g) ?? []).length - (fixed.match(/\}/g) ?? []).length;
          fixed += '}'.repeat(Math.max(0, opens));
        }
        try {
          content = JSON.parse(fixed);
        } catch {
          throw new Error(`JSON invalide: ${jsonStr.slice(0, 200)}`);
        }
      }

      const { error } = await supabase.from('breeds').upsert({
        animal: breed.animal,
        name: breed.name,
        slug: breed.slug,
        content,
        status: 'published',
        generated_at: new Date().toISOString(),
      }, { onConflict: 'animal,slug' });

      if (error) throw error;

      generated.push(`${breed.animal}/${breed.slug}`);
      console.log(`[Cron Races] ✓ ${breed.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${breed.name}: ${msg}`);
      console.error(`[Cron Races] ✗ ${breed.name}:`, msg);
    }
  }

  const duration = Date.now() - globalStart;
  const remaining = BREEDS_SEED.length - (existingSet.size + generated.length);
  await logActivity(
    errors.length === 0 ? 'success' : 'error',
    duration,
    { generated: generated.length, errors, remaining },
    totalTokens
  );

  return NextResponse.json({
    success: errors.length === 0,
    generated: generated.length,
    remaining,
    total: BREEDS_SEED.length,
    errors,
    duration_ms: duration,
    tokens_used: totalTokens,
  });
}
