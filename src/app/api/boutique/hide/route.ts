import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { catalog_id, action } = await req.json() as { catalog_id: string; action?: 'hide' | 'show' };
  if (!catalog_id) return NextResponse.json({ error: 'catalog_id requis' }, { status: 400 });

  const newStatus = action === 'show' ? 'active' : 'hidden';

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from('products_catalog')
    .update({ status: newStatus })
    .eq('id', catalog_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await adminSupabase.from('activity_logs').insert({
    agent_id: 'thomas', agent_name: 'Thomas',
    action: `[Boutique V2] Produit ${newStatus === 'hidden' ? 'masque' : 'remis'} : ${catalog_id}`,
    details: { catalog_id, status: newStatus },
    status: 'success',
  });

  return NextResponse.json({ ok: true });
}
