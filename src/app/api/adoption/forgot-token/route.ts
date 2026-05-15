import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

const BASE_URL = 'https://mespoilus.com';

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed } = checkRateLimit(`forgot-token:${ip}`, 3_600_000, 5);
  if (!allowed) return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 1h.' }, { status: 429 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: post } = await supabase
      .from('adoption_posts')
      .select('email, poster_name, animal_type, region, delete_token')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    // Réponse identique que le post existe ou non (anti-énumération)
    if (!post?.delete_token) {
      return NextResponse.json({ success: true });
    }

    const deleteUrl = `${BASE_URL}/adoption/supprimer?id=${id}&token=${post.delete_token}`;

    await sendEmail({
      to: post.email,
      subject: 'Votre code de suppression — Mes Poilus',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
          <h2 style="color:#f97316">Votre code de suppression</h2>
          <p>Bonjour <strong>${post.poster_name}</strong>,</p>
          <p>Voici votre code pour supprimer votre annonce (<strong>${post.animal_type}</strong>, ${post.region}) :</p>
          <p style="font-family:monospace;font-size:26px;font-weight:bold;letter-spacing:6px;color:#111;background:#f3f4f6;padding:14px 20px;border-radius:8px;text-align:center">${post.delete_token}</p>
          <p style="font-size:13px;color:#6b7280;margin-top:16px">Ou supprimez directement en cliquant ici :</p>
          <div style="text-align:center;margin:16px 0">
            <a href="${deleteUrl}" style="display:inline-block;background:#ef4444;color:#fff;font-weight:600;font-size:14px;padding:11px 24px;border-radius:10px;text-decoration:none">
              Supprimer mon annonce
            </a>
          </div>
          <p style="font-size:12px;color:#9ca3af">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          <p>-L'équipe Mes Poilus</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[adoption:forgot-token]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
