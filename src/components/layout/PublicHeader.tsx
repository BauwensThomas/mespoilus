'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';

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
    <header className="border-b sticky top-0 z-30 dark:bg-[#111827] bg-white dark:border-[#2a3a4a] border-gray-200">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🐾</span>
          <span className="font-bold dark:text-white text-gray-900 text-base tracking-tight">Mes Poilus</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 flex-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900 text-sm font-medium transition-colors duration-150"
            >
              {label}
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/boutique"
              className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-3 py-1 rounded-lg transition-colors duration-150"
            >
              Boutique
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
