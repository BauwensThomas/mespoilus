import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { anthropic } from '@/lib/anthropic';

export const maxDuration = 60;

const VALID_TYPES = ['nourriture', 'jouets', 'hygiene', 'sante', 'habitat', 'accessoires', 'livres'] as const;
type ProductType = typeof VALID_TYPES[number];

const BATCH_SIZE = 150;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: products, error } = await supabase
    .from('products_catalog')
    .select('id, name, brand, category')
    .is('product_type', null)
    .eq('status', 'active')
    .limit(BATCH_SIZE);

  if (error || !products?.length) {
    await supabase.from('activity_logs').insert({
      agent_id: 'thomas', agent_name: 'Thomas',
      action: '[Classify products] 0 produit à classifier (backlog vide)',
      details: {},
      status: 'success',
    });
    return NextResponse.json({ classified: 0, message: 'Aucun produit à classifier' });
  }

  const productList = products
    .map(p => `${p.id}|${p.name}${p.brand ? ` (${p.brand})` : ''}|${p.category}`)
    .join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Tu es un expert en produits pour animaux de compagnie. Classifie chaque produit dans exactement une de ces catégories : nourriture, jouets, hygiene, sante, habitat, accessoires, livres.

Règles :
- nourriture : croquettes, pâtées, friandises, compléments alimentaires, vitamines
- jouets : balles, cordes, peluches, laser, jouets interactifs, griffoirs
- hygiene : shampooings, brosses, soins dentaires, antiparasitaires, produits de toilettage
- sante : médicaments, compléments santé, articulaire, digestif, calmants
- habitat : cages, litières, paniers, lits, aquariums, griffoirs muraux, arbres à chat
- accessoires : laisses, harnais, colliers, gamelles, vêtements, transport, dressage
- livres : livres, guides, encyclopédies

Format d'entrée : id|nom du produit (marque)|catégorie_animal
Format de sortie : id|type - une seule ligne par produit, rien d'autre.

Produits à classifier :
${productList}`,
    }],
  });

  const responseText = (message.content[0] as { type: string; text: string }).text;
  const lines = responseText.trim().split('\n');

  const updates: { id: string; type: ProductType }[] = [];
  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length < 2) continue;
    const id = parts[0].trim();
    const type = parts[1].trim() as ProductType;
    if (id && VALID_TYPES.includes(type)) {
      updates.push({ id, type });
    }
  }

  let classified = 0;
  for (const { id, type } of updates) {
    const { error: updateError } = await supabase
      .from('products_catalog')
      .update({ product_type: type })
      .eq('id', id)
      .is('product_type', null);
    if (!updateError) classified++;
  }

  await supabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Classify products] ${classified}/${products.length} produits classifiés`,
    details: { classified, total: products.length, skipped: products.length - updates.length },
    status: 'success',
  });

  return NextResponse.json({
    classified,
    total: products.length,
    skipped: products.length - updates.length,
    message: `${classified}/${products.length} produits classifiés`,
  });
}
