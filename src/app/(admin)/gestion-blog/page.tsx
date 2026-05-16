import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, XCircle, MessageCircle } from 'lucide-react';

export const revalidate = 0;

async function approveComment(id: string) {
  'use server';
  const supabase = createAdminClient();
  await supabase.from('article_comments').update({ status: 'approved' }).eq('id', id);
  revalidatePath('/gestion-blog');
}

async function rejectComment(id: string) {
  'use server';
  const supabase = createAdminClient();
  await supabase.from('article_comments').update({ status: 'rejected' }).eq('id', id);
  revalidatePath('/gestion-blog');
}

async function getData() {
  const supabase = createAdminClient();
  const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
    supabase
      .from('article_comments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('article_comments')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('article_comments')
      .select('*')
      .eq('status', 'rejected')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);
  return {
    pending:  pendingRes.data  ?? [],
    approved: approvedRes.data ?? [],
    rejected: rejectedRes.data ?? [],
  };
}

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
          <a
            href={`/blog/${c.article_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-600 font-medium truncate hover:underline"
          >
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

export default async function GestionBlogPage() {
  const { pending, approved, rejected } = await getData();

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Blog</h1>
        <p className="text-gray-500 text-base mt-1">Modération des commentaires</p>
      </div>

      {/* En attente */}
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
            {pending.map((c) => <CommentCard key={c.id} c={c} showActions={true} />)}
          </div>
        )}
      </section>

      {/* Approuvés */}
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
            {approved.map((c) => <CommentCard key={c.id} c={c} showActions={false} />)}
          </div>
        )}
      </section>

      {/* Rejetés */}
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
            {rejected.map((c) => <CommentCard key={c.id} c={c} showActions={false} />)}
          </div>
        )}
      </section>
    </div>
  );
}
