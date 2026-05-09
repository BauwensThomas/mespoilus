'use client';
import { useRef, useEffect, useCallback } from 'react';
import type { Partenaire } from '@/lib/partenaires';
import { getFlagUrl } from '@/lib/partenaires';

const CARD_W = 220;
const STEP = 155;
const CONTAINER_W = 490;
const CONTAINER_H = 145;
const SPEED = 1 / 720;
const MANUAL_SPEED = 0.045;

export default function BoutiquePartenairesCarousel({ partenaires }: { partenaires: Partenaire[] }) {
  const n = partenaires.length;
  const posRef = useRef(0);
  const pausedRef = useRef(false);
  const manualRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const updateCards = useCallback(() => {
    const cards = containerRef.current?.querySelectorAll<HTMLElement>('[data-card]');
    if (!cards) return;
    const pos = posRef.current;

    cards.forEach((el, i) => {
      let dist = i - pos;
      dist = ((dist % n) + n) % n;
      if (dist > n / 2) dist -= n;
      const d = Math.abs(dist);

      const scale = Math.max(0.52, 1 - d * 0.21);
      const opacity = Math.max(0.45, 1 - d * 0.28);
      const zIndex = Math.round(20 - d * 3);
      const x = dist * STEP;
      // t=0 → centre (orange-50), t=1 → côtés (blanc/gris)
      const t = Math.min(1, d);
      // bg: orange-50 (255,247,237) → white (255,255,255)
      const bgG = Math.round(247 + (255 - 247) * t);
      const bgB = Math.round(237 + (255 - 237) * t);
      // border: orange-200 (254,215,170) → gray-300 (209,213,219)
      const bdR = Math.round(254 + (209 - 254) * t);
      const bdG = Math.round(215 + (213 - 215) * t);
      const bdB = Math.round(170 + (219 - 170) * t);

      el.style.transform = `translate(calc(-50% + ${x}px), -50%) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(zIndex);
      el.style.pointerEvents = d < 0.55 ? 'auto' : 'none';
      el.style.backgroundColor = `rgb(255,${bgG},${bgB})`;
      el.style.borderColor = `rgb(${bdR},${bdG},${bdB})`;
    });
  }, [n]);

  const go = useCallback((dir: 'next' | 'prev') => {
    manualRef.current += dir === 'next' ? 1 : -1;
  }, []);

  useEffect(() => {
    updateCards();
    if (n < 3) return;

    const animate = () => {
      if (manualRef.current !== 0) {
        const step = Math.sign(manualRef.current) * Math.min(MANUAL_SPEED, Math.abs(manualRef.current));
        posRef.current = ((posRef.current + step) % n + n) % n;
        manualRef.current -= step;
        if (Math.abs(manualRef.current) < 0.005) manualRef.current = 0;
      } else if (!pausedRef.current) {
        posRef.current = (posRef.current + SPEED) % n;
      }
      updateCards();
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [n, updateCards]);

  if (!partenaires.length) return null;

  return (
    <div className="shrink-0 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-gradient-to-b from-orange-600 to-orange-400 rounded-full" />
        <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">
          Partenaires
        </span>
      </div>

      <div className="flex items-center gap-2">
        {n >= 3 && (
          <button
            onClick={() => go('prev')}
            className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-orange-600 hover:border-orange-300 hover:shadow-lg transition-all text-base font-light z-20"
            aria-label="Précédent"
          >‹</button>
        )}

        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{ width: CONTAINER_W, height: CONTAINER_H }}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          {partenaires.map((p) => (
            <a
              key={p.id}
              data-card
              href={p.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              style={{
                position: 'absolute',
                width: CARD_W,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0,
                zIndex: 0,
                backgroundColor: '#ffffff',
                borderColor: '#d1d5db',
              }}
              className="flex flex-col gap-2 border rounded-xl px-4 py-3 shadow-md hover:shadow-xl cursor-pointer transition-all duration-200 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-gray-900 leading-tight">{p.nom}</span>
                {(p.pays ?? []).map(code => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={code}
                    src={getFlagUrl(code)}
                    alt={code}
                    style={{ width: 18, height: 13, objectFit: 'cover' }}
                    className="shrink-0 rounded-[2px] border border-gray-200"
                  />
                ))}
              </div>
              {p.tag && (
                <span
                  className="self-start text-[11px] font-bold px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: p.tagBg ?? '#e2e8f0', color: p.tagText ?? '#1e293b' }}
                >
                  {p.tag}
                </span>
              )}
              {p.description && (
                <p className="text-xs text-gray-700 leading-snug line-clamp-2">{p.description}</p>
              )}
            </a>
          ))}
        </div>

        {n >= 3 && (
          <button
            onClick={() => go('next')}
            className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-orange-600 hover:border-orange-300 hover:shadow-lg transition-all text-base font-light z-20"
            aria-label="Suivant"
          >›</button>
        )}
      </div>
    </div>
  );
}
