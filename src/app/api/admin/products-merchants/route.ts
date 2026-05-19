import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const NON_AWIN = ['Amazon FR', 'CanadaPetCare'];

export async function GET() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from('products')
    .select('merchant_name')
    .gt('price', 0)
    .not('merchant_name', 'in', `(${NON_AWIN.map(m => `"${m}"`).join(',')})`);

  const merchants = [...new Set((data ?? []).map(d => d.merchant_name).filter(Boolean))].sort() as string[];
  return NextResponse.json({ merchants });
}
