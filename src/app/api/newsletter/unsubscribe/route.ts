import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t');
  if (!token) {
    return NextResponse.redirect(new URL('/newsletter/unsubscribe?error=invalid', req.url));
  }

  try {
    const email = Buffer.from(token, 'base64url').toString('utf-8');
    if (!email.includes('@')) {
      return NextResponse.redirect(new URL('/newsletter/unsubscribe?error=invalid', req.url));
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('email', email);

    if (error) throw error;

    return NextResponse.redirect(new URL('/newsletter/unsubscribe?success=1', req.url));
  } catch {
    return NextResponse.redirect(new URL('/newsletter/unsubscribe?error=server', req.url));
  }
}
