import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const admin = createAdminClient();
  const { data: files, error } = await admin.storage
    .from('grille-backups')
    .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csvFiles = (files ?? []).filter(f => f.name.endsWith('.csv'));

  // URLs signées valables 1h
  const backups = await Promise.all(
    csvFiles.map(async f => {
      const { data: signed } = await admin.storage
        .from('grille-backups')
        .createSignedUrl(f.name, 3600);
      return {
        name: f.name,
        created_at: f.created_at ?? null,
        size: f.metadata?.size ?? null,
        url: signed?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json({ backups });
}
