'use client';

import { useState, useMemo } from 'react';
import { Save, Eye, PawPrint, Monitor, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { marked } from 'marked';
import ImageUploader from './ImageUploader';

interface Props {
  createAction: (formData: FormData) => Promise<void>;
}

const CATEGORIES = [
  { id: 'general',  label: 'Général' },
  { id: 'chiens',   label: 'Chiens' },
  { id: 'chats',    label: 'Chats' },
  { id: 'oiseaux',  label: 'Oiseaux' },
  { id: 'rongeurs', label: 'Rongeurs' },
  { id: 'reptiles', label: 'Reptiles' },
];

const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

function slugify(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function NewArticleClient({ createAction }: Props) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [category, setCategory] = useState('general');
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [faq, setFaq] = useState('');
  const [status, setStatus] = useState('draft');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Slug auto-dérivé du titre tant que l'utilisateur ne l'a pas modifié à la main
  const effectiveSlug = slugEdited ? slug : slugify(title);

  const htmlContent = useMemo(() => {
    try {
      return marked.parse(content, { gfm: true }) as string;
    } catch {
      return '';
    }
  }, [content]);

  const catLabel = CATEGORIES.find(c => c.id === category)?.label ?? category;

  return (
    <div className="flex gap-6 h-full">
      {/* ── Colonne gauche : formulaire ── */}
      <div className="w-1/2 flex-shrink-0">
        <form action={createAction} className="space-y-4">

          <div>
            <label className={labelCls}>Titre <span className="text-red-500">*</span></label>
            <input
              type="text" name="title" required
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ex. Où adopter un chien ou un chat ? Les meilleurs refuges…"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Slug (adresse de l'article)
              <span className="text-gray-400 font-normal"> — auto depuis le titre, modifiable</span>
            </label>
            <input
              type="text" name="slug"
              value={effectiveSlug}
              onChange={e => { setSlug(slugify(e.target.value)); setSlugEdited(true); }}
              placeholder="refuges-adopter-chien-chat"
              className={`${inputCls} font-mono text-xs`}
            />
            <p className="text-[11px] text-gray-400 mt-1">URL finale : /blog/{effectiveSlug || '…'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Catégorie</label>
              <select name="category" value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Statut</label>
              <select name="status" value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Résumé (excerpt) <span className="text-gray-400 font-normal">— phrase d'accroche affichée dans les listes</span></label>
            <textarea
              name="excerpt" rows={2}
              value={excerpt} onChange={e => setExcerpt(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Meta description <span className="text-gray-400 font-normal">— pour Google (≈ 150-160 caractères)</span></label>
            <textarea
              name="meta_description" rows={2}
              value={metaDescription} onChange={e => setMetaDescription(e.target.value)}
              className={inputCls}
            />
            <p className="text-[11px] text-gray-400 mt-1">{metaDescription.length} caractères</p>
          </div>

          <div>
            <label className={labelCls}>Contenu (Markdown) <span className="text-red-500">*</span></label>
            <ImageUploader />
            <textarea
              name="content" rows={22} required
              value={content} onChange={e => setContent(e.target.value)}
              placeholder={'## Un sous-titre\n\nTon paragraphe ici. **Gras**, [lien](https://…), listes :\n\n- point 1\n- point 2'}
              className={`${inputCls} font-mono text-xs leading-relaxed resize-y mt-2`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>URL image principale</label>
              <input
                type="text" name="image_url"
                value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                placeholder="https://…" className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Texte alternatif de l'image</label>
              <input
                type="text" name="image_alt"
                value={imageAlt} onChange={e => setImageAlt(e.target.value)}
                placeholder="Ex. Chien adopté en refuge" className={inputCls}
              />
            </div>
          </div>
          {imageUrl && (
            <img src={imageUrl} alt="" className="h-24 w-auto rounded-lg border border-gray-200 object-cover" />
          )}

          <div>
            <label className={labelCls}>
              FAQ <span className="text-gray-400 font-normal">— optionnel · une question par ligne, format <code className="text-orange-600">Question :: Réponse</code></span>
            </label>
            <textarea
              name="faq" rows={4}
              value={faq} onChange={e => setFaq(e.target.value)}
              placeholder={'Combien coûte une adoption ? :: En général entre 75 et 275 €.\nFaut-il un rendez-vous ? :: Oui, la plupart des refuges reçoivent sur RDV.'}
              className={`${inputCls} text-xs`}
            />
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Save size={15} strokeWidth={1.5} />
              Créer l'article
            </button>
            <Link href="/blog-admin?tab=articles"
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Annuler
            </Link>
          </div>
        </form>
      </div>

      {/* ── Colonne droite : prévisualisation live ── */}
      <div className="w-1/2 min-w-0">
        <div className="sticky top-6">
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

          <div className="max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl">
            <div className={previewMode === 'mobile' ? 'flex justify-center bg-gray-100 rounded-2xl p-4' : ''}>
            <div
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm w-full"
              style={previewMode === 'mobile' ? { maxWidth: '390px', width: '100%' } : {}}
            >
              {imageUrl && (
                <div className={`relative w-full overflow-hidden bg-gray-100 ${previewMode === 'mobile' ? 'h-36' : 'h-48'}`}>
                  <img src={imageUrl} alt={imageAlt || title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              )}

              <div className={previewMode === 'mobile' ? 'p-4' : 'p-6'}>
                <div className="flex items-center gap-1.5 mb-3">
                  <PawPrint size={12} strokeWidth={1.5} className="text-orange-500" />
                  <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wide">
                    {catLabel}
                  </span>
                </div>

                <h1 className={`font-bold text-gray-900 leading-tight mb-3 ${previewMode === 'mobile' ? 'text-lg' : 'text-xl'}`}>
                  {title || 'Titre…'}
                </h1>

                {excerpt && (
                  <p className="text-sm text-gray-500 italic mb-5 pb-4 border-b border-gray-100">{excerpt}</p>
                )}

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
                  dangerouslySetInnerHTML={{ __html: htmlContent || '<p style="color:#9ca3af">Le contenu s\'affichera ici au fur et à mesure…</p>' }}
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
