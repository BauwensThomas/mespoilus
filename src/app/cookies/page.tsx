import type { Metadata } from 'next';
import Link from 'next/link';
import CookieResetButton from '@/components/ui/CookieResetButton';

export const metadata: Metadata = {
  title: 'Politique de cookies',
  description: 'Politique d\'utilisation des cookies de Mes Poilus, conforme au RGPD.',
  robots: { index: true, follow: false },
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-12">

        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">Politique de cookies</h1>
        <p className="text-gray-600 text-sm mb-12">Conforme au RGPD et à la recommandation de l'APD belge - Dernière mise à jour : mai 2026</p>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">1. Qu'est-ce qu'un cookie ?</h2>
            <p className="text-sm">Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d'un site web. Il permet au site de mémoriser des informations sur votre visite et d'améliorer votre expérience.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">2. Cookies que nous utilisons</h2>
            <div className="space-y-6 text-sm">

              <div className="bg-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <h3 className="font-medium text-gray-900">Cookies essentiels</h3>
                  <span className="ml-auto text-xs bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full">Toujours actifs</span>
                </div>
                <p className="text-gray-600 mb-3">Indispensables au fonctionnement du site. Ils ne peuvent pas être désactivés.</p>
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-600"><th className="text-left py-1">Cookie</th><th className="text-left py-1">Durée</th><th className="text-left py-1">Rôle</th></tr></thead>
                  <tbody className="text-gray-600">
                    <tr className="border-t border-gray-200"><td className="py-1.5 pr-4">sb-access-token</td><td className="py-1.5 pr-4">Session</td><td className="py-1.5">Authentification Supabase</td></tr>
                    <tr className="border-t border-gray-200"><td className="py-1.5 pr-4">mespoilus_cookie_consent</td><td className="py-1.5 pr-4">12 mois</td><td className="py-1.5">Mémorisation de votre choix cookie</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                  <h3 className="font-medium text-gray-900">Cookies analytiques</h3>
                  <span className="ml-auto text-xs bg-blue-400/10 text-blue-400 border border-blue-400/20 px-2 py-0.5 rounded-full">Avec consentement</span>
                </div>
                <p className="text-gray-600 mb-3">Nous permettent de comprendre comment vous utilisez le site (pages visitées, durée de visite, provenance). Ces données sont anonymisées.</p>
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-600"><th className="text-left py-1">Cookie</th><th className="text-left py-1">Durée</th><th className="text-left py-1">Rôle</th></tr></thead>
                  <tbody className="text-gray-600">
                    <tr className="border-t border-gray-200"><td className="py-1.5 pr-4">_ga</td><td className="py-1.5 pr-4">13 mois</td><td className="py-1.5">Google Analytics - Identifiant utilisateur</td></tr>
                    <tr className="border-t border-gray-200"><td className="py-1.5 pr-4">_ga_*</td><td className="py-1.5 pr-4">13 mois</td><td className="py-1.5">Google Analytics - Session</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                  <h3 className="font-medium text-gray-900">Cookies publicitaires - Google AdSense</h3>
                  <span className="ml-auto text-xs bg-orange-400/10 text-orange-500 border border-orange-400/20 px-2 py-0.5 rounded-full">Avec consentement</span>
                </div>
                <p className="text-gray-600 mb-3">Permettent l'affichage de publicités personnalisées via Google AdSense. Ces cookies ne sont déposés qu'avec votre accord.</p>
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-600"><th className="text-left py-1">Cookie</th><th className="text-left py-1">Durée</th><th className="text-left py-1">Rôle</th></tr></thead>
                  <tbody className="text-gray-600">
                    <tr className="border-t border-gray-200"><td className="py-1.5 pr-4">_gcl_au</td><td className="py-1.5 pr-4">3 mois</td><td className="py-1.5">Google AdSense - Mesure des conversions publicitaires</td></tr>
                    <tr className="border-t border-gray-200"><td className="py-1.5 pr-4">IDE</td><td className="py-1.5 pr-4">13 mois</td><td className="py-1.5">Google DoubleClick - Ciblage publicitaire</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <h3 className="font-medium text-gray-900">Cookies marketing - Pinterest</h3>
                  <span className="ml-auto text-xs bg-red-400/10 text-red-500 border border-red-400/20 px-2 py-0.5 rounded-full">Avec consentement</span>
                </div>
                <p className="text-gray-600 mb-3">Permettent le suivi des visites provenant de Pinterest et la mesure des performances de nos contenus sur ce réseau. Ces cookies ne sont déposés qu'avec votre accord.</p>
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-600"><th className="text-left py-1">Cookie</th><th className="text-left py-1">Durée</th><th className="text-left py-1">Rôle</th></tr></thead>
                  <tbody className="text-gray-600">
                    <tr className="border-t border-gray-200"><td className="py-1.5 pr-4">_pinterest_sess</td><td className="py-1.5 pr-4">Session</td><td className="py-1.5">Pinterest - Session de suivi</td></tr>
                    <tr className="border-t border-gray-200"><td className="py-1.5 pr-4">_pin_unauth_id</td><td className="py-1.5 pr-4">12 mois</td><td className="py-1.5">Pinterest - Identifiant visiteur anonyme</td></tr>
                    <tr className="border-t border-gray-200"><td className="py-1.5 pr-4">_derived_epik</td><td className="py-1.5 pr-4">12 mois</td><td className="py-1.5">Pinterest - Mesure des conversions</td></tr>
                  </tbody>
                </table>
              </div>

            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">3. Gestion de vos préférences</h2>
            <div className="text-sm space-y-3">
              <p>Lors de votre première visite, un bandeau vous permet d'accepter ou de refuser les cookies non essentiels.</p>
              <p>Vous pouvez modifier votre choix à tout moment en cliquant sur le bouton ci-dessous ou en vidant les données de votre navigateur (<code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">localStorage</code>).</p>
              <CookieResetButton />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">4. Base légale</h2>
            <p className="text-sm">Conformément à l'Article 5(3) de la Directive ePrivacy et aux recommandations de l'Autorité de Protection des Données belge (APD), les cookies non essentiels ne sont déposés qu'avec votre consentement préalable, libre, spécifique, éclairé et univoque.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">5. Contact</h2>
            <p className="text-sm">Pour toute question relative à notre utilisation des cookies : <a href="mailto:contact@mespoilus.com" className="text-amber-600 hover:underline">contact@mespoilus.com</a></p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
          <Link href="/mentions-legales" className="hover:text-amber-600 transition-colors">Mentions légales</Link>
          <Link href="/politique-confidentialite" className="hover:text-amber-600 transition-colors">Politique de confidentialité</Link>
          <Link href="/cgu" className="hover:text-amber-600 transition-colors">CGU</Link>
          <Link href="/" className="hover:text-amber-600 transition-colors ml-auto">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
