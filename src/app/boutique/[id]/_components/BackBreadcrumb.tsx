'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface BackBreadcrumbProps {
  category: string;
  categoryLabel: string;
  productName: string;
}

export default function BackBreadcrumb({ category, categoryLabel, productName }: BackBreadcrumbProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/boutique');
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <button
        onClick={handleBack}
        className="hover:text-orange-600 transition-colors flex items-center gap-1"
      >
        <ChevronLeft size={15} />
        Boutique
      </button>
      <span>/</span>
      <button
        onClick={handleBack}
        className="hover:text-orange-600 transition-colors"
      >
        {categoryLabel}
      </button>
      <span>/</span>
      <span className="text-gray-700 line-clamp-1">{productName}</span>
    </div>
  );
}
