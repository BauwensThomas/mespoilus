'use client';

import { useState } from 'react';
import { ExternalLink, Package, EyeOff, Eye } from 'lucide-react';
import Image from 'next/image';
import type { AwinProduct } from '@/types';

const MERCHANT_COUNTRY: Record<string, string> = {
  'tuft & paw': 'us',
  'canadapetcare': 'ca',
};

function getCountryCode(product: AwinProduct): string | null {
  const nameKey = product.merchant_name.toLowerCase().replace(/\s+(fr|be|de|nl|es|it|uk)$/i, '').trim();
  const suffix = product.merchant_name.match(/\s+(FR|BE|DE|NL|ES|IT|UK)$/)?.[1]?.toLowerCase() ?? null;
  return MERCHANT_COUNTRY[nameKey] ?? suffix ?? (
    product.currency === 'USD' ? 'us' :
    product.currency === 'CAD' ? 'ca' :
    product.currency === 'GBP' ? 'gb' : null
  );
}

interface CardProps {
  product: AwinProduct;
  isAdmin: boolean;
  isHidden: boolean;
  onToggle: (url: string) => void;
}

function GridCard({ product, isAdmin, isHidden, onToggle }: CardProps) {
  const countryCode = getCountryCode(product);
  return (
    <div className={`border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 shadow-md group relative ${
      isHidden
        ? 'bg-gray-800 border-gray-700 opacity-60'
        : 'bg-white border-gray-200 hover:shadow-xl hover:border-orange-300'
    }`}>
      <div className="relative h-48 bg-gradient-to-br from-orange-50 to-blue-50 overflow-hidden">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill unoptimized
            className={`object-contain p-4 transition-transform duration-300 group-hover:scale-105 ${isHidden ? 'grayscale' : ''}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-gray-300" strokeWidth={1} />
          </div>
        )}
        {isAdmin && (
          <button
            onClick={() => onToggle(product.affiliate_url)}
            title={isHidden ? 'Rendre visible' : 'Cacher ce produit'}
            className={`absolute top-2 right-2 p-1.5 rounded-lg shadow transition-colors ${
              isHidden
                ? 'bg-orange-500 text-white hover:bg-orange-400 opacity-100'
                : 'bg-white/90 text-gray-500 hover:bg-orange-100 hover:text-orange-600 opacity-0 group-hover:opacity-100'
            }`}
          >
            {isHidden ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}
          </button>
        )}
      </div>
      <div className={`p-5 flex flex-col gap-3 flex-1 ${isHidden ? 'text-gray-400' : ''}`}>
        <p className={`text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 ${isHidden ? 'text-gray-500' : 'text-gray-500'}`}>
          {countryCode && <img src={`https://flagcdn.com/16x12/${countryCode}.png`} alt={countryCode.toUpperCase()} className="w-4 h-3" />}
          {product.merchant_name}
        </p>
        <h3 className={`text-base font-bold leading-snug line-clamp-2 transition-colors ${isHidden ? 'text-gray-400' : 'text-gray-900 group-hover:text-orange-600'}`}>
          {product.name}
        </h3>
        {product.description && (
          <p className={`text-sm leading-relaxed line-clamp-2 flex-1 ${isHidden ? 'text-gray-500' : 'text-gray-600'}`}>{product.description}</p>
        )}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
          <span className={`font-bold text-lg ${isHidden ? 'text-gray-500' : 'text-orange-600'}`}>
            {product.price.toFixed(2)} <span className="text-sm text-gray-500">{product.currency}</span>
          </span>
          <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
            className={`text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              isHidden ? 'bg-gray-600 text-gray-300' : 'bg-orange-600 hover:bg-orange-500 text-white'
            }`}
            aria-label={`Voir ${product.name}`}>
            Voir <ExternalLink size={14} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  );
}

function ListRow({ product, isAdmin, isHidden, onToggle }: CardProps) {
  const countryCode = getCountryCode(product);
  return (
    <div className={`border rounded-xl flex items-center gap-4 px-4 py-3 transition-all duration-200 group ${
      isHidden
        ? 'bg-gray-800 border-gray-700 opacity-60'
        : 'bg-white border-gray-200 hover:shadow-md hover:border-orange-300'
    }`}>
      <div className="relative w-16 h-16 flex-shrink-0 bg-gradient-to-br from-orange-50 to-blue-50 rounded-lg overflow-hidden">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill unoptimized
            className={`object-contain p-1 ${isHidden ? 'grayscale' : ''}`} sizes="64px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={24} className="text-gray-300" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs flex items-center gap-1 mb-0.5 ${isHidden ? 'text-gray-500' : 'text-gray-400'}`}>
          {countryCode && <img src={`https://flagcdn.com/16x12/${countryCode}.png`} alt={countryCode.toUpperCase()} className="w-4 h-3" />}
          {product.merchant_name}
          {isAdmin && isHidden && <span className="ml-1 text-[10px] font-semibold bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded-full">Masque</span>}
        </p>
        <h3 className={`text-sm font-semibold truncate transition-colors ${isHidden ? 'text-gray-400' : 'text-gray-900 group-hover:text-orange-600'}`}>
          {product.name}
        </h3>
        {product.description && (
          <p className={`text-xs truncate mt-0.5 ${isHidden ? 'text-gray-600' : 'text-gray-500'}`}>{product.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`font-bold text-base whitespace-nowrap ${isHidden ? 'text-gray-500' : 'text-orange-600'}`}>
          {product.price.toFixed(2)} <span className="text-xs text-gray-400">{product.currency}</span>
        </span>
        {isAdmin && (
          <button
            onClick={() => onToggle(product.affiliate_url)}
            title={isHidden ? 'Rendre visible' : 'Cacher ce produit'}
            className={`p-1.5 rounded-lg transition-colors ${
              isHidden
                ? 'text-orange-400 hover:bg-orange-900/30 hover:text-orange-300'
                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            {isHidden ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}
          </button>
        )}
        <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
          className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
            isHidden ? 'bg-gray-600 text-gray-300' : 'bg-orange-600 hover:bg-orange-500 text-white'
          }`}
          aria-label={`Voir ${product.name}`}>
          Voir <ExternalLink size={12} strokeWidth={1.5} />
        </a>
      </div>
    </div>
  );
}

interface Props {
  products: AwinProduct[];
  total: number;
  affiliate?: string;
  category?: string;
  search?: string;
  view?: 'grid' | 'list';
  isAdmin?: boolean;
  initialHiddenUrls?: string[];
}

export default function BoutiqueProductsGrid({
  products,
  total,
  affiliate,
  category,
  search,
  view = 'grid',
  isAdmin = false,
  initialHiddenUrls = [],
}: Props) {
  const [hiddenSet, setHiddenSet] = useState<Set<string>>(() => new Set(initialHiddenUrls));

  async function handleToggle(url: string) {
    const wasHidden = hiddenSet.has(url);
    // Optimistic update
    setHiddenSet(prev => {
      const next = new Set(prev);
      wasHidden ? next.delete(url) : next.add(url);
      return next;
    });
    await fetch('/api/admin/products-hidden', {
      method: wasHidden ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affiliate_url: url }),
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {total.toLocaleString('fr-FR')} produit{total !== 1 ? 's' : ''}
          {affiliate ? ` · ${affiliate}` : category && category !== 'all' ? ` · ${category}` : ''}
          {search ? ` · "${search}"` : ''}
        </h2>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map(p => (
            <GridCard
              key={p.id}
              product={p}
              isAdmin={isAdmin}
              isHidden={hiddenSet.has(p.affiliate_url)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map(p => (
            <ListRow
              key={p.id}
              product={p}
              isAdmin={isAdmin}
              isHidden={hiddenSet.has(p.affiliate_url)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
