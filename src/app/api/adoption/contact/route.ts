import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { emailWrapper } from '@/lib/cron-email';

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed } = await checkRateLimit(`adoption-contact:${ip}`, 3_600_000, 5);
  if (!allowed) return NextResponse.json({ error: 'Trop de messages. Réessayez dans 1h.' }, { status: 429 });

  try {
    const { id, name, from_email, message } = await req.json();

    if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ error: 'Prénom requis' }, { status: 400 });
    if (!from_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from_email))
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    if (!message?.trim() || message.trim().length < 10)
      return NextResponse.json({ error: 'Message trop court (min. 10 caractères)' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: post } = await supabase
      .from('adoption_posts')
      .select('email, poster_name, animal_type, region')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (!post) return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 });

    await sendEmail({
      to: post.email,
      replyTo: from_email,
      subject: `${name} est intéressé(e) par votre ${post.animal_type} - Mes Poilus`,
      html: emailWrapper("Quelqu'un est intéressé par votre animal !", `
        <p>Bonjour <strong>${post.poster_name}</strong>,</p>
        <p><strong>${name}</strong> souhaite adopter votre <strong>${post.animal_type}</strong> (${post.region}) et vous a laissé un message :</p>
        <div style="background:#f9fafb;border-left:3px solid #ea580c;padding:12px 16px;border-radius:4px;margin:16px 0">
          <p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap">${message.trim()}</p>
        </div>
        <p>Pour répondre, cliquez simplement sur "Répondre" - votre message partira directement à <strong>${name}</strong> (${from_email}).</p>
        <p style="font-size:12px;color:#9ca3af">Ce message a été transmis via Mes Poilus. Votre adresse email n'a pas été communiquée.</p>
      `),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[adoption:contact]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
