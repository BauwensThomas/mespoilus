import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const admin = createAdminClient();

  const [newsRes, grilleRes] = await Promise.all([
    admin.from('newsletter_subscribers')
      .select('id, email, first_name, status, source, created_at')
      .order('created_at', { ascending: false }),
    admin.from('pixel_achats')
      .select('acheteur_email')
      .not('acheteur_email', 'is', null),
  ]);

  const grilleEmails = new Set(
    (grilleRes.data ?? []).map(r => r.acheteur_email?.toLowerCase())
  );

  const rows = (newsRes.data ?? []).map(s => ({
    id: s.id,
    email: s.email,
    first_name: s.first_name ?? '',
    status: s.status,
    source: s.source ?? '',
    created_at: s.created_at,
    newsletter: true,
    grille: grilleEmails.has(s.email?.toLowerCase()),
  }));

  // Acheteurs grille non abonnés newsletter
  const newsEmails = new Set((newsRes.data ?? []).map(s => s.email?.toLowerCase()));
  for (const email of grilleEmails) {
    if (email && !newsEmails.has(email)) {
      rows.push({
        id: '',
        email,
        first_name: '',
        status: '',
        source: 'grille',
        created_at: '',
        newsletter: false,
        grille: true,
      });
    }
  }

  return NextResponse.json({ subscribers: rows });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

  const admin = createAdminClient();
  // Supprime uniquement l'abonnement newsletter — la grille n'est pas touchée
  const { error } = await admin.from('newsletter_subscribers').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
