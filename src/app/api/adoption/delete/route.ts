import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { isSameOriginRequest } from '@/lib/security';

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: 'Origine invalide' }, { status: 403 });
  const ip = getClientIP(req);
  const { allowed } = await checkRateLimit(`adoption-delete:${ip}`, 3_600_000, 10);
  if (!allowed) return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 1h.' }, { status: 429 });

  try {
    const { id, token, reason } = await req.json();
    if (!id || !token) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });

    const deletedReason = reason === 'adopted' ? 'adopted' : 'error';

    const supabase = createAdminClient();
    const { data: post } = await supabase
      .from('adoption_posts')
      .select('delete_token')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (!post) return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 });
    if (!post.delete_token || post.delete_token !== (token as string).trim().toUpperCase()) {
      return NextResponse.json({ error: 'Code incorrect' }, { status: 403 });
    }

    // Soft delete + anonymisation RGPD (données personnelles effacées, stats conservées)
    const { error: updateError } = await supabase.from('adoption_posts').update({
      status:         'deleted',
      deleted_at:     new Date().toISOString(),
      deleted_by:     'user',
      deleted_reason: deletedReason,
      poster_name:    'Anonymisé',
      email:          'supprime@mespoilus.com',
      contact_info:   null,
    }).eq('id', id);

    if (updateError) {
      console.error('[adoption:delete] update error:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[adoption:delete]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
