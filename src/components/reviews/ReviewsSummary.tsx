import StarRatingDisplay from './StarRatingDisplay';

interface Props {
  average: number;
  total: number;
}

export default function ReviewsSummary({ average, total }: Props) {
  if (total === 0) {
    return <p className="text-sm text-gray-500">Aucun avis pour le moment.</p>;
  }

  const avgLabel = average % 1 === 0 ? average.toFixed(0) : average.toFixed(1);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-gray-900">{avgLabel}</span>
        <span className="text-sm text-gray-500">/5</span>
      </div>
      <StarRatingDisplay rating={average} size={20} />
      <p className="text-sm text-gray-500">({total} avis)</p>
    </div>
  );
}
