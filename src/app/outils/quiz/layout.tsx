import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Quiz - Quel animal vous correspond ? | Mes Poilus",
  description: "Répondez à notre quiz pour découvrir quel animal de compagnie correspond le mieux à votre mode de vie : chien, chat, lapin, oiseau ou rongeur.",
  openGraph: {
    title: "Quiz : quel animal vous correspond ? | Mes Poilus",
    description: "Découvrez quel animal correspond à votre mode de vie en quelques questions.",
    url: 'https://www.mespoilus.com/outils/quiz',
    siteName: 'Mes Poilus',
  },
  alternates: { canonical: 'https://www.mespoilus.com/outils/quiz' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
