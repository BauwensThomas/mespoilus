import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';
import { cronEmailWrapper, statsRow } from '@/lib/cron-email';

export const maxDuration = 300;

const BATCH_SIZE_NAMES = 30;
const BATCH_SIZE_DESC = 5;
const MAX_RETRIES = 4;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callAnthropic(body: object): Promise<Response> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.status !== 529 && res.status !== 429) return res;
    const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
    console.warn(`[translate] Anthropic 529 — retry ${attempt + 1}/${MAX_RETRIES} dans ${delay}ms`);
    await sleep(delay);
  }
  throw new Error('Anthropic API 529 — trop de tentatives');
}

async function translateBatch(names: string[]): Promise<string[]> {
  const res = await callAnthropic({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Tu es un expert en produits pour animaux de compagnie. Pour chaque nom de produit ci-dessous, applique ces règles :
- Si le nom est DÉJÀ en français (même s'il contient des mots anglais qui sont des noms de marque, de gamme ou du vocabulaire technique international comme "Adult", "Senior", "Indoor", "Outdoor", "Premium"), retourne-le IDENTIQUE, sans le modifier.
- Si le nom est principalement en anglais ou en néerlandais (la majorité des mots descriptifs sont EN ou NL), traduis-le en français naturel. Garde les noms de marques et les chiffres tels quels.
Réponds UNIQUEMENT avec les résultats, un par ligne, dans le même ordre. Pas d'explication, pas de numéro, pas de guillemets.\n\n${names.join('\n')}`,
    }],
  });

  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const json = await res.json();
  const text: string = json.content?.[0]?.text ?? '';
  const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);

  if (lines.length !== names.length) return names;
  return lines;
}

async function translateDescBatch(descs: string[]): Promise<string[]> {
  const res = await callAnthropic({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Tu es un expert en produits pour animaux de compagnie. Pour chaque description ci-dessous :
- Si elle est DÉJÀ en français, retourne-la IDENTIQUE.
- Si elle est principalement en anglais ou en néerlandais, traduis-la en français naturel. Garde les noms de marques et les chiffres tels quels.
Réponds UNIQUEMENT avec un tableau JSON des résultats dans le même ordre. Pas d'explication, pas de markdown.\n\n${JSON.stringify(descs)}`,
    }],
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

  // ─── Pass 1 : noms ────────────────────────────────────────────────────────
  // Tous les produits sans name_fr (Claude détecte la langue et traduit si besoin)

  const { data: nameRows, error: nameError } = await supabase
    .from('products_catalog')
    .select('id, name')
    .is('name_fr', null)
    .not('name', 'is', null)
    .limit(150);

  if (nameError) return NextResponse.json({ error: nameError.message }, { status: 500 });

  let translatedNames = 0;
  let lastError: string | null = null;

  for (let i = 0; i < (nameRows ?? []).length; i += BATCH_SIZE_NAMES) {
    const batch = nameRows!.slice(i, i + BATCH_SIZE_NAMES);
    try {
      const translations = await translateBatch(batch.map(r => r.name));
      for (let j = 0; j < batch.length; j++) {
        // Ne met à jour que si Claude a réellement modifié le nom
        const nameFr = translations[j] !== batch[j].name ? translations[j] : null;
        if (nameFr) {
          await supabase.from('products_catalog').update({ name_fr: nameFr }).eq('id', batch[j].id);
          translatedNames++;
        } else {
          // Marque comme "déjà FR" pour ne plus y revenir
          await supabase.from('products_catalog').update({ name_fr: batch[j].name }).eq('id', batch[j].id);
        }
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Erreur inconnue';
      console.error('[translate] nom batch erreur:', lastError);
    }
  }

  // ─── Pass 2 : descriptions ────────────────────────────────────────────────
  // Tous les produits sans description_fr

  const { data: descRawRows, error: descError } = await supabase
    .from('products_catalog')
    .select('id, description, description_fr')
    .not('description', 'is', null)
    .is('description_fr', null)
    .limit(80);

  if (descError) lastError = descError.message;

  const descRows = descRawRows ?? [];
  let translatedDescs = 0;

  for (let i = 0; i < descRows.length; i += BATCH_SIZE_DESC) {
    const batch = descRows.slice(i, i + BATCH_SIZE_DESC);
    try {
      const translations = await translateDescBatch(batch.map(r => r.description!));
      for (let j = 0; j < batch.length; j++) {
        const descFr = translations[j] !== batch[j].description ? translations[j] : batch[j].description;
        await supabase.from('products_catalog').update({ description_fr: descFr }).eq('id', batch[j].id);
        if (descFr !== batch[j].description) translatedDescs++;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Erreur inconnue';
      console.error('[translate] desc batch erreur:', lastError);
    }
  }

  // ─── Log ──────────────────────────────────────────────────────────────────

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Catalog translate] ${translatedNames} noms + ${translatedDescs} descriptions traduits EN/NL→FR (${(nameRows?.length ?? 0)} noms traités)`,
    details: lastError ? { error: lastError } : {},
    status: lastError ? 'error' : 'success',
  });

  try {
    await sendEmail({
      to: 'contact@mespoilus.com',
      subject: `[Mes Poilus] Traduction EN→FR — ${translatedNames + translatedDescs} traduction${translatedNames + translatedDescs > 1 ? 's' : ''}`,
      html: cronEmailWrapper(
        'Traduction EN→FR terminée',
        'Catalogue · Boutique',
        statsRow([
          { label: 'Noms traduits',    value: translatedNames,                                  color: '#0d9488' },
          { label: 'Descriptions',     value: translatedDescs,                                  color: '#0d9488' },
          { label: 'Produits traités', value: (nameRows?.length ?? 0) + descRows.length,        color: '#6b7280' },
        ]) + (lastError ? `<p style="color:#dc2626;font-size:13px;margin-top:12px">⚠ Erreur : ${lastError}</p>` : ''),
      ),
    });
  } catch (e) {
    console.error('[translate] email erreur:', e);
  }

  return NextResponse.json({
    success: !lastError,
    translatedNames,
    translatedDescs,
    total: (nameRows?.length ?? 0) + descRows.length,
    ...(lastError ? { error: lastError } : {}),
  });
}
