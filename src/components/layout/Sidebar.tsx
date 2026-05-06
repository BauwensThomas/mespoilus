'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AGENTS } from '@/lib/agents/config';
import { logout } from '@/app/actions/auth';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',   icon: '⚡' },
  { href: '/orchestrate', label: 'Orchestrer', icon: '🎯' },
  { href: '/moderation', label: 'Modération',  icon: '🛡️' },
  { href: '/blog',       label: 'Blog',        icon: '📝' },
  { href: '/boutique',   label: 'Boutique',    icon: '' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0d1117] border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-sm">
            🐾
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-wide">Mes Poilus</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Multi-Agent System</div>
          </div>
        </Link>
      </div>

      {/* Nav principal */}
      <nav className="px-3 pt-4 pb-2">
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-all duration-150',
              pathname === href
                ? 'bg-white/10 text-white font-medium'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            )}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Séparateur agents */}
      <div className="px-6 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Agents</p>
      </div>

      {/* Liste agents */}
      <nav className="px-3 flex-1 overflow-y-auto scrollbar-thin">
        {Object.values(AGENTS).map((agent) => {
          const isActive = pathname === `/agents/${agent.id}`;
          return (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-all duration-150',
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              )}
            >
              <span className="text-base leading-none">{agent.icon}</span>
              <div className="min-w-0">
                <div className={clsx('font-medium text-xs truncate', isActive ? 'text-white' : 'text-gray-300')}>
                  {agent.name}
                </div>
                <div className="text-[10px] text-gray-500 truncate">{agent.role}</div>
              </div>
              <div className="ml-auto flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-70" />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer avec déconnexion */}
      <div className="px-4 py-4 border-t border-gray-800 space-y-2">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                       text-gray-400 hover:text-red-400 hover:bg-red-400/10
                       transition-all duration-150"
          >
            <span>⎋</span>
            <span>Se déconnecter</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
