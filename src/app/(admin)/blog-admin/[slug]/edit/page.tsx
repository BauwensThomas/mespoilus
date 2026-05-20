import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EditArticleClient from './EditArticleClient';

export const revalidate = 0;

interface Props {
  params: { slug: string };
}

async function getArticle(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('articles')
    .select('slug, title, excerpt, content, image_url, status, category')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

async function updateArticle(slug: string, formData: FormData) {
  'use server';
  const supabase = createAdminClient();
  await supabase.from('articles').update({
    title:     (formData.get('title') as string).trim(),
    excerpt:   (formData.get('excerpt') as string).trim(),
    content:   (formData.get('content') as string),
    image_url: (formData.get('image_url') as string).trim() || null,
    status:    formData.get('status') as string,
    updated_at: new Date().toISOString(),
  }).eq('slug', slug);

  revalidatePath(`/blog/${slug}`);
  revalidatePath('/blog');
  revalidatePath('/blog-admin');
  redirect('/blog-admin?tab=articles');
}

export default async function EditArticlePage({ params }: Props) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const update = updateArticle.bind(null, params.slug);

  return (
    <div className="px-6 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/blog-admin?tab=articles"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} strokeWidth={1.5} />
          Retour aux articles
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-bold text-gray-900">Modifier l'article</h1>
        <span className="text-xs text-gray-400 font-mono">{article.slug}</span>
      </div>

      <EditArticleClient article={article} updateAction={update} />
    </div>
  );
}
