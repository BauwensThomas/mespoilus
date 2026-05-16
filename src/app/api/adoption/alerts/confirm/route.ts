import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token');
  const base = new URL(req.url).origin;

  if (!token) return NextResponse.redirect(`${base}/adoption?alert_error=1`);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('adoption_alerts')
    .update({ confirmed: true })
    .eq('confirm_token', token);

  if (error) return NextResponse.redirect(`${base}/adoption?alert_error=1`);
  return NextResponse.redirect(`${base}/adoption?alert_ok=1`);
}
