import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, UtensilsCrossed, HelpCircle, Sparkles, BookOpen, Wrench } from 'lucide-react';
import ClientWrapper from '@/components/animations/ClientWrapper';

export const metadata: Metadata = {
  title: 'Outils gratuits pour animaux : calculateur, quiz, générateur',
  description: 'Calculez l\'âge de votre animal, trouvez la ration idéale, testez quel animal vous correspond et générez un prénom original. 100 % gratuit, sans inscription.',
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
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Hero avec animation */}
        <div className="text-center mb-10 fade-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white mb-4 shadow-lg hover:scale-105 transition-transform duration-300">
            <Wrench size={26} strokeWidth={1.8} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 glow-text">Nos outils gratuits</h1>
          <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
            Des calculateurs et ressources pratiques pour mieux prendre soin de votre animal - 100&nbsp;% gratuits, sans inscription.
          </p>
        </div>

        {/* Grille outils avec stagger */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-container">
          {TOOLS.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="stagger-child group bg-white rounded-2xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-orange-50 text-orange-600 mb-4 group-hover:bg-orange-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                <Icon size={20} />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">{label}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              <div className="mt-3 text-xs text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Découvrir →
              </div>
            </Link>
          ))}
        </div>

      </div>

      {/* Section descriptive */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <section className="mt-12 border-t border-gray-100 pt-10 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Des outils conçus pour les propriétaires d&apos;animaux</h2>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p>
              Prendre soin d&apos;un animal de compagnie demande des connaissances précises : quelle quantité de croquettes donner, à quel âge entre-t-il en phase senior, quel compagnon correspond vraiment à votre mode de vie ? Nos outils gratuits répondent à ces questions en quelques secondes, sans inscription ni compte à créer.
            </p>
            <p>
              Le <strong>calculateur d&apos;âge</strong> convertit l&apos;âge réel de votre animal en âge humain équivalent, en tenant compte de l&apos;espèce et de la taille. Un chien de grande race vieillit plus vite qu&apos;un petit chien, et un perroquet gris du Gabon peut dépasser 50 ans en bonne santé. Ce repère aide à anticiper les bilans vétérinaires et à adapter les soins à chaque étape de vie.
            </p>
            <p>
              La <strong>ration journalière</strong> calcule la quantité d&apos;aliments adaptée au poids, à l&apos;âge et au niveau d&apos;activité. Surpoids et sous-alimentation sont deux risques fréquents chez les animaux de compagnie : un calcul précis permet d&apos;éviter ces erreurs courantes qui impactent la santé sur le long terme.
            </p>
            <p>
              Le <strong>quiz &laquo;&nbsp;Quel animal pour moi&nbsp;?&nbsp;&raquo;</strong> pose 6 questions sur votre logement, votre rythme de vie et votre expérience pour vous orienter vers l&apos;espèce et la race la plus compatible. Un bon choix dès le départ, c&apos;est une adoption réussie pour de nombreuses années.
            </p>
            <p>
              Le <strong>générateur de prénoms</strong> propose des centaines d&apos;idées classées par espèce et par thème. Trouver le bon prénom pour un nouvel arrivant prend parfois plus de temps qu&apos;on ne le croit : cet outil simplifie la décision. Nos <strong>guides PDF gratuits</strong> complètent ces outils avec des checklists pratiques à télécharger et à conserver.
            </p>
          </div>
        </section>
      </div>

      <ClientWrapper />
    </div>
  );
}