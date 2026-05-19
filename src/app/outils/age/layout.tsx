import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Calculateur d'âge animal — Chien, Chat, Lapin | Mes Poilus",
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
  return children;
}
