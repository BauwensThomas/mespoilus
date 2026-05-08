'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { AwinProduct } from '@/types';

export default function ProductCard({ product }: { product: AwinProduct }) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  async function reportBroken() {
    await fetch('/api/products/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id }),
    });
    setHidden(true);
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:shadow-md hover:border-amber-400/30 transition-all shadow-sm">
      <div className="relative h-44 bg-gray-50 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🐾</div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1">
          {product.currency === 'USD' && <img src="https://flagcdn.com/16x12/us.png" alt="US" />}
          {product.currency === 'CAD' && <img src="https://flagcdn.com/16x12/ca.png" alt="CA" />}
          {product.currency === 'GBP' && <img src="https://flagcdn.com/16x12/gb.png" alt="GB" />}
          {product.currency === 'EUR' && <img src="https://flagcdn.com/16x12/eu.png" alt="EU" />}
          {product.merchant_name}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">{product.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
          <span className="text-amber-600 font-bold text-base">
            {product.price.toFixed(2)} {product.currency}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={reportBroken}
              title="Signaler un lien cassé"
              className="text-gray-300 hover:text-red-400 text-xs transition-colors"
            >
              ✕
            </button>
            <a
              href={product.affiliate_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Voir sur le site →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
