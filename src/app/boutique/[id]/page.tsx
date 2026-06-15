import type { Metadata } from 'next';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Package, Star, Tag, Weight, Heart, EyeOff } from 'lucide-react';
import BackBreadcrumb from './_components/BackBreadcrumb';
import FavoriteButton from '../_components/FavoriteButton';
import DirectionalTransition from '@/components/ui/DirectionalTransition';

export const revalidate = 3600;

const CATEGORY_LABELS: Record<string, string> = {
  chiens: 'Chiens', chats: 'Chats', oiseaux: 'Oiseaux',
  rongeurs: 'Rongeurs', reptiles: 'Reptiles', livres: 'Livres', general: 'General',
};

const COUNTRY_FLAGS: Record<string, string> = {
  fr: 'fr', be: 'be', ca: 'ca', us: 'us', gb: 'gb', de: 'de', nl: 'nl',
};

const COUNTRY_LABELS: Record<string, string> = {
  fr: 'France', be: 'Belgique', ca: 'Canada', us: 'Etats-Unis', gb: 'Royaume-Uni', de: 'Allemagne', nl: 'Pays-Bas',
};

function formatWeight(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 1)} kg`;
  return `${g} g`;
}

const EUR_RATES: Record<string, number> = { USD: 0.92, CAD: 0.68, GBP: 1.17 };
function toEUR(price: number, currency: string): number | null {
  const rate = EUR_RATES[currency];
  return rate ? Math.round(price * rate) : null;
}

async function getCatalogEntry(id: string) {
  const supabase = createAdminClient();

  const [catalogRes, offersRes] = await Promise.all([
    supabase
      .from('products_catalog')
      .select('id, name, name_fr, brand, category, categories, image_url, description, description_fr, weight_g, ean, status')
      .eq('id', id)
      .single(),
    supabase
      .from('product_offers')
      .select('id, merchant_name, country, price, currency, affiliate_url, in_stock, source, last_synced_at')
      .eq('catalog_id', id)
      .eq('in_stock', true)
      .gt('price', 0)
      .order('price', { ascending: true }),
  ]);

  if (catalogRes.error || !catalogRes.data) return null;

  // Garder 1 offre par marchand (la moins chère)
  const merchantMap = new Map<string, NonNullable<typeof offersRes.data>[0]>();
  for (const offer of offersRes.data ?? []) {
    const existing = merchantMap.get(offer.merchant_name);
    if (!existing || offer.price < existing.price) {
      merchantMap.set(offer.merchant_name, offer);
    }
  }
  const offers = [...merchantMap.values()].sort((a, b) => a.price - b.price);

  return {
    catalog: catalogRes.data,
    offers,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('products_catalog')
    .select('name, brand, category')
    .eq('id', id)
    .single();

  if (!data) return { title: 'Produit - Mes Poilus' };

  return {
    title: `${data.name} - Mes Poilus`,
    description: `Comparez les prix pour ${data.name}${data.brand ? ` de ${data.brand}` : ''}. Trouvez la meilleure offre chez nos marchands partenaires.`,
    // noindex : descriptions copiées des flux affiliés (Awin/CJ) = contenu dupliqué/fin.
    // On retire ces ~6000 fiches de l'index (qualité globale du site + AdSense) ; les liens
    // restent suivis et l'affiliation fonctionne (les visiteurs y accèdent via /boutique).
    robots: { index: false, follow: true },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, { data: { user } }] = await Promise.all([
    getCatalogEntry(id),
    createClient().then(s => s.auth.getUser()),
  ]);
  const isAdmin = !!user;

  if (!result) notFound();
  if (result.catalog.status === 'hidden' && !isAdmin) redirect('/boutique');

  const { catalog, offers } = result;
  const bestOffer = offers[0] ?? null;
  const otherOffers = offers.slice(1);
  const categoryLabel = CATEGORY_LABELS[catalog.category] ?? catalog.category;

  return (
    <DirectionalTransition>
    <div className="min-h-screen pb-20">
      {isAdmin && catalog.status === 'hidden' && (
        <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2 bg-red-600/95 backdrop-blur text-white text-xs">
          <EyeOff size={13} />
          <span className="font-semibold">Produit masqué</span>
          <span className="text-red-200">- visible uniquement pour les admins</span>
          <Link href="/boutique-v2-admin?status=hidden" className="ml-auto underline hover:text-red-100">Gérer les produits masqués</Link>
        </div>
      )}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6">

        {/* Fil d'ariane */}
        <div className="flex items-center justify-between mb-6">
          <BackBreadcrumb
            category={catalog.category}
            categoryLabel={categoryLabel}
            productName={(catalog as { name_fr?: string | null }).name_fr ?? catalog.name}
          />
          <Link
            href="/favoris"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors shrink-0"
          >
            <Heart size={15} strokeWidth={1.5} />
            Mes favoris
          </Link>
        </div>

        {/* Fiche produit */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row">

            {/* Image */}
            <div className="relative w-full md:w-96 shrink-0 h-80 md:h-auto bg-gradient-to-br from-orange-50 to-gray-50" style={{ viewTransitionName: `product-${id}` }}>
              {catalog.image_url ? (
                <Image
                  src={catalog.image_url}
                  alt={catalog.name}
                  fill
                  unoptimized
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 384px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={64} className="text-gray-200" strokeWidth={1} />
                </div>
              )}
              <span className="absolute top-3 left-3 z-10">
                <FavoriteButton catalogId={catalog.id} size={22} />
              </span>
            </div>

            {/* Infos */}
            <div className="flex-1 p-6 flex flex-col gap-4">
              <div>
                {catalog.brand && (
                  <p className="text-xs text-orange-600 font-semibold uppercase tracking-widest mb-1">
                    {catalog.brand}
                  </p>
                )}
                <h1 className="text-xl font-bold text-gray-900 leading-snug">
                  {(catalog as { name_fr?: string | null }).name_fr ?? catalog.name}
                </h1>
                {(catalog as { name_fr?: string | null }).name_fr && (
                  <p className="text-xs text-gray-600 mt-1">{catalog.name}</p>
                )}
              </div>

              {/* Meta tags */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  <Tag size={11} />
                  {categoryLabel}
                </span>
                {catalog.weight_g && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    <Weight size={11} />
                    {formatWeight(catalog.weight_g)}
                  </span>
                )}
                {catalog.ean && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-mono">
                    EAN {catalog.ean}
                  </span>
                )}
              </div>

              {catalog.description && (
                <div className="text-sm text-gray-600 leading-relaxed">
                  <p>{catalog.description}</p>
                  {(catalog as { description_fr?: string | null }).description_fr &&
                    (catalog as { description_fr?: string | null }).description_fr !== catalog.description && (
                    <>
                      <hr className="my-2 border-orange-300" />
                      <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Traduction</p>
                      <p>{(catalog as { description_fr?: string | null }).description_fr}</p>
                    </>
                  )}
                </div>
              )}

              {/* Meilleure offre */}
              {bestOffer && (
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-2">
                    Meilleure offre
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Star size={14} className="text-orange-500 fill-orange-500" />
                    <span className="text-2xl font-bold text-orange-600">
                      {bestOffer.price.toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold text-gray-600">{bestOffer.currency}</span>
                    {toEUR(bestOffer.price, bestOffer.currency) !== null && (
                      <span className="text-base text-gray-700">(≈{toEUR(bestOffer.price, bestOffer.currency)} €)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {bestOffer.country && COUNTRY_FLAGS[bestOffer.country] && (
                      <img
                        src={`https://flagcdn.com/16x12/${COUNTRY_FLAGS[bestOffer.country]}.png`}
                        alt={bestOffer.country}
                        className="w-4 h-3 rounded-sm"
                      />
                    )}
                    <span className="text-sm text-gray-600">{bestOffer.merchant_name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tableau comparaison */}
        {offers.length > 0 && (
          <div className="mt-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              Comparer les offres
              <span className="ml-2 text-sm font-normal text-gray-600">
                {offers.length} marchand{offers.length > 1 ? 's' : ''}
              </span>
            </h2>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                      Marchand
                    </th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider hidden sm:table-cell">
                      Pays
                    </th>
                    <th className="text-right px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="text-right px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider hidden sm:table-cell">
                      Dispo
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {offers.map((offer, i) => {
                    const flag = offer.country ? COUNTRY_FLAGS[offer.country] : null;
                    const isBest = i === 0;
                    return (
                      <tr
                        key={offer.id}
                        className={isBest ? 'bg-orange-100' : 'hover:bg-gray-50 transition-colors'}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 shrink-0">
                              {isBest && <Star size={12} className="text-orange-500 fill-orange-500" />}
                            </span>
                            <span className={`font-medium ${isBest ? 'text-gray-900' : 'text-gray-700'}`}>
                              {offer.merchant_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {flag ? (
                            <div className="flex items-center gap-1.5">
                              <img
                                src={`https://flagcdn.com/16x12/${flag}.png`}
                                alt={offer.country!}
                                className="w-4 h-3 rounded-sm"
                              />
                              <span className="text-gray-700 text-xs">
                                {COUNTRY_LABELS[offer.country!] ?? offer.country}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${isBest ? 'text-orange-600 text-base' : 'text-gray-800'}`}>
                            {offer.price.toFixed(2)}
                            <span className="text-xs font-semibold text-gray-600 ml-0.5">{offer.currency}</span>
                          </span>
                          {toEUR(offer.price, offer.currency) !== null && (
                            <span className="text-base text-gray-700 ml-1">(≈{toEUR(offer.price, offer.currency)} €)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            offer.in_stock
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {offer.in_stock ? 'En stock' : 'Indispo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={offer.affiliate_url}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1 ${
                              isBest
                                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            aria-label={`Voir chez ${offer.merchant_name}`}
                          >
                            Voir
                            <ExternalLink size={11} strokeWidth={1.5} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-400 mt-2 text-center">
              Prix mis a jour quotidiennement
            </p>
          </div>
        )}

        {offers.length === 0 && (
          <div className="mt-6 text-center py-10 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500 text-sm">Aucune offre disponible pour ce produit</p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-2.5">
        <p className="text-xs text-gray-500 text-center max-w-6xl mx-auto">
          Les liens présents sur cette page sont des liens affiliés. Mes Poilus peut percevoir une commission si vous effectuez un achat, sans surcoût pour vous.
        </p>
      </div>
    </div>
    </DirectionalTransition>
  );
}
