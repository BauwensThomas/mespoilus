import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const category = formData.get('category') as string | null;
  const slug = formData.get('slug') as string | null;

  if (!file || !category || !slug) {
    return NextResponse.json({ error: 'Fichier, catégorie et slug requis' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Seuls les fichiers PDF sont acceptés' }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fichier trop lourd (max 20 Mo)' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const filePath = `${category}/${slug}.pdf`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from('pdf-guides')
    .upload(filePath, bytes, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ file_path: filePath });
}
