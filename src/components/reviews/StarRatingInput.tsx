'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  value: number;
  onChange: (rating: number) => void;
}

export default function StarRatingInput({ value, onChange }: Props) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onClick={() => onChange(i)}
          aria-label={`${i} étoile${i > 1 ? 's' : ''}`}
          className="p-0.5"
        >
          <Star
            size={28}
            strokeWidth={1.5}
            className={i <= active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}
