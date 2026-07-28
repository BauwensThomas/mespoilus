import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, XCircle, Star } from 'lucide-react';
import StarRatingDisplay from '@/components/reviews/StarRatingDisplay';

export const revalidate = 0;

// ─── Actions ─────────────────────────────────────────────────────────────────

async function approveReview(id: string) {
  'use server';
  const supabase = createAdminClient();
  await supabase.from('reviews').update({ status: 'approved' }).eq('id', id);
  revalidatePath('/avis-admin');
  revalidatePath('/');
  revalidatePath('/avis');
}

async function rejectReview(id: string) {
  'use server';
  const supabase = createAdminClient();
  await supabase.from('reviews').update({ status: 'rejected' }).eq('id', id);
  revalidatePath('/avis-admin');
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getData() {
  const supabase = createAdminClient();
  const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
    supabase.from('reviews').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
    supabase.from('reviews').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(20),
    supabase.from('reviews').select('*').eq('status', 'rejected').order('created_at', { ascending: false }).limit(20),
  ]);
  return {
    pending:  pendingRes.data  ?? [],
    approved: approvedRes.data ?? [],
    rejected: rejectedRes.data ?? [],
  };
}

// ─── Composant avis ────────────────────────────────────────────────────────

type Review = { id: string; name: string; rating: number; comment: string | null; created_at: string; status: string };

function ReviewCard({ r, showActions }: { r: Review; showActions: boolean }) {
  const approveWithId = approveReview.bind(null, r.id);
  const rejectWithId  = rejectReview.bind(null, r.id);
  const date = formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-start">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="font-semibold text-sm text-gray-900">{r.name}</span>
          <StarRatingDisplay rating={r.rating} size={13} />
          <span className="text-xs text-gray-400 ml-auto">{date}</span>
        </div>
        {r.comment && <p className="text-sm text-gray-700 leading-relaxed">{r.comment}</p>}
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

export default async function GestionAvisPage() {
  const { pending, approved, rejected } = await getData();

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Avis</h1>
        <p className="text-gray-500 text-base mt-1">Modération des avis clients</p>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Star size={18} strokeWidth={1.5} className="text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">En attente</h2>
          {pending.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-600 text-white">{pending.length}</span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-gray-400 text-sm">Aucun avis en attente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(r => <ReviewCard key={r.id} r={r} showActions={true} />)}
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
            <p className="text-gray-400 text-sm">Aucun avis approuvé.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approved.map(r => <ReviewCard key={r.id} r={r} showActions={false} />)}
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
            <p className="text-gray-400 text-sm">Aucun avis rejeté.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rejected.map(r => <ReviewCard key={r.id} r={r} showActions={false} />)}
          </div>
        )}
      </section>
    </div>
  );
}
