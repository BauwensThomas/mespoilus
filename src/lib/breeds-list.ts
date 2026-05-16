export type AnimalType = 'chien' | 'chat' | 'oiseau' | 'rongeur' | 'reptile';

export interface BreedSeed {
  name: string;
  slug: string;
  animal: AnimalType;
}

export interface BreedContent {
  excerpt: string;
  description: string;
  origine: string;
  taille: 'petit' | 'moyen' | 'grand' | 'très grand';
  poids: string;
  esperance_vie: string;
  caractere: string[];
  entretien: string;
  alimentation: string;
  sante: string;
  convient_pour: {
    appartement: boolean;
    jardin: boolean;
    enfants: boolean;
    debutants: boolean;
    seniors: boolean;
  };
  niveau_activite: 'faible' | 'modéré' | 'élevé' | 'très élevé';
}

export interface Breed {
  id: string;
  animal: AnimalType;
  name: string;
  slug: string;
  content: BreedContent | null;
  photo_url: string | null;
  status: 'draft' | 'published';
  generated_at: string | null;
  created_at: string;
}

export const ANIMAL_URL_MAP: Record<string, AnimalType> = {
  chiens:   'chien',
  chats:    'chat',
  oiseaux:  'oiseau',
  rongeurs: 'rongeur',
  reptiles: 'reptile',
};

export const ANIMAL_LABEL: Record<AnimalType, string> = {
  chien:   'Chiens',
  chat:    'Chats',
  oiseau:  'Oiseaux',
  rongeur: 'Rongeurs',
  reptile: 'Reptiles',
};

export const ANIMAL_URL: Record<AnimalType, string> = {
  chien:   'chiens',
  chat:    'chats',
  oiseau:  'oiseaux',
  rongeur: 'rongeurs',
  reptile: 'reptiles',
};

export const ANIMAL_EMOJI: Record<AnimalType, string> = {
  chien:   '🐕',
  chat:    '🐈',
  oiseau:  '🦜',
  rongeur: '🐹',
  reptile: '🦎',
};

export const ANIMAL_GRADIENT: Record<AnimalType, string> = {
  chien:   'from-orange-600 to-amber-800',
  chat:    'from-pink-600 to-rose-800',
  oiseau:  'from-blue-600 to-indigo-800',
  rongeur: 'from-green-600 to-emerald-800',
  reptile: 'from-teal-600 to-cyan-800',
};

export const BREEDS_SEED: BreedSeed[] = [
  // ─── Chiens (50) ──────────────────────────────────────────────────────────────
  { name: 'Labrador Retriever',          slug: 'labrador-retriever',          animal: 'chien' },
  { name: 'Berger Allemand',             slug: 'berger-allemand',             animal: 'chien' },
  { name: 'Golden Retriever',            slug: 'golden-retriever',            animal: 'chien' },
  { name: 'Bulldog Français',            slug: 'bulldog-francais',            animal: 'chien' },
  { name: 'Husky Sibérien',              slug: 'husky-siberien',              animal: 'chien' },
  { name: 'Beagle',                      slug: 'beagle',                      animal: 'chien' },
  { name: 'Caniche',                     slug: 'caniche',                     animal: 'chien' },
  { name: 'Yorkshire Terrier',           slug: 'yorkshire-terrier',           animal: 'chien' },
  { name: 'Rottweiler',                  slug: 'rottweiler',                  animal: 'chien' },
  { name: 'Boxer',                       slug: 'boxer',                       animal: 'chien' },
  { name: 'Chihuahua',                   slug: 'chihuahua',                   animal: 'chien' },
  { name: 'Shih Tzu',                    slug: 'shih-tzu',                    animal: 'chien' },
  { name: 'Teckel',                      slug: 'teckel',                      animal: 'chien' },
  { name: 'Dobermann',                   slug: 'dobermann',                   animal: 'chien' },
  { name: 'Border Collie',               slug: 'border-collie',               animal: 'chien' },
  { name: 'Berger Australien',           slug: 'berger-australien',           animal: 'chien' },
  { name: 'Jack Russell Terrier',        slug: 'jack-russell-terrier',        animal: 'chien' },
  { name: 'Cavalier King Charles',       slug: 'cavalier-king-charles',       animal: 'chien' },
  { name: 'Bichon Frisé',               slug: 'bichon-frise',                animal: 'chien' },
  { name: 'Bouledogue Anglais',          slug: 'bouledogue-anglais',          animal: 'chien' },
  { name: 'Malinois Belge',             slug: 'malinois-belge',              animal: 'chien' },
  { name: 'Spitz Nain',                  slug: 'spitz-nain',                  animal: 'chien' },
  { name: 'Cocker Anglais',             slug: 'cocker-anglais',              animal: 'chien' },
  { name: 'Dalmatien',                   slug: 'dalmatien',                   animal: 'chien' },
  { name: 'Setter Irlandais',            slug: 'setter-irlandais',            animal: 'chien' },
  { name: 'Akita Inu',                   slug: 'akita-inu',                   animal: 'chien' },
  { name: 'Samoyède',                    slug: 'samoyede',                    animal: 'chien' },
  { name: 'Chow-Chow',                   slug: 'chow-chow',                   animal: 'chien' },
  { name: 'Dogue Allemand',              slug: 'dogue-allemand',              animal: 'chien' },
  { name: 'Saint-Bernard',               slug: 'saint-bernard',               animal: 'chien' },
  { name: 'Braque de Weimar',            slug: 'braque-de-weimar',            animal: 'chien' },
  { name: 'Staffordshire Bull Terrier',  slug: 'staffordshire-bull-terrier',  animal: 'chien' },
  { name: 'Schnauzer Nain',              slug: 'schnauzer-nain',              animal: 'chien' },
  { name: 'Épagneul Breton',             slug: 'epagneul-breton',             animal: 'chien' },
  { name: 'Greyhound',                   slug: 'greyhound',                   animal: 'chien' },
  { name: 'Basenji',                     slug: 'basenji',                     animal: 'chien' },
  { name: 'Shiba Inu',                   slug: 'shiba-inu',                   animal: 'chien' },
  { name: 'Montagne des Pyrénées',       slug: 'montagne-des-pyrenees',       animal: 'chien' },
  { name: 'Terre-Neuve',                 slug: 'terre-neuve',                 animal: 'chien' },
  { name: 'Leonberg',                    slug: 'leonberg',                    animal: 'chien' },
  { name: 'Bouvier des Flandres',        slug: 'bouvier-des-flandres',        animal: 'chien' },
  { name: 'Braque Allemand',             slug: 'braque-allemand',             animal: 'chien' },
  { name: 'Berger de Shetland',          slug: 'berger-de-shetland',          animal: 'chien' },
  { name: 'Shar Pei',                    slug: 'shar-pei',                    animal: 'chien' },
  { name: 'Pékinois',                    slug: 'pekinois',                    animal: 'chien' },
  { name: 'Whippet',                     slug: 'whippet',                     animal: 'chien' },
  { name: 'Bichon Maltais',              slug: 'bichon-maltais',              animal: 'chien' },
  { name: 'Lhasa Apso',                  slug: 'lhasa-apso',                  animal: 'chien' },
  { name: 'Pointer Anglais',             slug: 'pointer-anglais',             animal: 'chien' },
  { name: 'Mastiff Anglais',             slug: 'mastiff-anglais',             animal: 'chien' },

  // ─── Chats (30) ───────────────────────────────────────────────────────────────
  { name: 'Maine Coon',                  slug: 'maine-coon',                  animal: 'chat' },
  { name: 'Persan',                      slug: 'persan',                      animal: 'chat' },
  { name: 'Siamois',                     slug: 'siamois',                     animal: 'chat' },
  { name: 'Bengal',                      slug: 'bengal',                      animal: 'chat' },
  { name: 'Ragdoll',                     slug: 'ragdoll',                     animal: 'chat' },
  { name: 'Sphynx',                      slug: 'sphynx',                      animal: 'chat' },
  { name: 'Sacré de Birmanie',           slug: 'sacre-de-birmanie',           animal: 'chat' },
  { name: 'Chartreux',                   slug: 'chartreux',                   animal: 'chat' },
  { name: 'Abyssin',                     slug: 'abyssin',                     animal: 'chat' },
  { name: 'British Shorthair',           slug: 'british-shorthair',           animal: 'chat' },
  { name: 'Scottish Fold',               slug: 'scottish-fold',               animal: 'chat' },
  { name: 'Norvégien des Forêts',        slug: 'norvegien-des-forets',        animal: 'chat' },
  { name: 'Burmese',                     slug: 'burmese',                     animal: 'chat' },
  { name: 'Devon Rex',                   slug: 'devon-rex',                   animal: 'chat' },
  { name: 'Cornish Rex',                 slug: 'cornish-rex',                 animal: 'chat' },
  { name: 'Russe Bleu',                  slug: 'russe-bleu',                  animal: 'chat' },
  { name: 'Angora Turc',                 slug: 'angora-turc',                 animal: 'chat' },
  { name: 'Exotic Shorthair',            slug: 'exotic-shorthair',            animal: 'chat' },
  { name: 'Tonkinois',                   slug: 'tonkinois',                   animal: 'chat' },
  { name: 'Somali',                      slug: 'somali',                      animal: 'chat' },
  { name: 'Selkirk Rex',                 slug: 'selkirk-rex',                 animal: 'chat' },
  { name: 'Bombay',                      slug: 'bombay',                      animal: 'chat' },
  { name: 'Munchkin',                    slug: 'munchkin',                    animal: 'chat' },
  { name: 'Savannah',                    slug: 'savannah',                    animal: 'chat' },
  { name: 'Ocicat',                      slug: 'ocicat',                      animal: 'chat' },
  { name: 'American Curl',               slug: 'american-curl',               animal: 'chat' },
  { name: 'Balinais',                    slug: 'balinais',                    animal: 'chat' },
  { name: 'Turc de Van',                 slug: 'turc-de-van',                 animal: 'chat' },
  { name: 'Pixie-Bob',                   slug: 'pixie-bob',                   animal: 'chat' },
  { name: 'Havana Brown',                slug: 'havana-brown',                animal: 'chat' },

  // ─── Oiseaux (15) ─────────────────────────────────────────────────────────────
  { name: 'Perruche Ondulée',            slug: 'perruche-ondulee',            animal: 'oiseau' },
  { name: 'Calopsitte',                  slug: 'calopsitte',                  animal: 'oiseau' },
  { name: 'Perroquet Gris du Gabon',     slug: 'perroquet-gris-du-gabon',     animal: 'oiseau' },
  { name: 'Amazone à Front Bleu',        slug: 'amazone-a-front-bleu',        animal: 'oiseau' },
  { name: 'Grand Ara Bleu',              slug: 'grand-ara-bleu',              animal: 'oiseau' },
  { name: 'Canari Domestique',           slug: 'canari-domestique',           animal: 'oiseau' },
  { name: 'Diamant Mandarin',            slug: 'diamant-mandarin',            animal: 'oiseau' },
  { name: 'Inséparable Masqué',          slug: 'inseparable-masque',          animal: 'oiseau' },
  { name: 'Cacatoès Rosalbin',           slug: 'cacatoes-rosalbin',           animal: 'oiseau' },
  { name: 'Conure Soleil',               slug: 'conure-soleil',               animal: 'oiseau' },
  { name: 'Perroquet du Sénégal',        slug: 'perroquet-du-senegal',        animal: 'oiseau' },
  { name: 'Perruche Alexandrine',        slug: 'perruche-alexandrine',        animal: 'oiseau' },
  { name: 'Eclectus',                    slug: 'eclectus',                    animal: 'oiseau' },
  { name: 'Lori Multicolore',            slug: 'lori-multicolore',            animal: 'oiseau' },
  { name: 'Ara Macao',                   slug: 'ara-macao',                   animal: 'oiseau' },

  // ─── Rongeurs (15) ────────────────────────────────────────────────────────────
  { name: 'Hamster Doré',               slug: 'hamster-dore',                animal: 'rongeur' },
  { name: 'Hamster Nain de Campbell',    slug: 'hamster-nain-de-campbell',    animal: 'rongeur' },
  { name: 'Cochon d\'Inde',             slug: 'cochon-d-inde',               animal: 'rongeur' },
  { name: 'Lapin Nain',                  slug: 'lapin-nain',                  animal: 'rongeur' },
  { name: 'Souris Domestique',           slug: 'souris-domestique',           animal: 'rongeur' },
  { name: 'Rat Domestique',              slug: 'rat-domestique',              animal: 'rongeur' },
  { name: 'Gerbille de Mongolie',        slug: 'gerbille-de-mongolie',        animal: 'rongeur' },
  { name: 'Chinchilla',                  slug: 'chinchilla',                  animal: 'rongeur' },
  { name: 'Dégus',                       slug: 'degus',                       animal: 'rongeur' },
  { name: 'Écureuil de Corée',           slug: 'ecureuil-de-coree',           animal: 'rongeur' },
  { name: 'Lapin Rex',                   slug: 'lapin-rex',                   animal: 'rongeur' },
  { name: 'Lapin Bélier',               slug: 'lapin-elier',                animal: 'rongeur' },
  { name: 'Lapin Hollandais',            slug: 'lapin-hollandais',            animal: 'rongeur' },
  { name: 'Furet',                       slug: 'furet',                       animal: 'rongeur' },
  { name: 'Octodon',                     slug: 'octodon',                     animal: 'rongeur' },

  // ─── Reptiles (10) ────────────────────────────────────────────────────────────
  { name: 'Pogona (Dragon Barbu)',        slug: 'pogona',                      animal: 'reptile' },
  { name: 'Gecko Léopard',               slug: 'gecko-leopard',               animal: 'reptile' },
  { name: 'Tortue Hermann',              slug: 'tortue-hermann',              animal: 'reptile' },
  { name: 'Tortue de Floride',           slug: 'tortue-de-floride',           animal: 'reptile' },
  { name: 'Boa Constricteur',            slug: 'boa-constricteur',            animal: 'reptile' },
  { name: 'Python Royal',                slug: 'python-royal',                animal: 'reptile' },
  { name: 'Caméléon du Yémen',           slug: 'cameleon-du-yemen',           animal: 'reptile' },
  { name: 'Iguane Vert',                 slug: 'iguane-vert',                 animal: 'reptile' },
  { name: 'Serpent des Blés',            slug: 'serpent-des-bles',            animal: 'reptile' },
  { name: 'Gecko Crêté',                 slug: 'gecko-crete',                 animal: 'reptile' },
];
