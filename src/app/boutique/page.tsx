import BackButton from '@/components/ui/BackButton';

export default function BoutiquePage() {
  return (
    <div className="px-8 py-8 animate-fade-in">
      <BackButton />

      <div className="max-w-2xl mx-auto text-center py-24">
        <div className="text-6xl mb-6">🛍️</div>
        <h1 className="text-3xl font-bold text-white mb-4">Boutique Mes Poilus</h1>
        <p className="text-gray-400 text-lg mb-8">
          Notre boutique d'accessoires et produits pour animaux arrive bientôt.
        </p>
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm px-4 py-2 rounded-full">
          Intégration Shopify en cours
        </div>
      </div>
    </div>
  );
}
