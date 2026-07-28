import { Star } from 'lucide-react';

interface Props {
  rating: number;
  size?: number;
}

export default function StarRatingDisplay({ rating, size = 16 }: Props) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} sur 5 étoiles`}>
      {[1, 2, 3, 4, 5].map(i => {
        // Remplissage proportionnel (ex: note 4.5 -> 4 etoiles pleines + la 5e a moitie remplie)
        const fillPct = Math.max(0, Math.min(1, rating - (i - 1))) * 100;
        return (
          <span key={i} className="relative inline-block shrink-0" style={{ width: size, height: size }}>
            <Star size={size} strokeWidth={1.5} className="absolute inset-0 text-gray-300" />
            {fillPct > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPct}%` }}>
                <Star size={size} strokeWidth={1.5} className="fill-amber-400 text-amber-400" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
