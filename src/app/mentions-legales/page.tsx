import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de Mes Poilus conformes au droit belge.',
  robots: { index: true, follow: false },
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-12">

        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">Mentions légales</h1>
        <p className="text-gray-500 text-sm mb-12">Conformes au droit belge - dernière mise à jour : mai 2026</p>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">1. Éditeur du site</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Dénomination :</span> Mes Poilus</p>
              <p><span className="text-gray-500">Email :</span> contact@mespoilus.com</p>
              <p><span className="text-gray-500">Pays :</span> Belgique</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">2. Responsable de publication</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Entité :</span> Mes Poilus</p>
              <p><span className="text-gray-500">Email :</span> contact@mespoilus.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">3. Hébergement</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium mb-1">Hébergement du site</p>
                <p><span className="text-gray-500">Hébergeur :</span> Vercel Inc.</p>
                <p><span className="text-gray-500">Adresse :</span> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
                <p><span className="text-gray-500">Site web :</span> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">vercel.com</a></p>
              </div>
              <div>
                <p className="text-gray-600 font-medium mb-1">Nom de domaine</p>
                <p><span className="text-gray-500">Registrar :</span> LWS (LWS SARL)</p>
                <p><span className="text-gray-500">Adresse :</span> 4 rue Léon Jouhaux, 75010 Paris, France</p>
                <p><span className="text-gray-500">Site web :</span> <a href="https://www.lws.fr" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">lws.fr</a></p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">4. Propriété intellectuelle</h2>
            <p className="text-sm">
              L'ensemble des contenus présents sur ce site (textes, images, graphismes, logo, icônes) sont protégés par le droit d'auteur belge et le droit européen. Toute reproduction, représentation, modification ou exploitation, totale ou partielle, est strictement interdite sans autorisation écrite préalable de l'éditeur.
            </p>
            <p className="text-sm mt-3">
              Les photographies provenant d'Unsplash sont utilisées conformément à la licence Unsplash. Les crédits photographes sont mentionnés sur chaque image concernée.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">5. Contenu généré par intelligence artificielle</h2>
            <p className="text-sm">
              Une partie des contenus de ce site (articles de blog, descriptions produits) est rédigée avec l'aide d'outils d'intelligence artificielle (Claude d'Anthropic) et relue par un éditeur humain. Ces contenus sont fournis à titre informatif et ne constituent pas un avis vétérinaire professionnel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">6. Limitation de responsabilité</h2>
            <p className="text-sm">
              Les informations publiées sur ce site sont fournies à titre indicatif. L'éditeur décline toute responsabilité quant à l'exactitude, l'exhaustivité ou l'actualité des informations diffusées. En aucun cas, les conseils publiés sur ce site ne sauraient se substituer à une consultation vétérinaire professionnelle.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">7. Droit applicable</h2>
            <p className="text-sm">
              Le présent site est soumis au droit belge. Tout litige relatif à l'utilisation de ce site sera soumis à la compétence exclusive des tribunaux compétents en Belgique.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
          <Link href="/politique-confidentialite" className="hover:text-amber-600 transition-colors">Politique de confidentialité</Link>
          <Link href="/cgu" className="hover:text-amber-600 transition-colors">CGU</Link>
          <Link href="/cookies" className="hover:text-amber-600 transition-colors">Politique cookies</Link>
          <Link href="/" className="hover:text-amber-600 transition-colors ml-auto">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
