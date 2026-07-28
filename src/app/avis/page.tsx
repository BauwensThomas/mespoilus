import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import StarRatingDisplay from '@/components/reviews/StarRatingDisplay';
import ReviewsSummary from '@/components/reviews/ReviewsSummary';
import ReviewForm from '@/components/reviews/ReviewForm';
import { formatReviewDate } from '@/lib/formatReviewDate';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Avis clients - Mes Poilus',
  description: 'Découvrez les avis de nos visiteurs et laissez le vôtre sur Mes Poilus.',
  alternates: { canonical: '/avis' },
};

async function getReviews() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('reviews')
    .select('id, name, rating, comment, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  const reviews = data ?? [];
  const total = reviews.length;
  const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

  return { reviews, total, average };
}

export default async function AvisPage() {
  const { reviews, total, average } = await getReviews();

  return (
    <div className="min-h-screen px-4 md:px-8 py-5 md:py-6 max-w-6xl mx-auto space-y-4">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Ce qu'ils en pensent</h1>
        <ReviewsSummary average={average} total={total} />
      </div>

      <ReviewForm />

      <div className="space-y-2.5">
        {reviews.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">Aucun avis pour le moment. Soyez le premier à en laisser un !</p>
        )}
        {reviews.map(r => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="font-semibold text-sm text-gray-900">{r.name}</span>
              <span className="text-xs text-gray-400 shrink-0">{formatReviewDate(r.created_at)}</span>
            </div>
            <StarRatingDisplay rating={r.rating} size={14} />
            {r.comment && <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
