import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get('session_id');
  if (!sessionId) return NextResponse.json({ achat: null });

  const supabase = createAdminClient();
  const { data: achat } = await supabase
    .from('pixel_achats')
    .select('id, positions, acheteur_prenom, devinette')
    .eq('stripe_session_id', sessionId)
    .not('confirmed_at', 'is', null)
    .single();

  return NextResponse.json({ achat: achat ?? null });
}
