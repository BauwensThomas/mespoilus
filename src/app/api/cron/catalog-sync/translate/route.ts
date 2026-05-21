import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 300;

const ENGLISH_MERCHANTS = ['Tuft & Paw', 'CanadaPetCare'];
const BATCH_SIZE_NAMES = 40;
const BATCH_SIZE_DESC = 8;

// Mots néerlandais caractéristiques des produits animaux de Maxi Zoo BE
const DUTCH_NAME_PATTERN = [
  'vezel', 'nieren', 'gewrichten', 'spijsvertering', 'huidgezondheid',
  'beweeglijkheid', 'darmgezondheid', 'hartgezondheid', 'gewichtsbeheer',
  'sterilisatie', 'korthaar', 'langhaar', 'uitgebalanceerd',
  'respons', // vezelrespons, immuunrespons...
  'honden', 'katten', 'konijnen', 'knaagdieren', 'vogels',
].map(w => `name.ilike.%${w}%`).join(',');

async function getDutchProductIds(supabase: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const { data } = await supabase
    .from('products_catalog')
    .select('id')
    .or(DUTCH_NAME_PATTERN)
    .limit(2000);
  return (data ?? []).map(r => r.id as string);
}

async function translateBatch(names: string[]): Promise<string[]> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Tu es un traducteur expert en produits pour animaux de compagnie. Traduis ces noms de produits de l'anglais ou du néerlandais vers le français naturel et correct. Garde les noms de marques et les chiffres tels quels. Réponds UNIQUEMENT avec les traductions, une par ligne, dans le même ordre. Pas d'explication, pas de numéro, pas de guillemets.\n\n${names.join('\n')}`,
      }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const json = await res.json();
  const text: string = json.content?.[0]?.text ?? '';
  const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);

  if (lines.length !== names.length) return names;
  return lines;
}

async function translateDescBatch(descs: string[]): Promise<string[]> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Tu es un traducteur expert en produits pour animaux de compagnie. Traduis ces descriptions de produits de l'anglais ou du néerlandais vers le français naturel et correct. Garde les noms de marques et les chiffres tels quels. Réponds UNIQUEMENT avec un tableau JSON des traductions dans le même ordre. Pas d'explication, pas de markdown.\n\n${JSON.stringify(descs)}`,
      }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const json = await res.json();
  const text: string = json.content?.[0]?.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return descs;
  try {
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed) && parsed.length === descs.length) return parsed;
  } catch {}
  return descs;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquant' }, { status: 500 });
  }

  const supabase = createAdminClient();

  // IDs produits marchands anglais
  const { data: englishIds } = await supabase
    .from('product_offers')
    .select('catalog_id')
    .in('merchant_name', ENGLISH_MERCHANTS);
  const englishSet = new Set((englishIds ?? []).map(r => r.catalog_id as string));

  // IDs produits avec nom néerlandais
  const dutchIds = await getDutchProductIds(supabase);
  const dutchSet = new Set(dutchIds);

  const ids = [...new Set([...englishSet, ...dutchSet])];

  if (!ids.length) {
    return NextResponse.json({ success: true, translatedNames: 0, translatedDescs: 0, message: 'Aucun produit à traduire' });
  }

  // ─── Pass 1 : noms ────────────────────────────────────────────────────────

  const { data: nameRows, error: nameError } = await supabase
    .from('products_catalog')
    .select('id, name')
    .is('name_fr', null)
    .in('id', ids)
    .limit(500);

  if (nameError) return NextResponse.json({ error: nameError.message }, { status: 500 });

  let translatedNames = 0;
  let lastError: string | null = null;

  for (let i = 0; i < (nameRows ?? []).length; i += BATCH_SIZE_NAMES) {
    const batch = nameRows!.slice(i, i + BATCH_SIZE_NAMES);
    try {
      const translations = await translateBatch(batch.map(r => r.name));
      for (let j = 0; j < batch.length; j++) {
        const nameFr = translations[j] !== batch[j].name ? translations[j] : null;
        if (nameFr) {
          await supabase.from('products_catalog').update({ name_fr: nameFr }).eq('id', batch[j].id);
          translatedNames++;
        }
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Erreur inconnue';
      console.error('[translate] nom batch erreur:', lastError);
    }
  }

  // ─── Pass 2 : descriptions ────────────────────────────────────────────────

  const { data: descRawRows, error: descError } = await supabase
    .from('products_catalog')
    .select('id, description, description_fr')
    .not('description', 'is', null)
    .in('id', ids)
    .limit(500);

  if (descError) {
    lastError = descError.message;
  }

  const descRows = (descRawRows ?? []).filter(r => r.description_fr === null);

  let translatedDescs = 0;

  for (let i = 0; i < descRows.length; i += BATCH_SIZE_DESC) {
    const batch = descRows.slice(i, i + BATCH_SIZE_DESC);
    try {
      const translations = await translateDescBatch(batch.map(r => r.description!));
      for (let j = 0; j < batch.length; j++) {
        const descFr = translations[j] !== batch[j].description ? translations[j] : null;
        if (descFr) {
          await supabase.from('products_catalog').update({ description_fr: descFr }).eq('id', batch[j].id);
          translatedDescs++;
        }
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Erreur inconnue';
      console.error('[translate] desc batch erreur:', lastError);
    }
  }

  // ─── Log ──────────────────────────────────────────────────────────────────

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Catalog translate] ${translatedNames} noms + ${translatedDescs} descriptions traduits EN/NL→FR`,
    details: lastError ? { error: lastError } : {},
    status: lastError ? 'error' : 'success',
  });

  return NextResponse.json({
    success: !lastError,
    translatedNames,
    translatedDescs,
    total: (nameRows?.length ?? 0) + descRows.length,
    ...(lastError ? { error: lastError } : {}),
  });
}
