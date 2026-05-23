import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Guide nutritionnel pour animaux - Alimentation & Conseils | Mes Poilus",
  description: "Calculez les besoins alimentaires de votre animal. Conseils nutrition personnalisés pour chiens, chats et petits animaux.",
  openGraph: {
    title: "Guide nutritionnel pour animaux | Mes Poilus",
    description: "Calculez les besoins alimentaires et obtenez des conseils nutrition pour votre animal.",
    url: 'https://www.mespoilus.com/outils/nutrition',
    siteName: 'Mes Poilus',
  },
  alternates: { canonical: 'https://www.mespoilus.com/outils/nutrition' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
