import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const VALID_TYPES = ['nourriture', 'jouets', 'hygiene', 'sante', 'habitat', 'accessoires', 'livres', null] as const;

export async function PATCH(request: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { catalogId, productType } = await request.json();
  if (!catalogId) return NextResponse.json({ error: 'catalogId requis' }, { status: 400 });
  if (!VALID_TYPES.includes(productType)) return NextResponse.json({ error: 'Type invalide' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('products_catalog')
    .update({ product_type: productType })
    .eq('id', catalogId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
