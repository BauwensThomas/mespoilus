export interface Partenaire {
  id: string;
  nom: string;
  url: string;
  emoji: string;
  description?: string;
  tag?: string;
  tagColor?: string;
  tagBg?: string;   // CSS color pour inline style (carousel)
  tagText?: string; // CSS color pour inline style (carousel)
  pour?: string;
  network?: 'awin' | 'cj';
  pays?: string[];     // codes ISO: ['FR', 'BE', 'CA', 'US'…]
  categories?: string[];
}

export function getFlagUrl(code: string): string {
  return `https://flagcdn.com/w20/${code.toLowerCase()}.png`;
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
    tagColor: 'bg-orange-100 text-orange-800',
    tagBg: '#ffedd5', tagText: '#9a3412',
    pour: 'Pour les chiens',
    network: 'awin',
    pays: ['FR'],
    categories: ['chiens'],
  },
  {
    id: 'canada-pet-care',
    nom: 'CanadaPetCare',
    description:
      'Antiparasitaires, vermifuges et soins santé pour chiens et chats. Frontline Plus, Advantage, K9 Advantix et plus.',
    url: 'https://www.jdoqocy.com/click-101746286-17287368',
    emoji: '💊',
    tag: 'Santé animale',
    tagColor: 'bg-blue-100 text-blue-800',
    tagBg: '#dbeafe', tagText: '#1e40af',
    pour: 'Pour chiens & chats',
    network: 'cj',
    pays: ['CA', 'US'],
    categories: ['chiens', 'chats'],
  },
];
