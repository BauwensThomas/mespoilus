'use client';

import { useState } from 'react';
import { Dog, Cat, Rabbit, Bird, Rat, RotateCcw } from 'lucide-react';
import AdBanner from '@/components/ui/AdBanner';

type AnimalKey = 'chien' | 'chat' | 'lapin' | 'oiseau' | 'rongeur';

interface Question {
  id: number;
  question: string;
  options: { label: string; scores: Partial<Record<AnimalKey, number>> }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Où vivez-vous ?',
    options: [
      { label: 'Petit appartement (sans extérieur)',   scores: { chat: 3, oiseau: 4, rongeur: 5 } },
      { label: 'Appartement avec balcon / terrasse',   scores: { chat: 4, lapin: 3, oiseau: 3, rongeur: 3 } },
      { label: 'Maison avec jardin',                   scores: { chien: 5, chat: 3, lapin: 4 } },
      { label: 'Grande propriété / campagne',          scores: { chien: 6, lapin: 3, chat: 2 } },
    ],
  },
  {
    id: 2,
    question: 'Comment décririez-vous votre niveau d\'activité physique ?',
    options: [
      { label: 'Très peu - Je suis plutôt casanier·e',  scores: { chat: 4, oiseau: 3, rongeur: 4 } },
      { label: 'Modéré - Quelques sorties par semaine', scores: { chat: 3, lapin: 3, chien: 2, oiseau: 2 } },
      { label: 'Actif·ve - Sport régulier',             scores: { chien: 5, lapin: 2 } },
      { label: 'Très actif·ve - Sport quasi quotidien', scores: { chien: 7 } },
    ],
  },
  {
    id: 3,
    question: 'Combien de temps pouvez-vous consacrer à votre animal par jour ?',
    options: [
      { label: 'Moins de 30 minutes',   scores: { rongeur: 5, oiseau: 4 } },
      { label: '30 min à 1 heure',      scores: { chat: 5, lapin: 3, oiseau: 3 } },
      { label: '1 à 3 heures',          scores: { chien: 4, chat: 3, lapin: 4 } },
      { label: 'Plus de 3 heures',      scores: { chien: 7 } },
    ],
  },
  {
    id: 4,
    question: 'Y a-t-il des enfants (ou prévus) à la maison ?',
    options: [
      { label: 'Non, je vis seul·e ou en couple',   scores: { oiseau: 2, rongeur: 2, chat: 2 } },
      { label: 'Oui, de petits enfants (< 6 ans)',  scores: { chien: 3, chat: 3 } },
      { label: 'Oui, des enfants plus grands',      scores: { chien: 5, chat: 4, lapin: 3 } },
      { label: 'Peut-être dans le futur',           scores: { chien: 3, chat: 3, lapin: 2 } },
    ],
  },
  {
    id: 5,
    question: 'Quel budget mensuel pouvez-vous dédier à votre animal ?',
    options: [
      { label: 'Moins de 30 €',    scores: { rongeur: 6, oiseau: 3 } },
      { label: '30 à 60 €',        scores: { lapin: 4, oiseau: 4, chat: 3 } },
      { label: '60 à 120 €',       scores: { chat: 5, chien: 3, lapin: 3 } },
      { label: 'Plus de 120 €',    scores: { chien: 6 } },
    ],
  },
  {
    id: 6,
    question: 'Quelle relation souhaitez-vous avec votre animal ?',
    options: [
      { label: 'Très câlin - Toujours collé à moi',   scores: { chien: 6, chat: 3 } },
      { label: 'Indépendant - Me laisse vivre',       scores: { chat: 6, lapin: 2 } },
      { label: 'Joueur et interactif',                 scores: { chien: 4, chat: 3, oiseau: 4, lapin: 3 } },
      { label: 'Fascinant à observer',                 scores: { oiseau: 6, rongeur: 5 } },
    ],
  },
];

const RESULTS: Record<AnimalKey, {
  label: string;
  emoji: string;
  icon: typeof Dog;
  color: string;
  bg: string;
  description: string;
  tips: string[];
}> = {
  chien: {
    label: 'Le Chien',
    emoji: '🐕',
    icon: Dog,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    description: 'Le chien est l\'animal idéal pour vous ! Loyal, affectueux et toujours partant pour l\'aventure, il s\'adaptera parfaitement à votre mode de vie actif. Prévoyez des sorties quotidiennes et beaucoup d\'amour.',
    tips: ['Prévoir min. 2 sorties/jour', 'Budget moyen : 80–200 €/mois', 'Durée de vie : 10–15 ans'],
  },
  chat: {
    label: 'Le Chat',
    emoji: '🐈',
    icon: Cat,
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    description: 'Le chat est fait pour vous ! Indépendant mais câlin à ses heures, il s\'adapte parfaitement à la vie en appartement ou en maison. Il saura vous apporter de la douceur sans vous envahir.',
    tips: ['S\'adapte très bien à l\'appartement', 'Budget moyen : 50–120 €/mois', 'Durée de vie : 12–18 ans'],
  },
  lapin: {
    label: 'Le Lapin',
    emoji: '🐇',
    icon: Rabbit,
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    description: 'Le lapin est votre compagnon idéal ! Doux, silencieux et attachant, ce petit herbivore peut être très affectueux. Il peut même apprendre à utiliser une litière et se promener librement dans la maison.',
    tips: ['Peut vivre libre dans l\'appart', 'Budget moyen : 40–80 €/mois', 'Durée de vie : 8–12 ans'],
  },
  oiseau: {
    label: 'L\'Oiseau',
    emoji: '🦜',
    icon: Bird,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    description: 'Un oiseau serait votre animal idéal ! Vivace, joyeux et fascinant, il égayera votre quotidien de ses chants et de sa personnalité unique. Les perruches et perroquets peuvent même apprendre à parler !',
    tips: ['Peu encombrant, très sociable', 'Budget moyen : 30–70 €/mois', 'Durée de vie : 5–80 ans (selon espèce)'],
  },
  rongeur: {
    label: 'Le Rongeur',
    emoji: '🐹',
    icon: Rat,
    color: 'text-green-700',
    bg: 'bg-green-50',
    description: 'Un petit rongeur serait parfait pour vous ! Hamster, cochon d\'Inde ou gerbille - Ces adorables petites boules de poils sont faciles à entretenir, peu coûteux et attachants à leur manière.',
    tips: ['Idéal pour les petits espaces', 'Budget moyen : 15–40 €/mois', 'Durée de vie : 2–8 ans (selon espèce)'],
  },
};

export default function QuizPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<AnimalKey | null>(null);

  function answer(qId: number, optIndex: number) {
    const newAnswers = { ...answers, [qId]: optIndex };
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(q => q + 1), 300);
    } else {
      // Calcul des scores
      const scores: Record<AnimalKey, number> = { chien: 0, chat: 0, lapin: 0, oiseau: 0, rongeur: 0 };
      QUESTIONS.forEach(q => {
        const optIdx = newAnswers[q.id];
        if (optIdx !== undefined) {
          const opt = q.options[optIdx];
          (Object.entries(opt.scores) as [AnimalKey, number][]).forEach(([animal, pts]) => {
            scores[animal] += pts;
          });
        }
      });
      const winner = (Object.entries(scores) as [AnimalKey, number][]).sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner);
      setTimeout(() => setFinished(true), 300);
    }
  }

  function restart() {
    setAnswers({});
    setCurrentQ(0);
    setFinished(false);
    setResult(null);
  }

  const q = QUESTIONS[currentQ];
  const progress = ((currentQ) / QUESTIONS.length) * 100;

  if (finished && result) {
    const r = RESULTS[result];
    const IconComponent = r.icon;
    return (
      <div className="min-h-screen bg-white px-6 md:px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Quiz - Résultat</h1>
          </div>

          <div className={`${r.bg} border border-gray-200 rounded-2xl p-8 text-center shadow-sm mb-6`}>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm">
                <IconComponent size={40} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">Votre animal idéal</p>
            <h2 className={`text-3xl font-bold mb-4 ${r.color}`}>{r.label}</h2>
            <p className="text-gray-700 leading-relaxed text-base">{r.description}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">À savoir</p>
            <div className="space-y-2">
              {r.tips.map((tip, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  {tip}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={restart}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            <RotateCcw size={16} strokeWidth={1.5} />
            Recommencer le quiz
          </button>

          <AdBanner slot="2276363485" className="mt-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Quel animal est fait pour toi ?</h1>
          <p className="text-gray-500 text-sm">6 questions pour trouver votre compagnon idéal</p>
        </div>

        {/* Barre de progression */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Question {currentQ + 1} sur {QUESTIONS.length}</span>
            <span>{Math.round((currentQ / QUESTIONS.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">{q.question}</h2>
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => answer(q.id, i)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                  answers[q.id] === i
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <AdBanner slot="2276363485" className="mt-8" />
      </div>
    </div>
  );
}
