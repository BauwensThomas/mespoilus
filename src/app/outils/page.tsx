import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, UtensilsCrossed, HelpCircle, Sparkles, BookOpen, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Outils gratuits pour propriétaires d\'animaux - Mes Poilus',
  description: 'Calculateur d\'âge, ration journalière, quiz « quel animal pour moi ? », générateur de prénom et guides PDF gratuits pour chiens, chats et NAC.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/outils' },
};

const TOOLS = [
  { href: '/outils/age',       label: "Calculateur d'âge",      desc: 'Convertissez l\'âge de votre animal en âge humain.',          icon: Calculator       },
  { href: '/outils/nutrition', label: 'Ration journalière',     desc: 'Calculez la quantité de croquettes et pâtée idéale.',         icon: UtensilsCrossed  },
  { href: '/outils/quiz',      label: 'Quel animal pour moi ?', desc: 'Un quiz en 6 questions pour trouver le compagnon idéal.',     icon: HelpCircle       },
  { href: '/outils/prenom',    label: 'Générateur de prénom',   desc: 'Trouvez le prénom parfait pour votre nouveau compagnon.',     icon: Sparkles         },
  { href: '/guides',           label: 'Guides PDF gratuits',    desc: 'Checklists et guides pratiques à télécharger gratuitement.',  icon: BookOpen         },
];

export default function OutilsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white mb-4">
            <Wrench size={26} strokeWidth={1.8} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Nos outils gratuits</h1>
          <p className="text-gray-600 leading-relaxed">
            Des calculateurs et ressources pratiques pour mieux prendre soin de votre animal - 100&nbsp;% gratuits, sans inscription.
          </p>
        </div>

        {/* Grille outils */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all flex flex-col"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-orange-50 text-orange-600 mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Icon size={20} />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">{label}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
