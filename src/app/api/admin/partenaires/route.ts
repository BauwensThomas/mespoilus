import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('partenaires')
    .select('*')
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { data: maxRow } = await supabase
    .from('partenaires')
    .select('ordre')
    .order('ordre', { ascending: false })
    .limit(1)
    .single();
  const nextOrdre = (maxRow?.ordre ?? -1) + 1;
  const { data, error } = await supabase
    .from('partenaires')
    .insert([{ ...body, ordre: nextOrdre }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { id, ...fields } = body;
  const { data, error } = await supabase
    .from('partenaires')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient();
  const { id } = await req.json();
  const { error } = await supabase.from('partenaires').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
