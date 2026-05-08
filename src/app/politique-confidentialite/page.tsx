import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité et de protection des données personnelles de Mes Poilus, conforme au RGPD.',
  robots: { index: true, follow: false },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold dark:text-white text-gray-900 mt-8 mb-2">Politique de confidentialité</h1>
        <p className="text-gray-500 text-sm mb-12">Conforme au RGPD (Règlement UE 2016/679) - dernière mise à jour : mai 2026</p>

        <div className="space-y-10 dark:text-gray-300 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold dark:text-white text-gray-900 mb-4 pb-2 border-b dark:border-gray-800 border-gray-200">1. Responsable du traitement</h2>
            <div className="space-y-2 text-sm">
              <p>Mes Poilus</p>
              <p><span className="text-gray-500">Email :</span> contact@mespoilus.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold dark:text-white text-gray-900 mb-4 pb-2 border-b dark:border-gray-800 border-gray-200">2. Données collectées</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium dark:text-gray-200 text-gray-800 mb-2">2.1 Newsletter</h3>
                <p>Lorsque vous vous inscrivez à notre newsletter, nous collectons votre <strong>adresse email</strong>. Aucune autre donnée n'est requise.</p>
              </div>
              <div>
                <h3 className="font-medium dark:text-gray-200 text-gray-800 mb-2">2.2 Annonces d'adoption</h3>
                <p>Lorsque vous déposez une annonce d'adoption, nous collectons : votre <strong>prénom</strong>, votre <strong>adresse email privée</strong> (non affichée publiquement), votre <strong>région ou ville</strong>, une <strong>adresse email publique</strong> et optionnellement un <strong>numéro de téléphone</strong> (affichés sur l'annonce publiée), ainsi que les <strong>photos</strong> de l'animal. Ces données sont nécessaires à la publication et à la modération de l'annonce.</p>
              </div>
              <div>
                <h3 className="font-medium dark:text-gray-200 text-gray-800 mb-2">2.3 Cookies et données de navigation</h3>
                <p>Nous utilisons des cookies analytiques (Google Analytics) pour comprendre l'utilisation du site. Ces cookies ne sont déposés qu'avec votre consentement explicite. Consultez notre <Link href="/cookies" className="text-amber-400 hover:underline">politique cookies</Link>.</p>
              </div>
              <div>
                <h3 className="font-medium dark:text-gray-200 text-gray-800 mb-2">2.4 Données techniques</h3>
                <p>Lors de toute connexion, notre serveur enregistre automatiquement : adresse IP, type de navigateur, pages visitées, date et heure. Ces données sont conservées à des fins de sécurité et de débogage.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold dark:text-white text-gray-900 mb-4 pb-2 border-b dark:border-gray-800 border-gray-200">3. Base légale des traitements (RGPD)</h2>
            <div className="text-sm space-y-2">
              <div className="grid grid-cols-1 gap-3">
                {[
                  { traitement: 'Newsletter', base: 'Consentement (Art. 6.1.a RGPD)' },
                  { traitement: 'Annonces d\'adoption', base: 'Consentement (Art. 6.1.a RGPD)' },
                  { traitement: 'Cookies analytiques', base: 'Consentement (Art. 6.1.a RGPD)' },
                  { traitement: 'Cookies essentiels', base: 'Intérêt légitime (Art. 6.1.f RGPD)' },
                  { traitement: 'Logs de sécurité', base: 'Intérêt légitime (Art. 6.1.f RGPD)' },
                  { traitement: 'Facturation', base: 'Obligation légale (Art. 6.1.c RGPD)' },
                ].map(({ traitement, base }) => (
                  <div key={traitement} className="flex gap-4 py-2 border-b dark:border-gray-800/50 border-gray-200">
                    <span className="text-gray-300 w-52 shrink-0">{traitement}</span>
                    <span className="text-gray-500">{base}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold dark:text-white text-gray-900 mb-4 pb-2 border-b dark:border-gray-800 border-gray-200">4. Durée de conservation</h2>
            <div className="text-sm space-y-2">
              {[
                { type: 'Adresse email newsletter', duree: "Jusqu'à désinscription" },
                { type: 'Annonces d\'adoption', duree: "Jusqu'à suppression à votre demande ou après 12 mois sans activité" },
                { type: 'Photos d\'adoption', duree: "Supprimées avec l'annonce" },
                { type: 'Logs techniques', duree: '12 mois' },
                { type: 'Cookies analytiques', duree: '13 mois maximum' },
              ].map(({ type, duree }) => (
                <div key={type} className="flex gap-4 py-2 border-b dark:border-gray-800/50 border-gray-200">
                  <span className="text-gray-300 w-52 shrink-0">{type}</span>
                  <span className="text-gray-500">{duree}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold dark:text-white text-gray-900 mb-4 pb-2 border-b dark:border-gray-800 border-gray-200">5. Partage des données</h2>
            <div className="text-sm space-y-3">
              <p>Nous ne vendons jamais vos données personnelles à des tiers.</p>
              <p>Vos données peuvent être partagées avec :</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                <li>Nos partenaires affiliés (Amazon, Zooplus, etc.) — aucune donnée personnelle transmise, simple redirection</li>
                <li>Google Analytics — données de navigation anonymisées (si consentement accordé)</li>
                <li>Resend — service d'envoi d'emails transactionnels (confirmation d'annonce, notifications)</li>
                <li>Vercel — hébergeur du site (infrastructure technique)</li>
                <li>Supabase — base de données et stockage des photos (hébergement EU disponible)</li>
              </ul>
              <p>Tout transfert hors UE est encadré par les clauses contractuelles types de la Commission européenne.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold dark:text-white text-gray-900 mb-4 pb-2 border-b dark:border-gray-800 border-gray-200">6. Vos droits RGPD</h2>
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
                    <span className="text-amber-400 font-medium shrink-0">{droit} :</span>
                    <span className="text-gray-400">{desc}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4">Pour exercer vos droits, contactez-nous : <a href="mailto:contact@mespoilus.com" className="text-amber-400 hover:underline">contact@mespoilus.com</a></p>
              <p>Vous pouvez également introduire une réclamation auprès de l'<a href="https://www.autoriteprotectiondonnees.be" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Autorité de Protection des Données belge (APD)</a>.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold dark:text-white text-gray-900 mb-4 pb-2 border-b dark:border-gray-800 border-gray-200">7. Sécurité</h2>
            <p className="text-sm">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement HTTPS, accès restreint, rate limiting, détection d'intrusions. En cas de violation de données susceptible d'engendrer un risque pour vos droits, nous vous en informerons conformément à l'Art. 34 RGPD.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t dark:border-gray-800 border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
          <Link href="/mentions-legales" className="hover:text-amber-400 transition-colors">Mentions légales</Link>
          <Link href="/cgu" className="hover:text-amber-400 transition-colors">CGU</Link>
          <Link href="/cookies" className="hover:text-amber-400 transition-colors">Politique cookies</Link>
          <Link href="/" className="hover:text-amber-400 transition-colors ml-auto">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
