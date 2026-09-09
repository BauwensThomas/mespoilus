import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';
import { BREEDS_SEED, type AnimalType } from '@/lib/breeds-list';

export const runtime = 'nodejs';
export const maxDuration = 300;

const BATCH_SIZE = 10;
const BIWEEKLY_DAYS = 14;

// Ordre de rotation : oiseaux en premier, puis les autres categories
const ROTATION_ORDER: AnimalType[] = ['oiseau', 'reptile', 'rongeur', 'chat', 'chien'];

const ANIMAL_LABEL_FR: Record<AnimalType, string> = {
  chien:   'chien domestique',
  chat:    'chat domestique',
  oiseau:  'oiseau de compagnie',
  rongeur: 'rongeur / petit mammifere de compagnie',
  reptile: 'reptile de compagnie',
};

async function logActivity(
  supabase: ReturnType<typeof createAdminClient>,
  status: 'success' | 'error',
  durationMs: number,
  details: Record<string, unknown>,
  tokensUsed: number
) {
  try {
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
  // Permet de forcer une categorie depuis le CronLauncher (ex: ?animal=oiseau)
  const forceAnimal = url.searchParams.get('animal') as AnimalType | null;

  const globalStart = Date.now();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = createAdminClient();

  // Garde biweekly (sauf si forceAnimal specifie manuellement)
  if (!forceAnimal) {
    const { data: lastRun } = await supabase
      .from('activity_logs')
      .select('created_at, details')
      .eq('action', 'Cron races : génération fiches')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastRun) {
      const daysSince = (Date.now() - new Date(lastRun.created_at).getTime()) / 86_400_000;
      if (daysSince < BIWEEKLY_DAYS) {
        const daysLeft = Math.ceil(BIWEEKLY_DAYS - daysSince);
        return NextResponse.json({ success: true, message: `Prochain run dans ${daysLeft} jour(s)`, generated: 0, skipped: true });
      }
    }
  }

  // Rotation de categorie
  let targetAnimal: AnimalType;
  if (forceAnimal && ROTATION_ORDER.includes(forceAnimal)) {
    targetAnimal = forceAnimal;
  } else {
    const { data: lastRun } = await supabase
      .from('activity_logs')
      .select('details')
      .eq('action', 'Cron races : génération fiches')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastAnimal = (lastRun?.details as Record<string, unknown> | null)?.targeted_animal as AnimalType | undefined;
    const lastIndex = lastAnimal ? ROTATION_ORDER.indexOf(lastAnimal) : -1;
    targetAnimal = ROTATION_ORDER[(lastIndex + 1) % ROTATION_ORDER.length];
  }

  // Recupere les slugs deja generes
  const { data: existing } = await supabase
    .from('breeds')
    .select('slug, animal')
    .not('content', 'is', null);

  const existingSet = new Set((existing ?? []).map(r => `${r.animal}:${r.slug}`));

  // Selectionne les prochaines races de la categorie cible uniquement
  const toGenerate = BREEDS_SEED
    .filter(b => b.animal === targetAnimal && !existingSet.has(`${b.animal}:${b.slug}`))
    .slice(0, batchSize);

  if (toGenerate.length === 0) {
    return NextResponse.json({ success: true, message: `Aucune race ${targetAnimal} a generer`, generated: 0, targeted_animal: targetAnimal });
  }

  let totalTokens = 0;
  const generated: string[] = [];
  const errors: string[] = [];

  const queue = [...toGenerate];
  const worker = async () => {
    while (queue.length > 0) {
      const breed = queue.shift();
      if (!breed) return;

      try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Tu es un expert en bien-etre animal. Genere une fiche race complete et precise pour : ${breed.name} (${ANIMAL_LABEL_FR[breed.animal]}).

Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans commentaires) :
{
  "excerpt": "Une phrase accrocheuse de 80-120 caracteres decrivant la race",
  "description": "<p>Paragraphe sur l'histoire et l'origine.</p><p>Paragraphe sur le caractere et la personnalite.</p><p>Paragraphe sur la vie au quotidien et les conseils pratiques.</p>",
  "origine": "Pays ou region d'origine",
  "taille": "petit ou moyen ou grand ou tres grand",
  "poids": "X-Y kg",
  "esperance_vie": "X-Y ans",
  "caractere": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "entretien": "2 phrases sur le toilettage et les soins.",
  "alimentation": "2 phrases sur les besoins alimentaires specifiques.",
  "sante": "2 phrases sur les maladies frequentes et la robustesse.",
  "convient_pour": {
    "appartement": true,
    "jardin": false,
    "enfants": true,
    "debutants": false,
    "seniors": true
  },
  "niveau_activite": "faible ou modere ou eleve ou tres eleve"
}`,
        }],
      });

      totalTokens += response.usage.input_tokens + response.usage.output_tokens;

      if (response.stop_reason === 'max_tokens') {
        throw new Error('Reponse tronquee (max_tokens atteint)');
      }

      const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON introuvable dans la reponse');

      let jsonStr = jsonMatch[0];
      jsonStr = jsonStr
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/:\s*'([^']*?)'/g, ': "$1"');

      let content: Record<string, unknown>;
      try {
        content = JSON.parse(jsonStr);
      } catch (parseErr1) {
        console.error(`[Cron Races] Premiere tentative JSON.parse echouee pour ${breed.name}:`, parseErr1);
        let fixed = jsonStr.trimEnd();
        if (!fixed.endsWith('}')) {
          const lastComplete = fixed.lastIndexOf(',"niveau_activite"');
          if (lastComplete > 0) fixed = fixed.slice(0, lastComplete);
          const opens = (fixed.match(/\{/g) ?? []).length - (fixed.match(/\}/g) ?? []).length;
          fixed += '}'.repeat(Math.max(0, opens));
        }
        try {
          content = JSON.parse(fixed);
          console.log(`[Cron Races] JSON repare avec succes pour ${breed.name}`);
        } catch (parseErr2) {
          throw new Error(`JSON invalide pour ${breed.name}: ${(parseErr2 as Error).message}`);
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
      console.log(`[Cron Races] OK ${breed.name}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${breed.name}: ${msg}`);
        console.error(`[Cron Races] ERREUR ${breed.name}:`, msg);
      }
    }
  };

  const workerCount = Math.min(3, toGenerate.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  const duration = Date.now() - globalStart;
  const remaining = BREEDS_SEED.filter(b => b.animal === targetAnimal).length
    - BREEDS_SEED.filter(b => b.animal === targetAnimal && existingSet.has(`${b.animal}:${b.slug}`)).length
    - generated.length;

  await logActivity(
    supabase,
    errors.length === 0 ? 'success' : 'error',
    duration,
    { generated: generated.length, errors, remaining, targeted_animal: targetAnimal },
    totalTokens
  );

  return NextResponse.json({
    success: errors.length === 0,
    targeted_animal: targetAnimal,
    generated: generated.length,
    remaining,
    errors,
    duration_ms: duration,
    tokens_used: totalTokens,
  });
}
