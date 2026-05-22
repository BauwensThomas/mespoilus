'use client';

import { useState, useEffect } from 'react';
import { getFlagUrl } from '@/lib/partenaires';
import { ExternalLink, X } from 'lucide-react';

interface DbPartenaire {
  id: string;
  nom: string;
  description: string | null;
  logo_url: string | null;
  logo_urls?: string[];
  url: string | null;
  urls_by_country: Record<string, string> | null;
  tag: string | null;
  tag_bg: string;
  tag_text: string;
  pour: string | null;
  emoji: string;
  pays: string[];
  recommend: boolean;
  display_mode?: string;
  flag_position?: string;
  link_position?: string;
}

function CountryPickerModal({ partenaire, onClose }: { partenaire: DbPartenaire; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {partenaire.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={partenaire.logo_url} alt={partenaire.nom} className="h-8 object-contain" />
            ) : (
              <span className="text-2xl">{partenaire.emoji}</span>
            )}
            <h3 className="font-bold text-gray-900 text-lg">{partenaire.nom}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-5">Choisissez votre pays pour être redirigé vers le bon site.</p>
        <div className="flex flex-col gap-3">
          {Object.entries(partenaire.urls_by_country!).map(([code, url]) => (
            <a
              key={code}
              href={url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getFlagUrl(code)} alt={code} style={{ width: '24px', height: '18px', objectFit: 'cover' }} className="rounded-[3px] border border-gray-200" />
              <span className="font-semibold text-gray-800 group-hover:text-orange-700">
                {code === 'FR' ? 'France' : code === 'BE' ? 'Belgique' : code}
              </span>
              <ExternalLink size={14} className="ml-auto text-gray-400 group-hover:text-orange-500" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

const CORNER_CLASSES: Record<string, string> = {
  'top-left':     'top-3 left-3',
  'top-right':    'top-3 right-3',
  'bottom-left':  'bottom-3 left-3',
  'bottom-right': 'bottom-3 right-3',
};

function ImageCard({ p, onPick }: { p: DbPartenaire; onPick: (p: DbPartenaire) => void }) {
  const images = p.logo_urls?.length ? p.logo_urls : (p.logo_url ? [p.logo_url] : []);
  const [imgIdx, setImgIdx] = useState(0);
  const [imgFadeCard, setImgFadeCard] = useState(true);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setImgFadeCard(false);
      setTimeout(() => { setImgIdx(i => (i + 1) % images.length); setImgFadeCard(true); }, 400);
    }, 15000);
    return () => clearInterval(id);
  }, [images.length]);

  const flagPos = CORNER_CLASSES[p.flag_position ?? 'bottom-left'];
  const linkPos = CORNER_CLASSES[p.link_position ?? 'bottom-right'];

  const overlay = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[imgIdx] ?? ''} alt={p.nom} style={{ opacity: imgFadeCard ? 1 : 0, transition: 'opacity 0.4s ease' }} className="absolute inset-0 w-full h-full object-fill" />
      <div className={`absolute ${flagPos} flex gap-1.5`}>
        {(p.pays ?? []).map(code => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={code} src={getFlagUrl(code)} alt={code} style={{ width: '22px', height: '16px', objectFit: 'cover' }} className="rounded-[2px] border border-white/40 drop-shadow" />
        ))}
      </div>
      <div className={`absolute ${linkPos}`}>
        <span className="flex items-center gap-1.5 text-white text-sm font-semibold drop-shadow bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-lg">
          Découvrir <ExternalLink size={13} strokeWidth={2} />
        </span>
      </div>
    </>
  );

  const cardEl = p.urls_by_country ? (
    <button onClick={() => onPick(p)} className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow w-full h-60 block" aria-label={`Découvrir ${p.nom}`}>
      {overlay}
    </button>
  ) : (
    <a href={p.url ?? '#'} target="_blank" rel="noopener noreferrer sponsored" aria-label={`Découvrir ${p.nom} (lien externe)`} className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow w-full h-60 block">
      {overlay}
    </a>
  );

  return (
    <div>
      {cardEl}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => { setImgFadeCard(false); setTimeout(() => { setImgIdx(i); setImgFadeCard(true); }, 400); }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-orange-500' : 'bg-gray-300 hover:bg-gray-400'}`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PartenairesSection() {
  const [partenaires, setPartenaires] = useState<DbPartenaire[]>([]);
  const [pickerPartenaire, setPickerPartenaire] = useState<DbPartenaire | null>(null);

  useEffect(() => {
    fetch('/api/partenaires').then(r => r.json()).then(setPartenaires).catch(() => {});
  }, []);

  const visible = partenaires.filter(p => p.recommend !== false);
  if (visible.length === 0) return null;

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-orange-700 text-sm font-semibold uppercase tracking-widest">Partenaires</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2">Nos recommandations</h2>
          <p className="text-gray-600 mt-3 text-base">Des marques sélectionnées pour la qualité de leurs produits et services.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((p) => {
            if (p.display_mode === 'image' && (p.logo_url || p.logo_urls?.length)) {
              return <ImageCard key={p.id} p={p} onPick={setPickerPartenaire} />;
            }
            return (
            <div key={p.id} className="group bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg hover:border-orange-200 transition-all shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {p.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logo_url} alt={p.nom} className="h-10 max-w-[120px] object-contain" />
                    ) : (
                      <div className="text-3xl">{p.emoji}</div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-base">{p.nom}</p>
                      {(p.pays ?? []).map(code => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={code} src={getFlagUrl(code)} alt={`Drapeau de ${code}`} style={{ width: '18px', height: '13px', objectFit: 'cover' }} className="rounded-[2px] border border-gray-200 inline-block" />
                      ))}
                    </div>
                    {p.pour && <p className="text-xs text-gray-500">{p.pour}</p>}
                  </div>
                </div>
                {p.tag && (
                  <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ backgroundColor: p.tag_bg, color: p.tag_text }}>
                    {p.tag}
                  </span>
                )}
              </div>

              {p.description && (
                <p className="text-sm text-gray-600 leading-relaxed flex-1">{p.description}</p>
              )}

              {p.urls_by_country ? (
                <button
                  onClick={() => setPickerPartenaire(p)}
                  className="mt-auto inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                >
                  Découvrir {p.nom}
                  <ExternalLink size={16} strokeWidth={1.5} />
                </button>
              ) : (
                <a
                  href={p.url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="mt-auto inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                  aria-label={`Découvrir ${p.nom} (lien externe)`}
                >
                  Découvrir {p.nom}
                  <ExternalLink size={16} strokeWidth={1.5} />
                </a>
              )}
            </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 text-center mt-10">
          Liens affiliés. Mes Poilus peut percevoir une commission si vous effectuez un achat, sans surcoût pour vous.
        </p>
      </div>

      {pickerPartenaire && (
        <CountryPickerModal partenaire={pickerPartenaire} onClose={() => setPickerPartenaire(null)} />
      )}
    </section>
  );
}
