import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await params;

  const { status } = await req.json();
  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('adoption_posts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  return NextResponse.json({ success: true });
}
