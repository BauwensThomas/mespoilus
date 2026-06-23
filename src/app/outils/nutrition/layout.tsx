import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Calculateur de nutrition pour animaux",
  description: "Calculez les besoins alimentaires de votre animal. Conseils nutrition personnalisés pour chiens, chats et petits animaux.",
  openGraph: {
    title: "Calculateur de nutrition pour animaux | Mes Poilus",
    description: "Calculez les besoins alimentaires et obtenez des conseils nutrition pour votre animal.",
    url: 'https://www.mespoilus.com/outils/nutrition',
    siteName: 'Mes Poilus',
  },
  alternates: { canonical: 'https://www.mespoilus.com/outils/nutrition' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <section className="mt-12 border-t border-gray-100 pt-10 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pourquoi calculer la ration de son animal ?</h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              Un animal sous-alimenté perd du poids et de l&apos;énergie. Un animal suralimenté développe rapidement un surpoids qui fragilise ses articulations, son coeur et son foie. Pourtant, la plupart des propriétaires estiment la quantité à l&apos;oeil, en suivant vaguement les indications du sac de croquettes, souvent calculées pour un animal de poids idéal et d&apos;activité standard.
            </p>
            <p>
              Les besoins caloriques varient selon l&apos;espèce, la taille, l&apos;âge, le niveau d&apos;activité et l&apos;état de santé. Un chien stérilisé a des besoins énergétiques réduits d&apos;environ 20 à 30&nbsp;% par rapport à un chien entier. Un chaton en croissance a besoin de deux à trois fois plus de protéines par kilo qu&apos;un chat adulte sédentaire. Ces différences sont significatives sur la durée.
            </p>
            <p>
              Notre calculateur de ration journalière prend en compte le poids actuel, l&apos;âge et le niveau d&apos;activité pour estimer les besoins caloriques quotidiens. Il donne une base de travail à affiner avec votre vétérinaire, notamment si votre animal suit un régime particulier ou souffre d&apos;une pathologie (diabète, insuffisance rénale, allergie alimentaire).
            </p>
            <p>
              Pour les chats d&apos;intérieur peu actifs, le surpoids est le premier facteur de risque pour le diabète et les maladies urinaires. Pour les lapins, une mauvaise ration en foin (qui devrait représenter 80&nbsp;% de l&apos;alimentation) provoque des troubles digestifs graves. Pour les rongeurs, la suralimentation en graines grasses est la cause principale d&apos;obésité et de troubles hépatiques. Calculer ne prend que quelques secondes et peut faire une grande différence sur la santé à long terme.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
