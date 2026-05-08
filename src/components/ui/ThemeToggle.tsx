'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

const OPTIONS = [
  { value: 'light',  label: 'Jour',  icon: '☀️' },
  { value: 'dark',   label: 'Nuit',  icon: '🌙' },
  { value: 'system', label: 'Auto',  icon: '🖥️' },
] as const;

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!mounted) return <div className={`w-8 h-8 ${className}`} />;

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[1];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Changer le thème"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium
                   dark:bg-white/10 bg-black/10 dark:hover:bg-white/20 hover:bg-black/20
                   dark:text-white text-gray-800 transition-colors duration-150"
      >
        <span>{current.icon}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <span className="text-[10px] opacity-60">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-28 rounded-xl border shadow-xl overflow-hidden z-50
                        dark:bg-[#1e2a3a] bg-white dark:border-[#2a3a4a] border-gray-200">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setTheme(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-100
                          ${theme === opt.value
                            ? 'text-amber-500 dark:bg-amber-500/10 bg-amber-50 font-medium'
                            : 'dark:text-gray-300 text-gray-700 dark:hover:bg-white/5 hover:bg-gray-50'
                          }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
              {theme === opt.value && <span className="ml-auto text-amber-500 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
