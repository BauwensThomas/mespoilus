import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function checkAuth() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  return user;
}

export async function GET() {
  const user = await checkAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('pdf_guides')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guides: data ?? [] });
}

export async function POST(req: Request) {
  const user = await checkAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, category, slug, file_path, pages_count, active } = body;

  if (!title || !category || !slug || !file_path) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('pdf_guides')
    .insert({ title, description, category, slug, file_path, pages_count: pages_count ?? 1, active: active ?? true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guide: data });
}

export async function PATCH(req: Request) {
  const user = await checkAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('pdf_guides')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guide: data });
}

export async function DELETE(req: Request) {
  const user = await checkAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();

  // Récupère le file_path avant suppression pour nettoyer le Storage
  const { data: guide } = await supabase
    .from('pdf_guides')
    .select('file_path')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('pdf_guides').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Supprime le fichier du Storage (non bloquant)
  if (guide?.file_path) {
    await supabase.storage.from('pdf-guides').remove([guide.file_path]);
  }

  return NextResponse.json({ success: true });
}
