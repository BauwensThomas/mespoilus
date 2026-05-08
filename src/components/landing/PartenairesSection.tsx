import { PARTENAIRES, FLAGS } from '@/lib/partenaires';

export default function PartenairesSection() {
  if (!PARTENAIRES.length) return null;

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-amber-600 text-sm font-semibold uppercase tracking-widest">
              Partenaires
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              Nos recommandations
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Des marques sélectionnées pour la qualité de leurs produits et services.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PARTENAIRES.map((p) => (
            <div
              key={p.id}
              className="group bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md hover:border-amber-400/30 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{p.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-base">{p.nom}</p>
                      {(p.pays ?? []).map(code => (
                        <span key={code} title={code}>{FLAGS[code]}</span>
                      ))}
                    </div>
                    {p.pour && <p className="text-xs text-gray-400">{p.pour}</p>}
                  </div>
                </div>
                {p.tag && (
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${p.tagColor ?? 'bg-gray-100 text-gray-600'}`}>
                    {p.tag}
                  </span>
                )}
              </div>

              {p.description && (
                <p className="text-sm text-gray-500 leading-relaxed flex-1">
                  {p.description}
                </p>
              )}

              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Découvrir {p.nom}
              </a>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          Liens affiliés — Mes Poilus peut percevoir une commission si vous effectuez un achat, sans surcoût pour vous.
        </p>
      </div>
    </section>
  );
}
