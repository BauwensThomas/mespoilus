'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  label?: string;
}

export default function BackButton({ label = '← Retour' }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors duration-150"
    >
      {label}
    </button>
  );
}
