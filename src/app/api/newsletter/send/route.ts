import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { sendBulkNewsletter } from '@/lib/resend';
import { emailWrapper } from '@/lib/cron-email';

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { campaignId } = await req.json();
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId requis' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: campaign, error: campaignError } = await admin
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
    }

    if (campaign.status === 'sent') {
      return NextResponse.json({ error: 'Campagne déjà envoyée' }, { status: 409 });
    }

    const { data: subscribers } = await admin
      .from('newsletter_subscribers')
      .select('email')
      .eq('status', 'active');

    const emails = (subscribers ?? []).map((s: { email: string }) => s.email);

    if (emails.length === 0) {
      return NextResponse.json({ error: 'Aucun abonné actif' }, { status: 400 });
    }

    const { sent, failed } = await sendBulkNewsletter({
      subject: campaign.subject,
      html: emailWrapper(campaign.subject, campaign.content_html),
      subscribers: emails,
    });

    await admin
      .from('newsletter_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipients_count: emails.length,
        sent_count: sent,
        failed_count: failed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    return NextResponse.json({ success: true, sent, failed, total: emails.length });
  } catch (err) {
    console.error('[newsletter:send] Exception:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
