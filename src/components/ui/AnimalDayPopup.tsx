'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const ANIMAL_DAYS = [
{ month: 4,  day: 4,  emoji: '🐀', title: 'Journée mondiale du rat',      description: 'Célébrée dans le monde entier, la journée mondiale du rat honore ces petits compagnons intelligents et attachants.', boutique: '/boutique?category=rongeurs' },
  { month: 5,  day: 23, emoji: '🐢', title: 'Journée mondiale des tortues',  description: 'Partout sur la planète, la journée mondiale des tortues rappelle combien ces reptiles fascinants méritent notre attention.', boutique: '/boutique?category=reptiles' },
  { month: 5,  day: 31, emoji: '🦜', title: 'Journée mondiale des perroquets', description: 'Brillants et expressifs, les perroquets sont fêtés dans le monde entier ce 31 mai. Une belle occasion de leur faire plaisir !', boutique: '/boutique?category=oiseaux' },
  { month: 8,  day: 8,  emoji: '🐱', title: 'Journée mondiale du chat',      description: 'La Journée mondiale du chat est célébrée le 8 août partout dans le monde. Aujourd\'hui, gâtez votre félin !', boutique: '/boutique?category=chats' },
  { month: 8,  day: 26, emoji: '🐶', title: 'Journée mondiale du chien',     description: 'Le 26 août, le monde entier célèbre le meilleur ami de l\'homme. C\'est le moment de lui dire merci !', boutique: '/boutique?category=chiens' },
  { month: 10, day: 4,  emoji: '🐾', title: 'Journée mondiale des animaux',  description: 'Le 4 octobre est la journée mondiale de tous les animaux. Une occasion unique de célébrer chaque compagnon à vos côtés.', boutique: '/boutique' },
];

const STORAGE_KEY = 'animal-day-seen';

export default function AnimalDayPopup() {
  const [event, setEvent] = useState<typeof ANIMAL_DAYS[0] | null>(null);

  useEffect(() => {
    const today = new Date();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const todayStr = `${today.getFullYear()}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen === todayStr) return;

    const match = ANIMAL_DAYS.find(e => e.month === m && e.day === d);
    if (!match) return;

    setEvent(match);
  }, []);

  function close() {
    if (!event) return;
    const today = new Date();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const todayStr = `${today.getFullYear()}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    localStorage.setItem(STORAGE_KEY, todayStr);
    setEvent(null);
  }

  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={close}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 text-center relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Fermer"
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          &times;
        </button>

        <div className="text-6xl mb-4">{event.emoji}</div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">{event.description}</p>

        <Link
          href={event.boutique}
          onClick={close}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          <span>Faites un cadeau a votre animal</span>
        </Link>

        <button
          onClick={close}
          className="block mx-auto mt-4 text-xs text-gray-400 hover:text-gray-500 underline underline-offset-2"
        >
          Non merci
        </button>
      </div>
    </div>
  );
}
