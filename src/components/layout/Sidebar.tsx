'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AGENTS } from '@/lib/agents/config';
import { logout } from '@/app/actions/auth';
import { Zap, Target, Shield, BookOpen, ShoppingBag, Package, PawPrint, LogOut, Briefcase, PenTool, Search, Smartphone, Code, MessageCircle, BarChart3, Mail, Home, ChevronLeft, Menu, FileText, ClipboardList, Star, Send, Grid3x3 } from 'lucide-react';
import clsx from 'clsx';

function getAgentIcon(iconId: string) {
  const icons: Record<string, typeof PawPrint> = {
    briefcase: Briefcase,
    'pen-tool': PenTool,
    search: Search,
    smartphone: Smartphone,
    code: Code,
    'message-circle': MessageCircle,
    'bar-chart-3': BarChart3,
    shield: Shield,
    mail: Mail,
  };
  return icons[iconId] || PawPrint;
}

const navItems = [
  { href: '/',               label: 'Accueil',          icon: Home,          isPublic: true  },
  { href: '/dashboard',      label: 'Dashboard',        icon: Zap,           isPublic: false },
  { href: '/orchestrate',    label: 'Orchestrer',       icon: Target,        isPublic: false },
  { href: '/adoption-admin', label: 'Adoption',         icon: Shield,        isPublic: false },
  { href: '/blog-admin',     label: 'Blog',             icon: BookOpen,      isPublic: false },
  { href: '/boutique-v2-admin', label: 'Boutique',         icon: ShoppingBag,   isPublic: false },
  { href: '/produits-admin', label: 'Produits affiliés',icon: Package,       isPublic: false },
  { href: '/races-admin',    label: 'Fiches races',     icon: ClipboardList, isPublic: false },
  { href: '/guides-admin',     label: 'Guides PDF',       icon: FileText,      isPublic: false },
  { href: '/partenaires-admin', label: 'Partenaires',     icon: Star,          isPublic: false },
  { href: '/outreach-admin',   label: 'Prospection',      icon: Send,          isPublic: false },
  { href: '/grille-admin',     label: 'Grille mystère',   icon: Grid3x3,       isPublic: false },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  initialPendingCount?: number;
}

export default function Sidebar({ isOpen, onToggle, initialPendingCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(initialPendingCount);
  const [commentCount, setCommentCount] = useState(0);
  const [noPhotoCount, setNoPhotoCount] = useState(0);

  useEffect(() => {
    const refresh = () =>
      fetch('/api/admin/pending-count')
        .then(r => r.json())
        .then(d => {
          setPendingCount(d.count ?? 0);
          setCommentCount(d.commentCount ?? 0);
        })
        .catch(() => {});

    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const refresh = () =>
      fetch('/api/admin/breeds-no-photo-count', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => setNoPhotoCount(d.count ?? 0))
        .catch(() => {});

    refresh();
    const interval = setInterval(refresh, 60_000);
    window.addEventListener('breed-photo-updated', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('breed-photo-updated', refresh);
    };
  }, []);

  return (
    <>
      {/* Bouton rouvrir quand fermé */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-3 top-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-md text-gray-600 hover:text-orange-600 hover:border-orange-200 transition-colors"
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
      )}

      <aside
        className={clsx(
          'fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo + bouton fermer */}
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center">
              <PawPrint size={18} className="text-orange-600" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm tracking-wide">Mes Poilus</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Multi-Agent</div>
            </div>
          </Link>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Nav principal */}
        <nav className="px-3 pt-3 pb-1">
          {navItems.map(({ href, label, icon: Icon, isPublic }) => {
            const isActive = href === '/' ? pathname === '/' : pathname === href;
            const isMod = href === '/adoption-admin';
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all duration-150',
                  isPublic && 'border border-blue-200 bg-blue-50/60',
                  isActive
                    ? 'bg-orange-100 text-orange-700 font-medium border-orange-200'
                    : isPublic
                      ? 'text-blue-700 hover:bg-blue-100 hover:border-blue-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <Icon size={17} strokeWidth={1.5} />
                <span className="flex-1">{label}</span>
                {isMod && pendingCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-600 text-white min-w-[18px] text-center">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
                {href === '/races-admin' && noPhotoCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white min-w-[18px] text-center">
                    {noPhotoCount > 99 ? '99+' : noPhotoCount}
                  </span>
                )}
                {href === '/blog-admin' && commentCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white min-w-[18px] text-center">
                    {commentCount > 99 ? '99+' : commentCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Séparateur agents */}
        <div className="px-5 py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Agents</p>
        </div>

        {/* Liste agents */}
        <nav className="px-3 flex-1 overflow-y-auto scrollbar-thin">
          {Object.values(AGENTS).map((agent) => {
            const isActive = pathname === `/agents/${agent.id}`;
            const IconComponent = getAgentIcon(agent.icon);
            return (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-all duration-150',
                  isActive
                    ? 'bg-orange-100 text-orange-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <IconComponent size={17} strokeWidth={1.5} className="flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className={clsx('font-medium text-sm truncate', isActive ? 'text-orange-700' : 'text-gray-700')}>
                    {agent.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate leading-tight">{agent.role}</div>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-70" />
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-200">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
                         text-gray-600 hover:text-red-600 hover:bg-red-50
                         transition-all duration-150"
            >
              <LogOut size={17} strokeWidth={1.5} />
              <span>Se déconnecter</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
