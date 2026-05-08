export const FLAGS: Record<string, string> = {
  FR: '🇫🇷', BE: '🇧🇪', CH: '🇨🇭', CA: '🇨🇦', US: '🇺🇸', LU: '🇱🇺',
};

export interface Partenaire {
  id: string;
  nom: string;
  description: string;
  url: string;
  emoji: string;
  tag: string;
  tagColor: string;
  pour: string;
  network: 'awin' | 'cj';
  pays: string[];
  categories: string[]; // catégories boutique ('all' = toutes)
}

export const PARTENAIRES: Partenaire[] = [
  {
    id: 'dogfy-diet',
    nom: 'Dogfy Diet',
    description:
      "Repas 100 % naturels cuisinés à la vapeur. Livraison en France. Portions personnalisées selon le poids, l'âge et l'activité de votre chien.",
    url: 'https://www.awin1.com/cread.php?awinmid=30279&awinaffid=2885973&ued=https%3A%2F%2Fdogfydiet.com%2Ffr',
    emoji: '🍗',
    tag: 'Nutrition fraîche',
    tagColor: 'bg-orange-100 text-orange-700',
    pour: 'Pour les chiens',
    network: 'awin',
    pays: ['FR'],
    categories: ['chiens'],
  },
];
