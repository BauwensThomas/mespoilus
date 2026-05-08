import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();
  await supabase.from('products').update({ in_stock: false }).eq('id', id);

  return NextResponse.json({ success: true });
}
