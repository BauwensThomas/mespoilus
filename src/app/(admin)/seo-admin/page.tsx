import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, XCircle, Search, AlertTriangle, ExternalLink } from 'lucide-react';
import { applySuggestion, type SeoSuggestion } from '@/lib/seo-apply';

export const revalidate = 0;

// ─── Actions ─────────────────────────────────────────────────────────────────

async function approveSeoSuggestion(id: string, formData: FormData) {
  'use server';
  const supabase = createAdminClient();

  const { data: suggestion } = await supabase.from('seo_suggestions').select('*').eq('id', id).single();
  if (!suggestion || suggestion.status !== 'pending') { revalidatePath('/seo-admin'); return; }

  const editedValue = formData.get('value')?.toString().trim();
  const finalValue = editedValue && suggestion.suggestion_type !== 'internal_link' ? editedValue : suggestion.proposed_value;

  await supabase.from('seo_suggestions').update({
    proposed_value: finalValue,
    status: 'approved',
    reviewed_at: new Date().toISOString(),
  }).eq('id', id);

  const result = await applySuggestion({ ...(suggestion as SeoSuggestion), proposed_value: finalValue });

  await supabase.from('seo_suggestions').update({
    status: result.ok ? 'applied' : 'failed',
    error_message: result.ok ? null : result.error,
    applied_at: result.ok ? new Date().toISOString() : null,
  }).eq('id', id);

  revalidatePath('/seo-admin');
}

async function rejectSeoSuggestion(id: string) {
  'use server';
  const supabase = createAdminClient();
  const { data: suggestion } = await supabase.from('seo_suggestions').select('status').eq('id', id).single();
  if (!suggestion || suggestion.status !== 'pending') { revalidatePath('/seo-admin'); return; }

  await supabase.from('seo_suggestions').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/seo-admin');
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getData() {
  const supabase = createAdminClient();
  const [pendingRes, doneRes, closedRes] = await Promise.all([
    supabase.from('seo_suggestions').select('*').eq('status', 'pending').order('detected_at', { ascending: true }),
    supabase.from('seo_suggestions').select('*').in('status', ['approved', 'applied']).order('reviewed_at', { ascending: false }).limit(20),
    supabase.from('seo_suggestions').select('*').in('status', ['rejected', 'failed']).order('reviewed_at', { ascending: false }).limit(20),
  ]);
  return {
    pending: (pendingRes.data ?? []) as Suggestion[],
    done: (doneRes.data ?? []) as Suggestion[],
    closed: (closedRes.data ?? []) as Suggestion[],
  };
}

// ─── Composants ────────────────────────────────────────────────────────────

type Suggestion = {
  id: string; page: string; page_type: string; suggestion_type: 'title' | 'meta' | 'internal_link';
  current_value: string | null; proposed_value: string; anchor_text: string | null; target_url: string | null;
  reasoning: string; opportunity_type: string; status: string; error_message: string | null; detected_at: string;
};

const PAGE_TYPE_LABELS: Record<string, string> = { blog: 'Blog', produit: 'Boutique', race: 'Races', statique: 'Pages statiques', racine: 'Accueil' };
const OPPORTUNITY_LABELS: Record<string, string> = { page2: 'Page 2 Google', low_ctr: 'CTR faible', regression: 'Régression' };
const SUGGESTION_TYPE_LABELS: Record<string, string> = { title: 'Titre', meta: 'Meta description', internal_link: 'Lien interne' };

function SuggestionCard({ s, showActions }: { s: Suggestion; showActions: boolean }) {
  const approveWithId = approveSeoSuggestion.bind(null, s.id);
  const rejectWithId = rejectSeoSuggestion.bind(null, s.id);
  const date = formatDistanceToNow(new Date(s.detected_at), { addSuffix: true, locale: fr });

  return (
    <form action={approveWithId} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <a href={s.page} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 hover:text-orange-600 inline-flex items-center gap-1">
          {s.page} <ExternalLink size={11} strokeWidth={1.5} />
        </a>
        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{SUGGESTION_TYPE_LABELS[s.suggestion_type]}</span>
        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{OPPORTUNITY_LABELS[s.opportunity_type] ?? s.opportunity_type}</span>
        <span className="text-gray-400 ml-auto">{date}</span>
      </div>

      {s.suggestion_type === 'internal_link' ? (
        <div className="text-sm">
          <span className="text-gray-500">Lien à ajouter : </span>
          <span className="font-medium text-gray-900">&laquo;&nbsp;{s.anchor_text}&nbsp;&raquo;</span>
          <span className="text-gray-400 mx-1">→</span>
          <span className="text-orange-600">{s.target_url}</span>
        </div>
      ) : (
        <div className="space-y-1">
          {s.current_value && <p className="text-sm text-gray-400 line-through">{s.current_value}</p>}
          {showActions ? (
            <input
              name="value"
              defaultValue={s.proposed_value}
              className="w-full text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          ) : (
            <p className="text-sm font-medium text-gray-900">{s.proposed_value}</p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 italic">{s.reasoning}</p>

      {s.status === 'failed' && s.error_message && (
        <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} strokeWidth={1.5} /> {s.error_message}</p>
      )}

      {showActions && (
        <div className="flex gap-2 pt-1">
          <button type="submit" className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors">
            <CheckCircle2 size={13} strokeWidth={1.5} /> Valider
          </button>
          <button type="submit" formAction={rejectWithId} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors">
            <XCircle size={13} strokeWidth={1.5} /> Rejeter
          </button>
        </div>
      )}
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SeoAdminPage() {
  const { pending, done, closed } = await getData();

  const pendingByType = pending.reduce<Record<string, Suggestion[]>>((acc, s) => {
    (acc[s.page_type] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Suggestions SEO</h1>
        <p className="text-gray-500 text-base mt-1">Opportunités détectées via Google Search Console, générées par Lucas</p>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} strokeWidth={1.5} className="text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">En attente</h2>
          {pending.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-600 text-white">{pending.length}</span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-gray-400 text-sm">Aucune suggestion en attente.</p>
          </div>
        ) : (
          Object.entries(pendingByType).map(([pageType, items]) => (
            <div key={pageType} className="mb-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{PAGE_TYPE_LABELS[pageType] ?? pageType}</h3>
              <div className="space-y-3">
                {items.map(s => <SuggestionCard key={s.id} s={s} showActions={true} />)}
              </div>
            </div>
          ))
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={18} strokeWidth={1.5} className="text-green-600" />
          <h2 className="text-lg font-bold text-gray-900">Validées</h2>
          <span className="text-xs text-gray-400">(20 dernières)</span>
        </div>
        {done.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-gray-400 text-sm">Aucune suggestion validée.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {done.map(s => <SuggestionCard key={s.id} s={s} showActions={false} />)}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <XCircle size={18} strokeWidth={1.5} className="text-red-500" />
          <h2 className="text-lg font-bold text-gray-900">Rejetées / échouées</h2>
          <span className="text-xs text-gray-400">(20 dernières)</span>
        </div>
        {closed.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-gray-400 text-sm">Aucune suggestion rejetée.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {closed.map(s => <SuggestionCard key={s.id} s={s} showActions={false} />)}
          </div>
        )}
      </section>
    </div>
  );
}
