import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import { emailWrapper } from '@/lib/cron-email';
import { isSameOriginRequest } from '@/lib/security';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mespoilus.com';

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: 'Origine invalide' }, { status: 403 });
  try {
    const { email, guide_id, newsletter_consent } = await req.json();

    // 1. Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });
    }

    if (!guide_id) {
      return NextResponse.json({ error: 'Guide introuvable.' }, { status: 400 });
    }

    const normalizedEmail = (email as string).toLowerCase().trim();
    const supabase = createAdminClient();

    // 2. Check guide exists
    const { data: guide, error: guideError } = await supabase
      .from('pdf_guides')
      .select('id, title, file_path')
      .eq('id', guide_id)
      .eq('active', true)
      .maybeSingle();

    if (guideError || !guide) {
      return NextResponse.json({ error: 'Guide introuvable.' }, { status: 404 });
    }

    // 3. Generate token & expiry
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 4. Insert into pdf_downloads
    const { error: downloadError } = await supabase.from('pdf_downloads').insert({
      guide_id: guide.id,
      email: normalizedEmail,
      token,
      expires_at: expiresAt,
    });

    if (downloadError) {
      console.error('[guides/request] pdf_downloads insert:', downloadError);
      return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
    }

    // 5. Insert into pdf_consents
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null;

    await supabase.from('pdf_consents').insert({
      email: normalizedEmail,
      guide_id: guide.id,
      newsletter_consent: Boolean(newsletter_consent),
      ip_address: ipAddress,
    });

    // 6. Newsletter upsert if consent given
    if (newsletter_consent) {
      await supabase
        .from('newsletter_subscribers')
        .upsert(
          { email: normalizedEmail, status: 'active', source: 'landing_page' },
          { onConflict: 'email' }
        );
    }

    // 7. Build download URL and send email
    const downloadUrl = `${APP_URL}/api/guides/download/${token}`;

    await sendEmail({
      to: normalizedEmail,
      subject: `Votre guide PDF : ${guide.title}`,
      html: emailWrapper('Votre guide est pret !', `
        <p>Bonjour,</p>
        <p>Merci pour votre interet ! Voici votre lien pour telecharger <strong>${guide.title}</strong> :</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${downloadUrl}" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px">Telecharger mon guide PDF</a>
        </p>
        <p style="color:#6b7280;font-size:13px">Ce lien est valable 24 heures.</p>
      `),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[guides/request] Exception:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
