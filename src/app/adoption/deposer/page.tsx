import type { Metadata } from 'next';
import AdoptionPostForm from '../AdoptionPostForm';
import { ShieldCheck, Clock, Mail } from 'lucide-react';

const EXPIRY_DAYS = 60;

export const metadata: Metadata = {
  title: 'Déposer une annonce - Adoption Mes Poilus',
  description: "Déposez gratuitement une annonce pour donner votre animal à adopter. Votre annonce sera vérifiée avant publication.",
  robots: { index: false, follow: false },
};

export default function DeposerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Déposer une annonce</h1>
          <p className="text-gray-500 text-sm mt-1">Gratuit · Vérifié avant publication</p>
        </div>

        {/* Infos importantes */}
        <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
          <div className="flex items-start gap-3 px-4 py-3.5">
            <ShieldCheck size={18} strokeWidth={1.5} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Vos coordonnées restent privées</p>
              <p className="text-xs text-gray-500 mt-0.5">Les personnes intéressées vous contactent via un formulaire. Votre email et téléphone ne sont jamais affichés publiquement.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 px-4 py-3.5">
            <Clock size={18} strokeWidth={1.5} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Suppression automatique après {EXPIRY_DAYS} jours</p>
              <p className="text-xs text-gray-500 mt-0.5">Votre annonce est retirée automatiquement au bout de {EXPIRY_DAYS} jours. Vous recevrez un email et pourrez en déposer une nouvelle gratuitement.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 px-4 py-3.5">
            <Mail size={18} strokeWidth={1.5} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Un code de suppression vous est envoyé</p>
              <p className="text-xs text-gray-500 mt-0.5">Dès validation, vous recevrez un code personnel pour supprimer votre annonce à tout moment si votre animal trouve un foyer.</p>
            </div>
          </div>
        </div>

        <AdoptionPostForm />
      </div>
    </div>
  );
}
