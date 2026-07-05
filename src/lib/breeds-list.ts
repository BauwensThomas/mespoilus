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
  { name: 'Bouledogue Français',          slug: 'bulldog-francais',            animal: 'chien' },
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

  // ─── Semaine 1 ────────────────────────────────────────────────────────────────
  { name: 'Beauceron',                   slug: 'beauceron',                   animal: 'chien'   },
  { name: 'Briard',                      slug: 'briard',                      animal: 'chien'   },
  { name: 'Himalayan',                   slug: 'himalayan',                   animal: 'chat'    },
  { name: 'Manx',                        slug: 'manx',                        animal: 'chat'    },
  { name: 'Perruche de Bourke',          slug: 'perruche-de-bourke',          animal: 'oiseau'  },
  { name: 'Perruche Turquoisine',        slug: 'perruche-turquoisine',        animal: 'oiseau'  },
  { name: 'Hamster de Roborovski',       slug: 'hamster-de-roborovski',       animal: 'rongeur' },
  { name: 'Hamster Russe',               slug: 'hamster-russe',               animal: 'rongeur' },
  { name: 'Scinque à Langue Bleue',      slug: 'scinque-a-langue-bleue',      animal: 'reptile' },
  { name: 'Varan du Nil',                slug: 'varan-du-nil',                animal: 'reptile' },

  // ─── Semaine 2 ────────────────────────────────────────────────────────────────
  { name: 'Bobtail',                     slug: 'bobtail',                     animal: 'chien'   },
  { name: 'Collie à Poil Long',          slug: 'collie-a-poil-long',          animal: 'chien'   },
  { name: 'Japanese Bobtail',            slug: 'japanese-bobtail',            animal: 'chat'    },
  { name: 'Singapura',                   slug: 'singapura',                   animal: 'chat'    },
  { name: 'Rosella Commun',              slug: 'rosella-commun',              animal: 'oiseau'  },
  { name: 'Rosella de Stanley',          slug: 'rosella-de-stanley',          animal: 'oiseau'  },
  { name: 'Lapin Angora',                slug: 'lapin-angora',                animal: 'rongeur' },
  { name: 'Lapin Géant des Flandres',    slug: 'lapin-geant-des-flandres',    animal: 'rongeur' },
  { name: 'Tortue Africaine à Éperon',   slug: 'tortue-africaine-a-eperon',   animal: 'reptile' },
  { name: 'Gecko à Queue de Navet',      slug: 'gecko-a-queue-de-navet',      animal: 'reptile' },

  // ─── Semaine 3 ────────────────────────────────────────────────────────────────
  { name: 'Welsh Corgi Pembroke',        slug: 'welsh-corgi-pembroke',        animal: 'chien'   },
  { name: 'Australian Cattle Dog',       slug: 'australian-cattle-dog',       animal: 'chien'   },
  { name: 'Korat',                       slug: 'korat',                       animal: 'chat'    },
  { name: 'LaPerm',                      slug: 'laperm',                      animal: 'chat'    },
  { name: 'Conure à Front Rouge',        slug: 'conure-a-front-rouge',        animal: 'oiseau'  },
  { name: 'Cacatoès Molucain',           slug: 'cacatoes-molucain',           animal: 'oiseau'  },
  { name: 'Lapin Californien',           slug: 'lapin-californien',           animal: 'rongeur' },
  { name: 'Hérisson Africain',           slug: 'herisson-africain',           animal: 'rongeur' },
  { name: 'Anole Vert',                  slug: 'anole-vert',                  animal: 'reptile' },
  { name: 'Couleuvre Royale',            slug: 'couleuvre-royale',            animal: 'reptile' },

  // ─── Semaine 4 ────────────────────────────────────────────────────────────────
  { name: 'Basset Hound',                slug: 'basset-hound',                animal: 'chien'   },
  { name: 'Dogue de Bordeaux',           slug: 'dogue-de-bordeaux',           animal: 'chien'   },
  { name: 'Nebelung',                    slug: 'nebelung',                    animal: 'chat'    },
  { name: 'Peterbald',                   slug: 'peterbald',                   animal: 'chat'    },
  { name: 'Cacatoès Goffin',             slug: 'cacatoes-goffin',             animal: 'oiseau'  },
  { name: 'Cacatoès à Crête Jaune',      slug: 'cacatoes-a-crete-jaune',      animal: 'oiseau'  },
  { name: 'Chien de Prairie',            slug: 'chien-de-prairie',            animal: 'rongeur' },
  { name: 'Souris Sauteuse',             slug: 'souris-sauteuse',             animal: 'rongeur' },
  { name: 'Tortue Mauresque',            slug: 'tortue-mauresque',            animal: 'reptile' },

  // ─── Semaine 5 ────────────────────────────────────────────────────────────────
  { name: 'Cane Corso',                  slug: 'cane-corso',                  animal: 'chien'   },
  { name: 'Bouvier Bernois',             slug: 'bouvier-bernois',             animal: 'chien'   },
  { name: 'Chausie',                     slug: 'chausie',                     animal: 'chat'    },
  { name: 'Lykoi',                       slug: 'lykoi',                       animal: 'chat'    },
  { name: 'Ara Militaire',               slug: 'ara-militaire',               animal: 'oiseau'  },
  { name: 'Perruche Splendide',          slug: 'perruche-splendide',          animal: 'oiseau'  },

  // ─── Semaine 6 ────────────────────────────────────────────────────────────────
  { name: 'Bichon Havanais',             slug: 'bichon-havanais',             animal: 'chien'   },
  { name: 'Coton de Tuléar',             slug: 'coton-de-tulear',             animal: 'chien'   },
  { name: 'Cymric',                      slug: 'cymric',                      animal: 'chat'    },
  { name: 'Khao Manee',                  slug: 'khao-manee',                  animal: 'chat'    },

  // ─── Semaine 7 ────────────────────────────────────────────────────────────────
  { name: 'Épagneul Nain Continental',   slug: 'epagneul-nain-continental',   animal: 'chien'   },
  { name: 'Berger Hollandais',           slug: 'berger-hollandais',           animal: 'chien'   },
  { name: 'Donskoy',                     slug: 'donskoy',                     animal: 'chat'    },
  { name: 'Chantilly-Tiffany',           slug: 'chantilly-tiffany',           animal: 'chat'    },

  // ─── Semaine 8 ────────────────────────────────────────────────────────────────
  { name: 'West Highland White Terrier', slug: 'west-highland-white-terrier', animal: 'chien'   },
  { name: 'Scottish Terrier',            slug: 'scottish-terrier',            animal: 'chien'   },
  { name: 'Serengeti',                   slug: 'serengeti',                   animal: 'chat'    },

  // ─── Semaines 9–15 (chiens restants) ──────────────────────────────────────────
  { name: 'Bull Terrier',                slug: 'bull-terrier',                animal: 'chien'   },
  { name: 'Boston Terrier',              slug: 'boston-terrier',              animal: 'chien'   },
  { name: 'Cairn Terrier',               slug: 'cairn-terrier',               animal: 'chien'   },
  { name: 'Airedale Terrier',            slug: 'airedale-terrier',            animal: 'chien'   },
  { name: 'Cocker Américain',            slug: 'cocker-americain',            animal: 'chien'   },
  { name: 'Springer Anglais',            slug: 'springer-anglais',            animal: 'chien'   },
  { name: 'Rhodesian Ridgeback',         slug: 'rhodesian-ridgeback',         animal: 'chien'   },
  { name: 'Malamute d\'Alaska',          slug: 'malamute-d-alaska',           animal: 'chien'   },
  { name: 'Dogo Argentino',              slug: 'dogo-argentino',              animal: 'chien'   },
  { name: 'Bullmastiff',                 slug: 'bullmastiff',                 animal: 'chien'   },
  { name: 'Lévrier Afghan',              slug: 'levrier-afghan',              animal: 'chien'   },
  { name: 'Saluki',                      slug: 'saluki',                      animal: 'chien'   },
  { name: 'Berger Blanc Suisse',         slug: 'berger-blanc-suisse',         animal: 'chien'   },
  { name: 'Eurasier',                    slug: 'eurasier',                    animal: 'chien'   },

  // ─── Rotation biweekly — Cycle 1 : Oiseaux ────────────────────────────────────
  { name: 'Perruche à Collier',          slug: 'perruche-a-collier',          animal: 'oiseau'  },
  { name: 'Caique à Tête Noire',         slug: 'caique-tete-noire',           animal: 'oiseau'  },
  { name: 'Diamant de Gould',            slug: 'diamant-de-gould',            animal: 'oiseau'  },
  { name: 'Moineau du Japon',            slug: 'moineau-du-japon',            animal: 'oiseau'  },
  { name: 'Cacatoès Galah',              slug: 'cacatoes-galah',              animal: 'oiseau'  },
  { name: 'Conure de Patagonie',         slug: 'conure-de-patagonie',         animal: 'oiseau'  },
  { name: 'Perruche Moine',              slug: 'perruche-moine',              animal: 'oiseau'  },
  { name: 'Amazone à Front Jaune',       slug: 'amazone-front-jaune',         animal: 'oiseau'  },
  { name: 'Cacatoès Blanc',              slug: 'cacatoes-blanc',              animal: 'oiseau'  },
  { name: 'Tourterelle Diamant',         slug: 'tourterelle-diamant',         animal: 'oiseau'  },

  // ─── Rotation biweekly — Cycle 2 : Reptiles ───────────────────────────────────
  { name: 'Tortue Russe',                slug: 'tortue-russe',                animal: 'reptile' },
  { name: 'Gecko Tokay',                 slug: 'gecko-tokay',                 animal: 'reptile' },
  { name: 'Caméléon de Jackson',         slug: 'chameleon-de-jackson',        animal: 'reptile' },
  { name: 'Lézard à Collier',            slug: 'lezard-a-collier',            animal: 'reptile' },
  { name: 'Varan de Savane',             slug: 'varan-de-savane',             animal: 'reptile' },
  { name: 'Agame Barbu Nain',            slug: 'agame-barbu-nain',            animal: 'reptile' },
  { name: 'Couleuvre à Collier',         slug: 'couleuvre-a-collier',         animal: 'reptile' },
  { name: 'Gecko Vautour',               slug: 'gecko-vautour',               animal: 'reptile' },
  { name: 'Scinque des Prairies',        slug: 'scinque-des-prairies',        animal: 'reptile' },
  { name: 'Python Brun',                 slug: 'python-brun',                 animal: 'reptile' },

  // ─── Rotation biweekly — Cycle 3 : Rongeurs ───────────────────────────────────
  { name: 'Lapin Hotot',                 slug: 'lapin-hotot',                 animal: 'rongeur' },
  { name: 'Sugar Glider',               slug: 'sugar-glider',                animal: 'rongeur' },
  { name: 'Gerbille à Queue Grasse',     slug: 'gerbille-queue-grasse',       animal: 'rongeur' },
  { name: 'Rat Nu',                      slug: 'rat-nu',                      animal: 'rongeur' },
  { name: 'Lapin Mini Rex',              slug: 'lapin-mini-rex',              animal: 'rongeur' },
  { name: 'Lapin Argenté',               slug: 'lapin-argente',               animal: 'rongeur' },
  { name: 'Cochon d\'Inde Angora',       slug: 'cochon-d-inde-angora',        animal: 'rongeur' },
  { name: 'Hamster de Chine',            slug: 'hamster-de-chine',            animal: 'rongeur' },
  { name: 'Lapin Polish',                slug: 'lapin-polish',                animal: 'rongeur' },
  { name: 'Gerbille Fauve',              slug: 'gerbille-fauve',              animal: 'rongeur' },

  // ─── Rotation biweekly — Cycle 4 : Chats ──────────────────────────────────────
  { name: 'Munchkin',                    slug: 'munchkin',                    animal: 'chat'    },
  { name: 'Sibérien',                    slug: 'siberien',                    animal: 'chat'    },
  { name: 'Snowshoe',                    slug: 'snowshoe',                    animal: 'chat'    },
  { name: 'Wirehair Américain',          slug: 'wirehair-americain',          animal: 'chat'    },
  { name: 'Toyger',                      slug: 'toyger',                      animal: 'chat'    },
  { name: 'Australian Mist',             slug: 'australian-mist',             animal: 'chat'    },
  { name: 'York Chocolat',               slug: 'york-chocolat',               animal: 'chat'    },
  { name: 'Sokoke',                      slug: 'sokoke',                      animal: 'chat'    },
  { name: 'Minuet',                      slug: 'minuet',                      animal: 'chat'    },
  { name: 'Scottish Straight',           slug: 'scottish-straight',           animal: 'chat'    },

  // ─── Rotation biweekly — Cycle 5 : Chiens ─────────────────────────────────────
  { name: 'Berger Picard',               slug: 'berger-picard',               animal: 'chien'   },
  { name: 'Beauceron',                   slug: 'beauceron',                   animal: 'chien'   },
  { name: 'Vizsla',                      slug: 'vizsla',                      animal: 'chien'   },
  { name: 'Barbet',                      slug: 'barbet',                      animal: 'chien'   },
  { name: 'Bloodhound',                  slug: 'bloodhound',                  animal: 'chien'   },
  { name: 'Corgi Gallois de Pembroke',   slug: 'corgi-gallois-de-pembroke',   animal: 'chien'   },
  { name: 'Flat-Coated Retriever',       slug: 'flat-coated-retriever',       animal: 'chien'   },
  { name: 'Berger Islandais',            slug: 'berger-islandais',            animal: 'chien'   },
  { name: 'Shar Pei',                    slug: 'shar-pei',                    animal: 'chien'   },
  { name: 'Borzoi',                      slug: 'borzoi',                      animal: 'chien'   },
];
