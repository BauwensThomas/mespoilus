import type { Metadata } from 'next';
import AdoptionPostForm from '../AdoptionPostForm';

export const metadata: Metadata = {
  title: 'Déposer une annonce -Adoption Mes Poilus',
  description: "Déposez gratuitement une annonce pour donner votre animal à adopter. Votre annonce sera vérifiée avant publication.",
  robots: { index: false, follow: false },
};

export default function DeposerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Déposer une annonce</h1>
        <p className="text-gray-500 text-sm mt-1 mb-8">
          Votre annonce sera vérifiée avant publication.
        </p>
        <AdoptionPostForm />
      </div>
    </div>
  );
}
