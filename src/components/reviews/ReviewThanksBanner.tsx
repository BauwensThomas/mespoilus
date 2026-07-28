'use client';

import { useSearchParams } from 'next/navigation';

export default function ReviewThanksBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('avis') !== 'merci') return null;

  return (
    <div className="bg-green-50 border-b border-green-200 text-green-700 text-sm text-center py-2.5 px-4">
      Merci pour votre avis ! Il sera visible après validation.
    </div>
  );
}
