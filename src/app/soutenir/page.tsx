import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Search, Link2, ShoppingBag, PawPrint } from 'lucide-react';
import AffiliateLinkTool from './_components/AffiliateLinkTool';

export const metadata: Metadata = {
  title: 'Soutenir Mes Poilus - transformez vos achats en soutien',
  description: 'Un produit absent de notre boutique ? Collez son lien et obtenez un lien partenaire : en achetant via celui-ci, vous soutenez gratuitement Mes Poilus.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/soutenir' },
};

export default function SoutenirPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white mb-4">
            <Heart size={26} strokeWidth={1.8} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Soutenez Mes Poilus, gratuitement</h1>
          <p className="text-gray-600 leading-relaxed">
            Vous voulez acheter un produit pour votre animal qui n&apos;est pas dans notre boutique&nbsp;?
            Collez simplement son lien ci-dessous : nous le transformons en lien partenaire.
            En achetant via ce lien, vous nous reversez une petite commission <strong>sans payer un centime de plus</strong>.
            C&apos;est votre façon d&apos;aider la communauté Mes Poilus à rester gratuite.
          </p>
        </div>

        {/* Outil */}
        <AffiliateLinkTool />

        {/* Comment ça marche */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 text-center">Comment ça marche&nbsp;?</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Search, title: '1. Trouvez le produit', desc: 'Sur Amazon, Maxi Zoo, CanadaPetCare ou Tuft & Paw.' },
              { icon: Link2, title: '2. Collez le lien', desc: "Copiez l'adresse du produit et générez le lien partenaire." },
              { icon: ShoppingBag, title: '3. Achetez normalement', desc: 'Même prix pour vous, une commission pour Mes Poilus.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50 text-orange-600 mb-3">
                  <Icon size={18} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transparence */}
        <div className="mt-10 p-5 bg-orange-50/60 border border-orange-100 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <PawPrint size={15} className="text-orange-500" />
            En toute transparence
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Mes Poilus est partenaire affilié d&apos;Amazon et d&apos;autres marchands. Lorsqu&apos;un achat est réalisé
            via l&apos;un de nos liens, nous percevons une petite commission qui finance le blog, les guides gratuits
            et le service d&apos;adoption - sans aucun surcoût pour vous. Vérifiez toujours le prix et la disponibilité
            du produit sur le site marchand avant d&apos;acheter.
          </p>
        </div>

        {/* Retour boutique */}
        <div className="mt-10 text-center">
          <Link
            href="/boutique"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:border-orange-400 hover:text-orange-600 transition-colors"
          >
            <ShoppingBag size={15} />
            Découvrir notre boutique
          </Link>
        </div>

      </div>
    </div>
  );
}
