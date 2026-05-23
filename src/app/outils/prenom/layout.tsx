import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Générateur de prénoms pour animaux - Chien, Chat, Lapin | Mes Poilus",
  description: "Trouvez le prénom parfait pour votre animal. Des centaines d'idées de noms pour chiens, chats, lapins, oiseaux et rongeurs.",
  openGraph: {
    title: "Générateur de prénoms pour animaux | Mes Poilus",
    description: "Des centaines d'idées de noms pour chiens, chats, lapins, oiseaux et rongeurs.",
    url: 'https://www.mespoilus.com/outils/prenom',
    siteName: 'Mes Poilus',
  },
  alternates: { canonical: 'https://www.mespoilus.com/outils/prenom' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
