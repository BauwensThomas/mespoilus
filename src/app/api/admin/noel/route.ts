import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { SITE_SETTINGS_TAG, setNoelEnabled } from '@/lib/site-settings';

/** Interrupteur des décorations de Noël (la période reste du 25/11 au 10/01). */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { enabled } = await req.json().catch(() => ({})) as { enabled?: unknown };
  if (typeof enabled !== 'boolean') return NextResponse.json({ error: 'Valeur invalide' }, { status: 400 });
  try {
    await setNoelEnabled(enabled);
  } catch (e) {
    console.error('[noel] réglage:', e);
    return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 });
  }
  revalidateTag(SITE_SETTINGS_TAG);
  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true, enabled });
}
