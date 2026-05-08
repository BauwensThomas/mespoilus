'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/blog',        label: 'Blog'       },
  { href: '/#categories', label: 'Animaux'    },
  { href: '/adoption',    label: 'Adoption'   },
  { href: '/#newsletter', label: 'Newsletter' },
];

export default function PublicHeader() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🐾</span>
          <span className="font-bold text-white text-base tracking-tight">Mes Poilus</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 flex-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-gray-400 hover:text-white text-sm font-medium transition-colors duration-150"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/boutique"
            className="ml-auto bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-3 py-1 rounded-lg transition-colors duration-150"
          >
            Boutique
          </Link>
        </div>
      </nav>
    </header>
  );
}
