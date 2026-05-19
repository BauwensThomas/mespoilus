import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

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

const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

export default async function EditArticlePage({ params }: Props) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const update = updateArticle.bind(null, params.slug);

  return (
    <div className="px-8 py-8 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/blog-admin?tab=articles"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} strokeWidth={1.5} />
          Retour aux articles
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Modifier l'article</h1>
        <p className="text-gray-500 text-sm mt-1 font-mono">{article.slug}</p>
      </div>

      <form action={update} className="space-y-5">
        {/* Titre */}
        <div>
          <label className={labelCls}>Titre</label>
          <input type="text" name="title" defaultValue={article.title} required className={inputCls} />
        </div>

        {/* Résumé */}
        <div>
          <label className={labelCls}>Résumé (excerpt)</label>
          <textarea name="excerpt" rows={2} defaultValue={article.excerpt ?? ''} className={inputCls} />
        </div>

        {/* Contenu */}
        <div>
          <label className={labelCls}>Contenu (Markdown)</label>
          <textarea
            name="content"
            rows={28}
            defaultValue={article.content ?? ''}
            className={`${inputCls} font-mono text-xs leading-relaxed resize-y`}
          />
        </div>

        {/* Image URL */}
        <div>
          <label className={labelCls}>URL image</label>
          <input type="text" name="image_url" defaultValue={article.image_url ?? ''} placeholder="https://…" className={inputCls} />
          {article.image_url && (
            <img src={article.image_url} alt="" className="mt-2 h-28 w-auto rounded-lg border border-gray-200 object-cover" />
          )}
        </div>

        {/* Statut */}
        <div>
          <label className={labelCls}>Statut</label>
          <select name="status" defaultValue={article.status} className={inputCls}>
            <option value="published">Publié</option>
            <option value="draft">Brouillon</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl transition-colors">
            <Save size={15} strokeWidth={1.5} />
            Enregistrer
          </button>
          <Link href="/blog-admin?tab=articles"
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Annuler
          </Link>
          <a href={`/blog/${article.slug}`} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs text-gray-400 hover:text-orange-600 transition-colors">
            Voir l'article public →
          </a>
        </div>
      </form>
    </div>
  );
}
