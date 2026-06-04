import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type Row = {
  email: string;
  newsletterId: string;   // id pour supprimer l'abonnement newsletter
  newsletter: boolean;
  grille: boolean;
  adoption: boolean;
  commentaire: boolean;
  source: string;
  created_at: string;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const admin = createAdminClient();

  const [newsRes, grilleRes, adoptionRes, commentRes] = await Promise.all([
    admin.from('newsletter_subscribers').select('id, email, source, created_at').order('created_at', { ascending: false }),
    admin.from('pixel_achats').select('acheteur_email').not('acheteur_email', 'is', null),
    admin.from('adoption_posts').select('email').not('email', 'is', null),
    admin.from('article_comments').select('email').not('email', 'is', null),
  ]);

  const map = new Map<string, Row>();

  // Newsletter (porte l'id pour la suppression)
  for (const s of newsRes.data ?? []) {
    if (!s.email) continue;
    map.set(s.email.toLowerCase(), {
      email: s.email,
      newsletterId: s.id,
      newsletter: true,
      grille: false,
      adoption: false,
      commentaire: false,
      source: s.source ?? 'newsletter',
      created_at: s.created_at ?? '',
    });
  }

  const flag = (email: string | null, field: 'grille' | 'adoption' | 'commentaire') => {
    if (!email) return;
    const key = email.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { email, newsletterId: '', newsletter: false, grille: false, adoption: false, commentaire: false, source: field, created_at: '' });
    }
    map.get(key)![field] = true;
  };

  for (const r of grilleRes.data ?? []) flag(r.acheteur_email, 'grille');
  for (const r of adoptionRes.data ?? []) flag(r.email, 'adoption');
  for (const r of commentRes.data ?? []) flag(r.email, 'commentaire');

  return NextResponse.json({ subscribers: [...map.values()] });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id, action, email } = await req.json() as {
    id?: string;
    action: 'newsletter' | 'grille' | 'adoption' | 'commentaire';
    email?: string;
  };
  const admin = createAdminClient();

  // Newsletter : suppression complète de l'abonnement
  if (action === 'newsletter') {
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const { error } = await admin.from('newsletter_subscribers').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Grille / Adoption / Commentaire : anonymisation RGPD (on efface l'email, on garde l'enregistrement)
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });

  if (action === 'grille') {
    const { error } = await admin.from('pixel_achats')
      .update({ acheteur_email: null, acheteur_prenom: 'Anonyme' })
      .eq('acheteur_email', email);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'adoption') {
    const { error } = await admin.from('adoption_posts').update({ email: null }).eq('email', email);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'commentaire') {
    const { error } = await admin.from('article_comments').update({ email: null }).eq('email', email);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
}
