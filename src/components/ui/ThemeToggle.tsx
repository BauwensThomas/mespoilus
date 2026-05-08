'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className={`w-8 h-8 ${className}`} />;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Passer en mode jour' : 'Passer en mode nuit'}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base
                  transition-colors duration-150
                  dark:hover:bg-white/10 hover:bg-black/10
                  dark:text-gray-400 text-gray-500 ${className}`}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
