'use client';

import { useState, useMemo } from 'react';
import { Save, Eye, PawPrint, Monitor, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { marked } from 'marked';
import ImageUploader from './ImageUploader';

interface Article {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  status: string;
  category: string;
}

interface Props {
  article: Article;
  updateAction: (formData: FormData) => Promise<void>;
}

const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function EditArticleClient({ article, updateAction }: Props) {
  const [title, setTitle] = useState(article.title ?? '');
  const [excerpt, setExcerpt] = useState(article.excerpt ?? '');
  const [content, setContent] = useState(article.content ?? '');
  const [imageUrl, setImageUrl] = useState(article.image_url ?? '');
  const [status, setStatus] = useState(article.status ?? 'published');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const htmlContent = useMemo(() => {
    try {
      return marked.parse(content, { gfm: true }) as string;
    } catch {
      return '';
    }
  }, [content]);

  return (
    <div className="flex gap-6 h-full">
      {/* ── Colonne gauche : formulaire ── */}
      <div className="w-1/2 flex-shrink-0">
        <form action={updateAction} className="space-y-4">
          <input type="hidden" name="status" value={status} />

          <div>
            <label className={labelCls}>Titre</label>
            <input
              type="text" name="title" required
              value={title} onChange={e => setTitle(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Résumé (excerpt)</label>
            <textarea
              name="excerpt" rows={2}
              value={excerpt} onChange={e => setExcerpt(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Contenu (Markdown)</label>
            <ImageUploader />
            <textarea
              name="content" rows={24}
              value={content} onChange={e => setContent(e.target.value)}
              className={`${inputCls} font-mono text-xs leading-relaxed resize-y mt-2`}
            />
          </div>

          <div>
            <label className={labelCls}>URL image principale</label>
            <input
              type="text" name="image_url"
              value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              placeholder="https://…" className={inputCls}
            />
            {imageUrl && (
              <img src={imageUrl} alt="" className="mt-2 h-24 w-auto rounded-lg border border-gray-200 object-cover" />
            )}
          </div>

          <div>
            <label className={labelCls}>Statut</label>
            <select
              name="status" value={status} onChange={e => setStatus(e.target.value)}
              className={inputCls}
            >
              <option value="published">Publié</option>
              <option value="draft">Brouillon</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Save size={15} strokeWidth={1.5} />
              Enregistrer
            </button>
            <Link href="/blog-admin?tab=articles"
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Annuler
            </Link>
            <a href={`/blog/${article.slug}`} target="_blank" rel="noopener noreferrer"
              className="ml-auto text-xs text-gray-400 hover:text-orange-600 transition-colors">
              Voir public →
            </a>
          </div>
        </form>
      </div>

      {/* ── Colonne droite : prévisualisation live ── */}
      <div className="w-1/2 min-w-0">
        <div className="sticky top-6">
          {/* Header prévisualisation + toggle */}
          <div className="flex items-center gap-2 mb-3">
            <Eye size={14} strokeWidth={1.5} className="text-orange-600" />
            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide flex-1">Prévisualisation</span>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${previewMode === 'desktop' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Monitor size={13} strokeWidth={1.5} />
                Ordi
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${previewMode === 'mobile' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Smartphone size={13} strokeWidth={1.5} />
                Mobile
              </button>
            </div>
          </div>

          {/* Conteneur prévisualisation */}
          <div className="max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl">
            <div className={previewMode === 'mobile' ? 'flex justify-center bg-gray-100 rounded-2xl p-4' : ''}>
            <div
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm w-full"
              style={previewMode === 'mobile' ? { maxWidth: '390px', width: '100%' } : {}}
            >
              {/* Image hero */}
              {imageUrl && (
                <div className={`relative w-full overflow-hidden bg-gray-100 ${previewMode === 'mobile' ? 'h-36' : 'h-48'}`}>
                  <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              )}

              <div className={previewMode === 'mobile' ? 'p-4' : 'p-6'}>
                {/* Catégorie */}
                <div className="flex items-center gap-1.5 mb-3">
                  <PawPrint size={12} strokeWidth={1.5} className="text-orange-500" />
                  <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wide">
                    {article.category}
                  </span>
                </div>

                {/* Titre */}
                <h1 className={`font-bold text-gray-900 leading-tight mb-3 ${previewMode === 'mobile' ? 'text-lg' : 'text-xl'}`}>
                  {title || 'Titre…'}
                </h1>

                {/* Excerpt */}
                {excerpt && (
                  <p className="text-sm text-gray-500 italic mb-5 pb-4 border-b border-gray-100">{excerpt}</p>
                )}

                {/* Corps */}
                <div
                  className={`prose prose-base max-w-none
                    prose-headings:font-semibold
                    prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                    prose-h4:text-base prose-h4:mt-6 prose-h4:mb-2
                    prose-p:leading-[1.85] prose-p:my-5
                    prose-a:text-orange-600 prose-a:underline prose-a:decoration-orange-400 prose-a:underline-offset-2 prose-a:font-medium hover:prose-a:text-orange-500
                    prose-strong:font-semibold
                    prose-ul:my-5 prose-ol:my-5
                    prose-li:my-1.5 prose-li:leading-relaxed
                    prose-hr:border-gray-200 prose-hr:my-8
                    prose-blockquote:border-l-2 prose-blockquote:border-l-orange-400 prose-blockquote:bg-orange-50 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:my-8
                    prose-code:text-orange-700 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                    article-content ${previewMode === 'mobile' ? 'article-content-mobile' : ''}`}
                  style={{ color: '#1f2937' }}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
