'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import PublicHeader from './PublicHeader';
import { PARTENAIRES, getFlagUrl } from '@/lib/partenaires';
import clsx from 'clsx';

const ADMIN_PREFIXES = ['/dashboard', '/agents', '/orchestrate', '/moderation'];

function PartenairesBandeau() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (PARTENAIRES.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % PARTENAIRES.length);
        setVisible(true);
      }, 400);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const partenaire = PARTENAIRES[index];
  if (!partenaire) return null;

  return (
    <div className="sticky top-20 z-30 h-9 bg-white/95 backdrop-blur border-b border-gray-100 hidden md:flex items-center w-full">
      <a
        href={partenaire.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}
        className="max-w-7xl w-full mx-auto px-6 flex items-center justify-center gap-2.5 text-xs text-gray-600 hover:text-orange-600 transition-colors"
      >
        <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold shrink-0">Partenaire</span>
        <span className="w-px h-3 bg-gray-200 shrink-0" />
        <span className="font-bold text-gray-900 shrink-0">{partenaire.nom}</span>
        {(partenaire.pays ?? []).map(code => (
          <Image key={code} src={getFlagUrl(code)} alt={code} width={18} height={13} className="rounded-[2px] border border-gray-200 shrink-0" />
        ))}
        {partenaire.tag && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0" style={{ backgroundColor: partenaire.tagBg ?? '#f3f4f6', color: partenaire.tagText ?? '#374151' }}>
            {partenaire.tag}
          </span>
        )}
        <span className="w-px h-3 bg-gray-200 shrink-0" />
        {partenaire.description && (
          <span className="text-gray-500 truncate max-w-xs lg:max-w-md">{partenaire.description}</span>
        )}
      </a>
    </div>
  );
}

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  if (isAdmin) {
    return (
      <div className="min-h-screen flex bg-white text-gray-900">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
        <main className={clsx('flex-1 min-h-screen overflow-auto bg-gray-50 transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-0')}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <>
      <PublicHeader />
      <PartenairesBandeau />
      <main>{children}</main>
    </>
  );
}
