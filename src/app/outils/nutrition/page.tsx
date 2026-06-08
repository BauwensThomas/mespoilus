'use client';

import { useState } from 'react';
import { Dog, Cat, UtensilsCrossed, Info } from 'lucide-react';
import AdBanner from '@/components/ui/AdBanner';
import ClientWrapper from '@/components/animations/ClientWrapper';

type Animal   = 'chien' | 'chat';
type Stage    = 'chiot' | 'adulte' | 'senior';
type Activity = 'sedentaire' | 'normal' | 'actif';
type FoodType = 'croquettes' | 'patee' | 'mixte';

const DEFAULT_KCAL: Record<Animal, Record<'croquettes' | 'patee', number>> = {
  chien: { croquettes: 350, patee: 90 },
  chat:  { croquettes: 370, patee: 85 },
};

function getMerFactor(animal: Animal, stage: Stage, sterilise: boolean, activity: Activity): number {
  if (stage === 'chiot') return animal === 'chien' ? 3.0 : 2.5;
  if (stage === 'senior') {
    if (animal === 'chat') return 1.1;
    return sterilise ? 1.2 : 1.4;
  }
  // adulte
  const base = animal === 'chat'
    ? (sterilise ? 1.2 : 1.4)
    : (sterilise ? 1.4 : 1.6);
  const bonus = activity === 'normal' ? 0.2 : activity === 'actif' ? 0.4 : 0;
  return base + bonus;
}

function calcRation(
  animal: Animal, weight: number, stage: Stage,
  sterilise: boolean, activity: Activity,
  foodType: FoodType, kcalCroquettes: number, kcalPatee: number,
): { kcalJour: number; grammes: string } | null {
  if (weight <= 0) return null;
  const rer = 70 * Math.pow(weight, 0.75);
  const mer = rer * getMerFactor(animal, stage, sterilise, activity);

  if (foodType === 'croquettes') {
    return { kcalJour: Math.round(mer), grammes: `${Math.round((mer / kcalCroquettes) * 100)} g de croquettes` };
  }
  if (foodType === 'patee') {
    return { kcalJour: Math.round(mer), grammes: `${Math.round((mer / kcalPatee) * 100)} g de pâtée` };
  }
  // mixte : 50/50 en kcal
  const halfKcal = mer / 2;
  const gCroq = Math.round((halfKcal / kcalCroquettes) * 100);
  const gPat  = Math.round((halfKcal / kcalPatee) * 100);
  return { kcalJour: Math.round(mer), grammes: `${gCroq} g de croquettes + ${gPat} g de pâtée` };
}

export default function NutritionPage() {
  const [animal,    setAnimal]    = useState<Animal>('chien');
  const [weight,    setWeight]    = useState<string>('10');
  const [stage,     setStage]     = useState<Stage>('adulte');
  const [sterilise, setSterilise] = useState(false);
  const [activity,  setActivity]  = useState<Activity>('normal');
  const [foodType,  setFoodType]  = useState<FoodType>('croquettes');
  const [kcalCroq,  setKcalCroq]  = useState<string>('350');
  const [kcalPat,   setKcalPat]   = useState<string>('90');

  function handleAnimal(a: Animal) {
    setAnimal(a);
    setKcalCroq(String(DEFAULT_KCAL[a].croquettes));
    setKcalPat(String(DEFAULT_KCAL[a].patee));
  }

  const w = parseFloat(weight);
  const result = calcRation(
    animal, w, stage, sterilise, activity, foodType,
    parseInt(kcalCroq) || 350, parseInt(kcalPat) || 90,
  );

  const showActivity = stage === 'adulte';
  const showSterilise = stage !== 'chiot';

  return (
    <div className="min-h-screen px-6 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header avec animation */}
        <div className="mb-8 fade-up">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1 glow-text">Calculateur de ration journalière</h1>
          <p className="text-gray-500 text-sm">Estimez la quantité de nourriture quotidienne pour votre animal selon les standards vétérinaires</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Formulaire */}
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 reveal-color">

            {/* Animal avec stagger */}
            <div className="fade-up">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Type d'animal</label>
              <div className="grid grid-cols-2 gap-3 stagger-container">
                {([
                  { id: 'chien', label: 'Chien', icon: Dog },
                  { id: 'chat',  label: 'Chat',  icon: Cat },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleAnimal(id)}
                    className={`stagger-child flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
                      animal === id
                        ? 'bg-orange-600 text-white border-orange-600 shadow-md scale-105'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:scale-105'
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Poids avec animation */}
            <div className="fade-up">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Poids actuel : <span className="text-orange-600 text-lg font-bold">{weight || '–'} kg</span>
              </label>
              <input
                type="number"
                min={0.1}
                max={100}
                step={0.5}
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="Ex : 12"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-300"
              />
            </div>

            {/* Stade de vie avec stagger */}
            <div className="fade-up">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Stade de vie</label>
              <div className="grid grid-cols-3 gap-2 stagger-container">
                {([
                  { id: 'chiot',  label: animal === 'chien' ? 'Chiot' : 'Chaton', sub: '< 1 an' },
                  { id: 'adulte', label: 'Adulte', sub: animal === 'chien' ? '1–7 ans' : '1–10 ans' },
                  { id: 'senior', label: 'Senior',  sub: animal === 'chien' ? '> 7 ans' : '> 10 ans' },
                ] as const).map(({ id, label, sub }) => (
                  <button
                    key={id}
                    onClick={() => setStage(id)}
                    className={`stagger-child py-2.5 px-3 rounded-xl border text-sm font-medium transition-all duration-300 text-center ${
                      stage === id
                        ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-200 hover:bg-orange-50'
                    }`}
                  >
                    <div>{label}</div>
                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Stérilisé */}
            {showSterilise && (
              <div className="fade-up">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Stérilisé(e) ?</label>
                <div className="grid grid-cols-2 gap-2 stagger-container">
                  {[{ v: false, label: 'Non' }, { v: true, label: 'Oui' }].map(({ v, label }) => (
                    <button
                      key={String(v)}
                      onClick={() => setSterilise(v)}
                      className={`stagger-child py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 ${
                        sterilise === v
                          ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Activité */}
            {showActivity && (
              <div className="fade-up">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Niveau d'activité</label>
                <div className="grid grid-cols-3 gap-2 stagger-container">
                  {([
                    { id: 'sedentaire', label: 'Sédentaire', sub: 'Peu de sorties' },
                    { id: 'normal',     label: 'Normal',     sub: '1–2 sorties/j' },
                    { id: 'actif',      label: 'Actif',      sub: 'Sport régulier' },
                  ] as const).map(({ id, label, sub }) => (
                    <button
                      key={id}
                      onClick={() => setActivity(id)}
                      className={`stagger-child py-2.5 px-2 rounded-xl border text-sm font-medium transition-all duration-300 text-center ${
                        activity === id
                          ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      <div>{label}</div>
                      <div className="text-[10px] text-gray-400 font-normal mt-0.5">{sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Type d'alimentation avec stagger */}
            <div className="fade-up">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Type d'alimentation</label>
              <div className="grid grid-cols-3 gap-2 stagger-container">
                {([
                  { id: 'croquettes', label: 'Croquettes', sub: 'Aliment sec' },
                  { id: 'patee',      label: 'Pâtée',      sub: 'Aliment humide' },
                  { id: 'mixte',      label: 'Mixte',      sub: '50% / 50%' },
                ] as const).map(({ id, label, sub }) => (
                  <button
                    key={id}
                    onClick={() => setFoodType(id)}
                    className={`stagger-child py-2.5 px-2 rounded-xl border text-sm font-medium transition-all duration-300 text-center ${
                      foodType === id
                        ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-200 hover:bg-orange-50'
                    }`}
                  >
                    <div>{label}</div>
                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Densité calorique */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 fade-up">
              <div className="flex items-center gap-2">
                <Info size={14} strokeWidth={1.5} className="text-gray-500 flex-shrink-0" />
                <p className="text-xs text-gray-600">Valeurs pré-remplies avec les moyennes standard. Vérifiez sur l'emballage de votre marque pour plus de précision.</p>
              </div>
              {(foodType === 'croquettes' || foodType === 'mixte') && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-700 w-40 shrink-0">Croquettes (kcal/100 g)</label>
                  <input
                    type="number"
                    min={200}
                    max={600}
                    value={kcalCroq}
                    onChange={e => setKcalCroq(e.target.value)}
                    className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all duration-300"
                  />
                </div>
              )}
              {(foodType === 'patee' || foodType === 'mixte') && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-700 w-40 shrink-0">Pâtée (kcal/100 g)</label>
                  <input
                    type="number"
                    min={40}
                    max={200}
                    value={kcalPat}
                    onChange={e => setKcalPat(e.target.value)}
                    className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all duration-300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Résultat */}
          <div className="lg:col-span-2 space-y-4">
            {result ? (
              <>
                <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-6 text-white text-center shadow-sm fade-up hover:scale-[1.02] transition-transform duration-300">
                  <UtensilsCrossed size={28} strokeWidth={1.5} className="mx-auto mb-3 opacity-80" />
                  <div className="text-4xl font-bold mb-1">{result.kcalJour} kcal</div>
                  <div className="text-orange-200 text-sm mb-4">par jour</div>
                  <div className="bg-white/15 rounded-xl px-4 py-3">
                    <div className="text-sm font-semibold">{result.grammes}</div>
                    <div className="text-orange-200 text-xs mt-0.5">par jour</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 text-sm fade-up">
                  <p className="font-semibold text-gray-900 text-sm">Comment utiliser ce résultat</p>
                  <ul className="space-y-2 text-gray-600 text-xs">
                    <li className="flex gap-2"><span className="text-orange-500 font-bold mt-0.5">•</span>Divisez la ration en 2 repas par jour (matin et soir)</li>
                    <li className="flex gap-2"><span className="text-orange-500 font-bold mt-0.5">•</span>Ajustez selon la silhouette : si votre animal grossit, réduisez de 10%</li>
                    <li className="flex gap-2"><span className="text-orange-500 font-bold mt-0.5">•</span>L'eau doit toujours être disponible en libre accès</li>
                    <li className="flex gap-2"><span className="text-orange-500 font-bold mt-0.5">•</span>Les friandises comptent dans la ration journalière</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 fade-up">
                  <p className="text-xs text-blue-700">Ce calcul est basé sur les formules RER/MER utilisées en médecine vétérinaire. Il s'agit d'une estimation. Consultez votre vétérinaire pour un suivi personnalisé.</p>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-400 fade-up">
                <UtensilsCrossed size={32} strokeWidth={1} className="mx-auto mb-3" />
                <p className="text-sm">Renseignez le poids de votre animal pour obtenir le résultat</p>
              </div>
            )}

            <AdBanner slot="1266534148" variant="in-article" className="mt-2 fade-up" />
          </div>
        </div>
      </div>
      
      <ClientWrapper />
    </div>
  );
}