'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * Barre "Mode admin" en haut d'un article. Vérifiée dans le navigateur (session locale, sans
 * appel réseau) pour que la page puisse rester en cache : le visiteur ne paie plus ce contrôle.
 */
export default function ArticleAdminBar({ slug }: { slug: string }) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => setIsAdmin(!!data.session)).catch(() => {});
  }, []);
  if (!isAdmin) return null;
  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2 bg-gray-900/95 backdrop-blur text-white text-xs fade-up">
      <Pencil size={13} strokeWidth={1.5} className="text-orange-400" />
      <span className="text-gray-400">Mode admin</span>
      <Link href={`/blog-admin/${slug}/edit`}
        className="px-2.5 py-1 bg-orange-500 hover:bg-orange-400 text-white rounded-md font-medium transition-colors">
        Modifier l&apos;article
      </Link>
      <Link href="/blog-admin?tab=articles"
        className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition-colors">
        Tous les articles
      </Link>
    </div>
  );
}
