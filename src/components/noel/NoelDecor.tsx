'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronRight, Gift, Heart } from 'lucide-react';
import { useNoel } from './NoelProvider';

/**
 * Bonnet centré sur le haut d'un logo, plus large que lui : le bord blanc en couvre tout le dessus.
 * Le parent doit être en position relative. Purement décoratif.
 */
export function NoelHat({ className = '' }: { className?: string }) {
  const { decor } = useNoel();
  if (!decor) return null;
  return (
    <svg viewBox="0 0 48 28" className={`absolute left-1/2 -translate-x-1/2 pointer-events-none ${className}`} aria-hidden="true">
      <path d="M5 20C8 8 16 1 26 1c10 0 16 5 17.5 11-3.5-2-6.5-2-9-.5 3.5 2 5.5 5 6.5 8.500z" fill="#dc2626" />
      <path d="M5 20C8 8 16 1 26 1 19 6 16 12 16 20z" fill="#b91c1c" opacity=".4" />
      <rect x="1" y="18" width="46" height="9" rx="4.5" fill="#fff" stroke="#d1d5db" />
      <circle cx="43" cy="13" r="4.2" fill="#fff" stroke="#d1d5db" />
    </svg>
  );
}

// ── Guirlande lumineuse ─────────────────────────────────────────────────────
// Accrochée aux deux bords d'une photo, dessinée pour sa largeur exacte (jamais coupée). Chaque groupe
// d'ampoules allumées est un calque dont SEULE l'opacité varie : géré par la carte graphique, aucun
// redessin de la page.
const COLORS = ['#ef4444', '#fbbf24', '#22c55e', '#3b82f6', '#ef4444', '#fbbf24', '#22c55e', '#3b82f6'];
const ORDER = [3, 6, 0, 5, 2, 7, 1, 4]; // ordre d'allumage "au hasard"
const HEIGHT = 46;
const HOOK_Y = 4;    // crochets, sur les bords de la photo
const EDGE_Y = 22;   // bas de la photo
const SAG = 8;

const dataUri = (width: number, body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}">${body}</svg>`)}")`;
const n1 = (v: number) => Math.round(v * 10) / 10;

/** Fil + ampoules éteintes, puis un calque d'ampoules allumées par couleur du cycle. */
function buildGarland(width: number): { base: string; lit: string[] } {
  const swags = Math.max(3, Math.round(width / 56));
  const step = (width - 4) / swags;
  const point = (p: number) => ({ x: 2 + p * step, y: p === 0 || p === swags ? HOOK_Y : EDGE_Y });
  let wire = '';
  let off = '';
  const lit = COLORS.map(() => '');
  for (let p = 0; p < swags; p++) {
    const a = point(p), b = point(p + 1);
    const cx = (a.x + b.x) / 2, cy = Math.max(a.y, b.y) + SAG;
    wire += `<path d="M${n1(a.x)} ${a.y}Q${n1(cx)} ${cy} ${n1(b.x)} ${b.y}" fill="none" stroke="#166534" stroke-width="1.5"/>`;
    if (p > 0) wire += `<circle cx="${n1(a.x)}" cy="${a.y}" r="1.6" fill="#d4a017"/>`;
    [0.27, 0.73].forEach((t, j) => {
      const u = 1 - t;
      const x = n1(u * u * a.x + 2 * u * t * cx + t * t * b.x);
      const y = n1(u * u * a.y + 2 * u * t * cy + t * t * b.y);
      const c = (p * 2 + j) % COLORS.length;
      off += `<rect x="${x - 1.5}" y="${y - 1}" width="3" height="3" rx="1" fill="#14532d"/><ellipse cx="${x}" cy="${y + 5}" rx="2.8" ry="4" fill="${COLORS[c]}" opacity=".55"/>`;
      lit[c] += `<ellipse cx="${x}" cy="${y + 5.5}" rx="9" ry="10" fill="${COLORS[c]}" opacity=".18"/><ellipse cx="${x}" cy="${y + 5.5}" rx="5.5" ry="7" fill="${COLORS[c]}" opacity=".35"/><ellipse cx="${x}" cy="${y + 5}" rx="2.8" ry="4" fill="${COLORS[c]}"/><ellipse cx="${x - 0.8}" cy="${y + 3.6}" rx=".9" ry="1.5" fill="#fff" opacity=".85"/>`;
    });
  }
  const hook = (x: number) => `<circle cx="${n1(x)}" cy="${HOOK_Y}" r="3" fill="#d4a017" stroke="#8a6508"/><circle cx="${n1(x)}" cy="${HOOK_Y - 0.8}" r=".9" fill="#fff" opacity=".8"/>`;
  return { base: dataUri(width, wire + off + hook(4) + hook(width - 4)), lit: lit.map(body => dataUri(width, body)) };
}

// Cycle de 24 s, comme une guirlande de sapin. Jamais plus d'un clignotement par seconde (accessibilité).
const KEYFRAMES = COLORS.map((_, i) => {
  const rank = ORDER.indexOf(i);
  const on = (from: number, to: number) => `${from}%{opacity:0}${from + 1}%{opacity:1}${to - 1}%{opacity:1}${to}%{opacity:0}`;
  let css = '0%{opacity:0}';
  css += on(1 + rank * 4, 6 + rank * 4);                                  // 1. une par une (1 à 34 %)
  css += on(36, 41) + on(45, 50);                                         // 2. toutes ensemble, deux fois
  css += i % 2 ? on(57, 62) + on(67, 72) : on(52, 57) + on(62, 67);       // 3. une sur deux, en alternance
  css += `${74 + rank * 1.5}%{opacity:0}${76 + rank * 1.5}%{opacity:1}97%{opacity:1}100%{opacity:0}`; // 4. tout s'allume
  return `@keyframes noel-${i}{${css}}`;
}).join('') + '@media (prefers-reduced-motion:reduce){.noel-lit{animation:none!important;opacity:1!important}}';

/**
 * Petite guirlande lumineuse accrochée au bas d'une photo. Le parent est en position relative et de la
 * largeur de la photo ; `className` place la guirlande pour que le bas de la photo tombe à 22 px de son
 * haut ("-top-[22px]" dans un parent de hauteur nulle, "top-full -mt-[22px]" dans celui de la photo).
 * Purement décorative, ne prend aucune place dans la page.
 */
export function NoelGarland({ className = '-top-[22px]' }: { className?: string }) {
  const { decor } = useNoel();
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!decor || !el) return;
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [decor]);

  const art = useMemo(() => (width >= 120 ? buildGarland(width) : null), [width]);
  if (!decor) return null;
  return (
    <div ref={ref} className={`absolute inset-x-0 pointer-events-none ${className}`} style={{ height: HEIGHT }} data-noel="guirlande" aria-hidden="true">
      {art && (
        <>
          <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
          <div className="absolute inset-0" style={{ backgroundImage: art.base, backgroundRepeat: 'no-repeat' }} />
          {art.lit.map((image, i) => (
            <div
              key={i}
              className="noel-lit absolute inset-0"
              style={{ backgroundImage: image, backgroundRepeat: 'no-repeat', opacity: 0, willChange: 'opacity', animation: `noel-${i} 24s linear infinite` }}
            />
          ))}
        </>
      )}
    </div>
  );
}

const GIFT_LINKS = [
  { href: '/boutique?search=noel', icon: Gift, title: 'Idées cadeaux de Noël', text: 'Jouets, friandises et accessoires de fête.' },
  { href: '/boutique?search=calendrier%20avent', icon: CalendarDays, title: "Calendriers de l'Avent", text: 'Pour chats, chiens et rongeurs.' },
];

/** Liens vers les produits de Noël, en haut de la boutique, jusqu'au 25 décembre. */
export function NoelGifts({ className = '' }: { className?: string }) {
  const { gifts } = useNoel();
  if (!gifts) return null;
  return (
    <div className={`grid sm:grid-cols-2 gap-3 ${className}`}>
      {GIFT_LINKS.map(({ href, icon: Icon, title, text }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-green-50 px-4 py-3 hover:border-red-400 transition-colors focus-ring"
        >
          <span className="shrink-0 w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center">
            <Icon size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-gray-900 leading-tight">{title}</span>
            <span className="block text-xs text-gray-600 leading-tight mt-0.5">{text}</span>
          </span>
          <ChevronRight size={18} className="text-red-500 shrink-0" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

export function NoelAdoptionMessage() {
  const { decor } = useNoel();
  if (!decor) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <Heart size={18} className="text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm text-gray-700 leading-relaxed">
        <span className="font-semibold text-gray-900">Un animal n&apos;est pas un cadeau surprise.</span>{' '}
        Adopter, c&apos;est s&apos;engager pour des années : prenez le temps d&apos;y réfléchir avec toute la famille, en dehors de l&apos;agitation des fêtes.
      </p>
    </div>
  );
}
