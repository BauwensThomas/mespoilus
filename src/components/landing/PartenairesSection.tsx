import { PARTENAIRES, getFlagUrl } from '@/lib/partenaires';
import { ExternalLink } from 'lucide-react';

export default function PartenairesSection() {
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
                          width={20}
                          height={14}
                          className="w-4 h-auto inline-block"
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
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 text-center mt-10">
          Liens affiliés -Mes Poilus peut percevoir une commission si vous effectuez un achat, sans surcoût pour vous.
        </p>
      </div>
    </section>
  );
}
