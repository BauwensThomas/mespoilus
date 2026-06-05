import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: "Conditions Générales d'Utilisation de Mes Poilus, site de contenu et d'affiliation animalier.",
  robots: { index: true, follow: false },
};

export default function CGUPage() {
  return (
    <div className="min-h-screen text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-gray-600 text-sm mb-12">Applicables au site Mes Poilus - Dernière mise à jour : juin 2026</p>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">1. Objet du site</h2>
            <p className="text-sm">
              Mes Poilus est un site de contenu éditorial spécialisé dans les animaux de compagnie. Il propose des articles de conseils, guides pratiques, recommandations de produits, ainsi qu'un service de petites annonces pour l'adoption d'animaux entre particuliers. Mes Poilus ne vend aucun produit directement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">2. Liens d'affiliation</h2>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm mb-4">
              <p className="text-amber-700">
                Certains liens présents sur ce site sont des <strong className="text-amber-700 font-semibold">liens affiliés</strong>. Cela signifie que Mes Poilus peut percevoir une commission si vous effectuez un achat via ces liens, sans surcoût pour vous.
              </p>
            </div>
            <div className="text-sm space-y-3">
              <p>En tant que Partenaire Amazon, Mes Poilus réalise un bénéfice sur les achats remplissant les conditions requises.</p>
              <p>Les recommandations de produits publiées sur Mes Poilus sont rédigées de façon indépendante. La présence d'un lien affilié n'influence pas notre jugement éditorial.</p>
              <p>Les achats effectués via ces liens sont régis exclusivement par les conditions générales de vente du site partenaire concerné (Amazon, Zooplus, etc.). Mes Poilus n'est pas partie à ces transactions et ne peut être tenu responsable en cas de litige avec un partenaire.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">3. Service d'adoption entre particuliers</h2>
            <div className="text-sm space-y-3">
              <p>Mes Poilus met à disposition un espace permettant aux particuliers de publier des annonces pour donner un animal. Ce service est <strong>gratuit</strong> et soumis aux règles suivantes :</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                <li>Les annonces concernent uniquement des animaux <strong>donnés gratuitement</strong>. Toute annonce impliquant une contrepartie financière est interdite.</li>
                <li>Les photos soumises doivent représenter l'animal réel décrit dans l'annonce.</li>
                <li>Tout contenu illicite, trompeur, offensant ou contraire aux lois sur la protection animale est strictement interdit.</li>
                <li>Chaque annonce est soumise à <strong>modération</strong> avant publication. Mes Poilus se réserve le droit de refuser ou supprimer toute annonce sans justification.</li>
                <li>L'email et le numéro de téléphone renseignés sont conservés de façon privée et ne sont pas affichés publiquement.</li>
              </ul>
              <p>Mes Poilus agit uniquement en tant qu'intermédiaire technique. Mes Poilus n'est pas partie aux transactions ou arrangements conclus entre les utilisateurs et ne peut être tenu responsable des litiges, dommages ou problèmes résultant d'une adoption conclue via le site.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">4. Jeu « Grille Mystère »</h2>
            <div className="text-sm space-y-3">
              <p>Mes Poilus propose un jeu en ligne intitulé « Grille Mystère » : une photo d'animal est masquée par une grille de pixels que les participants révèlent en achetant des pixels. L'objectif est de deviner la race de l'animal.</p>
              <p><strong>Nature du jeu :</strong> il ne s'agit pas d'une loterie ni d'une tombola. Le gain repose sur une devinette (concours de connaissance) et/ou sur le nombre de pixels achetés (critère déterministe), et non sur un tirage au sort.</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                <li>L'achat de pixels est <strong>définitif et non remboursable</strong>. Le paiement est traité par Stripe ; Mes Poilus ne stocke aucune donnée bancaire.</li>
                <li>Les pixels achetés sont attribués <strong>aléatoirement</strong> sur la grille.</li>
                <li>Chaque achat donne droit à <strong>une seule tentative</strong> de devinette.</li>
                <li>À l'issue de chaque grille, <strong>3 gagnants</strong> sont désignés : le 1er prix revient à la première personne ayant trouvé la race (ou, à défaut, au plus gros acheteur de pixels) ; les 2e et 3e prix reviennent aux plus gros acheteurs.</li>
                <li>Une grille dure <strong>90 jours maximum</strong> et peut se terminer plus tôt si la race est trouvée.</li>
                <li>Les lots sont des « cadeaux surprises » dont la valeur dépend du montant collecté ; aucune valeur n'est garantie à l'avance.</li>
                <li>Une partie des recettes est reversée à un refuge animalier ou une association. Le bénéficiaire est désigné par tirage au sort parmi les refuges et associations partenaires ayant relayé le jeu ; le montant reversé est conservé à titre de justificatif.</li>
                <li>Mes Poilus se réserve le droit de modifier, suspendre ou annuler une grille en cas de force majeure ou de dysfonctionnement, et de disqualifier toute participation frauduleuse.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">5. Contenu éditorial</h2>
            <div className="text-sm space-y-3">
              <p>Les articles publiés sur Mes Poilus sont rédigés à titre informatif. Ils ne constituent en aucun cas un avis vétérinaire professionnel. En cas de doute sur la santé de votre animal, consultez un vétérinaire.</p>
              <p>Une partie des contenus est produite avec l'aide d'outils d'intelligence artificielle et relue par un éditeur humain.</p>
              <p>Mes Poilus s'efforce de maintenir des informations exactes et à jour, mais ne garantit pas l'exactitude, l'exhaustivité ou l'actualité des contenus publiés.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">6. Propriété intellectuelle</h2>
            <p className="text-sm">
              L'ensemble des contenus du site (textes, images, logo, structure) est protégé par le droit d'auteur belge. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable de Mes Poilus.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">7. Limitation de responsabilité</h2>
            <p className="text-sm">
              Mes Poilus ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation du site, de l'application des conseils publiés, ou de transactions effectuées sur des sites tiers accessibles via des liens affiliés.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">8. Contact</h2>
            <p className="text-sm">
              Pour toute question : <a href="mailto:contact@mespoilus.com" className="text-amber-600 hover:underline">contact@mespoilus.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">9. Droit applicable</h2>
            <p className="text-sm">
              Les présentes CGU sont soumises au droit belge. Tout litige sera soumis à la compétence exclusive des tribunaux compétents en Belgique.
            </p>
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
