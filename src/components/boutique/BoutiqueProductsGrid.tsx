'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, List, ExternalLink, Package } from 'lucide-react';
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

function GridCard({ product }: { product: AwinProduct }) {
  const countryCode = getCountryCode(product);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-xl hover:border-orange-300 transition-all duration-300 shadow-md group">
      <div className="relative h-48 bg-gradient-to-br from-orange-50 to-blue-50 overflow-hidden">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill unoptimized
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-gray-300" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
          {countryCode && <img src={`https://flagcdn.com/16x12/${countryCode}.png`} alt={countryCode.toUpperCase()} className="w-4 h-3" />}
          {product.merchant_name}
        </p>
        <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 flex-1">{product.description}</p>
        )}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
          <span className="font-bold text-lg text-orange-600">
            {product.price.toFixed(2)} <span className="text-sm text-gray-500">{product.currency}</span>
          </span>
          <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
            className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1.5"
            aria-label={`Voir ${product.name}`}>
            Voir <ExternalLink size={14} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  );
}

function ListRow({ product }: { product: AwinProduct }) {
  const countryCode = getCountryCode(product);
  return (
    <div className="bg-white border border-gray-200 rounded-xl flex items-center gap-4 px-4 py-3 hover:shadow-md hover:border-orange-300 transition-all duration-200 group">
      <div className="relative w-16 h-16 flex-shrink-0 bg-gradient-to-br from-orange-50 to-blue-50 rounded-lg overflow-hidden">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill unoptimized
            className="object-contain p-1" sizes="64px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={24} className="text-gray-300" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
          {countryCode && <img src={`https://flagcdn.com/16x12/${countryCode}.png`} alt={countryCode.toUpperCase()} className="w-4 h-3" />}
          {product.merchant_name}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{product.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-bold text-base text-orange-600 whitespace-nowrap">
          {product.price.toFixed(2)} <span className="text-xs text-gray-400">{product.currency}</span>
        </span>
        <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
          className="text-xs font-semibold px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1"
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
}

export default function BoutiqueProductsGrid({ products, total, affiliate, category, search }: Props) {
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const saved = localStorage.getItem('boutique-view');
    if (saved === 'list' || saved === 'grid') setView(saved);
  }, []);

  function toggle(v: 'grid' | 'list') {
    setView(v);
    localStorage.setItem('boutique-view', v);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {total.toLocaleString('fr-FR')} produit{total !== 1 ? 's' : ''}
          {affiliate ? ` · ${affiliate}` : category && category !== 'all' ? ` · ${category}` : ''}
          {search ? ` · "${search}"` : ''}
        </h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => toggle('grid')}
            className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}
            aria-label="Vue grille"
          >
            <LayoutGrid size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => toggle('list')}
            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}
            aria-label="Vue liste"
          >
            <List size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map(p => <GridCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map(p => <ListRow key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
