import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, name_fr, description_fr } = body as {
    id: string;
    name_fr?: string | null;
    description_fr?: string | null;
  };

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const update: Record<string, string | null> = {};
  if ('name_fr' in body) update.name_fr = name_fr ?? null;
  if ('description_fr' in body) update.description_fr = description_fr ?? null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('products_catalog').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
