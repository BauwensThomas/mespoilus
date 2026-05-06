import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, source = 'landing_page' } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ success: true, message: 'already_subscribed' });
      }
      await supabase
        .from('newsletter_subscribers')
        .update({ status: 'active', unsubscribed_at: null, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      return NextResponse.json({ success: true, message: 'resubscribed' });
    }

    const { error } = await supabase.from('newsletter_subscribers').insert({
      email: normalizedEmail,
      first_name: firstName?.trim() || null,
      source,
    });

    if (error) {
      console.error('[newsletter:subscribe]', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'subscribed' });
  } catch (err) {
    console.error('[newsletter:subscribe] Exception:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
