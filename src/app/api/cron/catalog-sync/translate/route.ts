import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 300;

const BATCH_SIZE_NAMES = 30;
const BATCH_SIZE_DESC = 5;
const MAX_RETRIES = 4;

// Marchands anglophones : leurs produits sont TOUJOURS traduits, jamais marqués "déjà FR"
const FORCE_MERCHANTS = ['CanadaPetCare', 'Puft', 'Tuft & Paw'];

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
    console.warn(`[translate] Anthropic 529 - retry ${attempt + 1}/${MAX_RETRIES} dans ${delay}ms`);
    await sleep(delay);
  }
  throw new Error('Anthropic API 529 - trop de tentatives');
}

async function translateBatch(names: string[]): Promise<string[]> {
  const res = await callAnthropic({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Tu es un expert en traduction de produits pour animaux de compagnie EN/NL → FR.

Règles STRICTES :
- Traduis TOUS les mots descriptifs anglais ou néerlandais en français. Exemples obligatoires : Adult→Adulte, Indoor→Intérieur, Outdoor→Extérieur, Senior→Senior, Kitten→Chaton, Puppy→Chiot, Chicken→Poulet, Salmon→Saumon, Beef→Bœuf, Turkey→Dinde, Lamb→Agneau, Fish→Poisson, Dry→Sec, Wet→Humide, Fresh→Frais, Light→Léger, Sterilised→Stérilisé, Grain Free→Sans céréales, Cat→Chat, Dog→Chien, Tree→Arbre, Box→Boîte, Litter→Litière, Enclosure→Enceinte, Toy→Jouet, Bed→Lit, Bowl→Bol, Feeder→Distributeur, Scratcher→Griffoir, Harness→Harnais, Leash→Laisse, Collar→Collier, Brush→Brosse, Coat→Pelage, House→Maison, Tower→Tour, Tunnel→Tunnel, Wand→Baguette, Carrier→Transporteur, Mat→Tapis, Pad→Coussin, Perch→Perchoir, Cage→Cage, Tank→Aquarium, Food→Nourriture, Treat→Friandise, Snack→Snack, Mix→Mélange, Blend→Mélange, Formula→Formule, Recipe→Recette, Natural→Naturel, Organic→Biologique, Grain→Céréale, Free→Sans, With→Avec, For→Pour, Small→Petit, Medium→Moyen, Large→Grand, Mini→Mini, Maxi→Maxi.
- Les noms propres de MARQUES ne se traduisent pas (Royal Canin, Purina, Whiskas, Hills, Orijen, Acana, Zooplus, Maxi Zoo, CanadaPetCare, Puft, Tuft & Paw, Trixie, Ferplast, etc.).
- Un prénom de produit (Haven, Milo, Luna, etc.) qui est le NOM DU PRODUIT doit rester tel quel, mais les mots descriptifs qui l'accompagnent se traduisent.
- Ne retourne JAMAIS le nom identique si celui-ci contient des mots anglais ou néerlandais descriptifs.
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

async function translateBatchForced(names: string[]): Promise<string[]> {
  const res = await callAnthropic({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Tu es un traducteur EN→FR expert en produits pour animaux. Ces noms sont EN ANGLAIS et doivent être traduits en français naturel et grammaticalement correct.

RÈGLES ABSOLUES :
- INTERDIT de retourner un nom identique à l'original. TOUT MOT ANGLAIS descriptif doit être traduit.
- Traduis les groupes nominaux composés avec la bonne grammaire française (ajoute les prépositions nécessaires) : Cat Tree→Arbre à chat, Cat Tower→Tour à chat, Cat Scratcher→Griffoir pour chat, Cat Bed→Lit pour chat, Cat Litter→Litière pour chat, Litter Box→Boîte à litière, Litter Box Enclosure→Meuble cache-litière, Cat Bowl→Bol pour chat, Dog Bed→Lit pour chien, Dog Bowl→Gamelle pour chien, Dog Harness→Harnais pour chien, Cat Food→Nourriture pour chat, Cat Treats→Friandises pour chat, Dog Food→Nourriture pour chien, Dog Treats→Friandises pour chien.
- Traduis les adjectifs : Really→Vraiment, Great→Super, Good→Bon, Best→Meilleur, Amazing→Incroyable, Premium→Premium, Natural→Naturel, Organic→Bio, Fresh→Frais, Original→Original, Perfect→Parfait, Ultimate→Ultime.
- Traduis les autres mots : Cat→Chat, Dog→Chien, Tree→Arbre, Tower→Tour, Box→Boîte, Litter→Litière, Enclosure→Meuble, Toy→Jouet, Bed→Lit, Bowl→Bol, Feeder→Distributeur, Scratcher→Griffoir, Harness→Harnais, Leash→Laisse, Collar→Collier, House→Maison, Food→Nourriture, Treat→Friandise, Grain→Céréale, Free→Sans, With→Avec, For→Pour, Small→Petit, Medium→Moyen, Large→Grand, Pack→Lot, Set→Ensemble, Bundle→Pack, Kit→Kit, Rope→Corde, Mat→Tapis, Pad→Coussin, Cover→Housse, Furniture→Meuble.
- Garde UNIQUEMENT les noms propres de lignes produits (Haven, Milo, Grove, Luna, etc.) et les noms de marques (Puft, CanadaPetCare, Tuft & Paw, Trixie, etc.) tels quels.
- Chiffres, unités et tirets inchangés.
Réponds UNIQUEMENT avec les traductions, une par ligne, dans le même ordre. Pas d'explication.\n\n${names.join('\n')}`,
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

  let translatedNames = 0;
  let lastError: string | null = null;
  let translatedDescs = 0;
  let copiedDescs = 0;
  let alreadyFrDesc = 0;

  // ─── Pass 0 : marchands anglophones forcés (CanadaPetCare, Puft) ─────────
  // Traduction obligatoire — jamais marqués "déjà FR"

  const { data: forceOffers } = await supabase
    .from('product_offers')
    .select('catalog_id')
    .in('merchant_name', FORCE_MERCHANTS);

  const forceIds = [...new Set((forceOffers ?? []).map((o: { catalog_id: string }) => o.catalog_id))];

  if (forceIds.length > 0) {
    const [{ data: forceNameRows }, { data: forceDescRaw }] = await Promise.all([
      supabase.from('products_catalog').select('id, name').in('id', forceIds).is('name_fr', null).not('name', 'is', null).limit(300),
      supabase.from('products_catalog').select('id, description').in('id', forceIds).is('description_fr', null).not('description', 'is', null).limit(100),
    ]);

    // Noms : passe forcée
    for (let i = 0; i < (forceNameRows ?? []).length; i += BATCH_SIZE_NAMES) {
      const batch = (forceNameRows ?? []).slice(i, i + BATCH_SIZE_NAMES);
      try {
        const translations = await translateBatchForced(batch.map(r => r.name));
        for (let j = 0; j < batch.length; j++) {
          const nameFr = translations[j] !== batch[j].name ? translations[j] : batch[j].name;
          await supabase.from('products_catalog').update({ name_fr: nameFr }).eq('id', batch[j].id);
          translatedNames++;
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : 'Erreur inconnue';
      }
    }

    // Descriptions : groupement + passe forcée
    const forceDescGroups = new Map<string, string[]>();
    for (const r of forceDescRaw ?? []) {
      const key = r.description!.trim();
      if (!forceDescGroups.has(key)) forceDescGroups.set(key, []);
      forceDescGroups.get(key)!.push(r.id);
    }

    for (const [desc, ids] of forceDescGroups) {
      const { data: existing } = await supabase
        .from('products_catalog').select('description_fr')
        .eq('description', desc).not('description_fr', 'is', null).limit(1);
      const existingFr = existing?.[0]?.description_fr;
      if (existingFr && existingFr !== desc) {
        await supabase.from('products_catalog').update({ description_fr: existingFr }).in('id', ids);
        copiedDescs += ids.length;
      } else {
        try {
          const [translated] = await translateDescBatch([desc]);
          const descFr = translated !== desc ? translated : desc;
          await supabase.from('products_catalog').update({ description_fr: descFr }).in('id', ids);
          if (descFr !== desc) translatedDescs++;
          else alreadyFrDesc++;
        } catch (e) {
          lastError = e instanceof Error ? e.message : 'Erreur inconnue';
        }
      }
    }
  }

  // ─── Pass 1 : noms ────────────────────────────────────────────────────────
  // Tous les produits sans name_fr (Claude détecte la langue et traduit si besoin)

  const { data: nameRows, error: nameError } = await supabase
    .from('products_catalog')
    .select('id, name')
    .is('name_fr', null)
    .not('name', 'is', null)
    .limit(500);

  if (nameError) return NextResponse.json({ error: nameError.message }, { status: 500 });

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
  // Stratégie :
  // 1. Grouper par texte de description identique → 1 appel Claude par texte unique
  // 2. Si une traduction existe déjà pour ce texte exact dans le catalog → copier au groupe
  // 3. Sinon → traduire une fois → propager à tous les produits du groupe
  // Les passages suivants propagent automatiquement via l'étape 2 (plus d'appel Claude nécessaire)

  const { data: descRawRows, error: descError } = await supabase
    .from('products_catalog')
    .select('id, description')
    .not('description', 'is', null)
    .is('description_fr', null)
    .limit(200);

  if (descError) lastError = descError.message;

  const descRows = descRawRows ?? [];

  // Grouper les produits par texte de description identique
  const groupsByDesc = new Map<string, string[]>(); // description → ids[]
  for (const r of descRows) {
    const key = r.description!.trim();
    if (!groupsByDesc.has(key)) groupsByDesc.set(key, []);
    groupsByDesc.get(key)!.push(r.id);
  }

  const needsTranslation: { description: string; ids: string[] }[] = [];

  for (const [desc, ids] of groupsByDesc) {
    // Vérifier si une traduction existe déjà pour ce texte exact (dans tout le catalog)
    const { data: existing } = await supabase
      .from('products_catalog')
      .select('description_fr')
      .eq('description', desc)
      .not('description_fr', 'is', null)
      .limit(1);

    const existingFr = existing?.[0]?.description_fr;

    if (existingFr) {
      // Copier la traduction existante à tous les produits du groupe
      await supabase.from('products_catalog').update({ description_fr: existingFr }).in('id', ids);
      copiedDescs += ids.length;
    } else {
      needsTranslation.push({ description: desc, ids });
    }
  }

  // Traduire les descriptions uniques sans traduction, par batch
  for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE_DESC) {
    const batch = needsTranslation.slice(i, i + BATCH_SIZE_DESC);
    try {
      const translations = await translateDescBatch(batch.map(b => b.description));
      for (let j = 0; j < batch.length; j++) {
        const descFr = translations[j] !== batch[j].description ? translations[j] : batch[j].description;
        // Mettre à jour tous les produits du groupe en une seule requête
        await supabase.from('products_catalog').update({ description_fr: descFr }).in('id', batch[j].ids);
        if (descFr !== batch[j].description) translatedDescs++;
        else alreadyFrDesc++;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Erreur inconnue';
      console.error('[translate] desc batch erreur:', lastError);
    }
  }

  // ─── Compter les restants ─────────────────────────────────────────────────

  const [{ count: remainingNames }, { count: remainingDescs }] = await Promise.all([
    supabase.from('products_catalog').select('id', { count: 'exact', head: true }).is('name_fr', null).eq('status', 'active'),
    supabase.from('products_catalog').select('id', { count: 'exact', head: true }).is('description_fr', null).not('description', 'is', null).eq('status', 'active'),
  ]);

  // ─── Log ──────────────────────────────────────────────────────────────────

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Catalog translate] ${translatedNames} noms + ${translatedDescs} desc. traduites + ${copiedDescs} copiées groupe + ${alreadyFrDesc} déjà FR`,
    details: lastError ? { error: lastError } : {},
    status: lastError ? 'error' : 'success',
  });

  return NextResponse.json({
    success: !lastError,
    translatedNames,
    translatedDescs,
    remainingNames: remainingNames ?? 0,
    remainingDescs: remainingDescs ?? 0,
    total: (nameRows?.length ?? 0) + descRows.length,
    ...(lastError ? { error: lastError } : {}),
  });
}
