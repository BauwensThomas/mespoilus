import type { Metadata } from 'next';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: "Conditions Générales d'Utilisation de Mes Poilus, site de contenu et d'affiliation animalier.",
  robots: { index: true, follow: false },
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <BackButton label="← Retour" />

        <h1 className="text-3xl font-bold text-white mt-8 mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-gray-500 text-sm mb-12">Applicables au site Mes Poilus — dernière mise à jour : mai 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">1. Objet du site</h2>
            <p className="text-sm">
              Mes Poilus est un site de contenu éditorial spécialisé dans les animaux de compagnie. Il propose des articles de conseils, guides pratiques et recommandations de produits à destination des propriétaires d'animaux. Mes Poilus ne vend aucun produit directement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">2. Liens d'affiliation</h2>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm mb-4">
              <p className="text-amber-200/80">
                Certains liens présents sur ce site sont des <strong className="text-amber-300">liens affiliés</strong>. Cela signifie que Mes Poilus peut percevoir une commission si vous effectuez un achat via ces liens, sans surcoût pour vous.
              </p>
            </div>
            <div className="text-sm space-y-3">
              <p>Les recommandations de produits publiées sur Mes Poilus sont rédigées de façon indépendante. La présence d'un lien affilié n'influence pas notre jugement éditorial.</p>
              <p>Les achats effectués via ces liens sont régis exclusivement par les conditions générales de vente du site partenaire concerné (Amazon, Zooplus, etc.). Mes Poilus n'est pas partie à ces transactions et ne peut être tenu responsable en cas de litige avec un partenaire.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">3. Contenu éditorial</h2>
            <div className="text-sm space-y-3">
              <p>Les articles publiés sur Mes Poilus sont rédigés à titre informatif. Ils ne constituent en aucun cas un avis vétérinaire professionnel. En cas de doute sur la santé de votre animal, consultez un vétérinaire.</p>
              <p>Une partie des contenus est produite avec l'aide d'outils d'intelligence artificielle et relue par un éditeur humain.</p>
              <p>Mes Poilus s'efforce de maintenir des informations exactes et à jour, mais ne garantit pas l'exactitude, l'exhaustivité ou l'actualité des contenus publiés.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">4. Propriété intellectuelle</h2>
            <p className="text-sm">
              L'ensemble des contenus du site (textes, images, logo, structure) est protégé par le droit d'auteur belge. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable de Mes Poilus.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">5. Limitation de responsabilité</h2>
            <p className="text-sm">
              Mes Poilus ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation du site, de l'application des conseils publiés, ou de transactions effectuées sur des sites tiers accessibles via des liens affiliés.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">6. Contact</h2>
            <p className="text-sm">
              Pour toute question : <a href="mailto:contact@mespoilus.com" className="text-amber-400 hover:underline">contact@mespoilus.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">7. Droit applicable</h2>
            <p className="text-sm">
              Les présentes CGU sont soumises au droit belge. Tout litige sera soumis à la compétence exclusive des tribunaux compétents en Belgique.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap gap-4 text-xs text-gray-600">
          <Link href="/mentions-legales" className="hover:text-amber-400 transition-colors">Mentions légales</Link>
          <Link href="/politique-confidentialite" className="hover:text-amber-400 transition-colors">Politique de confidentialité</Link>
          <Link href="/cookies" className="hover:text-amber-400 transition-colors">Politique cookies</Link>
          <Link href="/" className="hover:text-amber-400 transition-colors ml-auto">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
