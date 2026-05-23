import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité et de protection des données personnelles de Mes Poilus, conforme au RGPD.',
  robots: { index: true, follow: false },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">Politique de confidentialité</h1>
        <p className="text-gray-600 text-sm mb-12">Conforme au RGPD (Règlement UE 2016/679) - Dernière mise à jour : mai 2026</p>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">1. Responsable du traitement</h2>
            <div className="space-y-2 text-sm">
              <p>Mes Poilus</p>
              <p><span className="text-gray-600">Email :</span> contact@mespoilus.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">2. Données collectées</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">2.1 Newsletter</h3>
                <p>Lorsque vous vous inscrivez à notre newsletter, nous collectons votre <strong>adresse email</strong>. Aucune autre donnée n'est requise.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">2.2 Annonces d'adoption</h3>
                <p>Lorsque vous déposez une annonce d'adoption, nous collectons : votre <strong>prénom</strong>, votre <strong>adresse email</strong> (non affichée publiquement), votre <strong>numéro de téléphone</strong> (non affiché publiquement), votre <strong>pays et région/ville</strong>, ainsi que les <strong>informations sur l'animal</strong> (type, race, âge, sexe, description, raison du don) et les <strong>photos</strong>. Ces données sont nécessaires à la publication et à la modération de l'annonce.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">2.3 Cookies et données de navigation</h3>
                <p>Nous utilisons des cookies analytiques (Google Analytics) pour comprendre l'utilisation du site. Ces cookies ne sont déposés qu'avec votre consentement explicite. Consultez notre <Link href="/cookies" className="text-amber-600 hover:underline">politique cookies</Link>.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">2.4 Données techniques</h3>
                <p>Lors de toute connexion, notre serveur enregistre automatiquement : adresse IP, type de navigateur, pages visitées, date et heure. Ces données sont conservées à des fins de sécurité et de débogage.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">2.5 Téléchargement de guides PDF</h3>
                <p>Lorsque vous téléchargez un guide gratuit, nous collectons votre <strong>adresse email</strong> afin de vous envoyer le lien de téléchargement. Vous pouvez également consentir, séparément, à recevoir notre newsletter. Ces deux consentements sont indépendants.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">2.6 Alertes adoption</h3>
                <p>Si vous vous inscrivez aux alertes adoption, nous collectons votre <strong>adresse email</strong>, le <strong>type d'animal</strong> et le <strong>pays</strong> souhaités. Un email de confirmation (double opt-in) est envoyé avant toute activation. Vous pouvez vous désinscrire à tout moment via le lien présent dans chaque email d'alerte.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">2.7 Commentaires d'articles</h3>
                <p>Lorsque vous laissez un commentaire sur un article, nous collectons votre <strong>prénom</strong> (ou pseudo) et le <strong>texte de votre commentaire</strong>. Vous pouvez également fournir votre <strong>adresse email de façon optionnelle</strong> afin d'être notifié par email lorsqu'un nouveau commentaire est publié sur le même article. Cette adresse n'est pas affichée publiquement. Vous pouvez vous désabonner à tout moment via le lien de désabonnement présent dans chaque email de notification. Les commentaires sont soumis à modération avant publication et peuvent être supprimés à tout moment sur simple demande à <a href="mailto:contact@mespoilus.com" className="text-orange-600 underline">contact@mespoilus.com</a>.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">2.8 Demandes de contact par email</h3>
                <p>Lorsque vous nous contactez par email (presse, partenariats, questions générales), votre <strong>adresse email</strong> et le contenu de votre message sont utilisés uniquement pour répondre à votre demande. Ces échanges ne sont pas stockés dans une base de données et ne sont pas utilisés à des fins commerciales.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">2.9 Outil "Trouver un vétérinaire" (Google Maps)</h3>
                <p>Notre outil de recherche de vétérinaires utilise <strong>Google Maps Platform</strong> (Google Ireland Limited). Le chargement de la carte transmet votre <strong>adresse IP</strong> aux serveurs de Google, conformément à la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">politique de confidentialité de Google</a>. Si vous utilisez le bouton <em>"Ma position"</em>, votre navigateur vous demande explicitement l'autorisation d'accéder à votre <strong>position GPS</strong>. Cette position est utilisée uniquement pour centrer la carte et lancer la recherche à proximité. Elle n'est jamais transmise à nos serveurs ni stockée dans notre base de données. La géolocalisation n'est activée que sur votre action volontaire et peut être refusée sans impact sur les autres fonctionnalités du site.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">3. Base légale des traitements (RGPD)</h2>
            <div className="text-sm space-y-2">
              <div className="grid grid-cols-1 gap-3">
                {[
                  { traitement: 'Newsletter', base: 'Consentement (Art. 6.1.a RGPD)' },
                  { traitement: 'Annonces d\'adoption', base: 'Consentement (Art. 6.1.a RGPD)' },
                  { traitement: 'Alertes adoption', base: 'Consentement (Art. 6.1.a RGPD)' },
                  { traitement: 'Commentaires articles', base: 'Consentement (Art. 6.1.a RGPD)' },
                  { traitement: 'Cookies analytiques', base: 'Consentement (Art. 6.1.a RGPD)' },
                  { traitement: 'Téléchargement guide PDF', base: 'Consentement (Art. 6.1.a RGPD)' },
                  { traitement: 'Géolocalisation (vétérinaire)', base: 'Consentement explicite navigateur (Art. 6.1.a RGPD)' },
                  { traitement: 'Cookies essentiels', base: 'Intérêt légitime (Art. 6.1.f RGPD)' },
                  { traitement: 'Logs de sécurité', base: 'Intérêt légitime (Art. 6.1.f RGPD)' },
                  { traitement: 'Facturation', base: 'Obligation légale (Art. 6.1.c RGPD)' },
                ].map(({ traitement, base }) => (
                  <div key={traitement} className="flex gap-4 py-2 border-b border-gray-200">
                    <span className="text-gray-700 w-52 shrink-0">{traitement}</span>
                    <span className="text-gray-600">{base}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">4. Durée de conservation</h2>
            <div className="text-sm space-y-2">
              {[
                { type: 'Adresse email newsletter', duree: "Jusqu'à désinscription" },
                { type: 'Alertes adoption', duree: "Jusqu'à désinscription (lien dans chaque email)" },
                { type: 'Annonces d\'adoption', duree: "60 jours après approbation, ou suppression à votre demande" },
                { type: 'Photos d\'adoption', duree: "Supprimées avec l'annonce" },
                { type: 'Email téléchargement guide', duree: "Jusqu'à désinscription ou suppression à votre demande" },
                { type: 'Commentaires articles', duree: "Jusqu'à suppression par l'administrateur ou sur demande" },
                { type: 'Email notifications commentaires', duree: "Jusqu'à désabonnement (lien dans chaque email)" },
                { type: 'Logs techniques', duree: '12 mois' },
                { type: 'Cookies analytiques', duree: '13 mois maximum' },
              ].map(({ type, duree }) => (
                <div key={type} className="flex gap-4 py-2 border-b border-gray-200">
                  <span className="text-gray-700 w-52 shrink-0">{type}</span>
                  <span className="text-gray-600">{duree}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">5. Partage des données</h2>
            <div className="text-sm space-y-3">
              <p>Nous ne vendons jamais vos données personnelles à des tiers.</p>
              <p>Vos données peuvent être partagées avec :</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                <li className="!list-none -ml-2">
                  <span className="text-gray-700">Nos partenaires affiliés</span>
                  <span className="text-gray-700 text-xs ml-1">(aucune donnée personnelle transmise, simple redirection)</span>
                  <ul className="mt-1.5 space-y-1 ml-6">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Amazon FR Associates</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Awin (Dogfy Diet, Maxi Zoo, Tuft &amp; Paw)</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />CJ.com (CanadaPetCare)</li>
                  </ul>
                </li>
                <li>Google Analytics - Données de navigation anonymisées (si consentement accordé)</li>
                <li>Google AdSense - Affichage de publicités, cookies publicitaires déposés uniquement avec consentement (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">politique Google</a>)</li>
                <li>Google Maps Platform - Adresse IP transmise lors du chargement de la carte vétérinaire (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">politique Google</a>)</li>
                <li>Pinterest - Suivi de l'audience et mesure des performances via le tag Pinterest, cookies déposés uniquement avec consentement (<a href="https://policy.pinterest.com/fr/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">politique Pinterest</a>)</li>
                <li>Resend - Service d'envoi d'emails transactionnels (confirmation d'annonce, notifications)</li>
                <li>Vercel - Hébergeur du site (infrastructure technique)</li>
                <li>Supabase - Base de données et stockage des photos (hébergement EU disponible)</li>
                <li>Sentry - Outil de surveillance des erreurs techniques (stack traces, logs d'erreurs) ; aucune donnée personnelle volontairement transmise (<a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">politique Sentry</a>)</li>
              </ul>
              <p>Tout transfert hors UE est encadré par les clauses contractuelles types de la Commission européenne.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">6. Vos droits RGPD</h2>
            <div className="text-sm space-y-3">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="space-y-2 ml-2">
                {[
                  { droit: 'Droit d\'accès', desc: 'Obtenir une copie de vos données personnelles' },
                  { droit: 'Droit de rectification', desc: 'Corriger des données inexactes ou incomplètes' },
                  { droit: 'Droit à l\'effacement', desc: 'Demander la suppression de vos données ("droit à l\'oubli")' },
                  { droit: 'Droit à la portabilité', desc: 'Recevoir vos données dans un format structuré et lisible' },
                  { droit: 'Droit d\'opposition', desc: 'Vous opposer à certains traitements (ex. marketing)' },
                  { droit: 'Droit de limitation', desc: 'Demander la suspension temporaire d\'un traitement' },
                  { droit: 'Retrait du consentement', desc: 'À tout moment pour les traitements basés sur le consentement' },
                ].map(({ droit, desc }) => (
                  <li key={droit} className="flex gap-3">
                    <span className="text-amber-600 font-medium shrink-0">{droit} :</span>
                    <span className="text-gray-600">{desc}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4">Pour exercer vos droits, contactez-nous : <a href="mailto:contact@mespoilus.com" className="text-amber-600 hover:underline">contact@mespoilus.com</a></p>
              <p>Vous pouvez également introduire une réclamation auprès de l'<a href="https://www.autoriteprotectiondonnees.be" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Autorité de Protection des Données belge (APD)</a>.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">7. Sécurité</h2>
            <p className="text-sm">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement HTTPS, accès restreint, rate limiting, détection d'intrusions. En cas de violation de données susceptible d'engendrer un risque pour vos droits, nous vous en informerons conformément à l'Art. 34 RGPD.
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
