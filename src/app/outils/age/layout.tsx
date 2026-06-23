import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Calculateur d'âge animal",
  description: "Convertissez l'âge de votre animal en années humaines. Calculateur gratuit pour chiens, chats, lapins, rongeurs et oiseaux.",
  openGraph: {
    title: "Calculateur d'âge animal | Mes Poilus",
    description: "Convertissez l'âge de votre animal en années humaines. Gratuit pour chiens, chats, lapins et plus.",
    url: 'https://www.mespoilus.com/outils/age',
    siteName: 'Mes Poilus',
  },
  alternates: { canonical: 'https://www.mespoilus.com/outils/age' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <section className="mt-12 border-t border-gray-100 pt-10 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pourquoi convertir l&apos;âge de son animal ?</h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              L&apos;espérance de vie varie considérablement selon les espèces et la morphologie. Un chien géant comme le Dogue Allemand vieillit environ deux fois plus vite qu&apos;un Chihuahua. Un chat domestique atteint sa maturité dès 6 mois mais peut vivre 18 à 20 ans. Un perroquet gris du Gabon peut dépasser 50 ans en bonne santé. Ces différences rendent la notion d&apos;âge humain équivalent complexe mais précieuse.
            </p>
            <p>
              Connaître cet équivalent aide à prendre les bonnes décisions vétérinaires. Un chien de 7 ans n&apos;est pas vieux au sens humain, mais son organisme entre déjà en phase senior : bilan sanguin annuel recommandé, alimentation adaptée, surveillance des articulations. Un lapin de 4 ans est un adulte confirmé avec encore de belles années devant lui si ses besoins nutritionnels sont respectés.
            </p>
            <p>
              Notre calculateur utilise des formules validées par les associations vétérinaires pour chaque espèce. Pour les chiens, la taille est prise en compte car elle influence directement la vitesse de vieillissement cellulaire. Pour les oiseaux et les reptiles, la longévité naturelle de l&apos;espèce est le paramètre central. Le résultat est une estimation indicative, à combiner avec l&apos;avis de votre vétérinaire pour toute décision médicale.
            </p>
            <p>
              Parmi les signes courants du vieillissement chez le chien et le chat : grisonnement du museau, réduction de l&apos;activité physique, digestion plus lente, troubles du sommeil. Chez les rongeurs, la durée de vie plus courte impose une vigilance accrue dès 18 mois. Chez les reptiles, la croissance lente peut masquer un vieillissement silencieux nécessitant des contrôles réguliers.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
