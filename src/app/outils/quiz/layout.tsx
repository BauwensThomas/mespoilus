import type { Metadata } from 'next';
import { getMetaOverride } from '@/lib/seo-overrides';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: "Quiz : quel animal me correspond ?",
    description: "Répondez à notre quiz pour découvrir quel animal de compagnie correspond le mieux à votre mode de vie : chien, chat, lapin, oiseau ou rongeur.",
    openGraph: {
      title: "Quiz : quel animal me correspond ? | Mes Poilus",
      description: "Découvrez quel animal correspond à votre mode de vie en quelques questions.",
      url: 'https://www.mespoilus.com/outils/quiz',
      siteName: 'Mes Poilus',
    },
    alternates: { canonical: 'https://www.mespoilus.com/outils/quiz' },
  };
  const override = await getMetaOverride('/outils/quiz');
  return {
    ...base,
    ...(override?.title ? { title: override.title } : {}),
    ...(override?.description ? { description: override.description } : {}),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <section className="mt-12 border-t border-gray-100 pt-10 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quel animal me correspond vraiment ?</h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              Choisir un animal de compagnie est une décision qui engage plusieurs années, parfois une décennie ou plus. Un chien peut vivre 12 à 15 ans, un perroquet jusqu&apos;à 50 ans, un lapin nain entre 8 et 12 ans. Adopter sous le coup de l&apos;émotion, sans évaluer sa situation réelle, est l&apos;une des premières causes d&apos;abandon en refuge.
            </p>
            <p>
              Notre quiz pose 6 questions sur votre logement (surface, présence d&apos;un jardin), votre rythme de vie (temps disponible, voyages fréquents), votre budget mensuel et votre expérience avec les animaux. En croisant ces réponses, il oriente vers l&apos;espèce et le type de race les plus compatibles avec votre quotidien.
            </p>
            <p>
              Un appartement en ville sans jardin ne convient pas à un Border Collie ou un Malinois, mais parfaitement à un Bouledogue Français, un chat d&apos;intérieur ou un couple de cobayes. Un mode de vie très actif avec de longues randonnées hebdomadaires s&apos;accorde bien avec un Labrador ou un Vizsla. Une personne qui voyage souvent aura intérêt à réfléchir à la garde de son animal avant d&apos;adopter.
            </p>
            <p>
              Ce quiz n&apos;est pas une décision définitive mais un point de départ. Il est conçu pour élargir vos horizons au-delà de l&apos;espèce à laquelle vous pensiez initialement, et peut-être vous faire découvrir une race ou une espèce que vous n&apos;aviez pas envisagée. Après le quiz, consultez nos fiches races pour affiner votre choix.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
