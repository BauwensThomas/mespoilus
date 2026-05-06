'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import PublicHeader from './PublicHeader';

const ADMIN_PREFIXES = ['/dashboard', '/agents', '/orchestrate', '/moderation'];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isAdmin) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <>
      <PublicHeader />
      {children}
    </>
  );
}
