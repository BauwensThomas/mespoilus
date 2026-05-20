'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import PublicHeader from './PublicHeader';
import VetFinderPanel from '@/components/vet/VetFinderPanel';
import RefugeFinderPanel from '@/components/refuge/RefugeFinderPanel';
import { getFlagUrl } from '@/lib/partenaires';
import clsx from 'clsx';
import AnimalDayPopup from '@/components/ui/AnimalDayPopup';

interface DbPartenaire {
  id: string; nom: string; description: string | null; logo_url: string | null;
  url: string | null; urls_by_country: Record<string, string> | null;
  tag: string | null; tag_bg: string; tag_text: string; pays: string[];
  display_mode?: string;
}

const ADMIN_PREFIXES = ['/dashboard', '/agents', '/orchestrate', '/adoption-admin', '/produits-admin', '/guides-admin', '/races-admin', '/blog-admin', '/boutique-admin', '/partenaires-admin'];

function PartenairesBandeau() {
  const [partenaires, setPartenaires] = useState<DbPartenaire[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/partenaires?bandeau=1').then(r => r.json()).then(setPartenaires).catch(() => {});
  }, []);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  useEffect(() => {
    if (partenaires.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % partenaires.length);
        setVisible(true);
        setShowPicker(false);
      }, 400);
    }, 15000);
    return () => clearInterval(interval);
  }, [partenaires.length]);

  const partenaire = partenaires[index];
  if (!partenaire) return null;

  const hasCountryPicker = !!partenaire.urls_by_country;

  const innerContent = (
    <>
      <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold shrink-0">Partenaire</span>
      <span className="w-px h-3 bg-gray-200 shrink-0" />
      {partenaire.logo_url && partenaire.display_mode !== 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={partenaire.logo_url} alt={partenaire.nom} className="h-5 object-contain shrink-0" />
      ) : (
        <span className="font-bold text-gray-900 shrink-0">{partenaire.nom}</span>
      )}
      {(partenaire.pays ?? []).map(code => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={code} src={getFlagUrl(code)} alt={code} style={{ width: '18px', height: '13px', objectFit: 'cover' }} className="rounded-[2px] border border-gray-200 shrink-0" />
      ))}
      {partenaire.tag && (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0" style={{ backgroundColor: partenaire.tag_bg ?? '#f3f4f6', color: partenaire.tag_text ?? '#374151' }}>
          {partenaire.tag}
        </span>
      )}
      <span className="w-px h-3 bg-gray-200 shrink-0" />
      {partenaire.description && (
        <span className="text-gray-500 truncate flex-1 min-w-0">{partenaire.description}</span>
      )}
    </>
  );

  const innerClass = "max-w-7xl w-full mx-auto px-6 h-9 flex items-center gap-2.5 text-xs text-gray-600 hover:text-orange-600 transition-colors";

  return (
    <div className="sticky top-20 z-30 bg-white/95 backdrop-blur border-b border-gray-100 hidden md:block w-full">
      <div className="flex items-center w-full relative" ref={pickerRef}>
        <a
          href={hasCountryPicker ? '#' : (partenaire.url ?? '#')}
          target={hasCountryPicker ? undefined : '_blank'}
          rel={hasCountryPicker ? undefined : 'noopener noreferrer sponsored'}
          onClick={hasCountryPicker ? (e) => { e.preventDefault(); setShowPicker(v => !v); } : undefined}
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}
          className={innerClass + (hasCountryPicker ? ' cursor-pointer' : '')}
        >
          {innerContent}
        </a>

        {showPicker && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 flex z-50">
            {Object.entries(partenaire.urls_by_country!).map(([code, url]) => (
              <a
                key={code}
                href={url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => setShowPicker(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getFlagUrl(code)} alt={code} style={{ width: '20px', height: '15px', objectFit: 'cover' }} className="rounded-[2px] border border-gray-200 shrink-0" />
                {code === 'FR' ? 'France' : code === 'BE' ? 'Belgique' : code}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LayoutShell({ children, pendingCount = 0 }: { children: React.ReactNode; pendingCount?: number }) {
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
      <div className="h-screen flex bg-white text-gray-900">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} initialPendingCount={pendingCount} />
        <main className={clsx('flex-1 h-screen overflow-auto bg-gray-50 transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-0')}>
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
      <RefugeFinderPanel />
      <VetFinderPanel />
      <AnimalDayPopup />
    </>
  );
}
