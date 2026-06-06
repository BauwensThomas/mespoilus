import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Endpoint appelé par ManyChat (External Request) quand un abonné Instagram
// laisse son email → ajout à newsletter_subscribers (source 'instagram_manychat').
// Sécurité : header x-api-key === process.env.MANYCHAT_SECRET (à définir sur Vercel).
export async function POST(req: NextRequest) {
  if (!process.env.MANYCHAT_SECRET || req.headers.get('x-api-key') !== process.env.MANYCHAT_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const rawEmail = typeof body.email === 'string' ? body.email : '';
    const rawName = typeof body.first_name === 'string'
      ? body.first_name
      : (typeof body.firstName === 'string' ? body.firstName : '');

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      // 200 + message : ManyChat peut afficher un message "email invalide" sans planter le flow
      return NextResponse.json({ ok: false, message: 'invalid_email' });
    }

    const email = rawEmail.toLowerCase().trim();
    const firstName = rawName.trim() || null;
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      if (existing.status !== 'active') {
        await supabase
          .from('newsletter_subscribers')
          .update({ status: 'active', unsubscribed_at: null, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        return NextResponse.json({ ok: true, message: 'resubscribed' });
      }
      return NextResponse.json({ ok: true, message: 'already_subscribed' });
    }

    const { error } = await supabase.from('newsletter_subscribers').insert({
      email,
      first_name: firstName,
      source: 'instagram_manychat',
    });

    if (error) {
      console.error('[manychat:subscribe]', error.message);
      return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'subscribed' });
  } catch (err) {
    console.error('[manychat:subscribe] Exception:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
