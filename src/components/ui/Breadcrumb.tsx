import Link from 'next/link';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mespoilus.com';

export interface Crumb {
  name: string;
  /** Chemin relatif ("/blog/chiens"). Absent pour la page courante (dernier élément). */
  href?: string;
}

/**
 * Fil d'Ariane visible + données structurées BreadcrumbList (un seul composant pour que les
 * deux restent toujours identiques). Le dernier élément est la page courante, non cliquable.
 */
export default function Breadcrumb({ items, currentUrl, className = '' }: { items: Crumb[]; currentUrl: string; className?: string }) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.href ? `${APP_URL}${c.href === '/' ? '' : c.href}` : currentUrl,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav aria-label="Fil d'Ariane" className={`text-sm text-gray-500 ${className}`}>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {items.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <span aria-hidden="true" className="text-gray-300">/</span>}
              {c.href ? (
                <Link href={c.href} className="hover:text-orange-600 transition-colors">{c.name}</Link>
              ) : (
                <span aria-current="page" className="text-gray-700 truncate max-w-[16rem] sm:max-w-md">{c.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
