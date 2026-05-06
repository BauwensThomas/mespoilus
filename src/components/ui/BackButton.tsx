'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  label?: string;
  href?: string;
}

export default function BackButton({ label = '← Accueil', href }: BackButtonProps) {
  const router = useRouter();

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors duration-150"
      >
        {label}
      </Link>
    );
  }

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors duration-150"
    >
      {label}
    </button>
  );
}
