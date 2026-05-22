import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { slug } = await params;

  const body = await req.json();
  const { title, excerpt, content, image_url, status } = body;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('articles')
    .update({ title, excerpt, content, image_url, status, updated_at: new Date().toISOString() })
    .eq('slug', slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/blog/${slug}`);
  revalidatePath('/blog');
  revalidatePath('/blog-admin');

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { slug } = await params;

  const supabase = createAdminClient();
  const { error } = await supabase.from('articles').delete().eq('slug', slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/blog');
  revalidatePath('/blog-admin');

  return NextResponse.json({ success: true });
}
