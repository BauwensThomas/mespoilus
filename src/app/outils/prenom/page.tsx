'use client';

import { useState, useEffect } from 'react';
import { Shuffle } from 'lucide-react';
import AdBanner from '@/components/ui/AdBanner';
import ClientWrapper from '@/components/animations/ClientWrapper';

// Fallback statique si la DB est vide (avant le premier cron)
const PRENOMS_FALLBACK: Record<string, Record<string, string[]>> = {
  chien: {
    'Mignon': ['Noisette', 'Caramel', 'Biscuit', 'Cannelle', 'Pépito', 'Câlin', 'Doudou', 'Pépite', 'Praline', 'Coco', 'Miel', 'Sucre', 'Nougat', 'Cachou', 'Bonbon'],
    'Classique': ['Max', 'Rex', 'Bella', 'Charlie', 'Lucky', 'Oscar', 'Nala', 'Bruno', 'Luna', 'Toby', 'Simba', 'Lola', 'Rocky', 'Daisy', 'Jack'],
    'Nature': ['Forêt', 'Orage', 'Mistral', 'Aurora', 'Nuage', 'Tempête', 'Éclair', 'Brume', 'Sirocco', 'Boréal', 'Saule', 'Chêne', 'Zephyr', 'Soleil', 'Cascade'],
    'Rigolo': ['Boulette', 'Patate', 'Cornichon', 'Bouboule', 'Patatras', 'Biscotte', 'Bibendum', 'Craquelin', 'Chouquette', 'Gaufre', 'Macaron', 'Bretzel', 'Churros', 'Donut', 'Nacho'],
  },
  chat: {
    'Mignon': ['Mimi', 'Choupette', 'Câlinette', 'Poucette', 'Douceur', 'Velours', 'Miette', 'Nuage', 'Félix', 'Papillon', 'Lilou', 'Perle', 'Satin', 'Flocon', 'Minette'],
    'Classique': ['Luna', 'Simba', 'Nala', 'Oscar', 'Bella', 'Milo', 'Cleo', 'Tiger', 'Misty', 'Whiskers', 'Shadow', 'Smokey', 'Salem', 'Jasper', 'Mochi'],
    'Nature': ['Aurora', 'Brume', 'Cosmos', 'Eclipse', 'Galaxie', 'Iris', 'Jasmin', 'Lilas', 'Météore', 'Nebula', 'Opale', 'Pluie', 'Quartz', 'Rosée', 'Sirius'],
    'Rigolo': ['Ronron', 'Grognon', 'Chipie', 'Coquin', 'Filou', 'Fripouille', 'Gribouille', 'Kaboum', 'Maboule', 'Pantouffle', 'Pelote', 'Polochon', 'Rabougri', 'Scrogneugneu', 'Zigzag'],
  },
  lapin: {
    'Mignon': ['Cotton', 'Flocon', 'Pompom', 'Mousseline', 'Câline', 'Pastel', 'Velours', 'Doudou', 'Bébé', 'Noisette', 'Câlin', 'Pampille', 'Poudre', 'Rosette', 'Sucette'],
    'Classique': ['Bugs', 'Flopsy', 'Peter', 'Thumper', 'Coco', 'Grisou', 'Blanc', 'Caramel', 'Noisette', 'Lilas', 'Bijou', 'Câline', 'Fifi', 'Loulou', 'Patapon'],
    'Nature': ['Herbe', 'Trèfle', 'Sauge', 'Menthe', 'Pissenlit', 'Bruyère', 'Lavande', 'Thym', 'Serpolet', 'Camomille', 'Bardane', 'Ortie', 'Plantain', 'Carotte', 'Persil'],
    'Rigolo': ['Ouïe', 'Creusette', 'Grosse-Oreille', 'Hoppy', 'Nibble', 'Pince-Carotte', 'Pouf', 'Ronrounet', 'Saute-Partout', 'Trot-Trot', 'Zoreilles', 'Cabriole', 'Galipette', 'Sautille', 'Bondissant'],
  },
  oiseau: {
    'Mignon': ['Pépito', 'Twiti', 'Gazouillis', 'Piou', 'Sifflet', 'Chanteur', 'Mélody', 'Aria', 'Soprano', 'Allegro', 'Andante', 'Cadence', 'Harmonie', 'Mélodie', 'Ritmo'],
    'Classique': ['Coco', 'Kiwi', 'Rio', 'Titi', 'Lulu', 'Piaf', 'Percho', 'Verde', 'Azur', 'Jade', 'Samba', 'Tropical', 'Calypso', 'Mango', 'Papaye'],
    'Nature': ['Zéphyr', 'Nuage', 'Aurore', 'Ciel', 'Mistral', 'Brume', 'Soleil', 'Arc-en-ciel', 'Lumière', 'Étoile', 'Comète', 'Aube', 'Crépuscule', 'Horizon', 'Zenith'],
    'Rigolo': ['Bavard', 'Criailleur', 'Faussaire', 'Jacquot', 'Perroquet', 'Pilpil', 'Siffleur', 'Tchitchi', 'Trille', 'Turlututu', 'Vocaliseur', 'Caqueteur', 'Ramage', 'Gazouillis', 'Pépieur'],
  },
  rongeur: {
    'Mignon': ['Noisette', 'Boule', 'Cotton', 'Pépite', 'Caramel', 'Flocon', 'Câlin', 'Mini', 'Puce', 'Graine', 'Miette', 'Morille', 'Perle', 'Pistache', 'Praline'],
    'Classique': ['Jerry', 'Stuart', 'Speedy', 'Algernon', 'Remy', 'Gus', 'Chuck', 'Hammy', 'Pip', 'Squeak', 'Willy', 'Coco', 'Grizou', 'Nibbles', 'Whiskers'],
    'Nature': ['Gland', 'Musette', 'Terrier', 'Blé', 'Avoine', 'Seigle', 'Noisette', 'Châtaigne', 'Faine', 'Graine', 'Herbe', 'Mousse', 'Pierre', 'Roche', 'Sable'],
    'Rigolo': ['Bibibis', 'Chipeur', 'Grignote', 'Grignouille', 'Mâche-Tout', 'Nibble', 'Pioche', 'Ronge-Tout', 'Souriceau', 'Squick', 'Tatata', 'Tricote', 'Vrille', 'Zigoto', 'Zizou'],
  },
};

const ANIMAL_LABELS: Record<string, string> = {
  chien: 'Chien', chat: 'Chat', lapin: 'Lapin', oiseau: 'Oiseau', rongeur: 'Rongeur / Hamster',
};

const STYLES = ['Mignon', 'Classique', 'Nature', 'Rigolo'];

function generateNames(pool: Record<string, string[]>, style: string, count = 6): string[] {
  const list = pool[style] ?? [];
  if (list.length === 0) return [];
  return [...list].sort(() => Math.random() - 0.5).slice(0, Math.min(count, list.length));
}

export default function PrenomPage() {
  const [animal, setAnimal] = useState('chien');
  const [style, setStyle] = useState('Mignon');
  const [results, setResults] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [dbPool, setDbPool] = useState<Record<string, Record<string, string[]>>>({});

  useEffect(() => {
    const cached = dbPool[animal];
    if (cached) return;
    fetch(`/api/prenoms?animal=${animal}`)
      .then(r => r.json())
      .then(data => {
        if (data) setDbPool(prev => ({ ...prev, [animal]: data }));
      })
      .catch(() => {});
  }, [animal, dbPool]);

  const activePool = dbPool[animal] ?? PRENOMS_FALLBACK[animal] ?? {};
  const fromDb = !!dbPool[animal];

  function generate() {
    setResults(generateNames(activePool, style));
    setGenerated(true);
  }

  function handleAnimalChange(a: string) {
    setAnimal(a);
    setGenerated(false);
    setResults([]);
  }

  return (
    <div className="px-6 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header avec animation */}
        <div className="mb-8 fade-up">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1 glow-text">Générateur de prénom</h1>
          <p className="text-gray-500 text-sm">
            Trouvez le prénom parfait pour votre nouvel animal
            {fromDb && <span className="ml-2 text-xs text-orange-500 font-medium">Mis à jour ce mois-ci</span>}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 reveal-color">

          {/* Animal avec stagger */}
          <div className="fade-up">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Type d'animal</label>
            <div className="flex flex-wrap gap-2 stagger-container">
              {Object.keys(PRENOMS_FALLBACK).map(a => (
                <button
                  key={a}
                  onClick={() => handleAnimalChange(a)}
                  className={`stagger-child px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
                    animal === a
                      ? 'bg-orange-600 text-white border-orange-600 shadow-md scale-105'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 hover:scale-105'
                  }`}
                >
                  {ANIMAL_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {/* Style avec stagger */}
          <div className="fade-up">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Style de prénom</label>
            <div className="flex flex-wrap gap-2 stagger-container">
              {STYLES.map(s => (
                <button
                  key={s}
                  onClick={() => { setStyle(s); setGenerated(false); }}
                  className={`stagger-child px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
                    style === s
                      ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-200 hover:bg-orange-50 hover:scale-105'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Bouton générer */}
          <button
            onClick={generate}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-md fade-up"
          >
            <Shuffle size={18} strokeWidth={1.5} className="group-hover:rotate-180 transition-transform duration-500" />
            {generated ? 'Regénérer' : 'Générer des prénoms'}
          </button>

          {/* Résultats avec stagger */}
          {generated && results.length > 0 && (
            <div className="fade-up">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Suggestions</p>
              <div className="grid grid-cols-3 gap-2 stagger-container">
                {results.map((name, i) => (
                  <div
                    key={i}
                    className="stagger-child bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-center font-semibold text-orange-800 text-base hover:bg-orange-100 hover:scale-105 hover:shadow-md transition-all duration-300 cursor-default"
                  >
                    {name}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                Pas convaincus ? Cliquez sur "Regénérer" pour de nouvelles idées !
              </p>
            </div>
          )}
        </div>

        <AdBanner slot="2276363485" className="mt-10 fade-up" />
      </div>
      <ClientWrapper />
    </div>
  );
}