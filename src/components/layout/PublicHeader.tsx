'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { PawPrint, ChevronDown, Calculator, HelpCircle, Sparkles, BookOpen, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/blog',        label: 'Blog'       },
  { href: '/#categories', label: 'Animaux'    },
  { href: '/adoption',    label: 'Adoption'   },
  { href: '/#newsletter', label: 'Newsletter' },
];

const TOOLS = [
  { href: '/outils/age',    label: 'Calculateur d\'âge',      desc: 'Animal ↔ humain',          icon: Calculator },
  { href: '/outils/quiz',   label: 'Quel animal pour moi ?',  desc: 'Quiz en 6 questions',       icon: HelpCircle },
  { href: '/outils/prenom', label: 'Générateur de prénom',    desc: 'Trouvez le prénom parfait', icon: Sparkles   },
  { href: '/guides',        label: 'Guides PDF gratuits',     desc: 'Checklists & guides pratiques', icon: BookOpen },
];

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const pathname = usePathname();

  function close() { setMobileOpen(false); setToolsOpen(false); }

  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-orange-100 shadow-sm h-20">
      <nav className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" onClick={close} className="flex items-center gap-2.5 shrink-0 group">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg text-white group-hover:shadow-md transition-shadow h-10 w-10 flex items-center justify-center">
            <PawPrint size={24} strokeWidth={1.5} />
          </div>
          <span className="font-bold text-gray-900 text-base tracking-tight">Mes Poilus</span>
        </Link>

        {/* Nav desktop — visible à partir de lg */}
        <div className="hidden md:flex items-center gap-5 flex-1 mx-4">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-gray-600 hover:text-orange-600 font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 rounded px-2 py-1"
            >
              {label}
            </Link>
          ))}

          {/* Dropdown Outils */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-gray-600 hover:text-orange-600 font-medium text-sm transition-colors duration-200 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2">
              Outils
              <ChevronDown size={14} strokeWidth={2} className="transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute left-0 top-full pt-3 hidden group-hover:block z-50 min-w-[260px]">
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-2 space-y-1">
                {TOOLS.map(({ href, label, desc, icon: Icon }) => (
                  <Link key={href} href={href} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-orange-50 transition-colors group/item">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:bg-orange-200 transition-colors">
                      <Icon size={16} strokeWidth={1.5} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover/item:text-orange-700 transition-colors">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Droite : Boutique + hamburger */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/boutique"
            className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 whitespace-nowrap"
            aria-label="Accéder à la boutique"
          >
            Boutique
          </Link>

          {/* Hamburger — visible en dessous de lg */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 px-6 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                pathname === href ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}

          {/* Outils mobile */}
          <div>
            <button
              onClick={() => setToolsOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Outils
              <ChevronDown size={14} strokeWidth={2} className={`transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>
            {toolsOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {TOOLS.map(({ href, label, desc, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={close}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-orange-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} strokeWidth={1.5} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
