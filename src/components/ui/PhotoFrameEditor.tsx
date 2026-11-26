'use client';

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { DEFAULT_FRAME, frameStyle, parseFrame, serializeFrame, type PhotoFrame } from '@/lib/image-focus';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Réglage du cadrage d'une photo, à la souris comme au doigt :
 * - glisser l'image (un doigt ou la souris) pour la déplacer ;
 * - pincer à deux doigts, ou molette sur ordinateur, pour zoomer ;
 * - ou les trois réglages gauche-droite, haut-bas et zoom.
 * Les aperçus montrent les formats utilisés sur le site (carte large, carré, portrait).
 */
export interface FrameFormat { label: string; ratio: string; width: string }

/** Formats par défaut : carte large, carré, portrait */
export const DEFAULT_FORMATS: FrameFormat[] = [
  { label: 'Carte', ratio: '4 / 3', width: '14rem' },
  { label: 'Carré', ratio: '1 / 1', width: '8rem' },
  { label: 'Portrait', ratio: '3 / 4', width: '7rem' },
];

export default function PhotoFrameEditor({ src, value, onSave, onCancel, saving, saveLabel = 'Enregistrer le cadrage', alwaysEnabled = false, formats = DEFAULT_FORMATS }: {
  /** Formats d'aperçu, ceux où la photo est réellement affichée sur le site */
  formats?: FrameFormat[];
  src: string;
  value: string | null;
  onSave: (value: string) => void | Promise<void>;
  onCancel?: () => void;
  saving?: boolean;
  saveLabel?: string;
  /** Bouton de validation actif même sans changement (formulaire de dépôt) */
  alwaysEnabled?: boolean;
}) {
  const [frame, setFrame] = useState<PhotoFrame>(parseFrame(value));
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ frame: PhotoFrame; x: number; y: number; dist: number } | null>(null);
  const serialized = serializeFrame(frame);
  const style = frameStyle(serialized);
  const changed = serialized !== serializeFrame(parseFrame(value));

  const startGesture = () => {
    const pts = [...pointers.current.values()];
    if (pts.length === 0) { gesture.current = null; return; }
    const x = pts.reduce((s, p) => s + p.x, 0) / pts.length, y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    setFrame(f => { gesture.current = { frame: f, x, y, dist }; return f; });
  };

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    const box = e.currentTarget.getBoundingClientRect();
    const x = pts.reduce((s, p) => s + p.x, 0) / pts.length, y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    // Glisser vers la droite montre la partie gauche de la photo, comme dans une appli photo
    const dx = ((x - g.x) / box.width) * 100 / g.frame.zoom;
    const dy = ((y - g.y) / box.height) * 100 / g.frame.zoom;
    const zoom = pts.length > 1 && g.dist > 0 ? clamp(g.frame.zoom * Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) / g.dist, 1, 3) : g.frame.zoom;
    setFrame({ x: clamp(g.frame.x - dx, 0, 100), y: clamp(g.frame.y - dy, 0, 100), zoom });
  }
  function onPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    startGesture(); // un doigt levé pendant un pincement : on repart du doigt restant
  }

  // Molette sur ordinateur : écouteur non passif, sinon la page défile en même temps
  const wheelCleanups = useRef(new Map<HTMLDivElement, () => void>());
  const wheelRef = useCallback((el: HTMLDivElement | null) => {
    if (!el || wheelCleanups.current.has(el)) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      setFrame(f => ({ ...f, zoom: clamp(f.zoom * (ev.deltaY < 0 ? 1.08 : 1 / 1.08), 1, 3) }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    wheelCleanups.current.set(el, () => el.removeEventListener('wheel', onWheel));
  }, []);
  useEffect(() => () => { wheelCleanups.current.forEach(clean => clean()); wheelCleanups.current.clear(); }, []);

  const slider = (label: string, key: keyof PhotoFrame, min: number, max: number, step: number) => (
    <label className="block">
      <span className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-mono">{key === 'zoom' ? `x${frame.zoom.toFixed(2)}` : `${Math.round(frame[key])} %`}</span>
      </span>
      <input
        type="range" min={min} max={max} step={step} value={frame[key]}
        onChange={e => setFrame(f => ({ ...f, [key]: Number(e.target.value) }))}
        className="w-full h-6 accent-orange-600"
        aria-label={label}
      />
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        {formats.map(({ label, ratio, width }) => (
          <div key={label} style={{ width, maxWidth: '100%' }}>
            <p className="text-[11px] text-gray-500 mb-1">{label}</p>
            <div
              ref={wheelRef}
              className="relative w-full overflow-hidden rounded-lg bg-gray-100 cursor-grab active:cursor-grabbing touch-none select-none"
              style={{ aspectRatio: ratio }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
            >
              <img src={src} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={style} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        <span className="sm:hidden">Faites glisser la photo avec le doigt, pincez pour zoomer, ou utilisez les réglages.</span>
        <span className="hidden sm:inline">Faites glisser la photo, zoomez avec la molette, ou utilisez les réglages.</span>
      </p>
      <div className="grid sm:grid-cols-3 gap-4 max-w-xl">
        {slider('Gauche / droite', 'x', 0, 100, 1)}
        {slider('Haut / bas', 'y', 0, 100, 1)}
        {slider('Zoom', 'zoom', 1, 3, 0.05)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSave(serialized)}
          disabled={saving || (!changed && !alwaysEnabled)}
          className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-40"
        >
          {saving ? 'Enregistrement...' : saveLabel}
        </button>
        <button
          type="button"
          onClick={() => setFrame(DEFAULT_FRAME)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-3 py-2.5"
        >
          <RotateCcw size={14} /> Par défaut
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2.5">
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
