import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'À propos de Mes Poilus',
  description: 'Marie, fondatrice de Mes Poilus, partage ses conseils sur les animaux de compagnie depuis la Belgique. Un média francophone dédié aux chiens, chats, oiseaux, rongeurs et reptiles.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.mespoilus.com/a-propos' },
};

export default function AProposPage() {
  return (
    <div className="min-h-screen text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-12">

        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">À propos de Mes Poilus</h1>
        <p className="text-gray-600 text-sm mb-10">Média animalier francophone - Belgique, depuis 2026</p>

        {/* Équipe */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="flex items-start gap-4 bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <div className="w-40 h-40 rounded-full overflow-hidden flex-shrink-0">
              <Image src="/images/team/thomas.webp" alt="Thomas, fondateur de Mes Poilus" width={160} height={160} className="object-cover w-full h-full" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Thomas</h2>
              <p className="text-xs text-orange-600 mb-2">Fondateur de Mes Poilus</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Passionné d&apos;animaux basé en Belgique, Thomas a créé Mes Poilus en 2026 pour rassembler en un seul endroit conseils pratiques, boutique et adoption : une ressource francophone gratuite et fiable.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <div className="w-40 h-40 rounded-full overflow-hidden flex-shrink-0">
              <Image src="/images/team/marie.webp" alt="Marie, rédactrice principale de Mes Poilus" width={160} height={160} className="object-cover w-full h-full" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Marie</h2>
              <p className="text-xs text-orange-600 mb-2">Rédactrice principale de Mes Poilus</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Passionnée d&apos;animaux depuis l&apos;enfance, Marie partage son quotidien avec un chien et deux chats. Elle rédige les conseils de Mes Poilus avec le souci de proposer un contenu pratique, clair et bien documenté.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">1. Qui sommes-nous ?</h2>
            <div className="space-y-3 text-sm">
              <p>
                Mes Poilus est un projet belge lancé en 2026, dédié aux propriétaires d&apos;animaux de compagnie dans toute la francophonie. Le site propose un blog de conseils pratiques, une boutique de produits affiliés et un service d&apos;adoption entre particuliers.
              </p>
              <p>
                L&apos;initiative est portée par Thomas, passionné d&apos;animaux basé en Belgique, avec pour objectif de créer une ressource francophone fiable, accessible et gratuite pour tous les propriétaires d&apos;animaux.
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
                Nos articles couvrent les cinq familles d&apos;animaux de compagnie les plus populaires :
              </p>
              <ul className="space-y-2 mt-2">
                {[
                  { animal: 'Chiens', desc: 'éducation, races, santé, alimentation, comportement' },
                  { animal: 'Chats', desc: 'soins, comportement, races, alimentation, bien-être' },
                  { animal: 'Oiseaux', desc: 'espèces, habitat, alimentation, apprivoisement' },
                  { animal: 'Rongeurs', desc: 'hamsters, lapins, cobayes, rats, gerbilles' },
                  { animal: 'Reptiles', desc: 'lézards, serpents, tortues, soins et terrarium' },
                ].map(({ animal, desc }) => (
                  <li key={animal} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
                    <span className="font-semibold text-gray-900">{animal}</span>
                    <span className="text-gray-500">- {desc}</span>
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
                Chaque article publié sur Mes Poilus est relu et validé avant publication. Les sujets sont choisis en fonction des questions réelles que se posent les propriétaires francophones. Les informations sont vérifiées auprès de sources vétérinaires reconnues et mises à jour régulièrement.
              </p>
              <p>
                Nos articles sont rédigés en français clair et naturel, pour être compréhensibles partout dans la francophonie. Ils sont fournis à titre informatif uniquement et <strong>ne constituent pas un avis vétérinaire professionnel</strong>. En cas de doute sur la santé de votre animal, consultez toujours un vétérinaire.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">4. Notre boutique &amp; affiliation</h2>
            <div className="space-y-3 text-sm">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800">
                  <strong>Important :</strong> Mes Poilus ne vend aucun produit directement et ne détient aucun stock. La boutique présente des produits disponibles chez des marchands partenaires, accessibles via des liens d&apos;affiliation.
                </p>
              </div>
              <p>
                Si vous effectuez un achat via ces liens, nous percevons une commission de la part du marchand, sans aucun surcoût pour vous. Cela nous permet de financer le fonctionnement du site et de continuer à proposer du contenu gratuit.
              </p>
              <p>Nos partenaires affiliés actuels :</p>
              <ul className="space-y-1 ml-2">
                {[
                  'Amazon FR (programme Amazon Associates, tag mespoilus-21)',
                  'Awin - Maxi Zoo, Zooplus, et d\'autres marchands européens',
                  'CJ.com - CanadaPetCare',
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2 text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
              <p>
                Les recommandations de produits publiées sur Mes Poilus sont rédigées indépendamment. La présence d&apos;un lien affilié n&apos;influence pas notre jugement éditorial.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">5. Service d&apos;adoption</h2>
            <div className="text-sm space-y-3">
              <p>
                Mes Poilus propose un espace gratuit permettant aux particuliers de publier des annonces pour donner un animal. Mes Poilus agit uniquement comme intermédiaire technique et n&apos;est pas partie aux arrangements conclus entre particuliers.
              </p>
              <p>Seules les adoptions gratuites sont autorisées. Toute annonce impliquant une contrepartie financière est interdite et sera supprimée.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">6. La Grille Mystère</h2>
            <div className="text-sm space-y-3">
              <p>
                Mes Poilus propose un jeu original et solidaire : la <Link href="/grille" className="text-amber-600 hover:underline">Grille Mystère</Link>. Une photo d&apos;animal est cachée derrière une grille de pixels que la communauté révèle peu à peu en achetant des pixels. Le but : deviner la race en premier pour gagner un cadeau surprise.
              </p>
              <p>
                Ce n&apos;est ni une loterie ni une tombola : les gains reposent sur une devinette et sur la participation, pas sur le hasard. Et surtout, <strong>une partie des recettes de chaque grille est reversée à un refuge animalier ou une association</strong> - jouer, c&apos;est aussi soutenir une bonne cause.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">7. Nous contacter</h2>
            <p className="text-sm">Pour toute question, suggestion ou demande de partenariat : <a href="mailto:contact@mespoilus.com" className="text-amber-600 hover:underline">contact@mespoilus.com</a></p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
          <Link href="/mentions-legales" className="hover:text-amber-600 transition-colors">Mentions légales</Link>
          <Link href="/politique-confidentialite" className="hover:text-amber-600 transition-colors">Politique de confidentialité</Link>
          <Link href="/cgu" className="hover:text-amber-600 transition-colors">Conditions d&apos;utilisation</Link>
          <Link href="/cookies" className="hover:text-amber-600 transition-colors">Cookies</Link>
          <Link href="/presse" className="hover:text-amber-600 transition-colors">Presse &amp; partenaires</Link>
          <Link href="/a-propos" className="hover:text-amber-600 transition-colors">À propos</Link>
          <Link href="/" className="hover:text-amber-600 transition-colors ml-auto">Retour à l&apos;accueil</Link>
        </div>
      </div>
    </div>
  );
}
