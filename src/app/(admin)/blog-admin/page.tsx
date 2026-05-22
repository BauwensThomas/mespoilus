import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, XCircle, MessageCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import ArticlesPanel from '@/components/blog/ArticlesPanel';
import { notifyCommentSubscribers } from '@/lib/commentNotify';

export const revalidate = 0;

// ─── Actions ─────────────────────────────────────────────────────────────────

async function approveComment(id: string) {
  'use server';
  const supabase = createAdminClient();
  await supabase.from('article_comments').update({ status: 'approved' }).eq('id', id);
  await notifyCommentSubscribers(id);
  revalidatePath('/blog-admin');
}

async function rejectComment(id: string) {
  'use server';
  const supabase = createAdminClient();
  await supabase.from('article_comments').update({ status: 'rejected' }).eq('id', id);
  revalidatePath('/blog-admin');
}

async function deleteArticle(formData: FormData) {
  'use server';
  const slug = formData.get('slug') as string;
  if (!slug) return;
  const supabase = createAdminClient();
  await supabase.from('articles').delete().eq('slug', slug);
  revalidatePath('/blog');
  revalidatePath('/blog-admin');
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getData() {
  const supabase = createAdminClient();
  const [pendingRes, approvedRes, rejectedRes, articlesRes] = await Promise.all([
    supabase.from('article_comments').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
    supabase.from('article_comments').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(20),
    supabase.from('article_comments').select('*').eq('status', 'rejected').order('created_at', { ascending: false }).limit(20),
    supabase.from('articles').select('id, slug, title, category, published_at, status, reading_time, image_url').order('published_at', { ascending: false }).limit(200),
  ]);
  return {
    pending:  pendingRes.data  ?? [],
    approved: approvedRes.data ?? [],
    rejected: rejectedRes.data ?? [],
    articles: articlesRes.data ?? [],
  };
}

// ─── Composant commentaire ────────────────────────────────────────────────────

type Comment = { id: string; article_slug: string; author_name: string; content: string; created_at: string; status: string };

function CommentCard({ c, showActions }: { c: Comment; showActions: boolean }) {
  const approveWithId = approveComment.bind(null, c.id);
  const rejectWithId  = rejectComment.bind(null, c.id);
  const date = formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: fr });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-start">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-sm text-gray-900">{c.author_name}</span>
          <span className="text-xs text-gray-400">sur</span>
          <a href={`/blog/${c.article_slug}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-orange-600 font-medium truncate hover:underline">
            {c.article_slug}
          </a>
          <span className="text-xs text-gray-400 ml-auto">{date}</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
      </div>
      {showActions && (
        <div className="flex gap-2 flex-shrink-0">
          <form action={approveWithId}>
            <button type="submit" className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors">
              <CheckCircle2 size={13} strokeWidth={1.5} /> Approuver
            </button>
          </form>
          <form action={rejectWithId}>
            <button type="submit" className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors">
              <XCircle size={13} strokeWidth={1.5} /> Rejeter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: { tab?: string };
}

export default async function GestionBlogPage({ searchParams }: PageProps) {
  const { pending, approved, rejected, articles } = await getData();
  const tab = searchParams.tab === 'commentaires' ? 'commentaires' : 'articles';

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Blog</h1>
        <p className="text-gray-500 text-base mt-1">Gestion des articles et commentaires</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-gray-200">
        <Link href="/blog-admin?tab=articles"
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'articles' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <BookOpen size={15} strokeWidth={1.5} />
          Articles
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 ml-0.5">
            {articles.length}
          </span>
        </Link>
        <Link href="/blog-admin?tab=commentaires"
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'commentaires' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <MessageCircle size={15} strokeWidth={1.5} />
          Commentaires
          {pending.length > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white ml-0.5">
              {pending.length}
            </span>
          )}
        </Link>
      </div>

      {/* Onglet Articles */}
      {tab === 'articles' && (
        <ArticlesPanel articles={articles} deleteAction={deleteArticle} />
      )}

      {/* Onglet Commentaires */}
      {tab === 'commentaires' && (
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle size={18} strokeWidth={1.5} className="text-orange-600" />
              <h2 className="text-lg font-bold text-gray-900">En attente</h2>
              {pending.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-600 text-white">{pending.length}</span>
              )}
            </div>
            {pending.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-gray-400 text-sm">Aucun commentaire en attente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map(c => <CommentCard key={c.id} c={c} showActions={true} />)}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} strokeWidth={1.5} className="text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">Approuvés</h2>
              <span className="text-xs text-gray-400">(20 derniers)</span>
            </div>
            {approved.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-gray-400 text-sm">Aucun commentaire approuvé.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approved.map(c => <CommentCard key={c.id} c={c} showActions={false} />)}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <XCircle size={18} strokeWidth={1.5} className="text-red-500" />
              <h2 className="text-lg font-bold text-gray-900">Rejetés</h2>
              <span className="text-xs text-gray-400">(20 derniers)</span>
            </div>
            {rejected.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-gray-400 text-sm">Aucun commentaire rejeté.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rejected.map(c => <CommentCard key={c.id} c={c} showActions={false} />)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
