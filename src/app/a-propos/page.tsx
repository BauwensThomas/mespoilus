import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'À propos de Mes Poilus',
  description: 'Découvrez Mes Poilus : un média belge spécialisé dans les animaux de compagnie, avec blog de conseils, boutique affiliée et service d\'adoption gratuit.',
  robots: { index: true, follow: true },
};

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-12">

        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">À propos de Mes Poilus</h1>
        <p className="text-gray-600 text-sm mb-12">Média animalier francophone — Belgique, depuis 2026</p>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">1. Qui sommes-nous ?</h2>
            <div className="space-y-3 text-sm">
              <p>
                Mes Poilus est un projet belge lancé en 2026, dédié aux propriétaires d'animaux de compagnie dans toute la francophonie. Le site propose un blog de conseils pratiques, une boutique de produits affiliés et un service d'adoption entre particuliers.
              </p>
              <p>
                L'initiative est portée par un passionné d'animaux basé en Belgique, avec pour objectif de créer une ressource francophone fiable, accessible et gratuite pour tous les propriétaires d'animaux du monde entier.
              </p>
              <div className="space-y-2 mt-4">
                <p><span className="text-gray-500">Dénomination :</span> Mes Poilus</p>
                <p><span className="text-gray-500">Pays :</span> Belgique</p>
                <p><span className="text-gray-500">Fondé en :</span> 2026</p>
                <p><span className="text-gray-500">Email :</span> <a href="mailto:contact@mespoilus.com" className="text-amber-600 hover:underline">contact@mespoilus.com</a></p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">2. Notre blog de conseils</h2>
            <div className="space-y-3 text-sm">
              <p>
                Nos articles couvrent les cinq familles d'animaux de compagnie les plus populaires :
              </p>
              <ul className="space-y-2 mt-2">
                {[
                  { emoji: '🐶', animal: 'Chiens', desc: 'éducation, races, santé, alimentation, comportement' },
                  { emoji: '🐱', animal: 'Chats', desc: 'soins, comportement, races, alimentation, bien-être' },
                  { emoji: '🐦', animal: 'Oiseaux', desc: 'espèces, habitat, alimentation, apprivoisement' },
                  { emoji: '🐹', animal: 'Rongeurs', desc: 'hamsters, lapins, cobayes, rats, gerbilles' },
                  { emoji: '🦎', animal: 'Reptiles', desc: 'lézards, serpents, tortues, soins et terrarium' },
                ].map(({ emoji, animal, desc }) => (
                  <li key={animal} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
                    <span className="text-lg flex-shrink-0">{emoji}</span>
                    <span><span className="font-semibold text-gray-900">{animal}</span> — {desc}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">
                Chaque article vise à répondre à une question concrète : comment bien nourrir mon chien, comment comprendre le comportement de mon chat, quel habitat choisir pour mon rongeur, comment apprivoiser un oiseau...
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">3. Notre approche éditoriale</h2>
            <div className="space-y-3 text-sm">
              <p>
                Nos articles sont rédigés avec soin, en français clair et naturel, pour être compréhensibles partout dans la francophonie. Ils sont fournis à titre informatif uniquement et <strong>ne constituent pas un avis vétérinaire professionnel</strong>. En cas de doute sur la santé de votre animal, consultez toujours un vétérinaire.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">4. Notre boutique & affiliation</h2>
            <div className="space-y-3 text-sm">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800">
                  <strong>Important :</strong> Mes Poilus ne vend aucun produit directement et ne détient aucun stock. La boutique présente des produits disponibles chez des marchands partenaires, accessibles via des liens d'affiliation.
                </p>
              </div>
              <p>
                Si vous effectuez un achat via ces liens, nous percevons une commission de la part du marchand, sans aucun surcoût pour vous. Cela nous permet de financer le fonctionnement du site et de continuer à proposer du contenu gratuit.
              </p>
              <p>Nos partenaires affiliés actuels :</p>
              <ul className="space-y-1 ml-2">
                {[
                  'Amazon FR (programme Amazon Associates, tag mespoilus-21)',
                  'Awin — Maxi Zoo, Zooplus, et d\'autres marchands européens',
                  'CJ.com — CanadaPetCare',
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2 text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
              <p>
                Les recommandations de produits publiées sur Mes Poilus sont rédigées indépendamment. La présence d'un lien affilié n'influence pas notre jugement éditorial.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">5. Service d'adoption</h2>
            <div className="text-sm space-y-3">
              <p>
                Mes Poilus propose un espace gratuit permettant aux particuliers de publier des annonces pour donner un animal. Mes Poilus agit uniquement comme intermédiaire technique et n'est pas partie aux arrangements conclus entre particuliers.
              </p>
              <p>Seules les adoptions gratuites sont autorisées. Toute annonce impliquant une contrepartie financière est interdite et sera supprimée.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">6. Nous contacter</h2>
            <p className="text-sm">Pour toute question, suggestion ou demande de partenariat : <a href="mailto:contact@mespoilus.com" className="text-amber-600 hover:underline">contact@mespoilus.com</a></p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
          <Link href="/mentions-legales" className="hover:text-amber-600 transition-colors">Mentions légales</Link>
          <Link href="/politique-confidentialite" className="hover:text-amber-600 transition-colors">Politique de confidentialité</Link>
          <Link href="/cgu" className="hover:text-amber-600 transition-colors">Conditions d'utilisation</Link>
          <Link href="/cookies" className="hover:text-amber-600 transition-colors">Cookies</Link>
          <Link href="/presse" className="hover:text-amber-600 transition-colors">Presse & partenaires</Link>
          <Link href="/a-propos" className="hover:text-amber-600 transition-colors">À propos</Link>
          <Link href="/" className="hover:text-amber-600 transition-colors ml-auto">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
