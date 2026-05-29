import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { catalog_id } = await req.json() as { catalog_id: string };
  if (!catalog_id) return NextResponse.json({ error: 'catalog_id requis' }, { status: 400 });

  const admin = createAdminClient();

  const { error } = await admin
    .from('products_catalog')
    .update({ status: 'deleted' })
    .eq('id', catalog_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Boutique V2] Produit marqué supprimé : ${catalog_id}`,
    details: { catalog_id },
    status: 'success',
  });

  return NextResponse.json({ ok: true });
}
