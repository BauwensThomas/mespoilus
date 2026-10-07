import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { sendEmail } from '@/lib/resend';
import { isSameOriginRequest } from '@/lib/security';

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: 'Origine invalide' }, { status: 403 });
  const ip = getClientIP(req);
  const { allowed } = await checkRateLimit(`review:${ip}`, 86_400_000, 1);
  if (!allowed) return NextResponse.json({ error: 'Vous avez déjà laissé un avis récemment, merci !' }, { status: 429 });

  const { name, rating, comment } = await req.json();

  if (!name?.trim() || name.trim().length < 2 || name.trim().length > 60)
    return NextResponse.json({ error: 'Nom requis (2 à 60 caractères).' }, { status: 400 });

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5)
    return NextResponse.json({ error: 'Note invalide.' }, { status: 400 });

  if (comment && comment.trim().length > 150)
    return NextResponse.json({ error: 'Commentaire trop long (max. 150 caractères).' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('reviews').insert({
    name: name.trim(),
    rating: ratingNum,
    comment: comment?.trim() || null,
  });

  if (error) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });

  // Notification a l'admin (non bloquant)
  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL ?? 'contact@mespoilus.com',
      subject: `Nouvel avis à modérer - ${ratingNum}/5 (${name.trim()})`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
          <h2 style="color:#ea580c">Nouvel avis à modérer</h2>
          <p><strong>Nom :</strong> ${name.trim()}</p>
          <p><strong>Note :</strong> ${ratingNum}/5</p>
          ${comment?.trim() ? `<p><strong>Commentaire :</strong> ${comment.trim()}</p>` : ''}
          <p><a href="https://www.mespoilus.com/avis-admin" style="color:#ea580c">→ Accéder à la modération</a></p>
        </div>
      `,
    });
  } catch (mailErr) {
    console.error('[reviews:submit] mail admin error:', mailErr);
  }

  return NextResponse.json({ success: true });
}
