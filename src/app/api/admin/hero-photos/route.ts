import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Photos des cartes de catégories (pages Races et Accueil, table hero_photos) : liste et cadrage.
 * Protégé par le middleware (/api/admin).
 */
export async function GET() {
  const { data, error } = await createAdminClient()
    .from('hero_photos')
    .select('id, url, alt, animal_type, active, focus')
    .order('animal_type')
    .order('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ photos: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const { id, focus } = await req.json().catch(() => ({})) as { id?: string; focus?: string };
  if (!id || typeof focus !== 'string' || !/^\d{1,3} \d{1,3} \d(\.\d+)?$/.test(focus)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
  }
  const { error } = await createAdminClient().from('hero_photos').update({ focus }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath('/races');
  revalidatePath('/');
  return NextResponse.json({ success: true });
}
