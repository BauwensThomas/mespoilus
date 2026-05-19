'use client';

import { useState } from 'react';
import { Dog, Cat, Bird, Rat, Shell } from 'lucide-react';
import AdBanner from '@/components/ui/AdBanner';

type Animal = 'chien' | 'chat' | 'oiseau' | 'rongeur' | 'reptile';
type DogSize = 'petit' | 'moyen' | 'grand' | 'geant';

const ANIMALS = [
  { id: 'chien',   label: 'Chien',   icon: Dog,   hasSize: true,  maxAge: 20 },
  { id: 'chat',    label: 'Chat',    icon: Cat,   hasSize: false, maxAge: 20 },
  { id: 'oiseau',  label: 'Oiseau',  icon: Bird,  hasSize: false, maxAge: 30 },
  { id: 'rongeur', label: 'Rongeur', icon: Rat,   hasSize: false, maxAge: 8  },
  { id: 'reptile', label: 'Reptile', icon: Shell, hasSize: false, maxAge: 30 },
] as const;

const DOG_SIZES = [
  { id: 'petit',  label: 'Petit  (<10 kg)',   rate: 4 },
  { id: 'moyen',  label: 'Moyen  (10–25 kg)', rate: 5 },
  { id: 'grand',  label: 'Grand  (25–45 kg)', rate: 6 },
  { id: 'geant',  label: 'Géant  (>45 kg)',   rate: 7 },
];

function calcHumanAge(animal: Animal, years: number, dogSize: DogSize): number | null {
  if (years <= 0) return null;
  const dogRate = DOG_SIZES.find(s => s.id === dogSize)?.rate ?? 5;

  switch (animal) {
    case 'chien':
      if (years === 1) return 15;
      if (years === 2) return 24;
      return 24 + (years - 2) * dogRate;
    case 'chat':
      if (years === 1) return 15;
      if (years === 2) return 24;
      return 24 + (years - 2) * 4;
    case 'oiseau':
      return Math.round(years * 5);
    case 'rongeur':
      return Math.round(years * 12);
    case 'reptile':
      return Math.round(years * 4);
  }
}

function getComment(humanAge: number): string {
  if (humanAge < 13)  return 'Un bébé plein d\'énergie !';
  if (humanAge < 18)  return 'Un ado turbulent !';
  if (humanAge < 30)  return 'Un jeune adulte dans la fleur de l\'âge.';
  if (humanAge < 45)  return 'Un adulte épanoui et expérimenté.';
  if (humanAge < 60)  return 'Un senior en pleine forme !';
  if (humanAge < 75)  return 'Un sage doyen qui mérite tout votre amour.';
  return 'Un vénérable ancien - Chouchoutez-le !';
}

export default function AgePage() {
  const [animal, setAnimal] = useState<Animal>('chien');
  const [dogSize, setDogSize] = useState<DogSize>('moyen');
  const [years, setYears] = useState<number>(3);

  const selectedAnimal = ANIMALS.find(a => a.id === animal)!;
  const IconComponent = selectedAnimal.icon;
  const humanAge = calcHumanAge(animal, years, dogSize);

  function handleAnimalChange(id: Animal) {
    setAnimal(id);
    const next = ANIMALS.find(a => a.id === id)!;
    if (years > next.maxAge) setYears(next.maxAge);
  }

  return (
    <div className="min-h-screen bg-white px-6 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Calculateur d'âge</h1>
          <p className="text-gray-500 text-sm">Convertissez l'âge de votre animal en années humaines</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">

          {/* Choix animal */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Type d'animal</label>
            <div className="grid grid-cols-5 gap-2">
              {ANIMALS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleAnimalChange(id as Animal)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                    animal === id
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  <Icon size={20} strokeWidth={1.5} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Taille (chien uniquement) */}
          {selectedAnimal.hasSize && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Taille du chien</label>
              <div className="grid grid-cols-2 gap-2">
                {DOG_SIZES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setDogSize(s.id as DogSize)}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all text-left ${
                      dogSize === s.id
                        ? 'bg-orange-100 text-orange-700 border-orange-300'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Âge slider */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Âge de votre animal : <span className="text-orange-600">{years} an{years > 1 ? 's' : ''}</span>
            </label>
            <input
              type="range"
              min={1}
              max={selectedAnimal.maxAge}
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full accent-orange-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 an</span>
              <span>{selectedAnimal.maxAge} ans</span>
            </div>
          </div>

          {/* Résultat */}
          {humanAge !== null && (
            <div className="bg-gradient-to-r from-orange-600 to-gray-800 rounded-2xl p-6 text-center text-white">
              <div className="flex items-center justify-center mb-3">
                <IconComponent size={36} strokeWidth={1.5} />
              </div>
              <p className="text-orange-200 text-xs uppercase tracking-widest font-semibold mb-1">Équivalent humain</p>
              <p className="text-5xl font-bold mb-2">{humanAge} <span className="text-2xl font-normal">ans</span></p>
              <p className="text-orange-100 text-sm">{getComment(humanAge)}</p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Les conversions sont des approximations basées sur les moyennes scientifiques pour chaque espèce.
        </p>

        <AdBanner slot="2276363485" className="mt-8" />
      </div>
    </div>
  );
}
