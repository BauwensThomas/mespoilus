import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateFaq } from '@/lib/generate-faq';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Génère la FAQ des articles publiés qui n'en ont pas encore (par lots, relançable).
const BATCH = 10;

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const supabase = createAdminClient();

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, content')
    .eq('status', 'published')
    .is('faq', null)
    .limit(BATCH);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!articles || articles.length === 0) {
    return NextResponse.json({ done: true, processed: 0, message: 'Tous les articles ont déjà une FAQ.' });
  }

  let processed = 0;
  let withFaq = 0;
  const details: { title: string; questions: number }[] = [];

  for (const a of articles) {
    try {
      const faq = await generateFaq(a.title, a.content ?? '');
      // On stocke même un tableau vide [] pour marquer l'article comme traité (≠ null)
      await supabase.from('articles').update({ faq }).eq('id', a.id);
      processed++;
      if (faq.length > 0) withFaq++;
      details.push({ title: a.title.slice(0, 60), questions: faq.length });
    } catch (e) {
      details.push({ title: a.title.slice(0, 60), questions: -1 });
      console.error('[backfill-faq] erreur:', e instanceof Error ? e.message : e);
    }
  }

  // Reste-t-il des articles sans FAQ ? (pour savoir s'il faut relancer)
  const { count: remaining } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .is('faq', null);

  return NextResponse.json({
    done: (remaining ?? 0) === 0,
    processed,
    withFaq,
    remaining: remaining ?? 0,
    details,
  });
}
