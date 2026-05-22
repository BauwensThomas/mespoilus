import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed } = await checkRateLimit(`comment:${ip}`, 3_600_000, 5);
  if (!allowed) return NextResponse.json({ error: 'Trop de commentaires, réessayez dans 1h.' }, { status: 429 });

  const { article_slug, author_name, content, email } = await req.json();

  if (!article_slug?.trim())
    return NextResponse.json({ error: 'Article manquant.' }, { status: 400 });
  if (!author_name?.trim() || author_name.trim().length < 2)
    return NextResponse.json({ error: 'Prénom trop court.' }, { status: 400 });
  if (!content?.trim() || content.trim().length < 10)
    return NextResponse.json({ error: 'Commentaire trop court (min. 10 caractères).' }, { status: 400 });
  if (content.trim().length > 1000)
    return NextResponse.json({ error: 'Commentaire trop long (max. 1000 caractères).' }, { status: 400 });

  const cleanEmail = email?.trim().toLowerCase() || null;
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
    return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('article_comments').insert({
    article_slug: article_slug.trim(),
    author_name: author_name.trim(),
    content: content.trim(),
    email: cleanEmail,
  });

  if (error) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });

  // Abonner l'email aux notifications pour cet article
  if (cleanEmail) {
    await supabase.from('comment_subscriptions').upsert(
      { email: cleanEmail, article_slug: article_slug.trim() },
      { onConflict: 'email,article_slug', ignoreDuplicates: true }
    );
  }

  return NextResponse.json({ success: true });
}
