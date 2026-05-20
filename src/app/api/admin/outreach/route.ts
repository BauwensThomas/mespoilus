import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';
import { createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('outreach_campaigns')
    .select('id, subject, emails, sent_count, failed_count, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { subject, html, emails } = await req.json();

  if (!subject || !html || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: 'subject, html et emails requis' }, { status: 400 });
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const email of emails) {
    try {
      await sendEmail({ to: email, subject, html });
      sent++;
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      failed++;
      errors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const supabase = createAdminClient();
  await supabase.from('outreach_campaigns').insert({
    subject,
    html,
    emails,
    sent_count: sent,
    failed_count: failed,
    errors,
  });

  return NextResponse.json({ sent, failed, errors });
}
