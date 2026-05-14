'use client';

import { useState } from 'react';
import { PARTENAIRES, getFlagUrl, type Partenaire } from '@/lib/partenaires';
import { ExternalLink, X } from 'lucide-react';

function CountryPickerModal({ partenaire, onClose }: { partenaire: Partenaire; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{partenaire.emoji}</span>
            <h3 className="font-bold text-gray-900 text-lg">{partenaire.nom}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-5">Choisissez votre pays pour être redirigé vers le bon site.</p>
        <div className="flex flex-col gap-3">
          {Object.entries(partenaire.urlsByCountry!).map(([code, url]) => (
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

export default function PartenairesSection() {
  const [pickerPartenaire, setPickerPartenaire] = useState<Partenaire | null>(null);

  if (!PARTENAIRES.length) return null;

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-orange-600 text-sm font-semibold uppercase tracking-widest">
            Partenaires
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2">
            Nos recommandations
          </h2>
          <p className="text-gray-600 mt-3 text-base">
            Des marques sélectionnées pour la qualité de leurs produits et services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PARTENAIRES.map((p) => (
            <div
              key={p.id}
              className="group bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg hover:border-orange-200 transition-all shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl flex-shrink-0">
                    {p.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-base">{p.nom}</p>
                      {(p.pays ?? []).map(code => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={code}
                          src={getFlagUrl(code)}
                          alt={`Drapeau de ${code}`}
                          style={{ width: '18px', height: '13px', objectFit: 'cover' }}
                          className="rounded-[2px] border border-gray-200 inline-block"
                        />
                      ))}
                    </div>
                    {p.pour && <p className="text-xs text-gray-500">{p.pour}</p>}
                  </div>
                </div>
                {p.tag && (
                  <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${p.tagColor ?? 'bg-gray-100 text-gray-700'}`}>
                    {p.tag}
                  </span>
                )}
              </div>

              {p.description && (
                <p className="text-sm text-gray-600 leading-relaxed flex-1">
                  {p.description}
                </p>
              )}

              {p.urlsByCountry ? (
                <button
                  onClick={() => setPickerPartenaire(p)}
                  className="mt-auto inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                >
                  Découvrir {p.nom}
                  <ExternalLink size={16} strokeWidth={1.5} />
                </button>
              ) : (
                <a
                  href={p.url}
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
          ))}
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
