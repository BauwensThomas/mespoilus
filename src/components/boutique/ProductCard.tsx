import Image from 'next/image';
import { ExternalLink, Package } from 'lucide-react';
import type { AwinProduct } from '@/types';

export default function ProductCard({ product }: { product: AwinProduct }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-xl hover:border-orange-300 transition-all duration-300 shadow-md group focus-within:ring-2 focus-within:ring-orange-300">
      <div className="relative h-48 bg-gradient-to-br from-orange-50 to-blue-50 overflow-hidden focus-within:ring-2 focus-within:ring-orange-300">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-smooth"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-gray-300" strokeWidth={1} />
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
          {product.currency === 'USD' && <img src="https://flagcdn.com/16x12/us.png" alt="US" className="w-4 h-3" />}
          {product.currency === 'CAD' && <img src="https://flagcdn.com/16x12/ca.png" alt="CA" className="w-4 h-3" />}
          {product.currency === 'GBP' && <img src="https://flagcdn.com/16x12/gb.png" alt="GB" className="w-4 h-3" />}
          {product.currency === 'EUR' && <img src="https://flagcdn.com/16x12/eu.png" alt="EU" className="w-4 h-3" />}
          {product.merchant_name}
        </p>
        <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 flex-1">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
          <span className="text-orange-600 font-bold text-lg">
            {product.price.toFixed(2)} <span className="text-sm text-gray-600">{product.currency}</span>
          </span>
          <a
            href={product.affiliate_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
            aria-label={`Voir le produit: ${product.name}`}
          >
            Voir
            <ExternalLink size={14} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  );
}
