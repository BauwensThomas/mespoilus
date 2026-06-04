import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NewArticleClient from './NewArticleClient';

export const revalidate = 0;

function slugify(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // enlève les accents
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function createArticle(formData: FormData) {
  'use server';
  const supabase = createAdminClient();

  const title = (formData.get('title') as string ?? '').trim();
  const content = (formData.get('content') as string ?? '');
  if (!title || !content.trim()) {
    redirect('/blog-admin/new?error=1'); // titre et contenu obligatoires
  }

  // Slug : fourni (nettoyé) ou dérivé du titre
  const rawSlug = (formData.get('slug') as string ?? '').trim();
  const baseSlug = slugify(rawSlug || title) || 'article';

  // Déduplication du slug
  let slug = baseSlug;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await supabase.from('articles').select('id').eq('slug', slug).maybeSingle();
    if (!data) break;
    slug = `${baseSlug}-${n++}`;
  }

  const category = (formData.get('category') as string) || 'general';
  const excerpt = ((formData.get('excerpt') as string) ?? '').trim() || null;
  const metaDescription = ((formData.get('meta_description') as string) ?? '').trim() || null;
  const imageUrl = ((formData.get('image_url') as string) ?? '').trim() || null;
  const imageAlt = ((formData.get('image_alt') as string) ?? '').trim() || null;
  const status = (formData.get('status') as string) === 'published' ? 'published' : 'draft';

  // FAQ : une paire par ligne, format "Question :: Réponse"
  const faqRaw = ((formData.get('faq') as string) ?? '').trim();
  const faq = faqRaw
    ? faqRaw.split('\n').map(line => {
        const idx = line.indexOf('::');
        if (idx === -1) return null;
        const q = line.slice(0, idx).trim();
        const a = line.slice(idx + 2).trim();
        return q && a ? { q, a } : null;
      }).filter(Boolean)
    : [];

  // Temps de lecture sur le vrai nombre de mots (≈ 200 mots/min)
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  await supabase.from('articles').insert({
    title,
    slug,
    content,
    category,
    excerpt,
    meta_description: metaDescription,
    image_url: imageUrl,
    image_alt: imageAlt,
    status,
    reading_time: readingTime,
    faq: faq.length ? faq : null,
    published_at: status === 'published' ? new Date().toISOString() : null,
  });

  revalidatePath('/blog');
  revalidatePath('/blog-admin');
  revalidatePath(`/blog/${slug}`);
  redirect('/blog-admin?tab=articles');
}

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewArticlePage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div className="px-6 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/blog-admin?tab=articles"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} strokeWidth={1.5} />
          Retour aux articles
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-bold text-gray-900">Créer un article</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          Le titre et le contenu sont obligatoires.
        </div>
      )}

      <NewArticleClient createAction={createArticle} />
    </div>
  );
}
